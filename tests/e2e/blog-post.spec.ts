import { test, expect } from '@playwright/test'

/**
 * A blog post's layout holds still while its lazy images load: each body image
 * carries its own size, so the browser reserves its space before it arrives.
 * Without that, reaching the end of a post pushed the share bar down under the
 * reader's pointer (a WebKit click on "Copy link" landed on the page instead).
 */
test('body images reserve their space, so the end of a post does not move as they load', { tag: '@cross-browser' }, async ({ page, request }) => {
  const html = await (await request.get('/blog')).text()
  const path = html.match(/href="(\/blog\/[a-z0-9-]+)"/)?.[1]
  expect(path, 'blog index links to at least one post').toBeTruthy()
  await page.goto(path!)

  const images = page.locator('article figure img')
  expect(await images.count(), 'the post has body images').toBeGreaterThan(0)
  for (const img of await images.all()) {
    expect(Number(await img.getAttribute('width'))).toBeGreaterThan(0)
    expect(Number(await img.getAttribute('height'))).toBeGreaterThan(0)
  }

  // Jump to the end before any image has loaded, then let them all load.
  const bar = page.getByRole('region', { name: 'Share this note' })
  await bar.scrollIntoViewIfNeeded()
  const before = await bar.evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
  await page.evaluate(() => {
    for (const img of document.querySelectorAll('article figure img')) (img as HTMLImageElement).loading = 'eager'
  })
  await expect
    .poll(() => page.evaluate(() => [...document.querySelectorAll<HTMLImageElement>('article figure img')].every((img) => img.complete)))
    .toBe(true)
  const after = await bar.evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
  expect(Math.abs(after - before)).toBeLessThan(1)
})

test("N8's Notions offers its RSS feed as a button you can't miss", async ({ page }) => {
  await page.goto('/blog')
  const rss = page.getByRole('link', { name: 'Subscribe with RSS' })
  await expect(rss).toBeVisible()
  await expect(rss).toHaveAttribute('href', '/blog/rss.xml')
  // Round 8 of 2026-11-09: a bordered button, above the fold, not a small grey mono link.
  await expect(rss).toBeInViewport()
  expect(await rss.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('1px')
  // Feed readers find it too.
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute('href', /\/blog\/rss\.xml$/)
})
