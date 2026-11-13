import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { WaitlistStore, type WaitlistLinks } from '@/lib/waitlist/store'
import type { D1Database } from '@/lib/db'
import { FAKE_FORM_ID, KIT_DOWN_DOMAIN, fakeKit, type FakeKit } from '@/lib/newsletter/kitFake'
import { setSwitch } from '@/lib/newsletter/switch'
import { testDatabases, type TestDatabases } from './d1'

const checkRateLimit = vi.fn()
const verifyTurnstile = vi.fn()
const sendConfirmEmail = vi.fn()
const sendLeaveEmail = vi.fn()

vi.mock('@/lib/security/rateLimiter', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
  getClientIp: () => '1.2.3.4',
  rateLimitIpKey: (ip: string) => `key:${ip}`,
  recipientKey: (email: string) => `hash:${email}`,
}))
vi.mock('@/lib/security/turnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => verifyTurnstile(...args),
}))
vi.mock('@/lib/email/waitlist', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/email/waitlist')>()),
  sendConfirmEmail: (...args: unknown[]) => sendConfirmEmail(...args),
  sendLeaveEmail: (...args: unknown[]) => sendLeaveEmail(...args),
}))
// after() needs a live request scope: collect its callbacks and run them by hand.
const afterCallbacks: (() => unknown)[] = []
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (fn: () => unknown) => afterCallbacks.push(fn),
}))
let store: WaitlistStore | null = null
vi.mock('@/lib/waitlist/store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/waitlist/store')>()),
  waitlistStore: async () => store,
}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
// The newsletter switch's database (lib/newsletter/server.ts): none, so off, unless a test sets it.
let switchDb: D1Database | null = null
vi.mock('@/lib/db', () => ({ waitlistDb: async () => switchDb }))

const join = (await import('@/app/api/waitlist/route')).POST
const confirm = (await import('@/app/api/waitlist/confirm/route')).POST
const leave = (await import('@/app/api/waitlist/leave/route')).POST
const { JOINED_MESSAGE, LEAVE_LINK_MESSAGE } = await import('@/lib/waitlist/http')
const { entryId } = await import('@/lib/waitlist/store')

const valid = {
  email: 'Visitor@Example.com',
  projects: ['feelium'],
  note: 'For my docs site',
  source: { interest: 'feelium', referrer: 'https://feelium.n8builds.dev/pricing?ref=abc#plans' },
  turnstile: 'token',
  honeypot: '',
}

type Handler = (request: NextRequest) => Promise<Response>

async function call(handler: Handler, body: unknown, contentType = 'application/json') {
  const response = await handler(
    new NextRequest('http://localhost/api/waitlist', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'content-type': contentType },
    })
  )
  const result = { status: response.status, json: await response.json() }
  await reload()
  return result
}

let dbs: TestDatabases
let real: WaitlistStore
beforeAll(async () => {
  dbs = await testDatabases()
})
afterAll(() => dbs.dispose())

/** The visitor's entry as stored now. */
let current: Awaited<ReturnType<WaitlistStore['get']>> = null
const saved = () => current
async function reload() {
  current = await real.get(entryId('visitor@example.com'))
}
const rows = async () => (await dbs.waitlist.prepare('SELECT COUNT(*) AS n FROM waitlist_subscribers').first<{ n: number }>())!.n
/** The links in the latest confirm email. */
const links = (): WaitlistLinks => sendConfirmEmail.mock.calls.at(-1)![1]
/** The token in the latest leave-link email. */
const leaveToken = (): string => sendLeaveEmail.mock.calls.at(-1)![1]

beforeEach(async () => {
  checkRateLimit.mockReset().mockResolvedValue({ allowed: true })
  verifyTurnstile.mockReset().mockResolvedValue(true)
  sendConfirmEmail.mockReset().mockResolvedValue(undefined)
  sendLeaveEmail.mockReset().mockResolvedValue(undefined)
  afterCallbacks.length = 0
  await dbs.reset()
  real = new WaitlistStore(dbs.waitlist)
  store = real
  current = null
  switchDb = null
})

describe('POST /api/waitlist while the newsletter is on (Kit)', () => {
  let kit: FakeKit
  beforeEach(async () => {
    kit = fakeKit()
    vi.stubGlobal('fetch', kit.fetch)
    vi.stubEnv('KIT_API_KEY', 'kit_test_key')
    vi.stubEnv('KIT_FORM_ID', FAKE_FORM_ID)
    switchDb = dbs.waitlist
    await setSwitch(dbs.waitlist, true, { by: 'test' })
  })

  it('sends the sign-up to Kit with one tag per project, and keeps nothing here', async () => {
    const response = await call(join, { ...valid, projects: ['feelium', 'fitflow7'] })
    expect(response).toEqual({ status: 200, json: { message: JOINED_MESSAGE } })
    expect(kit.subscriber('visitor@example.com')).toEqual({
      email: 'visitor@example.com',
      state: 'inactive',
      tags: ['Waitlist: Feelium', 'Waitlist: FitFlow 7'],
      forms: [FAKE_FORM_ID],
      // Origin and path only, as the stored referrer.
      referrer: 'https://feelium.n8builds.dev/pricing',
    })
    expect(await rows()).toBe(0)
    expect(sendConfirmEmail).not.toHaveBeenCalled()
    expect(checkRateLimit.mock.calls).toEqual([
      ['waitlist-ip', 'key:1.2.3.4'],
      ['waitlist-global', 'all'],
      ['waitlist-recipient', 'hash:visitor@example.com'],
    ])
  })

  it('works without the waitlist store: Kit is all it needs', async () => {
    store = null
    expect((await call(join, valid)).status).toBe(200)
    expect(kit.subscriber('visitor@example.com')?.tags).toEqual(['Waitlist: Feelium'])
  })

  it('still checks Turnstile and the form first', async () => {
    verifyTurnstile.mockResolvedValue(false)
    expect((await call(join, valid)).status).toBe(400)
    expect((await call(join, { ...valid, projects: [] })).status).toBe(400)
    expect(kit.calls).toEqual([])
  })

  it('answers the same past the per-address limit, without calling Kit', async () => {
    checkRateLimit.mockImplementation(async (s: string) => (s === 'waitlist-recipient' ? { allowed: false, reason: 'limited' } : { allowed: true }))
    expect(await call(join, valid)).toEqual({ status: 200, json: { message: JOINED_MESSAGE } })
    expect(kit.calls).toEqual([])
  })

  it('answers 503 when Kit refuses', async () => {
    const response = await call(join, { ...valid, email: `visitor@${KIT_DOWN_DOMAIN}` })
    expect(response).toMatchObject({ status: 503, json: { type: 'unavailable' } })
    expect(await rows()).toBe(0)
  })

  it('goes back to its own double opt-in when the switch is off', async () => {
    await setSwitch(dbs.waitlist, false, { by: 'test' })
    expect((await call(join, valid)).status).toBe(200)
    expect(kit.calls).toEqual([])
    expect(sendConfirmEmail).toHaveBeenCalledTimes(1)
    expect(await rows()).toBe(1)
  })
})

describe('POST /api/waitlist', () => {
  it('saves a valid sign-up as a request and emails the confirm link', async () => {
    expect(await call(join, valid)).toEqual({ status: 200, json: { message: JOINED_MESSAGE } })

    expect(saved()).toMatchObject({
      email: 'visitor@example.com',
      projects: [],
      requested: ['feelium'],
      requestedNote: 'For my docs site',
      confirmedAt: '',
      interest: 'feelium',
      // Origin and path only: the query string and fragment are dropped.
      referrer: 'https://feelium.n8builds.dev/pricing',
    })
    expect(saved()!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(sendConfirmEmail).toHaveBeenCalledWith(saved(), { confirm: expect.any(String), leave: expect.any(String) })
    expect(verifyTurnstile).toHaveBeenCalledWith('token', '1.2.3.4')
    expect(checkRateLimit.mock.calls).toEqual([
      ['waitlist-ip', 'key:1.2.3.4'],
      ['waitlist-global', 'all'],
      ['waitlist-recipient', 'hash:visitor@example.com'],
    ])
  })

  it('ignores an interest that is no longer a project', async () => {
    await call(join, { ...valid, source: { interest: 'relink' } })
    expect(saved()).toMatchObject({ interest: '' })
  })

  it('accepts Pivot as a project and as an interest', async () => {
    const response = await call(join, { ...valid, projects: ['pivot'], source: { interest: 'pivot' } })
    expect(response.status).toBe(200)
    expect(saved()).toMatchObject({ requested: ['pivot'], interest: 'pivot' })
  })

  it('accepts an entry without a note (the form no longer has one)', async () => {
    const { note: _note, ...withoutNote } = valid
    const response = await call(join, withoutNote)
    expect(response.status).toBe(200)
    expect(saved()).toMatchObject({ requested: ['feelium'], requestedNote: '' })
  })

  it('keeps an interest only when it names a project', async () => {
    await call(join, { ...valid, source: { interest: '<script>' } })
    expect(saved()).toMatchObject({ interest: '', referrer: '' })
  })

  // Unlisted since 2026-11-11 (owner: "it's just not advertised"): the waitlist behind each still works.
  it.each(['keysready', 'strollz', 'vibelog', 'asset-arsenal'])('accepts %s, an unlisted project, as a project and as an interest, and emails its confirm link', async (slug) => {
    const response = await call(join, { ...valid, projects: [slug], source: { interest: slug } })
    expect(response.status).toBe(200)
    expect(saved()).toMatchObject({ requested: [slug], interest: slug })
    expect(sendConfirmEmail).toHaveBeenCalledTimes(1)
    expect(sendConfirmEmail.mock.calls.at(-1)![0]).toMatchObject({ requested: [slug] })
    // Confirming it puts the address on it, by name.
    const confirmed = await call(confirm, { token: links().confirm })
    expect(confirmed.status).toBe(200)
    expect(saved()?.projects).toEqual([slug])
  })

  it.each([
    ['a bad email', { email: 'not-an-email' }],
    ['no projects', { projects: [] }],
    ['an unknown project', { projects: ['relink'] }],
    ['a known project next to an unknown one', { projects: ['feelium', 'keys-ready'] }],
    ['a note over 500 characters', { note: 'x'.repeat(501) }],
    ['no Turnstile token', { turnstile: '' }],
  ])('rejects %s without touching the store', async (_, change) => {
    const response = await call(join, { ...valid, ...change })
    expect(response.status).toBe(400)
    expect(await rows()).toBe(0)
    expect(sendConfirmEmail).not.toHaveBeenCalled()
  })

  it('rejects a filled honeypot before Turnstile or the store', async () => {
    const response = await call(join, { ...valid, honeypot: 'https://spam.example' })
    expect(response.status).toBe(400)
    expect(verifyTurnstile).not.toHaveBeenCalled()
    expect(checkRateLimit).not.toHaveBeenCalled()
    expect(await rows()).toBe(0)
  })

  it('rejects a non-JSON request', async () => {
    expect((await call(join, 'email=a@b.co', 'application/x-www-form-urlencoded')).status).toBe(415)
  })

  it('says the waitlist opens soon while no store is configured', async () => {
    store = null
    const response = await call(join, valid)
    expect(response.status).toBe(503)
    expect(response.json.type).toBe('closed')
    expect(verifyTurnstile).not.toHaveBeenCalled()
  })

  it('rejects a failed Turnstile check', async () => {
    verifyTurnstile.mockResolvedValue(false)
    expect((await call(join, valid)).status).toBe(400)
    expect(await rows()).toBe(0)
  })

  it('answers 429 over the per-IP limit, and 503 when the limiter is down', async () => {
    checkRateLimit.mockResolvedValueOnce({ allowed: false, reason: 'limited' })
    expect(await call(join, valid)).toMatchObject({ status: 429, json: { type: 'rate_limit' } })
    checkRateLimit.mockResolvedValueOnce({ allowed: false, reason: 'unavailable' })
    expect(await call(join, valid)).toMatchObject({ status: 503, json: { type: 'unavailable' } })
    expect(await rows()).toBe(0)
  })

  it('answers 503 and sends nothing when the store fails', async () => {
    store = Object.assign(new WaitlistStore(dbs.waitlist), { join: vi.fn().mockRejectedValue(new Error('D1 down')) })
    expect(await call(join, valid)).toMatchObject({ status: 503, json: { type: 'unavailable' } })
    expect(sendConfirmEmail).not.toHaveBeenCalled()
  })

  it('says so when the confirm email fails', async () => {
    sendConfirmEmail.mockRejectedValue(new Error('SMTP down'))
    const response = await call(join, valid)
    expect(response.status).toBe(500)
    expect(response.json.error).toMatch(/confirmation email/)
  })

  it('skips the email, but still saves, once an address had its emails for today', async () => {
    checkRateLimit.mockImplementation(async (scope: string) =>
      scope === 'waitlist-recipient' ? { allowed: false, reason: 'limited' } : { allowed: true }
    )
    expect((await call(join, valid)).status).toBe(200)
    expect(saved()?.requested).toEqual(['feelium'])
    expect(sendConfirmEmail).not.toHaveBeenCalled()
  })

  it("gives the same answer for a confirmed address, and doesn't change it until confirmed", async () => {
    await call(join, valid)
    await call(confirm, { token: links().confirm })
    expect(saved()).toMatchObject({ projects: ['feelium'], note: 'For my docs site' })

    const again = await call(join, { ...valid, projects: ['fitflow7'], note: 'Walks too' })
    expect(again).toEqual({ status: 200, json: { message: JOINED_MESSAGE } })
    expect(saved()).toMatchObject({ projects: ['feelium'], requested: ['fitflow7'], note: 'For my docs site' })

    await call(confirm, { token: links().confirm })
    expect(saved()).toMatchObject({ projects: ['feelium', 'fitflow7'], requested: [], note: 'Walks too' })
  })
})

describe('the confirm email after a repeat join', () => {
  it('names the projects asked for, even ones the address already confirmed', async () => {
    await call(join, valid)
    await call(confirm, { token: links().confirm })
    await call(join, valid)
    expect(sendConfirmEmail.mock.calls.at(-1)![0]).toMatchObject({ projects: ['feelium'], requested: ['feelium'] })
  })
})

describe('POST /api/waitlist/confirm', () => {
  it('confirms the projects behind a link', async () => {
    await call(join, { ...valid, projects: ['feelium', 'fitflow7'] })
    const response = await call(confirm, { token: links().confirm })
    expect(response).toEqual({ status: 200, json: { message: 'Confirmed', projects: 'Feelium and FitFlow 7' } })
    expect(saved()!.confirmedAt).toMatch(/^\d{4}-/)
  })

  it('works once: a replayed or leave link confirms nothing', async () => {
    await call(join, valid)
    const { confirm: token, leave: leaveLink } = links()
    expect((await call(confirm, { token: leaveLink })).status).toBe(404)
    expect(saved()!.confirmedAt).toBe('')
    expect((await call(confirm, { token })).status).toBe(200)
    expect((await call(confirm, { token })).status).toBe(404)
  })

  it('answers 404 for an unknown link and 400 for a malformed one', async () => {
    expect((await call(confirm, { token: 'x'.repeat(32) })).status).toBe(404)
    expect((await call(confirm, { token: 'short' })).status).toBe(400)
  })

  it('answers 503 when the store fails', async () => {
    store = Object.assign(new WaitlistStore(dbs.waitlist), { confirm: vi.fn().mockRejectedValue(new Error('down')) })
    expect((await call(confirm, { token: 'x'.repeat(32) })).status).toBe(503)
  })
})

describe('POST /api/waitlist/leave', () => {
  it('deletes the entry behind a leave link', async () => {
    await call(join, valid)
    const { confirm: confirmLink, leave: token } = links()
    // A confirm link isn't a leave link.
    expect((await call(leave, { token: confirmLink })).status).toBe(404)
    expect(await call(leave, { token })).toEqual({ status: 200, json: { message: 'Removed' } })
    expect(await rows()).toBe(0)
    // Neither link can confirm or remove anything any more.
    expect((await call(confirm, { token: confirmLink })).status).toBe(404)
    expect((await call(leave, { token })).status).toBe(404)
  })

  it('emails a leave link to an address on the list, after answering', async () => {
    await call(join, valid)
    const response = await call(leave, { email: 'visitor@example.com', turnstile: 'token', honeypot: '' })
    expect(response).toEqual({ status: 200, json: { message: LEAVE_LINK_MESSAGE } })
    expect(sendLeaveEmail).not.toHaveBeenCalled()
    await Promise.all(afterCallbacks.map((fn) => fn()))
    expect(sendLeaveEmail).toHaveBeenCalledWith(saved(), expect.any(String))
    // The emailed link works.
    expect(await call(leave, { token: leaveToken() })).toEqual({ status: 200, json: { message: 'Removed' } })
    expect(await rows()).toBe(0)
  })

  it('gives the same answer for an address that is not on the list, and sends nothing', async () => {
    const response = await call(leave, { email: 'nobody@example.com', turnstile: 'token', honeypot: '' })
    expect(response).toEqual({ status: 200, json: { message: LEAVE_LINK_MESSAGE } })
    await Promise.all(afterCallbacks.map((fn) => fn()))
    expect(sendLeaveEmail).not.toHaveBeenCalled()
  })

  it('rejects a filled honeypot and a failed Turnstile check', async () => {
    expect((await call(leave, { email: 'visitor@example.com', turnstile: 'token', honeypot: 'x' })).status).toBe(400)
    verifyTurnstile.mockResolvedValue(false)
    expect((await call(leave, { email: 'visitor@example.com', turnstile: 'token', honeypot: '' })).status).toBe(400)
    expect(afterCallbacks).toHaveLength(0)
  })
})
