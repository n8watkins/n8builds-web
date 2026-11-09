import { test, expect } from '@playwright/test'

/**
 * The homepage's N8's Notions band (#notions): the newest note featured in a
 * larger card (round 3 of 2026-11-02), then up to three more as before; on
 * phones (below 640px) all of them as compact rows instead (2026-11-08).
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

  const rest = band.locator('a[href^="/blog/"]:not([data-featured-post]):visible').filter({ has: page.locator('time') })
  const restCount = await rest.count()
  expect(restCount).toBeLessThanOrEqual(3)
  // The featured note is the newest, and comes first.
  const dates = await band.locator('time:visible').evaluateAll((els) => els.map((el) => el.getAttribute('datetime')!))
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

test('at 1024px the featured note fits the screen', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await page.goto('/')
  const band = page.locator('#notions')
  test.skip((await band.count()) === 0, 'Sanity unreachable: the band is hidden')
  const featured = band.locator('[data-featured-post]')
  await featured.scrollIntoViewIfNeeded()
  const box = (await featured.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(1024)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024)
})

for (const width of [390, 320]) {
  test(`at ${width}px the notes are compact rows: a thumbnail beside the title, all of them short`, { tag: width === 320 ? '@cross-browser' : [] }, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const band = page.locator('#notions')
    test.skip((await band.count()) === 0, 'Sanity unreachable: the band is hidden')
    await band.scrollIntoViewIfNeeded()
    // No big cards on phones.
    await expect(band.locator('[data-featured-post]')).toBeHidden()
    const rows = band.locator('a[href^="/blog/"]:visible')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(4)
    const boxes = await rows.evaluateAll((els) =>
      els.map((el) => {
        const thumb = el.firstElementChild!.getBoundingClientRect()
        const title = el.querySelector('h3')!.getBoundingClientRect()
        const row = el.getBoundingClientRect()
        return { thumbRight: thumb.right, thumbWidth: thumb.width, titleLeft: title.left, height: row.height, right: row.right }
      })
    )
    for (const b of boxes) {
      // The thumbnail sits beside the text, small.
      expect(b.titleLeft).toBeGreaterThan(b.thumbRight)
      expect(b.thumbWidth).toBeLessThanOrEqual(100)
      expect(b.height).toBeLessThan(160)
      expect(b.right).toBeLessThanOrEqual(width)
    }
    // The four notes take under about 600px on a 390px phone (about 2,200px as cards); a
    // 320px phone wraps the titles a line more.
    const first = (await rows.first().boundingBox())!
    const last = (await rows.last().boundingBox())!
    expect(last.y + last.height - first.y).toBeLessThan(width >= 390 ? 600 : 700)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}
