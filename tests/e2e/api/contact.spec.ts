import { test, expect, type APIRequestContext } from '@playwright/test'

/**
 * Contact API end-to-end tests, run against a production build in
 * CONTACT_TEST_MODE (no email is sent; Turnstile uses Cloudflare's
 * always-pass test secret, which accepts any token).
 *
 * Every test gets its own client IP via x-real-ip, so per-IP rate limits never
 * leak between tests and no bypass is needed.
 */

// Random addresses rather than a counter: a counter restarts every run, so a
// reused local server (whose in-memory limits persist) would see repeats.
function uniqueIp(): string {
  const octet = () => Math.floor(Math.random() * 256)
  return `10.${octet()}.${octet()}.${octet()}`
}

function validForm(overrides: Record<string, unknown> = {}) {
  return {
    name: 'John Doe',
    email: 'john.doe@example.com',
    subject: 'project_opportunity',
    message: 'This is a test message that is longer than 10 characters.',
    turnstile: 'XXXX.DUMMY.TOKEN.XXXX',
    honeypot: '',
    ...overrides,
  }
}

function post(request: APIRequestContext, data: unknown, ip = uniqueIp(), headers: Record<string, string> = {}) {
  return request.post('/api/contact', {
    headers: { 'x-real-ip': ip, ...headers },
    data,
  })
}

test.describe('valid submissions', () => {
  test('accepts a valid submission', async ({ request }) => {
    const response = await post(request, validForm())
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ message: 'Message sent successfully!' })
  })

  for (const subject of ['project_opportunity', 'consulting', 'networking']) {
    test(`accepts subject "${subject}"`, async ({ request }) => {
      const response = await post(request, validForm({ subject }))
      expect(response.status()).toBe(200)
    })
  }

  test('accepts the maximum message length', async ({ request }) => {
    const response = await post(request, validForm({ message: 'a'.repeat(1000) }))
    expect(response.status()).toBe(200)
  })

  test('accepts names with accents, hyphens, and apostrophes', async ({ request }) => {
    for (const name of ['José García', "O'Brien", 'Jean-Pierre', 'Zoë Müller']) {
      const response = await post(request, validForm({ name }))
      expect(response.status(), name).toBe(200)
    }
  })
})

test.describe('rate limiting', () => {
  test('allows 5 submissions per IP per hour, then returns 429', async ({ request }) => {
    const ip = uniqueIp()
    for (let i = 1; i <= 5; i++) {
      const response = await post(request, validForm(), ip)
      expect(response.status(), `request ${i}`).toBe(200)
    }

    const limited = await post(request, validForm(), ip)
    expect(limited.status()).toBe(429)
    const body = await limited.json()
    expect(body.type).toBe('rate_limit')
    expect(body.error).toContain('submission limit')
  })

  test('the removed x-bypass-rate-limit header has no effect', async ({ request }) => {
    const ip = uniqueIp()
    for (let i = 0; i < 5; i++) await post(request, validForm(), ip)

    const response = await post(request, validForm(), ip, { 'x-bypass-rate-limit': 'true' })
    expect(response.status()).toBe(429)
  })

  test('limits are tracked per IP', async ({ request }) => {
    const ip = uniqueIp()
    for (let i = 0; i < 6; i++) await post(request, validForm(), ip)

    const other = await post(request, validForm())
    expect(other.status()).toBe(200)
  })

  test('invalid submissions count toward the per-IP limit', async ({ request }) => {
    const ip = uniqueIp()
    for (let i = 0; i < 5; i++) await post(request, validForm({ name: '' }), ip)

    const response = await post(request, validForm(), ip)
    expect(response.status()).toBe(429)
  })
})

test.describe('input validation', () => {
  const invalid: Array<[string, Record<string, unknown>]> = [
    ['missing name', { name: undefined }],
    ['short name', { name: 'J' }],
    ['long name', { name: 'a'.repeat(51) }],
    ['name with invalid characters', { name: 'John<script>' }],
    ['invalid email', { email: 'not-an-email' }],
    ['email without a TLD', { email: 'john@localhost' }],
    ['short message', { message: 'short' }],
    ['long message', { message: 'a'.repeat(1001) }],
    ['unknown subject', { subject: 'spam' }],
    ['missing Turnstile token', { turnstile: '' }],
    ['filled honeypot', { honeypot: 'gotcha' }],
  ]

  for (const [label, overrides] of invalid) {
    test(`rejects ${label}`, async ({ request }) => {
      const response = await post(request, validForm(overrides))
      expect(response.status()).toBe(400)
      // Validation details are never exposed.
      expect(await response.json()).toEqual({
        error: 'Invalid form data. Please check your inputs and try again.',
      })
    })
  }

  test('rejects malformed JSON', async ({ request }) => {
    const response = await request.post('/api/contact', {
      headers: { 'x-real-ip': uniqueIp(), 'content-type': 'application/json' },
      data: Buffer.from('{not json'),
    })
    expect(response.status()).toBe(400)
    expect((await response.json()).error).toBe('Invalid JSON in request body')
  })

  test('rejects payloads over 10KB with 413', async ({ request }) => {
    const response = await post(request, validForm({ message: 'a'.repeat(11 * 1024) }))
    expect(response.status()).toBe(413)
  })
})

test.describe('robustness', () => {
  test('handles concurrent submissions from different IPs', async ({ request }) => {
    const responses = await Promise.all(Array.from({ length: 5 }, () => post(request, validForm())))
    for (const response of responses) expect(response.status()).toBe(200)
  })

  test('the legacy /api/health/error endpoint is gone', async ({ request }) => {
    const response = await request.post('/api/health/error', { data: { error: 'x' } })
    expect(response.status()).toBe(404)
  })

  test('/api/health is a minimal liveness check', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })
})
