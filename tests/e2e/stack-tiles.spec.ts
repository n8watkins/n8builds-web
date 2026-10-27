import { test, expect } from '@playwright/test'

/**
 * The homepage AI kit's tiles (components/ui/StackTile.tsx, `still`) are calm:
 * icon and name only, no hover highlight or description reveal, so the dino
 * walking their rows is what stands out. Each is a single tab stop (focus
 * pauses its row) and its description stays available to screen readers.
 */

test.describe('AI kit tiles (motion allowed)', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test("the loop's copies move in step, never drifting over each other", async ({ page }) => {
    // The first copy is in the server HTML; the others join after hydration.
    await page.goto('/')
    await expect
      .poll(() => page.getByText('Claude Code', { exact: true }).count())
      .toBeGreaterThan(1)
    await expect
      .poll(() =>
        page.locator('[data-marquee-row]').evaluateAll((rows) =>
          rows.every((row) => {
            const times = [...row.children].map((t) => Number(t.getAnimations()[0]?.currentTime))
            return times.every((time) => Math.abs(time - times[0]) < 1)
          })
        )
      )
      .toBe(true)
  })

  test("tiles don't react to the pointer, and each item is a single tab stop", async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'hover is a pointer check')
    await page.goto('/')
    const panel = page.locator('[data-dino-panel]')
    await panel.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    const tiles = panel.locator('figure')
    await expect.poll(() => tiles.count()).toBeGreaterThan(10)
    // Only the first copy of each item is in the tab order.
    const focusable = panel.locator('figure[tabindex="0"]')
    await expect.poll(async () => (await tiles.count()) / (await focusable.count())).toBe(4)
    await expect(panel.locator('[aria-hidden="true"] [tabindex="0"]')).toHaveCount(0)
    await expect(panel.locator('.description')).toHaveCount(0)

    // Hovering a tile changes nothing about it.
    const target = await tiles.evaluateAll((figures) => {
      for (const [index, figure] of figures.entries()) {
        const box = figure.getBoundingClientRect()
        if (box.left > 40 && box.right < innerWidth - 40 && box.top > 0 && box.bottom < innerHeight)
          return { index, x: box.left + box.width / 2, y: box.top + box.height / 2 }
      }
      return null
    })
    expect(target, 'a tile fully on screen').not.toBeNull()
    const tile = tiles.nth(target!.index)
    const look = () =>
      tile.evaluate((el) => {
        const cs = getComputedStyle(el)
        return `${cs.borderColor}|${cs.backgroundColor}|${cs.boxShadow}`
      })
    const before = await look()
    await page.mouse.move(target!.x, target!.y)
    await page.waitForTimeout(400)
    expect(await look()).toBe(before)
  })

  test("each tile's description is there for screen readers", async ({ page }) => {
    await page.goto('/')
    const first = page.locator('[data-dino-panel] figure').first()
    await expect(first.locator('.sr-only')).toHaveText(/^: .+/)
  })
})
