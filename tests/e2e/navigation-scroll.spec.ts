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
  // An animated scroll passes through dozens of positions on its way up (the
  // bug measured 3,710, 3,503, 2,526, 1,334... over a second). A jump goes
  // straight to the top; at most one position in between is allowed, where the
  // browser clamps the old offset to the new page's height for a frame or two
  // before Next.js scrolls to the top.
  const frames = await page.evaluate(() => (window as unknown as { __frames: number[] }).__frames)
  const start = frames[0]
  const trace = `scroll positions after the click: ${frames.join(', ')}`
  const inBetween = new Set(frames.filter((y) => y > 0 && y < start))
  expect(inBetween.size, trace).toBeLessThanOrEqual(1)
  const left = frames.findIndex((y) => y !== start)
  const top = frames.indexOf(0)
  expect(top, trace).toBeGreaterThan(-1)
  expect(top - left, trace).toBeLessThanOrEqual(6)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})
