import { test, expect } from '@playwright/test'

/**
 * The marquee pauses while focus is inside it, so a focused tile doesn't slide
 * away (components/magicui/marquee.tsx). A visitor can focus a tile before the
 * page hydrates (the tiles are server-rendered), when React isn't listening for
 * the focus event yet: the marquee must still pause once it hydrates.
 */
test.use({ contextOptions: { reducedMotion: 'no-preference' } })

test('a tile focused before hydration pauses its marquee', async ({ page }) => {
  // Hold the page's scripts back, so the focus lands before hydration.
  await page.route('**/_next/static/chunks/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue()
  })
  // The homepage's AI kit, the site's marquee.
  await page.goto('/', { waitUntil: 'commit' })
  const tiles = page.locator('[data-dino-panel] figure')
  const tile = tiles.and(page.locator('[tabindex="0"]')).first()
  await tile.waitFor({ state: 'attached' })
  const serverTiles = await tiles.count()
  await tile.focus()

  // Hydration adds the loop's copies.
  await expect.poll(() => tiles.count(), { timeout: 20_000 }).toBeGreaterThan(serverTiles)
  await expect(tile).toBeFocused()
  const playStates = () =>
    tile.evaluate((el) =>
      [...el.closest('.overflow-hidden:has(> .animate-marquee)')!.children].map(
        (t) => getComputedStyle(t).animationPlayState
      )
    )
  await expect.poll(playStates).toEqual(['paused', 'paused', 'paused', 'paused'])
})
