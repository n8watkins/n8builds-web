import { test, expect } from '@playwright/test'

/**
 * The homepage AI kit's tiles (components/ui/StackTile.tsx): icon and name,
 * with what each is for shown on hover, focus or a tap (tests/e2e/ai-kit.spec.ts
 * covers those and the click). Each is a single tab stop (focus pauses its
 * row) and its description is there for screen readers.
 */

test.describe('AI kit tiles (motion allowed)', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test("the loop's copies move in step, never drifting over each other", { tag: '@cross-browser' }, async ({ page }) => {
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

  test('every row moves at the same pace, however many tiles it has', { tag: '@cross-browser' }, async ({ page }) => {
    await page.goto('/')
    // px/s of each row: one copy's width (plus the gap) over its loop time.
    const speeds = () =>
      page.locator('[data-dino-panel] [data-marquee-row]').evaluateAll((rows) =>
        rows.map((row) => {
          const track = row.children[0] as HTMLElement
          const gap = parseFloat(getComputedStyle(row).columnGap)
          return (track.offsetWidth + gap) / parseFloat(getComputedStyle(track).animationDuration)
        })
      )
    await expect.poll(async () => (await speeds()).length).toBe(3)
    const pace = await speeds()
    for (const speed of pace) expect(speed, `row speeds ${pace.map(Math.round).join(', ')} px/s`).toBeGreaterThan(18)
    for (const speed of pace) expect(speed, `row speeds ${pace.map(Math.round).join(', ')} px/s`).toBeLessThan(26)
  })

  test('each item is a single tab stop', { tag: '@cross-browser' }, async ({ page }) => {
    await page.goto('/')
    const panel = page.locator('[data-dino-panel]')
    // Hydration adds the loop's copies (four of a short row, two of the long dev stack).
    await expect.poll(() => panel.locator('[aria-hidden="true"] figure').count()).toBeGreaterThan(10)
    // Only the first copy of each item is in the tab order.
    const rows = await panel.locator('[data-marquee-row]').evaluateAll((rows) =>
      rows.map((row) => {
        const [first, ...copies] = [...row.children]
        return {
          tiles: first.querySelectorAll('figure').length,
          focusable: first.querySelectorAll('figure[tabindex="0"]').length,
          copiesFocusable: copies.reduce((n, copy) => n + copy.querySelectorAll('[tabindex="0"]').length, 0),
        }
      })
    )
    for (const row of rows) expect(row).toEqual({ tiles: row.tiles, focusable: row.tiles, copiesFocusable: 0 })
  })

  test("each tile's description is there for screen readers", async ({ page }) => {
    await page.goto('/')
    const first = page.locator('[data-dino-panel] figure').first()
    await expect(first.locator('.description')).toHaveText(/.+/)
  })
})
