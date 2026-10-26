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
const showKit = (page: Page, selector: string) =>
  page
    .locator(selector)
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))

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

    await showKit(page, '#loadout')
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
    await showKit(page, '#loadout')
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

  test('a tapped or focused tile pauses only its own row for the dino', async ({ page }) => {
    await onTopRow(page)
    // Focus (a keyboard user, or a tap on a touch screen) on a fully visible
    // tile of the bottom row pauses that row, not the one the dino is on.
    const focusTile = (index: number) =>
      page
        .locator('[data-dino-panel] [data-marquee-row]')
        .nth(index)
        .evaluate((row) => {
          const panel = row.closest('[data-dino-panel]')!.getBoundingClientRect()
          const tile = [...row.querySelectorAll<HTMLElement>('figure')].find((figure) => {
            const box = figure.getBoundingClientRect()
            return box.left >= panel.left + 8 && box.right <= panel.right - 8
          })!
          tile.focus({ preventScroll: true })
        })
    await recordDino(page)
    await focusTile(1)
    await page.waitForTimeout(5000)
    const log = await dinoLog(page)
    expect(log.filter((entry) => !entry.endsWith('@0')), 'stayed on the top row').toEqual([])
    expect(log.filter((entry) => entry.startsWith('miss')), 'never missed a jump').toEqual([])

    // Focus moving to the top row pauses the dino's own row: it misses.
    await focusTile(0)
    await expect(dino(page)).toHaveAttribute('data-level', '1', { timeout: 10_000 })
    await expect(dino(page)).toHaveAttribute('data-dir', 'left')
  })

  test('clicking it makes it roar: a RAWR bubble, a backflip and a new colour', async ({ page }) => {
    await onTopRow(page)
    const colour = () =>
      dino(page).evaluate((el) => getComputedStyle(el).getPropertyValue('--dino-body').trim())
    const before = await colour()
    // It never holds still, so click it where it is.
    await dino(page).click({ force: true })
    await expect(dino(page)).toHaveAttribute('data-roars', '1')
    await expect(dino(page)).toHaveAttribute('data-mode', 'flip')
    await expect(page.locator('[data-dino-bubble="roar"]')).toBeVisible()
    expect(await colour()).not.toBe(before)
    // It lands and walks on, the bubble gone.
    await expect(dino(page)).toHaveAttribute('data-mode', 'walk')
    await expect(page.locator('[data-dino-bubble="roar"]')).toBeHidden()
    await dino(page).click({ force: true })
    await expect(dino(page)).toHaveAttribute('data-roars', '2')
  })

  test('says its lines now and then, each once per visit', async ({ page }) => {
    // A line waits for seconds of walking in plain view: slow on a busy machine.
    test.slow()
    await page.goto('/')
    await showKit(page, '#loadout')
    // The first, a few seconds in, hints at the click; it stops to say it.
    await expect(dino(page)).toHaveAttribute('data-line', '0', { timeout: 40_000 })
    await expect(page.locator('[data-dino-bubble="line-0"]')).toBeVisible()
    await expect(dino(page)).toHaveAttribute('data-mode', 'walk')
    // Back again in the same visit: it picks up with the next line.
    await page.reload()
    await showKit(page, '#loadout')
    await expect(dino(page)).toHaveAttribute('data-line', '1', { timeout: 40_000 })
    await expect(page.locator('[data-dino-bubble="line-1"]')).toBeVisible()
  })

  test('skips the click hint once it has been clicked', async ({ page }) => {
    test.slow()
    await onTopRow(page)
    await dino(page).click({ force: true })
    await expect(dino(page)).toHaveAttribute('data-roars', '1')
    await expect(dino(page)).toHaveAttribute('data-line', '1', { timeout: 40_000 })
  })

  test('the gaps it hops and falls through are clearly wider than it is', async ({ page }) => {
    await page.goto('/')
    await showKit(page, '#loadout')
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
    await showKit(page, '#loadout')
    await page.waitForTimeout(1500)
    await expect(dino(page)).toHaveCount(0)
  })
})
