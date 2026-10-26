import { test, expect, type Page } from '@playwright/test'

/**
 * The homepage's "AI kit I build with" marquee, the /loadout copy of it, and
 * the homepage-only easter egg: a pixel dino walking the marquee rows
 * (components/features/dino/).
 */

test.describe('AI kit content', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('lists the tools in use, and not the ones dropped', async ({ page }) => {
    for (const path of ['/', '/loadout']) {
      await page.goto(path)
      const kit = page.getByRole('region', { name: 'AI tools' })
      await expect(kit.getByText('whisper.cpp', { exact: true })).toBeVisible()
      await expect(
        page.getByRole('region', { name: 'AI agents' }).getByText('Perplexity', { exact: true })
      ).toBeVisible()
      for (const dropped of ['Ollama', 'LangChain']) {
        await expect(page.getByText(dropped)).toHaveCount(0)
      }
    }
  })

  test('the default stack says why each piece is in it', async ({ page }) => {
    await page.goto('/')
    const stack = page.getByRole('group', { name: 'The Turso Stack' })
    await expect(stack.getByText('My default stack')).toBeVisible()
    for (const tool of ['Next.js', 'TypeScript', 'Turso', 'Drizzle', 'Cloudflare R2', 'Vercel']) {
      await expect(stack.getByText(tool, { exact: true })).toBeVisible()
    }
    await expect(stack.getByText(/no egress fees/)).toBeVisible()
    await expect(page.getByText('TL;DR')).toHaveCount(0)
  })

  test('the whoami terminal is in the homepage hero, not on /loadout', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main [data-terminal-title]')).toContainText('~/whoami')
    await page.goto('/loadout')
    await expect(page.getByRole('heading', { level: 1, name: /loadout/i })).toBeVisible()
    await expect(page.locator('[data-terminal]')).toHaveCount(0)
  })
})

const dino = (page: Page) => page.locator('[data-dino]')

// Bring the panel on screen without a smooth scroll still on its way.
// Jump there, and again if the page moves it away (a reload restores the old
// scroll position after load, and late content can shift the page).
const showKit = (page: Page, selector: string) =>
  expect
    .poll(() =>
      page.locator(selector).evaluate((el) => {
        const box = el.getBoundingClientRect()
        // Centred: it spans the middle of the viewport (it can be taller).
        if (box.top <= innerHeight / 2 && box.bottom >= innerHeight / 2) return true
        el.scrollIntoView({ block: 'center', behavior: 'instant' })
        return false
      })
    )
    .toBe(true)

// Click (or tap) the dino where it is right now. It never holds still, so a
// pointer aimed at where it was a moment ago can miss: hit-test its centre
// and click in the same tick. (That its box takes the pointer at all is
// checked above.)
const pokeDino = (page: Page) =>
  expect
    .poll(() =>
      dino(page).evaluate((el) => {
        const box = el.getBoundingClientRect()
        const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
        if (!hit || !el.contains(hit)) return false
        ;(el as HTMLElement).click()
        return true
      })
    )
    .toBe(true)

// The tests shorten the dino's line waits (see DinoTiming in DinoGame.tsx).
const lineTiming = (page: Page, timing: { firstLineAfter: number; lineGap: [number, number] }) =>
  page.addInitScript((t) => {
    ;(window as unknown as { __n8DinoTiming: unknown }).__n8DinoTiming = t
  }, timing)

test.describe('dino easter egg (motion allowed)', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('loads only once the AI kit nears the viewport, and never blocks the tiles', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    // Far above the kit, the game hasn't loaded.
    await page.waitForTimeout(1000)
    await expect(dino(page)).toHaveCount(0)

    await showKit(page, '[data-dino-panel]')
    await expect(dino(page)).toHaveCount(1)
    // Decorative: hidden from assistive tech. Clicks pass through its layer;
    // only the dino's own small box takes them (the click easter egg).
    await expect(
      page.locator('[data-dino-panel] [aria-hidden="true"]:has([data-dino])')
    ).toHaveCount(1)
    expect(
      await dino(page).evaluate((el) => getComputedStyle(el.parentElement!).pointerEvents)
    ).toBe('none')
    expect(await dino(page).evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('auto')
    // It walks: its position changes from frame to frame.
    const at = () => dino(page).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41)
    const first = await at()
    await expect.poll(at).not.toBe(first)
  })

  // Every mode/level the dino passes through, recorded in the page so a brief
  // miss between two polls can't slip by.
  const recordDino = (page: Page) =>
    dino(page).evaluate((el) => {
      const log: string[] = []
      ;(window as unknown as { dinoLog: string[] }).dinoLog = log
      const note = () => log.push(`${el.dataset.mode}@${el.dataset.level}`)
      note()
      new MutationObserver(note).observe(el, { attributes: true })
    })
  const dinoLog = (page: Page) =>
    page.evaluate(() => (window as unknown as { dinoLog: string[] }).dinoLog)

  const rowBox = async (page: Page, index: number) =>
    (await page.locator('[data-dino-panel] [data-marquee-row]').nth(index).boundingBox())!
  const hoverRow = async (page: Page, index: number) => {
    const row = await rowBox(page, index)
    await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2)
  }

  const onTopRow = async (page: Page) => {
    await page.goto('/')
    await showKit(page, '[data-dino-panel]')
    await expect(dino(page)).toHaveAttribute('data-level', '0', { timeout: 10_000 })
    await expect(dino(page)).toHaveAttribute('data-mode', 'walk')
    await expect(dino(page)).toHaveAttribute('data-dir', 'right')
  }

  test('pausing the row it walks on makes it miss a jump and fall to the next row, walking the other way', async ({
    page,
  }) => {
    await onTopRow(page)

    // Hovering the top row pauses it: the dino misses, lands on the bottom
    // row and turns around.
    await hoverRow(page, 0)
    await expect(dino(page)).toHaveAttribute('data-level', '1', { timeout: 10_000 })
    await expect(dino(page)).toHaveAttribute('data-dir', 'left')
    await expect(dino(page)).toHaveAttribute('data-mode', 'walk')

    // Pausing the bottom row (leave, then hover it) makes it miss again: off
    // the last row, it drops back in at the top left, walking right.
    await page.mouse.move(5, 5)
    await page.waitForTimeout(300)
    await hoverRow(page, 1)
    await expect(dino(page)).toHaveAttribute('data-level', '0', { timeout: 10_000 })
    await expect(dino(page)).toHaveAttribute('data-dir', 'right')
  })

  test('pausing a row it is not on leaves its jumps alone', async ({ page }) => {
    await onTopRow(page)
    await hoverRow(page, 0)
    await expect(dino(page)).toHaveAttribute('data-level', '1', { timeout: 10_000 })
    await expect(dino(page)).toHaveAttribute('data-mode', 'walk')

    // Leave, then hover the top row again: it pauses, but the dino is on the
    // bottom row, still moving at full speed, so it keeps clearing the gaps.
    await page.mouse.move(5, 5)
    await page.waitForTimeout(300)
    await recordDino(page)
    await hoverRow(page, 0)
    await page.waitForTimeout(5000)
    await expect(dino(page)).toHaveAttribute('data-level', '1')
    const log = await dinoLog(page)
    expect(log.filter((entry) => !entry.endsWith('@1')), 'stayed on the bottom row').toEqual([])
    expect(log.filter((entry) => entry.startsWith('miss')), 'never missed a jump').toEqual([])
    expect(log.filter((entry) => entry.startsWith('hop')).length, 'kept hopping').toBeGreaterThan(0)
  })

  test('a tapped or focused tile pauses only its own row for the dino', async ({ page, hasTouch }) => {
    await onTopRow(page)
    // Focus (a keyboard user) or a tap (a touch screen) on a tile of the
    // bottom row pauses that row, not the one the dino is on. Wait for a tile
    // fully on screen (on a phone one is often cut by an edge).
    const rowsEl = page.locator('[data-dino-panel] [data-marquee-row]')
    const findTile = (index: number) =>
      rowsEl.nth(index).evaluate((row) => {
        const panel = row.closest('[data-dino-panel]')!.getBoundingClientRect()
        const figures = [...row.querySelectorAll<HTMLElement>('figure')]
        const at = figures.findIndex((figure) => {
          const box = figure.getBoundingClientRect()
          return box.left >= panel.left + 8 && box.right <= panel.right - 8
        })
        if (at < 0) return null
        const box = figures[at].getBoundingClientRect()
        return { at, x: box.x + box.width / 2, y: box.y + box.height / 2 }
      })
    const pick = async (index: number) => {
      await expect.poll(() => findTile(index), { message: 'a tile fully on screen' }).not.toBeNull()
      const target = (await findTile(index))!
      if (hasTouch) await page.touchscreen.tap(target.x, target.y)
      else
        await rowsEl
          .nth(index)
          .locator('figure')
          .nth(target.at)
          .evaluate((tile) => tile.focus({ preventScroll: true }))
    }
    await recordDino(page)
    await pick(1)
    await page.waitForTimeout(5000)
    const log = await dinoLog(page)
    expect(log.filter((entry) => !entry.endsWith('@0')), 'stayed on the top row').toEqual([])
    expect(log.filter((entry) => entry.startsWith('miss')), 'never missed a jump').toEqual([])

    // Moving to the top row pauses the dino's own row: it misses.
    await pick(0)
    await expect(dino(page)).toHaveAttribute('data-level', '1', { timeout: 10_000 })
    await expect(dino(page)).toHaveAttribute('data-dir', 'left')
  })

  test('clicking it makes it roar: a RAWR bubble, a backflip and a new colour', async ({ page }) => {
    await onTopRow(page)
    const colour = () =>
      dino(page).evaluate((el) => getComputedStyle(el).getPropertyValue('--dino-body').trim())
    const before = await colour()
    // It never holds still, so click it where it is.
    await pokeDino(page)
    await expect(dino(page)).toHaveAttribute('data-roars', '1')
    await expect(dino(page)).toHaveAttribute('data-mode', 'flip')
    await expect(page.locator('[data-dino-bubble="roar"]')).toBeVisible()
    expect(await colour()).not.toBe(before)
    // It lands and walks on, the bubble gone.
    await expect(dino(page)).toHaveAttribute('data-mode', 'walk')
    await expect(page.locator('[data-dino-bubble="roar"]')).toBeHidden()
    await pokeDino(page)
    await expect(dino(page)).toHaveAttribute('data-roars', '2')
  })

  test('says its lines now and then, each once per visit', async ({ page }) => {
    // Shortened waits; one line per page view, so each view shows the next.
    await lineTiming(page, { firstLineAfter: 0.3, lineGap: [600, 600] })
    await page.goto('/')
    await showKit(page, '[data-dino-panel]')
    // The first hints at the click; it stops to say it.
    await expect(dino(page)).toHaveAttribute('data-line', '0', { timeout: 15_000 })
    await expect(page.locator('[data-dino-bubble="line-0"]')).toBeVisible()
    await expect(dino(page)).toHaveAttribute('data-mode', 'walk')
    // Back again in the same visit (same tab): it picks up with the next line.
    await page.goto('/')
    await showKit(page, '[data-dino-panel]')
    await expect(dino(page)).toHaveAttribute('data-line', '1', { timeout: 15_000 })
    await expect(page.locator('[data-dino-bubble="line-1"]')).toBeVisible()
  })

  test('skips the click hint once it has been clicked', async ({ page }) => {
    // Long enough a first wait to click before it.
    await lineTiming(page, { firstLineAfter: 1.5, lineGap: [600, 600] })
    await onTopRow(page)
    await pokeDino(page)
    await expect(dino(page)).toHaveAttribute('data-roars', '1')
    await expect(dino(page)).toHaveAttribute('data-line', '1', { timeout: 15_000 })
  })

  test('the gaps it hops and falls through are clearly wider than it is', async ({ page }) => {
    await page.goto('/')
    await showKit(page, '[data-dino-panel]')
    await expect(dino(page)).toHaveCount(1)
    const m = await page.locator('[data-dino-panel]').evaluate((panel) => {
      const rows = [...panel.querySelectorAll('[data-marquee-row]')]
      const tiles = rows.map((row) =>
        [...row.querySelectorAll('figure')].map((f) => f.getBoundingClientRect())
      )
      const dino = panel.querySelector('[data-dino]')!.getBoundingClientRect()
      return {
        across: tiles[0][1].left - tiles[0][0].right,
        between: tiles[1][0].top - tiles[0][0].bottom,
        width: dino.width,
        height: dino.height,
      }
    })
    expect(m.across, 'gap between tiles vs the dino').toBeGreaterThanOrEqual(m.width + 6)
    expect(m.between, 'gap between the rows vs the dino').toBeGreaterThanOrEqual(m.height + 6)
  })

  test('is not on /loadout', async ({ page }) => {
    await page.goto('/loadout')
    await showKit(page, '#ai')
    await expect(page.locator('#ai [data-marquee-row]').first()).toBeVisible()
    await page.waitForTimeout(1500)
    await expect(dino(page)).toHaveCount(0)
    await expect(page.locator('[data-dino-panel]')).toHaveCount(0)
  })
})

test.describe('dino easter egg (reduced motion)', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('the wrapped tiles keep the default spacing', async ({ page }) => {
    await page.goto('/')
    const gap = await page
      .getByRole('region', { name: 'AI agents' })
      .evaluate((row) => getComputedStyle(row).columnGap)
    expect(gap).toBe('16px')
  })

  test('is not shown or loaded', async ({ page }) => {
    await page.goto('/')
    await showKit(page, '[data-dino-panel]')
    await page.waitForTimeout(1500)
    await expect(dino(page)).toHaveCount(0)
  })
})
