import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * My dev setup's tiles on /loadout (owner's ask, 2026-11-01): they rise in one
 * by one, then their chips, as the grid comes into view, and lift a little on
 * hover or keyboard focus. CSS from the server HTML (`.setup-tile` in
 * app/globals.css), so they play without JavaScript; SetupTilesMotion holds
 * the tiles still below the window until they scroll in. Reduced motion
 * shows everything at once.
 */

// WebKit's animation frames crawl on a loaded machine (see reveal.spec.ts).
const FADE = { timeout: 15_000 }

const tiles = (page: Page) => page.locator('#setup-tiles > li')

/** The element's opacity multiplied through its ancestors: what the eye sees. */
const seenOpacity = (locator: Locator) =>
  locator.evaluate((el) => {
    let opacity = 1
    for (let node: Element | null = el; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity)
    return opacity
  })

/** Scroll the element into the middle of the window, at once. */
const bringIn = (locator: Locator) =>
  locator.evaluate((el) => {
    const box = el.getBoundingClientRect()
    window.scrollTo({ top: box.top + window.scrollY - window.innerHeight / 2 + box.height / 2, behavior: 'instant' })
  })

test('on a laptop the tiles rise in from the first screen and end fully shown, chips too', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/loadout')
  const first = tiles(page).first()
  await expect(first).toHaveCSS('animation-name', 'setup-rise')
  await expect(first.locator('.setup-chip').first()).toHaveCSS('animation-name', 'setup-chip-in')
  // One after another: each tile on the first screen starts a little after the one before it.
  const delays = await tiles(page).evaluateAll((els) => els.slice(0, 2).map((el) => parseFloat(getComputedStyle(el).animationDelay)))
  expect(delays[1]).toBeGreaterThan(delays[0])
  for (const tile of await tiles(page).all()) {
    await bringIn(tile)
    await expect.poll(() => seenOpacity(tile), FADE).toBe(1)
    await expect.poll(() => seenOpacity(tile.locator('.setup-chip').last()), FADE).toBe(1)
  }
})

test('on a phone a tile below the window waits for the scroll, then plays, without moving the layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/loadout')
  const last = tiles(page).last()
  // Hydrated: the tiles wholly below the window are held for their entrance.
  await expect(last).toHaveAttribute('data-wait', '', FADE)
  expect(await seenOpacity(last)).toBe(0)
  const before = await last.evaluate((el) => (el as HTMLElement).offsetTop)
  await bringIn(last)
  await expect(last).not.toHaveAttribute('data-wait', '', FADE)
  await expect.poll(() => seenOpacity(last), FADE).toBe(1)
  await expect.poll(() => seenOpacity(last.locator('.setup-chip').last()), FADE).toBe(1)
  // Opacity and transform only: the tile never moved in the layout.
  expect(await last.evaluate((el) => (el as HTMLElement).offsetTop)).toBe(before)
  // A tile already on screen at load never waited.
  await expect(tiles(page).first()).not.toHaveAttribute('data-wait')
})

test('a tile lifts a little on hover and while a chip in it has keyboard focus', async ({ page, isMobile }) => {
  test.skip(isMobile, 'A touch screen has no hover')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/loadout')
  const agents = tiles(page).filter({ has: page.getByRole('heading', { name: 'Agents', exact: true }) })
  await bringIn(agents)
  await expect.poll(() => seenOpacity(agents), FADE).toBe(1)
  await agents.hover()
  await expect(agents).toHaveCSS('translate', '0px -4px')
  await page.mouse.move(5, 5)
  await expect(agents).toHaveCSS('translate', 'none')
  await agents.getByRole('link', { name: 'Claude Code' }).focus()
  await expect(agents).toHaveCSS('translate', '0px -4px')
})

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('every tile and chip is simply shown: no animation, no waiting, no lift', async ({ page, isMobile }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/loadout')
    // Give the script its chance to hold anything (it must not).
    await expect(page.getByTestId('loadout-section-nav')).toHaveAttribute('data-ready', '', FADE)
    for (const tile of await tiles(page).all()) {
      await expect(tile).not.toHaveAttribute('data-wait')
      await expect(tile).toHaveCSS('animation-name', 'none')
      await expect(tile.locator('.setup-chip').first()).toHaveCSS('animation-name', 'none')
      expect(await tile.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    }
    if (isMobile) return
    const first = tiles(page).first()
    await first.hover()
    // Held still: no lift (the translate stays at rest).
    await page.waitForTimeout(400)
    await expect(first).toHaveCSS('translate', /^(none|0px)$/)
  })
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('the tiles still play and end fully shown, even below the window', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/loadout')
    const last = tiles(page).last()
    await bringIn(last)
    await expect.poll(() => seenOpacity(last), FADE).toBe(1)
    await expect.poll(() => seenOpacity(last.locator('.setup-chip').last()), FADE).toBe(1)
  })
})
