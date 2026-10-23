import { test, expect } from '@playwright/test'

/**
 * The image optimizer only accepts the sources the site actually uses. Each
 * extra source (another Sanity project, a cache-busting query string) is a new
 * image anyone could make it fetch and transform, spending the quota.
 */

const optimize = (url: string) => `/_next/image?url=${encodeURIComponent(url)}&w=640&q=75`

test('serves a local image', async ({ request }) => {
  expect((await request.get(optimize('/tab/n8-icon.png'))).status()).toBe(200)
})

test('rejects a local image with a query string', async ({ request }) => {
  expect((await request.get(optimize('/tab/n8-icon.png?a=1'))).status()).toBe(400)
})

test("rejects another Sanity project's images", async ({ request }) => {
  const foreign = 'https://cdn.sanity.io/images/zzzzzzzz/production/abc-100x100.png'
  expect((await request.get(optimize(foreign))).status()).toBe(400)
})

test('rejects query strings on remote images', async ({ request }) => {
  const own = 'https://cdn.sanity.io/images/abgyc32w/production/abc-100x100.png?a=2'
  expect((await request.get(optimize(own))).status()).toBe(400)
})

test('rejects hosts that are not allowlisted', async ({ request }) => {
  expect((await request.get(optimize('https://pbs.twimg.com/profile_images/x.jpg'))).status()).toBe(400)
})
