import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { WaitlistStore, type WaitlistLinks } from '@/lib/waitlist/store'
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

const join = (await import('@/app/api/waitlist/route')).POST
const confirm = (await import('@/app/api/waitlist/confirm/route')).POST
const leave = (await import('@/app/api/waitlist/leave/route')).POST
const { JOINED_MESSAGE, LEAVE_LINK_MESSAGE } = await import('@/lib/waitlist/http')
const { entryId } = await import('@/lib/waitlist/store')

const valid = {
  email: 'Visitor@Example.com',
  projects: ['relink'],
  note: 'For my docs site',
  source: { interest: 'relink', referrer: 'https://getrelink.dev/pricing?ref=abc#plans' },
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
})

describe('POST /api/waitlist', () => {
  it('saves a valid sign-up as a request and emails the confirm link', async () => {
    expect(await call(join, valid)).toEqual({ status: 200, json: { message: JOINED_MESSAGE } })

    expect(saved()).toMatchObject({
      email: 'visitor@example.com',
      projects: [],
      requested: ['relink'],
      requestedNote: 'For my docs site',
      confirmedAt: '',
      interest: 'relink',
      // Origin and path only: the query string and fragment are dropped.
      referrer: 'https://getrelink.dev/pricing',
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

  it("maps a renamed project's old interest to its new name", async () => {
    await call(join, { ...valid, source: { interest: 'rewire' } })
    expect(saved()).toMatchObject({ interest: 'relink' })
  })

  it('accepts Feelium as a project and as an interest', async () => {
    const response = await call(join, { ...valid, projects: ['feelium'], source: { interest: 'feelium' } })
    expect(response.status).toBe(200)
    expect(saved()).toMatchObject({ requested: ['feelium'], interest: 'feelium' })
  })

  it('accepts KeysReady, the fourth project, as a project and as an interest', async () => {
    const response = await call(join, { ...valid, projects: ['keysready'], source: { interest: 'keysready' } })
    expect(response.status).toBe(200)
    expect(saved()).toMatchObject({ requested: ['keysready'], interest: 'keysready' })
  })

  it('accepts an entry without a note (the form no longer has one)', async () => {
    const { note: _note, ...withoutNote } = valid
    const response = await call(join, withoutNote)
    expect(response.status).toBe(200)
    expect(saved()).toMatchObject({ requested: ['relink'], requestedNote: '' })
  })

  it('keeps an interest only when it names a project', async () => {
    await call(join, { ...valid, source: { interest: '<script>' } })
    expect(saved()).toMatchObject({ interest: '', referrer: '' })
  })

  it.each([
    ['a bad email', { email: 'not-an-email' }],
    ['no projects', { projects: [] }],
    ['an unknown project', { projects: ['deadlink'] }],
    ['a known project next to an unknown one', { projects: ['keysready', 'keys-ready'] }],
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
    expect(saved()?.requested).toEqual(['relink'])
    expect(sendConfirmEmail).not.toHaveBeenCalled()
  })

  it("gives the same answer for a confirmed address, and doesn't change it until confirmed", async () => {
    await call(join, valid)
    await call(confirm, { token: links().confirm })
    expect(saved()).toMatchObject({ projects: ['relink'], note: 'For my docs site' })

    const again = await call(join, { ...valid, projects: ['strollz'], note: 'Walks too' })
    expect(again).toEqual({ status: 200, json: { message: JOINED_MESSAGE } })
    expect(saved()).toMatchObject({ projects: ['relink'], requested: ['strollz'], note: 'For my docs site' })

    await call(confirm, { token: links().confirm })
    expect(saved()).toMatchObject({ projects: ['relink', 'strollz'], requested: [], note: 'Walks too' })
  })
})

describe('the confirm email after a repeat join', () => {
  it('names the projects asked for, even ones the address already confirmed', async () => {
    await call(join, valid)
    await call(confirm, { token: links().confirm })
    await call(join, valid)
    expect(sendConfirmEmail.mock.calls.at(-1)![0]).toMatchObject({ projects: ['relink'], requested: ['relink'] })
  })
})

describe('POST /api/waitlist/confirm', () => {
  it('confirms the projects behind a link', async () => {
    await call(join, { ...valid, projects: ['relink', 'strollz'] })
    const response = await call(confirm, { token: links().confirm })
    expect(response).toEqual({ status: 200, json: { message: 'Confirmed', projects: 'Relink and Strollz' } })
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
