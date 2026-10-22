import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const checkRateLimit = vi.fn()
const verifyTurnstile = vi.fn()
const sendContactEmails = vi.fn()

vi.mock('@/lib/security/rateLimiter', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
  getClientIp: () => '1.2.3.4',
  rateLimitIpKey: (ip: string) => `key:${ip}`,
  recipientKey: (email: string) => `hash:${email}`,
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

async function post(body: unknown, contentType = 'application/json') {
  const response = await POST(
    new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': contentType },
    })
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
      ['ip', 'key:1.2.3.4'],
      ['global', 'all'],
      ['recipient', 'hash:john.doe@example.com'],
    ])
    expect(verifyTurnstile).toHaveBeenCalledWith('token', '1.2.3.4')
    expect(sendContactEmails).toHaveBeenCalledWith(expect.objectContaining({ email: 'john.doe@example.com' }), {
      autoReply: true,
    })
  })

  it('checks Turnstile before any rate limiter, so junk never reaches Redis', async () => {
    verifyTurnstile.mockResolvedValue(false)

    const { status, json } = await post(validForm)
    expect(status).toBe(400)
    expect(json.error).toMatch(/Verification failed/)
    expect(checkRateLimit).not.toHaveBeenCalled()
    expect(sendContactEmails).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON before any rate limiter', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: '{"bad json',
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(response.status).toBe(400)
    expect(checkRateLimit).not.toHaveBeenCalled()
  })

  it('rejects a filled honeypot before Turnstile or any rate limiter', async () => {
    const { status } = await post({ ...validForm, honeypot: 'gotcha' })
    expect(status).toBe(400)
    expect(verifyTurnstile).not.toHaveBeenCalled()
    expect(checkRateLimit).not.toHaveBeenCalled()
  })

  it('rejects a non-JSON content type (cross-site simple form posts)', async () => {
    const { status } = await post(validForm, 'text/plain')
    expect(status).toBe(415)
    expect(verifyTurnstile).not.toHaveBeenCalled()
    expect(sendContactEmails).not.toHaveBeenCalled()
  })

  it('returns 503 with the direct email when the per-IP limiter is unavailable', async () => {
    checkRateLimit.mockResolvedValueOnce({ allowed: false, reason: 'unavailable' })

    const { status, json } = await post(validForm)
    expect(status).toBe(503)
    expect(json.type).toBe('unavailable')
    expect(json.error).toContain('email me directly at nathancwatkins23@gmail.com')
    expect(sendContactEmails).not.toHaveBeenCalled()
  })

  it('returns 429 when the per-IP limit is reached', async () => {
    checkRateLimit.mockResolvedValueOnce({ allowed: false, reason: 'limited' })

    const { status, json } = await post(validForm)
    expect(status).toBe(429)
    expect(json.type).toBe('rate_limit')
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

  it('still notifies the owner but skips the auto-reply once the recipient had one today', async () => {
    checkRateLimit
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce({ allowed: false, reason: 'limited' })

    const { status } = await post(validForm)
    expect(status).toBe(200)
    expect(sendContactEmails).toHaveBeenCalledWith(expect.anything(), { autoReply: false })
  })

  it('returns 500 with the sender error when email delivery fails', async () => {
    sendContactEmails.mockResolvedValue({ success: false, error: 'SMTP down' })

    expect(await post(validForm)).toEqual({ status: 500, json: { error: 'SMTP down' } })
  })
})
