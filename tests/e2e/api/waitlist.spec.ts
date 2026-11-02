import { test, expect, type APIRequestContext } from '@playwright/test'

/**
 * The waitlist API against the test-mode server (an in-memory store, no
 * email sent, Turnstile's always-pass test secret). Each test has its own IP.
 */

function uniqueIp(): string {
  const octet = () => Math.floor(Math.random() * 256)
  return `10.${octet()}.${octet()}.${octet()}`
}

function join(request: APIRequestContext, overrides: Record<string, unknown> = {}) {
  return request.post('/api/waitlist', {
    headers: { 'x-real-ip': uniqueIp() },
    data: {
      email: `api+${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`,
      projects: ['relink'],
      note: '',
      turnstile: 'XXXX.DUMMY.TOKEN.XXXX',
      honeypot: '',
      ...overrides,
    },
  })
}

test('accepts a valid sign-up', async ({ request }) => {
  const response = await join(request, { source: { interest: 'relink', referrer: 'https://example.com/' } })
  expect(response.status()).toBe(200)
  expect((await response.json()).message).toMatch(/check your inbox/i)
})

test('rejects a filled honeypot', async ({ request }) => {
  expect((await join(request, { honeypot: 'gotcha' })).status()).toBe(400)
})

test('rejects an unknown project', async ({ request }) => {
  expect((await join(request, { projects: ['deadlink'] })).status()).toBe(400)
})

test('rejects a form post (JSON only)', async ({ request }) => {
  const response = await request.post('/api/waitlist', { headers: { 'x-real-ip': uniqueIp() }, form: { email: 'a@b.co' } })
  expect(response.status()).toBe(415)
})

test('an unknown confirm link is a 404', async ({ request }) => {
  const response = await request.post('/api/waitlist/confirm', {
    headers: { 'x-real-ip': uniqueIp() },
    data: { token: 'y'.repeat(32) },
  })
  expect(response.status()).toBe(404)
})

test('the upcoming page is in the sitemap; its link pages are not indexed', async ({ request }) => {
  expect(await (await request.get('/sitemap.xml')).text()).toContain('https://n8builds.dev/upcoming</loc>')
  const confirm = await (await request.get('/upcoming/confirm')).text()
  expect(confirm).toMatch(/<meta name="robots" content="noindex, nofollow"/)
})
