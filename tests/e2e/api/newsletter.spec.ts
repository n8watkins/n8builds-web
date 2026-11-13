import { test, expect, type APIRequestContext } from '@playwright/test'

/**
 * The newsletter API against the test-mode server: Kit is the in-memory
 * stand-in, Turnstile's always-pass test secret, and the owner's switch off
 * unless a request carries the test cookie. Each request has its own IP.
 */

function uniqueIp(): string {
  const octet = () => Math.floor(Math.random() * 256)
  return `10.${octet()}.${octet()}.${octet()}`
}

const ON = 'n8-newsletter-test=on'
const uniqueEmail = (domain = 'example.com') => `api+${Date.now()}${Math.floor(Math.random() * 1e6)}@${domain}`

function subscribe(request: APIRequestContext, overrides: Record<string, unknown> = {}, cookie: string | null = ON) {
  return request.post('/api/newsletter', {
    headers: { 'x-real-ip': uniqueIp(), ...(cookie ? { cookie } : {}) },
    data: { email: uniqueEmail(), topics: ['everything'], turnstile: 'XXXX.DUMMY.TOKEN.XXXX', honeypot: '', ...overrides },
  })
}

test('is closed while the switch is off', async ({ request }) => {
  const response = await subscribe(request, {}, null)
  expect(response.status()).toBe(503)
  expect((await response.json()).type).toBe('closed')
  expect(await (await request.get('/api/newsletter/status')).json()).toEqual({ on: false })
})

test('accepts a valid sign-up with the one answer every address gets, and hands it to Kit', async ({ request }) => {
  const email = uniqueEmail()
  const response = await subscribe(request, { email, topics: ['launches'] })
  expect(response.status()).toBe(200)
  expect((await response.json()).message).toMatch(/check your inbox/i)
  const { subscriber } = await (await request.get(`/api/test/kit?email=${encodeURIComponent(email)}`)).json()
  expect(subscriber).toMatchObject({ state: 'inactive', tags: ['New launches'], forms: ['4242'] })
})

test('rejects a filled honeypot, a bad address and a bad topic', async ({ request }) => {
  expect((await subscribe(request, { honeypot: 'gotcha' })).status()).toBe(400)
  expect((await subscribe(request, { email: 'not-an-email' })).status()).toBe(400)
  expect((await subscribe(request, { topics: [] })).status()).toBe(400)
  expect((await subscribe(request, { topics: ['gossip'] })).status()).toBe(400)
})

test('rejects a form post (JSON only)', async ({ request }) => {
  const response = await request.post('/api/newsletter', { headers: { 'x-real-ip': uniqueIp(), cookie: ON }, form: { email: 'a@b.co' } })
  expect(response.status()).toBe(415)
})

test('answers 503 when Kit refuses', async ({ request }) => {
  const response = await subscribe(request, { email: uniqueEmail('kit-down.example') })
  expect(response.status()).toBe(503)
  expect((await response.json()).type).toBe('unavailable')
})

test('the self-sent confirm and unsubscribe APIs are gone', async ({ request }) => {
  expect((await request.post('/api/newsletter/confirm', { data: { token: 'y'.repeat(32) } })).status()).toBe(404)
  expect((await request.post(`/api/newsletter/unsubscribe?t=${'z'.repeat(32)}`)).status()).toBe(404)
})
