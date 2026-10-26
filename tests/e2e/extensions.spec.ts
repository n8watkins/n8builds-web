import { test, expect, type Page } from '@playwright/test'

/**
 * The homepage's Chrome extensions showcase (components/sections/ExtensionsCarousel.tsx).
 * On desktop: three tabs that auto-cycle, each readable as a real option (no
 * fading or blurring the inactive ones), the active one marked by its border,
 * glow and timer bar. Hover or focus picks a tab and holds the cycle; under
 * reduced motion it never cycles. On phones the three simply stack.
 */

const NAMES = ['Piper TTS', 'TubeVault', 'TL;DW']
const CYCLE_MS = 5000

async function openShowcase(page: Page) {
  await page.goto('/')
  const section = page.locator('#extensions')
  await section.scrollIntoViewIfNeeded()
  const tabs = section.getByRole('tablist', { name: 'Chrome extensions' }).getByRole('tab')
  await expect(tabs).toHaveCount(3)
  return { section, tabs }
}

const activePanelHeading = (page: Page) => page.locator('#extensions [role="tabpanel"]:not([aria-hidden="true"]) h3')

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test.describe('with reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } })

    test('the tabs are real, readable options and the active one stands out without dimming the rest', async ({ page }) => {
      const { tabs } = await openShowcase(page)
      for (const [i, name] of NAMES.entries()) await expect(tabs.nth(i)).toContainText(name)
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
      await expect(activePanelHeading(page)).toHaveText('Piper TTS')

      for (let i = 0; i < 3; i++) {
        const style = await tabs.nth(i).evaluate((el) => {
          const s = getComputedStyle(el)
          const [name, tagline] = el.querySelectorAll('p')
          const icon = el.querySelector('img')!.getBoundingClientRect()
          return {
            opacity: s.opacity,
            filter: s.filter,
            nameSize: parseFloat(getComputedStyle(name).fontSize),
            taglineSize: parseFloat(getComputedStyle(tagline).fontSize),
            taglineFont: getComputedStyle(tagline).fontFamily,
            iconSize: icon.width,
            height: el.getBoundingClientRect().height,
          }
        })
        expect(style.opacity, `tab ${i} opacity`).toBe('1')
        expect(style.filter, `tab ${i} filter`).toBe('none')
        expect(style.nameSize).toBeGreaterThanOrEqual(18)
        expect(style.taglineSize).toBeGreaterThanOrEqual(14)
        expect(style.taglineFont).not.toMatch(/mono/i)
        expect(style.iconSize).toBe(32)
        expect(style.height).toBeGreaterThanOrEqual(24)
      }

      // The active tab is set apart by its border colour, not by fading the others.
      const borders = await tabs.evaluateAll((els) => els.map((el) => getComputedStyle(el).borderTopColor))
      expect(borders[0]).not.toBe(borders[1])
      expect(borders[1]).toBe(borders[2])
    })

    test('it never cycles, and the timer bar shows full instead of filling', async ({ page }) => {
      const { tabs } = await openShowcase(page)
      await page.mouse.move(0, 0)
      await page.waitForTimeout(CYCLE_MS + 1000)
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
      await expect(tabs.nth(0).locator('[data-progress]')).toHaveCSS('animation-name', 'none')
    })

    test('the keyboard moves between tabs with the arrow keys, Home and End', async ({ page }) => {
      const { tabs } = await openShowcase(page)
      // Only the active tab is in the tab order.
      await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0')
      await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1')
      await tabs.nth(0).focus()
      await page.keyboard.press('ArrowRight')
      await expect(tabs.nth(1)).toBeFocused()
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
      await expect(activePanelHeading(page)).toHaveText('TubeVault')
      await page.keyboard.press('End')
      await expect(tabs.nth(2)).toBeFocused()
      await expect(activePanelHeading(page)).toHaveText('TL;DW')
      await page.keyboard.press('ArrowRight')
      await expect(tabs.nth(0)).toBeFocused()
      await page.keyboard.press('ArrowLeft')
      await expect(tabs.nth(2)).toBeFocused()
      await page.keyboard.press('Home')
      await expect(tabs.nth(0)).toBeFocused()
      // Tab leaves the tablist for the active panel's links.
      await page.keyboard.press('Tab')
      await expect(page.locator('#extensions [role="tabpanel"]:not([aria-hidden="true"]) a').first()).toBeFocused()
      // Each tab names its panel.
      const panel = page.locator(`#${await tabs.nth(0).getAttribute('aria-controls')}`)
      await expect(panel).toHaveAttribute('role', 'tabpanel')
      await expect(panel).toHaveAttribute('aria-labelledby', (await tabs.nth(0).getAttribute('id'))!)
    })
  })

  test.describe('with motion', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } })

    test('it auto-advances, and hovering a tab picks it and holds the cycle', async ({ page }) => {
      test.setTimeout(60_000)
      const { tabs } = await openShowcase(page)
      await page.mouse.move(0, 0)
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true', { timeout: CYCLE_MS + 2000 })
      await expect(activePanelHeading(page)).toHaveText('TubeVault')

      await tabs.nth(2).hover()
      await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')
      await page.waitForTimeout(CYCLE_MS + 1000)
      await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')

      // Reading the detail panel holds it too.
      await activePanelHeading(page).hover()
      await page.waitForTimeout(CYCLE_MS + 1000)
      await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')

      // Leaving the showcase resumes the cycle.
      await page.mouse.move(0, 0)
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true', { timeout: CYCLE_MS + 2000 })
    })

    test('focus anywhere in the showcase holds the cycle, so a focused link never disappears', async ({ page }) => {
      const { tabs } = await openShowcase(page)
      await page.mouse.move(0, 0)
      await tabs.nth(0).focus()
      await page.keyboard.press('Tab')
      const link = page.locator('#extensions [role="tabpanel"]:not([aria-hidden="true"]) a').first()
      await expect(link).toBeFocused()
      await page.waitForTimeout(CYCLE_MS + 1000)
      await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
      await expect(link).toBeFocused()
    })
  })
})

test.describe('phones', () => {
  test.use({ viewport: { width: 375, height: 800 }, contextOptions: { reducedMotion: 'reduce' } })

  test('the three extensions stack, each with its readable subtitle, and no tabs show', async ({ page }) => {
    await page.goto('/')
    const section = page.locator('#extensions')
    await section.scrollIntoViewIfNeeded()
    await expect(section.getByRole('tablist')).toBeHidden()
    const headings = section.locator('h3:visible')
    await expect(headings).toHaveText(['Chrome extensions', ...NAMES])
    const first = headings.nth(1)
    const tagline = first.locator('xpath=following-sibling::p[1]')
    await expect(tagline).toHaveCSS('font-size', '14px')
    // Nothing spills sideways.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})
