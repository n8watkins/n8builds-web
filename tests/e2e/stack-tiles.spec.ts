import { test, expect, type Locator } from '@playwright/test'

/**
 * Tech-stack tiles (components/ui/StackTile.tsx) reveal their description on
 * hover, and on focus: keyboard users and touch screens, where Tailwind 4
 * doesn't apply hover: styles, need it too.
 */

const descriptionOpacity = (tile: Locator) =>
  tile.evaluate((el) => getComputedStyle(el.querySelector('.description')!).opacity)

test.describe('touch screens', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } })

  test('tapping a tile reveals its description', async ({ page }) => {
    await page.goto('/loadout')
    const tile = page.locator('#techstack figure').first()
    await tile.scrollIntoViewIfNeeded()
    await expect.poll(() => descriptionOpacity(tile)).toBe('0')

    await tile.tap()
    await expect.poll(() => descriptionOpacity(tile)).toBe('1')
  })
})

test.describe('marquees (motion allowed)', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('keyboard focus reveals a tile, and each item is a single tab stop', async ({ page }) => {
    await page.goto('/loadout')
    const tiles = page.locator('#techstack figure')
    const focusable = page.locator('#techstack figure[tabindex="0"]')
    await expect(focusable.first()).toBeVisible()

    // The loop repeats every item; only the first copy is in the tab order,
    // and the copies are hidden from assistive tech.
    expect(await tiles.count()).toBe((await focusable.count()) * 4)
    await expect(page.locator('[aria-hidden="true"] [tabindex="0"]')).toHaveCount(0)

    await focusable.first().focus()
    await expect.poll(() => descriptionOpacity(focusable.first())).toBe('1')
  })
})
