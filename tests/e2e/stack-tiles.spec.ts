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
    // Jump there (a smooth scroll would still be moving the tiles vertically).
    await page
      .locator('#techstack')
      .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))

    // The marquee keeps moving until the tap focuses a tile (which pauses it),
    // so tap like a finger does: wherever a tile is fully on screen. On a
    // phone a tile is often cut by an edge, so wait for one that isn't.
    const findTarget = () =>
      page.locator('#techstack figure').evaluateAll((figures) => {
        for (const [index, figure] of figures.entries()) {
          const box = figure.getBoundingClientRect()
          const row = figure.parentElement!.closest('.overflow-hidden')!.getBoundingClientRect()
          const inView = box.top >= 0 && box.bottom <= innerHeight
          if (inView && box.left >= row.left + 8 && box.right <= row.right - 8) {
            return { index, x: box.left + box.width / 2, y: box.top + box.height / 2 }
          }
        }
        return null
      })
    await expect.poll(findTarget, { message: 'a tile fully on screen' }).not.toBeNull()
    const target = await findTarget()
    expect(target, 'a tile fully on screen').not.toBeNull()
    const tile = page.locator('#techstack figure').nth(target!.index)
    expect(await descriptionOpacity(tile)).toBe('0')

    await page.touchscreen.tap(target!.x, target!.y)
    // The row can move on before the finger lands (WebKit is slow to tap), so
    // check the tile that was actually tapped, which may be the next one.
    const tapped = page.locator('#techstack figure:focus')
    await expect(tapped).toHaveCount(1)
    await expect.poll(() => descriptionOpacity(tapped)).toBe('1')
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
    // (The copies join after hydration: wait for them.)
    const items = await focusable.count()
    await expect.poll(() => tiles.count()).toBe(items * 4)
    await expect(page.locator('[aria-hidden="true"] [tabindex="0"]')).toHaveCount(0)

    await focusable.first().focus()
    await expect.poll(() => descriptionOpacity(focusable.first())).toBe('1')
  })
})
