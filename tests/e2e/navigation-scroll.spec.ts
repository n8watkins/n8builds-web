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
  const link = strip.locator('a[href^="/blog/"]').first()
  // Centre the link itself, as a visitor would see it before tapping. Scrolling
  // only the strip into view can leave the link's middle under the sticky
  // navbar on phones; the click then scrolls the page first (Playwright's
  // actionability), and that scroll used to count as the glide this test
  // catches (mobile Safari, about 1 run in 30).
  await link.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await expect(link).toBeInViewport({ ratio: 1 })
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
  // straight to the top; at most two positions in between are allowed, where
  // the browser clamps the old offset to the new page's height for a few
  // frames before Next.js scrolls to the top. The new page can lay out in two
  // steps on a loaded runner, so the clamp can move once (WebKit on #131:
  // 6,316, then 6,292 for 3 frames, 6,179 for 2, then 0).
  const frames = await page.evaluate(() => (window as unknown as { __frames: number[] }).__frames)
  const start = frames[0]
  const trace = `scroll positions after the click: ${frames.join(', ')}`
  // The clamped offset can settle by a pixel or two while the new page lays
  // out (Firefox measured 5,570 then 5,569), so positions a few pixels apart
  // count as one stop; an animated scroll's stops are hundreds apart.
  // A settle of a few dozen pixels before the new page replaces the old one is
  // not a glide either (WebKit on #136: 6,091, then 6,067, then the clamped
  // 5,910, then 0), so only positions well below the start count.
  const stops = [...new Set(frames.filter((y) => y > 0 && y < start - 40))]
    .sort((a, b) => a - b)
    .filter((y, i, all) => i === 0 || y - all[i - 1] > 4)
  expect(stops.length, trace).toBeLessThanOrEqual(2)
  const left = frames.findIndex((y) => y !== start)
  const top = frames.indexOf(0)
  expect(top, trace).toBeGreaterThan(-1)
  // The clamped stop can hold for several frames while a loaded runner lays
  // out the new page (mobile-chrome on #112: 9,779, then 9,755 for 7 frames,
  // then 0). That is still a jump: `stops` above already rules out a glide, so
  // this bound only catches a top that comes far too late (30 frames, ~0.5s).
  expect(top - left, trace).toBeLessThanOrEqual(30)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})
