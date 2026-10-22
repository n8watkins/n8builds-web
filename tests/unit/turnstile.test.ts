import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validateHoneypot, verifyTurnstile } from '@/lib/security/turnstile'

const fetchMock = vi.fn()

function siteverifyReturns(body: Record<string, unknown>) {
  // A Response body can only be read once, so build a new one per call.
  fetchMock.mockImplementation(async () => new Response(JSON.stringify(body)))
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://n8builds.dev')
  vi.stubEnv('TURNSTILE_ALLOWED_HOSTNAMES', '')
  vi.stubEnv('CONTACT_TEST_MODE', '')
  vi.stubEnv('VERCEL', '')
})

describe('verifyTurnstile', () => {
  it('accepts a successful token issued on the site host', async () => {
    siteverifyReturns({ success: true, hostname: 'n8builds.dev' })
    expect(await verifyTurnstile('token', '1.2.3.4')).toBe(true)
  })

  it('accepts the www. variant of the site host', async () => {
    siteverifyReturns({ success: true, hostname: 'www.n8builds.dev' })
    expect(await verifyTurnstile('token')).toBe(true)
  })

  it('rejects a successful token issued on another hostname', async () => {
    siteverifyReturns({ success: true, hostname: 'evil.example' })
    expect(await verifyTurnstile('token')).toBe(false)
  })

  it('rejects a response with no hostname', async () => {
    siteverifyReturns({ success: true })
    expect(await verifyTurnstile('token')).toBe(false)
  })

  it('rejects when Cloudflare says the token is invalid', async () => {
    siteverifyReturns({ success: false, 'error-codes': ['invalid-input-response'] })
    expect(await verifyTurnstile('token')).toBe(false)
  })

  it('fails closed when the secret is missing', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    expect(await verifyTurnstile('token')).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails closed on network errors', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'))
    expect(await verifyTurnstile('token')).toBe(false)
  })

  it('fails closed on a non-JSON response', async () => {
    fetchMock.mockResolvedValue(new Response('<html>502</html>'))
    expect(await verifyTurnstile('token')).toBe(false)
  })

  it('sends the secret, token and client IP to siteverify', async () => {
    siteverifyReturns({ success: true, hostname: 'n8builds.dev' })
    await verifyTurnstile('the-token', '1.2.3.4')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    const body = init.body as URLSearchParams
    expect(body.get('secret')).toBe('secret')
    expect(body.get('response')).toBe('the-token')
    expect(body.get('remoteip')).toBe('1.2.3.4')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('omits remoteip when the IP is unknown', async () => {
    siteverifyReturns({ success: true, hostname: 'n8builds.dev' })
    await verifyTurnstile('token', 'unknown')
    expect((fetchMock.mock.calls[0][1].body as URLSearchParams).has('remoteip')).toBe(false)
  })

  it('honors TURNSTILE_ALLOWED_HOSTNAMES', async () => {
    vi.stubEnv('TURNSTILE_ALLOWED_HOSTNAMES', 'preview.n8builds.dev, other.dev')
    siteverifyReturns({ success: true, hostname: 'other.dev' })
    expect(await verifyTurnstile('token')).toBe(true)

    siteverifyReturns({ success: true, hostname: 'n8builds.dev' })
    expect(await verifyTurnstile('token')).toBe(false)
  })

  it("accepts Cloudflare's test-key hostname only in test mode", async () => {
    siteverifyReturns({ success: true, hostname: 'example.com' })
    expect(await verifyTurnstile('token')).toBe(false)

    vi.stubEnv('CONTACT_TEST_MODE', '1')
    expect(await verifyTurnstile('token')).toBe(true)

    vi.stubEnv('VERCEL', '1')
    expect(await verifyTurnstile('token')).toBe(false)
  })

  it('skips verification only under next dev', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    expect(await verifyTurnstile('anything')).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('validateHoneypot', () => {
  it('passes when empty or missing', () => {
    expect(validateHoneypot('')).toBe(true)
    expect(validateHoneypot(undefined)).toBe(true)
  })

  it('fails when filled', () => {
    expect(validateHoneypot('x')).toBe(false)
  })
})
