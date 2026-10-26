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
    // Decorative: hidden from assistive tech, and clicks pass through it.
    await expect(
      page.locator('[data-dino-panel] [aria-hidden="true"]:has([data-dino])')
    ).toHaveCount(1)
    expect(await dino(page).evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none')
    // It walks: its position changes from frame to frame.
    const at = () => dino(page).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41)
    const first = await at()
    await expect.poll(at).not.toBe(first)
  })

  test('pausing the marquee makes it miss a jump and fall to the next row, walking the other way', async ({
    page,
  }) => {
    await page.goto('/')
    await showKit(page, '#loadout')
    await expect(dino(page)).toHaveAttribute('data-level', '0', { timeout: 10_000 })
    await expect(dino(page)).toHaveAttribute('data-mode', 'walk')
    await expect(dino(page)).toHaveAttribute('data-dir', 'right')

    // Hovering the marquee pauses it (the pointer rests on the panel's bottom
    // row, away from the dino).
    const row = (await page.locator('[data-dino-panel] [data-marquee-row]').nth(1).boundingBox())!
    await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2)
    await expect(dino(page)).toHaveAttribute('data-level', '1', { timeout: 10_000 })
    await expect(dino(page)).toHaveAttribute('data-dir', 'left')
    await expect(dino(page)).toHaveAttribute('data-mode', 'walk')

    // Hovering again (leave, come back) makes it miss again: off the last
    // row, it drops back in at the top left, walking right.
    await page.mouse.move(5, 5)
    await page.waitForTimeout(300)
    await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2)
    await expect(dino(page)).toHaveAttribute('data-level', '0', { timeout: 10_000 })
    await expect(dino(page)).toHaveAttribute('data-dir', 'right')
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

  test('is not shown or loaded', async ({ page }) => {
    await page.goto('/')
    await showKit(page, '#loadout')
    await page.waitForTimeout(1500)
    await expect(dino(page)).toHaveCount(0)
  })
})
