import { test, expect } from '@playwright/test'

/**
 * A link to another page opens it at its top, at once. The site scrolls
 * smoothly (scroll-behavior: smooth), which used to animate Next's scroll to
 * the top: a post opened from the homepage started thousands of pixels down
 * and glided up for about a second.
 */
test('a post opened from the homepage starts at its top, without scrolling up to it', async ({ page }) => {
  await page.goto('/')
  const strip = page.locator('#notions')
  await strip.scrollIntoViewIfNeeded()
  const link = strip.locator('a[href^="/blog/"]').first()
  await expect(link).toBeVisible()
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)

  // Record the scroll position on every frame from the click on.
  await page.evaluate(() => {
    const w = window as unknown as { __frames: number[] }
    w.__frames = []
    const tick = () => {
      w.__frames.push(window.scrollY)
      if (w.__frames.length < 90) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await link.click()
  await expect(page).toHaveURL(/\/blog\/.+/)
  await expect(page.locator('article h1, main h1').first()).toBeVisible()
  await page.waitForTimeout(500)
  // Once the post is showing it sits at the top; it never passes through the
  // in-between positions an animated scroll would.
  const frames = await page.evaluate(() => (window as unknown as { __frames: number[] }).__frames)
  const start = frames[0]
  const inBetween = frames.filter((y) => y > 0 && y < start - 50)
  expect(inBetween, `scroll positions after the click: ${frames.join(', ')}`).toEqual([])
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})
