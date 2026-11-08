import { test, expect } from '@playwright/test'

/**
 * Draft previews are gated: only a link made by the Studio's "Preview" button
 * (a secret a signed-in Studio user wrote into the dataset) turns them on.
 * The test server has no read token, so previews are off there (404); a
 * deployed site refuses the same links with 401. Neither ever sets the
 * draft-mode cookie, and a guessed cookie shows nothing.
 */

const enable = '/api/draft-mode/enable?sanity-preview-pathname=/blog'

test('the enable link needs a valid secret, and never sets the cookie without one', async ({ request }) => {
  for (const url of [enable, `${enable}&sanity-preview-secret=not-a-real-secret`]) {
    const response = await request.get(url, { maxRedirects: 0 })
    expect([401, 404], url).toContain(response.status())
    expect(response.headers()['set-cookie'] ?? '', url).not.toContain('__prerender_bypass')
    expect(response.headers()['x-robots-tag'], url).toContain('noindex')
    expect(response.headers()['cache-control'], url).toContain('no-store')
  }
})

test('a guessed draft-mode cookie shows no preview', async ({ request }) => {
  const response = await request.get('/blog', { headers: { cookie: '__prerender_bypass=guessed' } })
  expect(response.status()).toBe(200)
  expect(await response.text()).not.toContain('Drafts are showing')
})

test('leaving a preview only ever redirects within the site', async ({ request }) => {
  const cases: [string, string][] = [
    ['/blog/some-post', '/blog/some-post'],
    ['//evil.example/x', '/blog'],
    ['https://evil.example/', '/blog'],
    ['/\\evil.example', '/blog'],
  ]
  for (const [path, expected] of cases) {
    const response = await request.get(`/api/draft-mode/disable?path=${encodeURIComponent(path)}`, { maxRedirects: 0 })
    expect(response.status(), path).toBe(307)
    expect(response.headers().location, path).toBe(expected)
  }
})
