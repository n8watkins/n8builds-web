import { test, expect, type APIRequestContext } from '@playwright/test'

/**
 * The newsletter API against the test-mode server (no email sent, Turnstile's
 * always-pass test secret). Each test has its own IP.
 */

function uniqueIp(): string {
  const octet = () => Math.floor(Math.random() * 256)
  return `10.${octet()}.${octet()}.${octet()}`
}

function subscribe(request: APIRequestContext, overrides: Record<string, unknown> = {}) {
  return request.post('/api/newsletter', {
    headers: { 'x-real-ip': uniqueIp() },
    data: {
      email: `api+${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`,
      turnstile: 'XXXX.DUMMY.TOKEN.XXXX',
      honeypot: '',
      ...overrides,
    },
  })
}

test('accepts a valid sign-up with the one answer every address gets', async ({ request }) => {
  const response = await subscribe(request)
  expect(response.status()).toBe(200)
  expect((await response.json()).message).toMatch(/check your inbox/i)
})

test('rejects a filled honeypot and a bad address', async ({ request }) => {
  expect((await subscribe(request, { honeypot: 'gotcha' })).status()).toBe(400)
  expect((await subscribe(request, { email: 'not-an-email' })).status()).toBe(400)
})

test('rejects a form post (JSON only)', async ({ request }) => {
  const response = await request.post('/api/newsletter', { headers: { 'x-real-ip': uniqueIp() }, form: { email: 'a@b.co' } })
  expect(response.status()).toBe(415)
})

test('an unknown confirm link is a 404, and a bad unsubscribe token a 400', async ({ request }) => {
  const confirm = await request.post('/api/newsletter/confirm', { headers: { 'x-real-ip': uniqueIp() }, data: { token: 'y'.repeat(32) } })
  expect(confirm.status()).toBe(404)
  expect((await request.post('/api/newsletter/unsubscribe?t=short')).status()).toBe(400)
  // An unknown but well-formed token: nothing to delete, the same answer.
  expect((await request.post(`/api/newsletter/unsubscribe?t=${'z'.repeat(32)}`, { form: { 'List-Unsubscribe': 'One-Click' } })).status()).toBe(200)
})
