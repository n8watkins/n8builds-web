import { test, expect } from '@playwright/test'

/**
 * The homepage AI kit's tiles (components/ui/StackTile.tsx): icon and name,
 * with what each is for shown on hover, focus or a tap (tests/e2e/ai-kit.spec.ts
 * covers those and the click). Each is a single tab stop (focus pauses its
 * row) and its description is there for screen readers.
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

  test('each item is a single tab stop', async ({ page }) => {
    await page.goto('/')
    const panel = page.locator('[data-dino-panel]')
    const tiles = panel.locator('figure')
    await expect.poll(() => tiles.count()).toBeGreaterThan(10)
    // Only the first copy of each item is in the tab order.
    const focusable = panel.locator('figure[tabindex="0"]')
    await expect.poll(async () => (await tiles.count()) / (await focusable.count())).toBe(4)
    await expect(panel.locator('[aria-hidden="true"] [tabindex="0"]')).toHaveCount(0)
  })

  test("each tile's description is there for screen readers", async ({ page }) => {
    await page.goto('/')
    const first = page.locator('[data-dino-panel] figure').first()
    await expect(first.locator('.description')).toHaveText(/.+/)
  })
})
