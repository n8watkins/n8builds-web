import { test, expect } from '@playwright/test'
import { getBuild } from '../../../data/builds'

/**
 * The n8builds build page's assets: its screenshots are served as real images,
 * and its share card renders. (Metadata and the homepage link are covered for
 * every build in seo.spec.ts.)
 */

const build = getBuild('n8builds')!

test('the n8builds build page serves every screenshot', async ({ request }) => {
  expect(build.images.length).toBeGreaterThanOrEqual(3)
  for (const image of build.images) {
    const response = await request.get(image.src)
    expect(response.status(), image.src).toBe(200)
    expect(response.headers()['content-type'], image.src).toMatch(/^image\//)
    // Kept light: the first one is the page's LCP.
    expect((await response.body()).length, `${image.src} size`).toBeLessThan(150_000)
  }
})

test('the n8builds share card is a 1200x630 PNG, set as the page preview', async ({ request }) => {
  const card = await request.get('/builds/n8builds/og.png')
  expect(card.status()).toBe(200)
  expect(card.headers()['content-type']).toBe('image/png')
  const bytes = await card.body()
  expect({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }).toEqual({ width: 1200, height: 630 })

  const html = await (await request.get('/builds/n8builds')).text()
  expect(html).toContain('<meta property="og:image" content="https://n8builds.dev/builds/n8builds/og.png"')
  expect(html).toContain('<title>n8builds.dev | n8builds</title>')
})

test('the n8builds build page labels its Lighthouse numbers: desktop scores, and mobile as local runs', async ({ request }) => {
  const html = await (await request.get('/builds/n8builds')).text()
  expect(html).toContain('recent runs score 0.98 to 1.00 for')
  expect(html).toContain('Mobile numbers are local Lighthouse runs')
  // The page never shows the old "problem" pitch or the CI report's localhost URL.
  expect(html).not.toContain('The problem')
  expect(html).not.toContain('localhost:')
})
