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

  test("the loop's copies move in step, never drifting over each other", async ({ page }) => {
    // The first copy is in the server HTML; the others join after hydration.
    for (const path of ['/', '/loadout']) {
      await page.goto(path)
      await expect
        .poll(() => page.getByText('Claude Code', { exact: true }).count())
        .toBeGreaterThan(1)
      await expect
        .poll(() =>
          page
            .locator('[data-marquee-row], .overflow-hidden:has(> .animate-marquee)')
            .evaluateAll((rows) =>
              rows.every((row) => {
                const times = [...row.children].map((t) =>
                  Number(t.getAnimations()[0]?.currentTime)
                )
                return times.every((time) => Math.abs(time - times[0]) < 1)
              })
            )
        )
        .toBe(true)
    }
  })

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

/**
 * Revealing a tile (hover, or a tap or focus) shrinks its name and shows the
 * description. The pair must sit centred in the tile whatever the
 * description's length (one line or three), not crammed against the top with
 * empty space below.
 */
test.describe('revealed tile content is vertically centred', () => {
  test.use({
    contextOptions: { reducedMotion: 'no-preference' },
    viewport: { width: 1280, height: 900 },
  })

  // The homepage AI kit has one- and two-line descriptions; the /loadout tech
  // stack has two- and three-line ones.
  for (const { path, section, lines } of [
    { path: '/', section: '#loadout', lines: [1, 2] },
    { path: '/loadout', section: '#techstack', lines: [2, 3] },
  ]) {
    test(`${section} tiles on ${path}`, async ({ page, hasTouch }) => {
      await page.goto(path)
      const tiles = page.locator(`${section} figure`)
      // Jump (the page scrolls smoothly otherwise) so the marquee sits mid-screen.
      await page
        .locator(section)
        .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
      // Wait for hydration's loop copies, so the track has its final layout.
      await expect.poll(() => tiles.count()).toBeGreaterThan(10)

      const seenLines = new Set<number>()
      const rows = page.locator(`${section} .overflow-hidden:has(> .animate-marquee)`)
      for (const rowEl of await rows.all()) {
        // Pause this row, then reveal each tile fully on screen in turn: by
        // hovering it with a mouse, or tapping it on a touch screen (where
        // there is no hover; a tap focuses the tile). The pointer rests on the
        // row's edge to pause it; on touch, focus inside the row does.
        const rowTiles = rowEl.locator('figure')
        if (hasTouch) await rowTiles.first().evaluate((el) => el.focus({ preventScroll: true }))
        else {
          const row = (await rowEl.boundingBox())!
          await page.mouse.move(640, row.y + 3)
        }
        const visible = await rowTiles.evaluateAll((figures) =>
          figures.flatMap((figure, index) => {
            const box = figure.getBoundingClientRect()
            // The rounded panel clips the rows (which can be wider than it).
            const panel = figure.closest('.rounded-3xl')!.getBoundingClientRect()
            const inView =
              box.top >= 0 &&
              box.bottom <= innerHeight &&
              box.left >= Math.max(panel.left, 0) + 8 &&
              box.right <= Math.min(panel.right, innerWidth) - 8
            return inView ? [index] : []
          })
        )
        expect(visible.length).toBeGreaterThan(2)
        for (const index of visible) {
          const tile = rowTiles.nth(index)
          const box = (await tile.boundingBox())!
          if (hasTouch) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
          else await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
          // Let the reveal transition finish.
          await expect
            .poll(() =>
              tile.evaluate((el) => getComputedStyle(el.querySelector('.description')!).opacity)
            )
            .toBe('1')
          await page.waitForTimeout(400)
          const m = await tile.evaluate((tile) => {
            const box = tile.getBoundingClientRect()
            // The visible ink: the icon, the name's text and the description's text.
            const rects = [tile.querySelector('svg')!.getBoundingClientRect()]
            let lines = 0
            for (const el of tile.querySelectorAll('[data-tile-name], .description')) {
              const range = document.createRange()
              range.selectNodeContents(el)
              rects.push(range.getBoundingClientRect())
              if (el.classList.contains('description')) {
                lines = Math.round(
                  range.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)
                )
              }
            }
            const top = Math.min(...rects.map((r) => r.top))
            const bottom = Math.max(...rects.map((r) => r.bottom))
            return {
              name: tile.querySelector('[data-tile-name]')!.textContent,
              lines,
              top: Math.round(top - box.top),
              bottom: Math.round(box.bottom - bottom),
            }
          })
          seenLines.add(m.lines)
          expect(m.top, `${m.name}: content clears the top edge`).toBeGreaterThan(4)
          expect(
            Math.abs(m.top - m.bottom),
            `${m.name} (${m.lines} lines): top gap ${m.top}px vs bottom gap ${m.bottom}px`
          ).toBeLessThanOrEqual(3)
        }
      }
      for (const n of lines) expect([...seenLines], `checked a ${n}-line description`).toContain(n)
    })
  }
})
