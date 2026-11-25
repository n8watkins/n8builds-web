import { test, expect } from '@playwright/test'

/**
 * The homepage AI kit's tiles (components/ui/StackTile.tsx): icon and name,
 * with how I use each shown on hover, focus or a tap (tests/e2e/ai-kit.spec.ts
 * covers those and the click). Each is one tab stop (focus pauses its row),
 * plus a second for the project link its description may carry, and its
 * description is there for screen readers.
 */

// data/stack.tsx: the tiles whose description names a project (owner, 2026-11-25).
const LINKED_TILES = 17

// The first copy of every row's tiles (the loop's copies only make it seamless).
const firstCopies = '[data-dino-panel] [data-marquee-row] > :first-child > figure'

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

  test('a description that names a project links to it: builds here, the portfolio’s projects there', async ({ page }) => {
    await page.goto('/')
    const links = page.locator(firstCopies).locator('a')
    // One per linked tile: a link whose words are missing from its description would show none.
    await expect(links).toHaveCount(LINKED_TILES)
    const voicedock = links.filter({ hasText: 'VoiceDock' })
    await expect(voicedock).toHaveAttribute('href', '/builds/voicedock')
    await expect(voicedock).not.toHaveAttribute('target', '_blank')
    for (const pr of await links.filter({ hasText: 'Portfolio Rank' }).all())
      await expect(pr).toHaveAttribute('href', '/builds/portfolio-rank')
    await expect(links.filter({ hasText: "N8's Notions" })).toHaveAttribute('href', '/blog')
    // Wren and NetTrailers have their pages on the portfolio, in a new tab that says so.
    const wren = links.filter({ hasText: 'Wren' })
    await expect(wren).toHaveAttribute('href', 'https://portfolio.n8builds.dev/projects/wren')
    await expect(wren).toHaveAttribute('target', '_blank')
    await expect(wren).toHaveAccessibleName('Wren (opens in a new tab)')
    await expect(links.filter({ hasText: 'NetTrailers' })).toHaveAttribute(
      'href',
      'https://portfolio.n8builds.dev/projects/net-trailers'
    )
  })

  test('Tab from a tile reaches its project link, and its description stays open', async ({ page }) => {
    await page.goto('/')
    const tile = page
      .locator(firstCopies)
      .filter({ has: page.locator('[data-tile-name]', { hasText: /^Piper$/ }) })
    await tile.evaluate((el: HTMLElement) => el.focus({ preventScroll: true }))
    await page.keyboard.press('Tab')
    await expect(tile.getByRole('link', { name: 'VoiceDock' })).toBeFocused()
    await expect(tile.locator('.description')).toHaveCSS('opacity', '1')
    // The loop's copies keep their links out of the tab order.
    const copies = page.locator('[data-dino-panel] [data-marquee-row] > :not(:first-child) a')
    await expect.poll(() => copies.count()).toBeGreaterThan(0)
    for (const copy of await copies.all()) await expect(copy).toHaveAttribute('tabindex', '-1')
  })

  // Every tile, its description shown (focused, with transitions off so it
  // opens at once): at most three lines, and all of it inside the tile.
  for (const width of [1440, 390]) {
    test(`every description fits its tile at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => {
        document.addEventListener('DOMContentLoaded', () => {
          const style = document.createElement('style')
          style.textContent = '*, *::before, *::after { transition: none !important }'
          document.head.append(style)
        })
      })
      await page.goto('/')
      const tiles = page.locator(firstCopies)
      await expect(tiles).toHaveCount(38)
      const misfits = await tiles.evaluateAll((figures) =>
        figures.flatMap((figure) => {
          ;(figure as HTMLElement).focus({ preventScroll: true })
          const tile = figure.getBoundingClientRect()
          const caption = figure.querySelector('figcaption')!.getBoundingClientRect()
          const p = figure.querySelector<HTMLElement>('.description')!
          const style = getComputedStyle(p)
          const lines = Math.round(
            (p.getBoundingClientRect().height - parseFloat(style.paddingTop)) / parseFloat(style.lineHeight)
          )
          const name = figure.querySelector('[data-tile-name]')!.textContent
          const inside = caption.top >= tile.top && caption.bottom <= tile.bottom
          return lines <= 3 && inside ? [] : [`${name}: ${lines} lines, ${inside ? 'inside' : 'spills out of'} its tile`]
        })
      )
      expect(misfits).toEqual([])
    })
  }
})
