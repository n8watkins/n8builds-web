import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { MemoryWaitlistStore, type WaitlistStore } from '@/lib/waitlist/store'

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
  waitlistStore: () => store,
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
  return { status: response.status, json: await response.json() }
}

let memory: MemoryWaitlistStore
const saved = () => memory.entries.get(entryId('visitor@example.com'))

beforeEach(() => {
  checkRateLimit.mockReset().mockResolvedValue({ allowed: true })
  verifyTurnstile.mockReset().mockResolvedValue(true)
  sendConfirmEmail.mockReset().mockResolvedValue(undefined)
  sendLeaveEmail.mockReset().mockResolvedValue(undefined)
  afterCallbacks.length = 0
  memory = new MemoryWaitlistStore()
  store = memory
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
    expect(sendConfirmEmail).toHaveBeenCalledWith(saved())
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
    expect(memory.entries.size).toBe(0)
    expect(sendConfirmEmail).not.toHaveBeenCalled()
  })

  it('rejects a filled honeypot before Turnstile or the store', async () => {
    const response = await call(join, { ...valid, honeypot: 'https://spam.example' })
    expect(response.status).toBe(400)
    expect(verifyTurnstile).not.toHaveBeenCalled()
    expect(checkRateLimit).not.toHaveBeenCalled()
    expect(memory.entries.size).toBe(0)
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
    expect(memory.entries.size).toBe(0)
  })

  it('answers 429 over the per-IP limit, and 503 when the limiter is down', async () => {
    checkRateLimit.mockResolvedValueOnce({ allowed: false, reason: 'limited' })
    expect(await call(join, valid)).toMatchObject({ status: 429, json: { type: 'rate_limit' } })
    checkRateLimit.mockResolvedValueOnce({ allowed: false, reason: 'unavailable' })
    expect(await call(join, valid)).toMatchObject({ status: 503, json: { type: 'unavailable' } })
    expect(memory.entries.size).toBe(0)
  })

  it('answers 503 and sends nothing when the store fails', async () => {
    store = { ...memory, get: vi.fn().mockRejectedValue(new Error('Upstash down')) } as unknown as WaitlistStore
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
    await call(confirm, { token: saved()!.token })
    expect(saved()).toMatchObject({ projects: ['relink'], note: 'For my docs site' })

    const again = await call(join, { ...valid, projects: ['strollz'], note: 'Walks too' })
    expect(again).toEqual({ status: 200, json: { message: JOINED_MESSAGE } })
    expect(saved()).toMatchObject({ projects: ['relink'], requested: ['strollz'], note: 'For my docs site' })

    await call(confirm, { token: saved()!.token })
    expect(saved()).toMatchObject({ projects: ['relink', 'strollz'], requested: [], note: 'Walks too' })
  })
})

describe('POST /api/waitlist/confirm', () => {
  it('confirms the projects behind a link', async () => {
    await call(join, { ...valid, projects: ['relink', 'strollz'] })
    const response = await call(confirm, { token: saved()!.token })
    expect(response).toEqual({ status: 200, json: { message: 'Confirmed', projects: 'Relink and Strollz' } })
    expect(saved()!.confirmedAt).toMatch(/^\d{4}-/)
  })

  it('answers 404 for an unknown link and 400 for a malformed one', async () => {
    expect((await call(confirm, { token: 'x'.repeat(32) })).status).toBe(404)
    expect((await call(confirm, { token: 'short' })).status).toBe(400)
  })

  it('answers 503 when the store fails', async () => {
    store = { idForToken: vi.fn().mockRejectedValue(new Error('down')) } as unknown as WaitlistStore
    expect((await call(confirm, { token: 'x'.repeat(32) })).status).toBe(503)
  })
})

describe('POST /api/waitlist/leave', () => {
  it('deletes the entry behind a leave link', async () => {
    await call(join, valid)
    const { token } = saved()!
    expect(await call(leave, { token })).toEqual({ status: 200, json: { message: 'Removed' } })
    expect(memory.entries.size).toBe(0)
    // The link can't confirm or remove anything any more.
    expect((await call(confirm, { token })).status).toBe(404)
    expect((await call(leave, { token })).status).toBe(404)
  })

  it('emails a leave link to an address on the list, after answering', async () => {
    await call(join, valid)
    const response = await call(leave, { email: 'visitor@example.com', turnstile: 'token', honeypot: '' })
    expect(response).toEqual({ status: 200, json: { message: LEAVE_LINK_MESSAGE } })
    expect(sendLeaveEmail).not.toHaveBeenCalled()
    await Promise.all(afterCallbacks.map((fn) => fn()))
    expect(sendLeaveEmail).toHaveBeenCalledWith(saved())
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
