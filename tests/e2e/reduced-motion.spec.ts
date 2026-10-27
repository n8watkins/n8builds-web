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
    // The homepage's AI kit (the only marquee since /loadout dropped its own).
    await page.goto('/')
    await expect(page.locator('[data-dino-panel]').getByText('Claude Code', { exact: true })).toHaveCount(1)
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
    await page.goto('/')
    // The server sends one copy of the items; hydration adds the loop's copies.
    await expect
      .poll(() => page.locator('[data-dino-panel]').getByText('Claude Code', { exact: true }).count())
      .toBeGreaterThan(1)
    // Check the marquee tracks themselves, not just "some infinite animation":
    // pulses elsewhere kept a page-wide count passing while every marquee had
    // an invalid animation (animation-name: none) and stood still.
    const tracks = await page.locator('.animate-marquee').evaluateAll((els) =>
      els.map((el) => ({
        name: getComputedStyle(el).animationName,
        running: el.getAnimations().some((a) => a.playState === 'running'),
      }))
    )
    expect(tracks.length).toBeGreaterThan(0)
    for (const track of tracks) expect(track).toEqual({ name: 'marquee', running: true })
  })
})
