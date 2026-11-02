import { test, expect } from '@playwright/test'

/**
 * The homepage's N8's Notions band (#notions): the newest note featured in a
 * larger card (round 3 of 2026-11-02), then up to three more as before.
 * Against the live Sanity dataset; the band hides when Sanity is unreachable.
 */

test('the newest note is featured above the rest, larger, with its cover, title and excerpt', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const band = page.locator('#notions')
  test.skip((await band.count()) === 0, 'Sanity unreachable: the band is hidden')
  await band.scrollIntoViewIfNeeded()

  const featured = band.locator('[data-featured-post]')
  await expect(featured).toHaveCount(1)
  await expect(featured.getByText('Featured', { exact: true })).toBeVisible()
  await expect(featured.getByRole('heading', { level: 3 })).toBeVisible()
  await expect(featured.locator('p').first()).toBeVisible()
  await expect(featured.getByText('Read the note')).toBeVisible()

  const rest = band.locator('a[href^="/blog/"]:not([data-featured-post])').filter({ has: page.locator('time') })
  const restCount = await rest.count()
  expect(restCount).toBeLessThanOrEqual(3)
  // The featured note is the newest, and comes first.
  const dates = await band.locator('time').evaluateAll((els) => els.map((el) => el.getAttribute('datetime')!))
  expect(dates[0]).toBe([...dates].sort().reverse()[0])
  // Larger than the others, and the others sit in one row of equal cards under it.
  if (restCount > 0) {
    const big = (await featured.boundingBox())!
    const boxes = await rest.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect))
    for (const box of boxes) {
      expect(big.width).toBeGreaterThan(box.width * 2)
      expect(box.y).toBeGreaterThan(big.y + big.height)
      expect(Math.abs(box.height - boxes[0].height)).toBeLessThan(1)
      expect(Math.abs(box.y - boxes[0].y)).toBeLessThan(1)
    }
  }
})

for (const width of [1024, 390, 320]) {
  test(`at ${width}px the featured note fits the screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const band = page.locator('#notions')
    test.skip((await band.count()) === 0, 'Sanity unreachable: the band is hidden')
    const featured = band.locator('[data-featured-post]')
    await featured.scrollIntoViewIfNeeded()
    const box = (await featured.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}
