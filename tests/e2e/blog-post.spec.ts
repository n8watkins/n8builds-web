import { test, expect } from '@playwright/test'

/**
 * A blog post's layout holds still while its lazy images load: each body image
 * carries its own size, so the browser reserves its space before it arrives.
 * Without that, reaching the end of a post pushed the share bar down under the
 * reader's pointer (a WebKit click on "Copy link" landed on the page instead).
 */
test('body images reserve their space, so the end of a post does not move as they load', async ({ page, request }) => {
  const html = await (await request.get('/blog')).text()
  const path = html.match(/href="(\/blog\/[^"?#]+)"/)?.[1]
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
