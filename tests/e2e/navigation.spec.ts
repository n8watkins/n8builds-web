import { test, expect, type Page } from '@playwright/test'

/**
 * The navbar and mobile menu at the widths where they change shape.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu' })

/** Open the mobile menu, retrying a click that lands before hydration. */
async function openMenu(page: Page) {
  const button = menuButton(page)
  await expect(async () => {
    if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click()
    await expect(button).toHaveAttribute('aria-expanded', 'true', { timeout: 500 })
  }).toPass()
}

test('the logo goes home from any page', async ({ page }) => {
  await page.goto('/loadout')
  await page.getByRole('link', { name: 'n8builds.dev home' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test.describe('tablet width', () => {
  test.use({ viewport: { width: 810, height: 1080 } })

  test('nothing in the navbar is pushed off-screen, and the menu button is there', async ({ page }) => {
    await page.goto('/')
    const cta = page.locator('nav[aria-label="Primary"]').getByRole('link', { name: /Appturnity/ })
    const box = await cta.boundingBox()
    expect(box!.x + box!.width).toBeLessThanOrEqual(810)
    await expect(menuButton(page)).toBeVisible()
  })
})

test.describe('mobile menu', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('opens as an overlay: announced, scroll-locked, closed by Escape or the backdrop', async ({ page }) => {
    await page.goto('/')
    const button = menuButton(page)
    await expect(button).toHaveAttribute('aria-expanded', 'false')

    await openMenu(page)
    await expect(page.locator('#mobile-menu')).toBeVisible()
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden')

    await page.keyboard.press('Escape')
    await expect(page.locator('#mobile-menu')).toBeHidden()
    await expect(button).toBeFocused()
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('')

    // A tap outside the panel closes it rather than activating what's behind.
    await openMenu(page)
    const url = page.url()
    await page.mouse.click(195, 820)
    await expect(page.locator('#mobile-menu')).toBeHidden()
    expect(page.url()).toBe(url)
  })

  test('is modal: Tab stays in the navbar and menu, and the page behind is inert until it closes', async ({ page }) => {
    await page.goto('/')
    await openMenu(page)
    const main = page.locator('#main-content')
    await expect(main).toHaveAttribute('inert', '')

    await page.locator('#mobile-menu').getByRole('link').last().focus()
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(
        () =>
          !!document.activeElement?.closest('nav[aria-label="Primary"], #mobile-menu') ||
          document.activeElement === document.body,
      )
      expect(inside, `Tab ${i + 1} left the menu`).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(main).not.toHaveAttribute('inert')
  })
})

test.describe('mobile menu on a landscape phone', () => {
  test.use({ viewport: { width: 750, height: 340 }, hasTouch: true })

  test('scrolls, so every link can be reached', async ({ page }) => {
    await page.goto('/')
    await openMenu(page)
    const menu = page.locator('#mobile-menu')
    const last = menu.getByRole('link', { name: /Portfolio/ })

    const panel = await menu.boundingBox()
    expect(panel!.y + panel!.height).toBeLessThanOrEqual(340)
    await last.scrollIntoViewIfNeeded()
    await expect(last).toBeInViewport()
  })
})
