import { test, expect, type Page } from '@playwright/test'

/**
 * prefers-reduced-motion is honored: no endless animation, no auto-advancing
 * carousels, and marquees show their items once instead of a frozen track.
 * The no-preference cases guard against the opposite regression.
 */

const runningInfiniteAnimations = (page: Page) =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity).length
  )

const htmlScrollBehavior = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)

const scrollYNextFrame = (page: Page) =>
  page.evaluate(() => new Promise<number>((resolve) => requestAnimationFrame(() => resolve(window.scrollY))))

const activeNowBuildingDot = (page: Page) =>
  page.locator('#now button[aria-current="true"]').getAttribute('aria-label')

/**
 * Select the carousel's second item by hand. The click only takes effect once
 * the section has hydrated (and its auto-advance timer, if any, is running),
 * so timing assertions after this can't pass vacuously.
 */
async function selectSecondNowBuildingItem(page: Page): Promise<string | null> {
  const second = page.locator('#now button[aria-label^="Show "]').nth(1)
  await second.scrollIntoViewIfNeeded()
  await expect(async () => {
    await second.click()
    await expect(second).toHaveAttribute('aria-current', 'true', { timeout: 500 })
  }).toPass()
  return second.getAttribute('aria-label')
}

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  for (const path of ['/', '/loadout']) {
    test(`${path} runs no infinite animations`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('h1').first()).toBeVisible()
      expect(await runningInfiniteAnimations(page)).toBe(0)
    })
  }

  test('marquees list each item once', async ({ page }) => {
    await page.goto('/loadout')
    await expect(page.getByText('Claude Code', { exact: true })).toHaveCount(1)
  })

  test('the Now Building carousel does not auto-advance', async ({ page }) => {
    await page.clock.install()
    await page.goto('/')
    // Let time flow so hydration isn't stalled (WebKit); fastForward skips ahead.
    await page.clock.resume()
    const selected = await selectSecondNowBuildingItem(page)
    // Hovering pauses the carousel anyway; move away so only reduced motion stops it.
    await page.mouse.move(0, 0)
    await page.clock.fastForward(20_000)
    expect(await activeNowBuildingDot(page)).toBe(selected)
  })

  test('scrolling jumps instead of animating', async ({ page }) => {
    // Landing mid-page (as from a /#contact link) shows the button without
    // any further scrolling.
    await page.goto('/#contact')
    expect(await htmlScrollBehavior(page)).toBe('auto')

    await page.getByRole('button', { name: 'Scroll to top of page' }).click()
    // A smooth scroll would still be on its way up a frame later.
    expect(await scrollYNextFrame(page)).toBe(0)
  })
})

test.describe('motion allowed', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('anchor scrolling is smooth', async ({ page }) => {
    await page.goto('/')
    expect(await htmlScrollBehavior(page)).toBe('smooth')
  })

  test('marquees scroll a repeated track', async ({ page }) => {
    await page.goto('/loadout')
    expect(await page.getByText('Claude Code', { exact: true }).count()).toBeGreaterThan(1)
    expect(await runningInfiniteAnimations(page)).toBeGreaterThan(0)
  })

  test('the Now Building carousel auto-advances', async ({ page }) => {
    await page.clock.install()
    await page.goto('/')
    await page.clock.resume()
    const selected = await selectSecondNowBuildingItem(page)
    // Clicking pauses the carousel while hovered; move the pointer away.
    await page.mouse.move(0, 0)
    await page.clock.fastForward(8_000)
    await expect.poll(() => activeNowBuildingDot(page)).not.toBe(selected)
  })
})
