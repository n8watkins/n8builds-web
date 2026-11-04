import { createHmac } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { E2E_REMOTE_URL } from '../../e2e-env'

/**
 * Sanity's publish webhook: only a delivery signed with the shared secret
 * revalidates anything. The secret here is the test server's
 * (playwright.config.ts); a deployed site has its own, so against one only
 * the refusals are checked.
 */

const SECRET = 'e2e-sanity-webhook-secret'
const BODY = JSON.stringify({ _id: 'e2e', _type: 'post', slug: 'welcome-to-n8-notions' })
const sign = (body: string, t = Date.now(), secret = SECRET) =>
  `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('base64url')}`

test('refuses unsigned, wrongly signed and replayed deliveries', async ({ request }) => {
  const post = (headers: Record<string, string>) => request.post('/api/sanity/revalidate', { data: BODY, headers })
  expect((await post({})).status()).toBe(401)
  expect((await post({ 'sanity-webhook-signature': sign(BODY, Date.now(), 'wrong-secret') })).status()).toBe(401)
  expect((await post({ 'sanity-webhook-signature': sign(BODY, Date.now() - 10 * 60_000) })).status()).toBe(401)
  expect((await request.get('/api/sanity/revalidate')).status()).toBe(405)
})

test('a signed delivery revalidates the post tag, and the blog still renders', async ({ request }) => {
  test.skip(!!E2E_REMOTE_URL, 'the deployed site has its own secret')
  const response = await request.post('/api/sanity/revalidate', {
    data: BODY,
    headers: { 'sanity-webhook-signature': sign(BODY), 'content-type': 'application/json' },
  })
  expect(response.status()).toBe(200)
  expect((await response.json()).revalidated).toEqual(['sanity:post'])
  for (const path of ['/blog', '/blog/welcome-to-n8-notions', '/blog/rss.xml']) {
    expect((await request.get(path)).status(), path).toBe(200)
  }
})
