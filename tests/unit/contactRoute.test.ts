import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const checkRateLimit = vi.fn()
const verifyTurnstile = vi.fn()
const sendContactEmails = vi.fn()

vi.mock('@/lib/security/rateLimiter', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
  getClientIp: () => '1.2.3.4',
}))
vi.mock('@/lib/security/turnstile', () => ({
  verifyTurnstile: (...args: unknown[]) => verifyTurnstile(...args),
}))
vi.mock('@/lib/email/sender', () => ({
  sendContactEmails: (...args: unknown[]) => sendContactEmails(...args),
}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const { POST } = await import('@/app/api/contact/route')

const validForm = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  subject: 'project_opportunity',
  message: 'This is a test message that is longer than 10 characters.',
  turnstile: 'token',
  honeypot: '',
}

async function post(body: unknown) {
  const response = await POST(
    new NextRequest('http://localhost/api/contact', { method: 'POST', body: JSON.stringify(body) })
  )
  return { status: response.status, json: await response.json() }
}

beforeEach(() => {
  checkRateLimit.mockReset().mockResolvedValue({ allowed: true })
  verifyTurnstile.mockReset().mockResolvedValue(true)
  sendContactEmails.mockReset().mockResolvedValue({ success: true })
})

describe('POST /api/contact', () => {
  it('sends a valid submission after every check passes', async () => {
    expect(await post(validForm)).toEqual({ status: 200, json: { message: 'Message sent successfully!' } })
    expect(checkRateLimit.mock.calls).toEqual([
      ['ip', '1.2.3.4'],
      ['global', 'all'],
    ])
    expect(verifyTurnstile).toHaveBeenCalledWith('token', '1.2.3.4')
    expect(sendContactEmails).toHaveBeenCalledOnce()
  })

  it('returns 503 with the direct email when the per-IP limiter is unavailable', async () => {
    checkRateLimit.mockResolvedValueOnce({ allowed: false, reason: 'unavailable' })

    const { status, json } = await post(validForm)
    expect(status).toBe(503)
    expect(json.type).toBe('unavailable')
    expect(json.error).toContain('email me directly at nathancwatkins23@gmail.com')
    expect(verifyTurnstile).not.toHaveBeenCalled()
    expect(sendContactEmails).not.toHaveBeenCalled()
  })

  it('returns 429 when the per-IP limit is reached', async () => {
    checkRateLimit.mockResolvedValueOnce({ allowed: false, reason: 'limited' })

    const { status, json } = await post(validForm)
    expect(status).toBe(429)
    expect(json.type).toBe('rate_limit')
    expect(sendContactEmails).not.toHaveBeenCalled()
  })

  it('rejects a failed Turnstile check without counting it against the daily limit', async () => {
    verifyTurnstile.mockResolvedValue(false)

    const { status, json } = await post(validForm)
    expect(status).toBe(400)
    expect(json.error).toMatch(/Verification failed/)
    expect(checkRateLimit.mock.calls).toEqual([['ip', '1.2.3.4']])
    expect(sendContactEmails).not.toHaveBeenCalled()
  })

  it('returns 503 when the site-wide limiter is unavailable', async () => {
    checkRateLimit
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce({ allowed: false, reason: 'unavailable' })

    const { status, json } = await post(validForm)
    expect(status).toBe(503)
    expect(json.type).toBe('unavailable')
    expect(sendContactEmails).not.toHaveBeenCalled()
  })

  it('returns 429 when the site-wide daily limit is reached', async () => {
    checkRateLimit
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce({ allowed: false, reason: 'limited' })

    const { status } = await post(validForm)
    expect(status).toBe(429)
    expect(sendContactEmails).not.toHaveBeenCalled()
  })

  it('rejects a filled honeypot before Turnstile or the daily limit', async () => {
    const { status } = await post({ ...validForm, honeypot: 'gotcha' })
    expect(status).toBe(400)
    expect(verifyTurnstile).not.toHaveBeenCalled()
    expect(checkRateLimit.mock.calls).toEqual([['ip', '1.2.3.4']])
  })

  it('returns 500 with the sender error when email delivery fails', async () => {
    sendContactEmails.mockResolvedValue({ success: false, error: 'SMTP down' })

    expect(await post(validForm)).toEqual({ status: 500, json: { error: 'SMTP down' } })
  })
})
