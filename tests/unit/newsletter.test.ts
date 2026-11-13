import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { KitError, kitClient } from '@/lib/newsletter/kit'
import { FAKE_FORM_ID, KIT_DOWN_DOMAIN, fakeKit, type FakeKit } from '@/lib/newsletter/kitFake'
import { readSwitch, setSwitch, switchLog } from '@/lib/newsletter/switch'
import { topicTags, waitlistTag } from '@/lib/newsletter/topics'
import { testDatabases, type TestDatabases } from './d1'

/**
 * The newsletter on Kit: the client against an in-memory Kit
 * (lib/newsletter/kitFake.ts), the owner's switch on a real local D1, and
 * POST /api/newsletter end to end with both.
 */

const checkRateLimit = vi.fn()
const verifyTurnstile = vi.fn()
const logged = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
let db: TestDatabases['waitlist'] | null = null

vi.mock('@/lib/security/rateLimiter', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
  getClientIp: () => '1.2.3.4',
  rateLimitIpKey: (ip: string) => `key:${ip}`,
  recipientKey: (email: string) => `hash:${email}`,
}))
vi.mock('@/lib/security/turnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => verifyTurnstile(...args),
}))
vi.mock('@/lib/logger', () => ({ logger: logged }))
vi.mock('@/lib/db', () => ({ waitlistDb: async () => db }))

const subscribe = (await import('@/app/api/newsletter/route')).POST
const status = (await import('@/app/api/newsletter/status/route')).GET
const { SUBSCRIBED_MESSAGE } = await import('@/lib/newsletter/http')

let dbs: TestDatabases
beforeAll(async () => {
  dbs = await testDatabases()
})
afterAll(() => dbs.dispose())

let kit: FakeKit
beforeEach(async () => {
  await dbs.reset()
  db = dbs.waitlist
  kit = fakeKit()
  vi.stubGlobal('fetch', kit.fetch)
  vi.stubEnv('KIT_API_KEY', 'kit_test_key')
  vi.stubEnv('KIT_FORM_ID', FAKE_FORM_ID)
  vi.stubEnv('CONTACT_TEST_MODE', '')
  checkRateLimit.mockReset().mockResolvedValue({ allowed: true })
  verifyTurnstile.mockReset().mockResolvedValue(true)
  for (const fn of Object.values(logged)) fn.mockReset()
})

describe('kitClient', () => {
  const client = (f: typeof fetch = kit.fetch) => kitClient({ apiKey: 'kit_test_key', base: 'https://kit.test/v4', fetch: f })!

  it('is null without a key', () => {
    expect(kitClient({ apiKey: '' })).toBeNull()
    expect(kitClient({ apiKey: '   ' })).toBeNull()
  })

  it('signs an address up unconfirmed, tagged, on the double opt-in form', async () => {
    await client().subscribe('reader@example.com', { formId: FAKE_FORM_ID, tags: ['Everything', 'New launches'], referrer: 'https://n8builds.dev/blog' })
    expect(kit.subscriber('reader@example.com')).toEqual({
      email: 'reader@example.com',
      state: 'inactive',
      tags: ['Everything', 'New launches'],
      forms: [FAKE_FORM_ID],
      referrer: 'https://n8builds.dev/blog',
    })
    // The subscriber first, then its tags, then the form (which sends the confirm email).
    expect(kit.calls.filter((c) => c.method === 'POST').map((c) => c.path)).toEqual([
      '/subscribers',
      '/tags',
      '/tags',
      expect.stringMatching(/^\/tags\/\d+\/subscribers$/),
      expect.stringMatching(/^\/tags\/\d+\/subscribers$/),
      `/forms/${FAKE_FORM_ID}/subscribers`,
    ])
    // One look at the account's tags, then the two it lacked created.
    expect(kit.calls.filter((c) => c.method === 'GET')).toHaveLength(1)
  })

  it('finds a tag again when the remembered one was deleted in Kit', async () => {
    let target = kit
    const c = client((i, init) => target.fetch(i, init))
    await c.subscribe('a@example.com', { formId: FAKE_FORM_ID, tags: ['Everything'] })
    // The same client, an account without that tag: tagging by the remembered id is a 404.
    const emptied = fakeKit()
    target = emptied
    await c.subscribe('a@example.com', { formId: FAKE_FORM_ID, tags: ['Everything'] })
    expect(emptied.subscriber('a@example.com')?.tags).toEqual(['Everything'])
    expect(emptied.calls.some((call) => call.method === 'POST' && call.path === '/tags')).toBe(true)
  })

  it('reuses tags the account has, by name, and remembers their ids', async () => {
    const c = client()
    await c.subscribe('a@example.com', { formId: FAKE_FORM_ID, tags: ['Waitlist: Feelium'] })
    const before = kit.calls.length
    await c.subscribe('b@example.com', { formId: FAKE_FORM_ID, tags: ['Waitlist: Feelium'] })
    const later = kit.calls.slice(before)
    expect(later.some((call) => call.path.startsWith('/tags?'))).toBe(false)
    expect(later.some((call) => call.method === 'POST' && call.path === '/tags')).toBe(false)
    expect(kit.tags()).toEqual([{ id: expect.any(String), name: 'Waitlist: Feelium' }])
    expect(kit.subscriber('b@example.com')?.tags).toEqual(['Waitlist: Feelium'])
  })

  it('leaves a confirmed address confirmed when it signs up again', async () => {
    await client().subscribe('reader@example.com', { formId: FAKE_FORM_ID, tags: ['Everything'] })
    kit.confirm('reader@example.com')
    await client().subscribe('reader@example.com', { formId: FAKE_FORM_ID, tags: ['New launches'] })
    expect(kit.subscriber('reader@example.com')).toMatchObject({ state: 'active', tags: ['Everything', 'New launches'] })
  })

  it('sends only the key header, and never the key anywhere else', async () => {
    const seen: RequestInit[] = []
    const spy: typeof fetch = (input, init) => {
      seen.push(init ?? {})
      return kit.fetch(input, init)
    }
    await client(spy).subscribe('reader@example.com', { formId: FAKE_FORM_ID, tags: ['Everything'] })
    for (const init of seen) {
      expect(new Headers(init.headers).get('X-Kit-Api-Key')).toBe('kit_test_key')
      expect(String(init.body ?? '')).not.toContain('kit_test_key')
    }
  })

  it('refuses a missing form id before calling Kit', async () => {
    await expect(client().subscribe('reader@example.com', { formId: '', tags: [] })).rejects.toThrow('kit form id missing')
    expect(kit.calls).toEqual([])
  })

  it.each([
    [429, 'Rate limit hit'],
    [500, 'Internal'],
    [401, 'The access token is invalid'],
  ])('throws a KitError with the status on a %i, and no address in its message', async (code, why) => {
    const failing: typeof fetch = async () => new Response(JSON.stringify({ errors: [`${why} for reader@example.com`] }), { status: code })
    const error = await client(failing)
      .subscribe('reader@example.com', { formId: FAKE_FORM_ID, tags: [] })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(KitError)
    expect((error as KitError).status).toBe(code)
    expect((error as KitError).message).toContain(`kit POST /subscribers ${code}`)
    expect((error as KitError).message).not.toContain('reader@example.com')
  })

  it('throws a KitError when Kit is unreachable', async () => {
    const down: typeof fetch = async () => {
      throw new TypeError('fetch failed')
    }
    await expect(client(down).confirmedCount()).rejects.toMatchObject({ name: 'KitError', status: 0 })
  })

  it("finds the account's only form, and none when there are several", async () => {
    expect(await client().onlyForm()).toBe(FAKE_FORM_ID)
    const two = fakeKit({ forms: [{ id: '1', name: 'a' }, { id: '2', name: 'b' }] })
    expect(await client(two.fetch).onlyForm()).toBeNull()
  })

  it('counts confirmed subscribers only', async () => {
    const c = client()
    await c.subscribe('a@example.com', { formId: FAKE_FORM_ID, tags: [] })
    await c.subscribe('b@example.com', { formId: FAKE_FORM_ID, tags: [] })
    kit.confirm('a@example.com')
    expect(await c.confirmedCount()).toBe(1)
  })

  it('reports each part of the setup check on its own', async () => {
    const report = await client().diagnostics()
    expect(report.account).toEqual({ ok: true, name: 'n8builds', plan: 'newsletter', sendingAddress: 'updates@n8builds.dev' })
    expect(report.forms).toMatchObject({ ok: true, forms: [{ id: FAKE_FORM_ID }] })
    expect(report.tags).toEqual({ ok: true, tags: [] })
  })
})

describe('tags', () => {
  it('maps topics and projects to their Kit tag names', () => {
    expect(topicTags(['everything'])).toEqual(['Everything'])
    expect(topicTags(['notions', 'launches'])).toEqual(['n8 Notions posts', 'New launches'])
    expect(waitlistTag('feelium')).toBe('Waitlist: Feelium')
    expect(waitlistTag('fitflow7')).toBe('Waitlist: FitFlow 7')
  })
})

describe('the newsletter switch', () => {
  it('is off until it is set', async () => {
    expect(await readSwitch(dbs.waitlist)).toEqual({ on: false, at: null, by: null })
  })

  it('logs every change with who and when, and nothing for a no-op', async () => {
    const t = (m: number) => new Date(Date.UTC(2026, 10, 12, 12, m))
    await setSwitch(dbs.waitlist, true, { by: 'n8watkins', now: t(0) })
    await setSwitch(dbs.waitlist, true, { by: 'n8watkins', now: t(1) })
    await setSwitch(dbs.waitlist, false, { by: 'n8watkins', now: t(2) })
    expect(await readSwitch(dbs.waitlist)).toEqual({ on: false, at: t(2).toISOString(), by: 'n8watkins' })
    expect(await switchLog(dbs.waitlist)).toEqual([
      { on: false, at: t(2).toISOString(), by: 'n8watkins' },
      { on: true, at: t(0).toISOString(), by: 'n8watkins' },
    ])
  })
})

const valid = { email: 'Reader@Example.com', topics: ['notions', 'launches'], turnstile: 'token', honeypot: '' }

async function post(body: unknown, { contentType = 'application/json', cookie }: { contentType?: string; cookie?: string } = {}) {
  const response = await subscribe(
    new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'content-type': contentType, ...(cookie ? { cookie } : {}) },
    })
  )
  return { status: response.status, json: await response.json() }
}

/** Every row of every table in the waitlist database, as text: where an address could be kept. */
async function everythingStored(): Promise<string> {
  const { results } = await dbs.waitlist.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all<{ name: string }>()
  let all = ''
  for (const { name } of results) all += JSON.stringify((await dbs.waitlist.prepare(`SELECT * FROM "${name}"`).all()).results)
  return all
}

describe('POST /api/newsletter', () => {
  beforeEach(async () => {
    await setSwitch(dbs.waitlist, true, { by: 'test' })
  })

  it('sends a valid sign-up to Kit, tagged with its topics, and stores no address', async () => {
    expect(await post(valid)).toEqual({ status: 200, json: { message: SUBSCRIBED_MESSAGE } })
    expect(kit.subscriber('reader@example.com')).toMatchObject({
      state: 'inactive',
      tags: ['New launches', 'n8 Notions posts'],
      forms: [FAKE_FORM_ID],
      referrer: 'https://n8builds.dev/blog',
    })
    expect(verifyTurnstile).toHaveBeenCalledWith('token', '1.2.3.4')
    expect(checkRateLimit.mock.calls).toEqual([
      ['newsletter-ip', 'key:1.2.3.4'],
      ['newsletter-global', 'all'],
      ['newsletter-recipient', 'hash:reader@example.com'],
    ])
    expect(await everythingStored()).not.toMatch(/reader@example\.com/i)
  })

  it('is closed while the switch is off, before Turnstile or Kit', async () => {
    await setSwitch(dbs.waitlist, false, { by: 'test' })
    const response = await post(valid)
    expect(response).toMatchObject({ status: 503, json: { type: 'closed' } })
    expect(verifyTurnstile).not.toHaveBeenCalled()
    expect(kit.calls).toEqual([])
  })

  it('is closed while Kit has no key, even with the switch on', async () => {
    vi.stubEnv('KIT_API_KEY', '')
    expect((await post(valid)).status).toBe(503)
    expect(kit.calls).toEqual([])
  })

  it('is closed when the database is missing', async () => {
    db = null
    expect((await post(valid)).json.type).toBe('closed')
  })

  it.each([
    ['a bad email', { email: 'not-an-email' }],
    ['no topics', { topics: [] }],
    ['an unknown topic', { topics: ['gossip'] }],
    ['no Turnstile token', { turnstile: '' }],
    ['a filled honeypot', { honeypot: 'https://spam.example' }],
  ])('rejects %s before Turnstile or Kit', async (_, change) => {
    expect((await post({ ...valid, ...change })).status).toBe(400)
    expect(verifyTurnstile).not.toHaveBeenCalled()
    expect(kit.calls).toEqual([])
  })

  it('rejects a non-JSON request', async () => {
    expect((await post('email=a@b.co', { contentType: 'application/x-www-form-urlencoded' })).status).toBe(415)
  })

  it('rejects a failed Turnstile check', async () => {
    verifyTurnstile.mockResolvedValue(false)
    expect((await post(valid)).status).toBe(400)
    expect(kit.calls).toEqual([])
  })

  it.each([
    ['the per-IP limit', 'newsletter-ip'],
    ['the daily limit', 'newsletter-global'],
  ])('answers 429 past %s, without calling Kit', async (_, scope) => {
    checkRateLimit.mockImplementation(async (s: string) => (s === scope ? { allowed: false, reason: 'limited' } : { allowed: true }))
    expect((await post(valid)).status).toBe(429)
    expect(kit.calls).toEqual([])
  })

  it('answers the same past the per-address limit, without calling Kit', async () => {
    checkRateLimit.mockImplementation(async (s: string) => (s === 'newsletter-recipient' ? { allowed: false, reason: 'limited' } : { allowed: true }))
    expect(await post(valid)).toEqual({ status: 200, json: { message: SUBSCRIBED_MESSAGE } })
    expect(kit.calls).toEqual([])
  })

  it('answers 503 when Kit refuses, and logs no address', async () => {
    const response = await post({ ...valid, email: `reader@${KIT_DOWN_DOMAIN}` })
    expect(response).toMatchObject({ status: 503, json: { type: 'unavailable' } })
    expect(JSON.stringify(logged.error.mock.calls)).toContain('kit POST /subscribers 503')
    expect(JSON.stringify(logged.error.mock.calls)).not.toContain(KIT_DOWN_DOMAIN)
  })

  it("uses the account's only form when KIT_FORM_ID isn't set", async () => {
    vi.stubEnv('KIT_FORM_ID', '')
    expect((await post(valid)).status).toBe(200)
    expect(kit.subscriber('reader@example.com')?.forms).toEqual([FAKE_FORM_ID])
  })

  it('ignores the test cookie outside test mode', async () => {
    await setSwitch(dbs.waitlist, false, { by: 'test' })
    expect((await post(valid, { cookie: 'n8-newsletter-test=on' })).status).toBe(503)
  })
})

describe('GET /api/newsletter/status', () => {
  const get = async (cookie?: string) => {
    const response = await status(new NextRequest('http://localhost/api/newsletter/status', { headers: cookie ? { cookie } : {} }))
    return { on: (await response.json()).on, cache: response.headers.get('cache-control') }
  }

  it('is off by default, on with the switch, and cacheable for a minute', async () => {
    expect(await get()).toEqual({ on: false, cache: 'public, max-age=60' })
    await setSwitch(dbs.waitlist, true, { by: 'test' })
    expect((await get()).on).toBe(true)
  })

  it('is off without a Kit key, whatever the switch says', async () => {
    await setSwitch(dbs.waitlist, true, { by: 'test' })
    vi.stubEnv('KIT_API_KEY', '')
    expect((await get()).on).toBe(false)
  })

  it('in test mode, follows the test cookie and is never cached', async () => {
    vi.stubEnv('CONTACT_TEST_MODE', '1')
    vi.stubEnv('APP_ENV', '')
    expect(await get('n8-newsletter-test=on')).toEqual({ on: true, cache: 'no-store' })
    expect((await get()).on).toBe(false)
  })
})
