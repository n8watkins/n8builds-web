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

/** The Ko-fi link (2026-10-26): left of Portfolio in the navbar, and in the mobile menu. */
const KOFI = 'https://ko-fi.com/n8watkins'

test.describe('the Ko-fi link', () => {
  test('sits left of Portfolio in the navbar and opens Ko-fi in a new tab', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const nav = page.locator('nav[aria-label="Primary"]')
    const kofi = nav.getByRole('link', { name: 'Ko-fi', exact: true })
    await expect(kofi).toBeVisible()
    await expect(kofi).toHaveAttribute('href', KOFI)
    await expect(kofi).toHaveAttribute('target', '_blank')
    await expect(kofi).toHaveAttribute('rel', /noopener/)
    await expect(kofi.locator('svg')).toBeVisible()
    const portfolio = (await nav.getByRole('link', { name: 'Portfolio', exact: true }).boundingBox())!
    const box = (await kofi.boundingBox())!
    expect(box.x + box.width, 'left of Portfolio').toBeLessThanOrEqual(portfolio.x)
    // Same look as Portfolio: the same height and top.
    expect(Math.abs(box.height - portfolio.height)).toBeLessThanOrEqual(1)
    expect(Math.abs(box.y - portfolio.y)).toBeLessThanOrEqual(1)
  })

  test('is in the mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await openMenu(page)
    const kofi = page.locator('#mobile-menu').getByRole('link', { name: /Ko-fi/ })
    await expect(kofi).toBeVisible()
    await expect(kofi).toHaveAttribute('href', KOFI)
    await expect(kofi).toHaveAttribute('target', '_blank')
  })
})

/** "Contact" in the navbar and the mobile menu (2026-10-28): it jumps to the homepage's contact form. */
test.describe('the Contact link', () => {
  const form = (page: Page) => page.locator('#contact form')

  test('scrolls to the form on the homepage', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await expect(form(page)).not.toBeInViewport()
    await page.locator('nav[aria-label="Primary"]').getByRole('link', { name: 'Contact', exact: true }).click()
    await expect(form(page)).toBeInViewport()
    await expect(page).toHaveURL(/\/#contact$/)
  })

  test('takes you to the form from another page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/loadout')
    await page.locator('nav[aria-label="Primary"]').getByRole('link', { name: 'Contact', exact: true }).click()
    await expect(page).toHaveURL(/\/#contact$/)
    await expect(form(page)).toBeInViewport()
  })

  test('is in the mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await openMenu(page)
    await page.locator('#mobile-menu').getByRole('link', { name: 'Contact', exact: true }).click()
    await expect(form(page)).toBeInViewport()
    // Under the navbar at the page's scroll-padding-top, not 80px lower: WebKit
    // counted the padding twice while the open menu held the body's overflow.
    await expect
      .poll(() => page.locator('#contact').evaluate((el) => Math.round(el.getBoundingClientRect().top)), { timeout: 10_000 })
      .toBe(80)
  })
})

/**
 * The navbar's Tech for Pros link (2026-11-01): a bordered pill like Ko-fi and
 * Portfolio, holding its icon and techforpros.com over a hand-drawn swoosh
 * that draws itself in (drawn at once under reduced motion).
 */
const techForPros = (page: Page) => page.locator('nav[aria-label="Primary"]').getByRole('link', { name: /^techforpros\.com/ })
const swoosh = (page: Page) => techForPros(page).locator('svg.tfp-swoosh path')

test('the navbar links techforpros.com in a pill like Ko-fi and Portfolio, through the counted short link', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const link = techForPros(page)
  await expect(link).toHaveAttribute('href', '/techforpros?from=navbar')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link.locator('img[src*="techforpros"]')).toBeVisible()
  // The same height, radius and border as the buttons beside it.
  const kofi = page.locator('nav[aria-label="Primary"]').getByRole('link', { name: 'Ko-fi', exact: true })
  const style = (el: HTMLElement | SVGElement) => {
    const s = getComputedStyle(el)
    return { radius: s.borderTopLeftRadius, border: s.borderTopWidth, style: s.borderTopStyle, height: el.getBoundingClientRect().height }
  }
  expect(await link.evaluate(style)).toEqual(await kofi.evaluate(style))
  // A swoosh under the text, not a straight text underline, and no gradient fill.
  await expect(link.getByText('techforpros.com', { exact: true })).not.toHaveCSS('text-decoration-line', 'underline')
  expect(await link.evaluate((el) => getComputedStyle(el).backgroundImage)).toBe('none')
  const text = (await link.getByText('techforpros.com', { exact: true }).boundingBox())!
  const curve = (await swoosh(page).boundingBox())!
  // Under the letters: its lowest point is below the text's line box.
  expect(curve.y + curve.height).toBeGreaterThan(text.y + text.height)
  expect(curve.y).toBeGreaterThan(text.y + text.height / 2)
  expect(curve.width).toBeGreaterThan(text.width * 0.95)
})

test.describe('the techforpros.com swoosh', () => {
  test.describe('with motion', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } })

    test('draws itself in on load, then again on hover', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto('/')
      await expect(swoosh(page)).toHaveCSS('animation-name', 'tfp-swoosh-draw')
      // Drawn by the end.
      await expect.poll(() => swoosh(page).evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset)), { timeout: 5000 }).toBe(0)
      await techForPros(page).hover()
      await expect(techForPros(page).locator('svg.tfp-swoosh')).toHaveCSS('animation-name', 'tfp-swoosh-wipe')
    })
  })

  test('shows fully drawn, with no animation, under reduced motion', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(swoosh(page)).toHaveCSS('animation-name', 'none')
    expect(await swoosh(page).evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset))).toBe(0)
    await techForPros(page).hover()
    await expect(techForPros(page).locator('svg.tfp-swoosh')).toHaveCSS('animation-name', 'none')
    await expect(techForPros(page).locator('svg.tfp-swoosh')).toBeVisible()
  })
})

// On phones the link sits between the logo and the menu button, on one line.
for (const width of [320, 375, 390]) {
  test(`at ${width}px the techforpros.com link fits between the logo and the menu button`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const link = (await techForPros(page).boundingBox())!
    const logo = (await page.getByRole('link', { name: 'n8builds.dev home' }).boundingBox())!
    const menu = (await menuButton(page).boundingBox())!
    expect(link.x).toBeGreaterThan(logo.x + logo.width)
    expect(link.x + link.width).toBeLessThanOrEqual(menu.x)
    expect(menu.x + menu.width).toBeLessThanOrEqual(width)
    // One line, the pill's height, not wrapped.
    expect(link.height).toBeLessThan(40)
  })
}

test.describe('tablet width', () => {
  test.use({ viewport: { width: 810, height: 1080 } })

  test('nothing in the navbar is pushed off-screen, and the menu button is there', async ({ page }) => {
    await page.goto('/')
    const box = await techForPros(page).boundingBox()
    expect(box!.x + box!.width).toBeLessThanOrEqual(810)
    await expect(menuButton(page)).toBeVisible()
    // Ko-fi fits too, clear of the logo.
    const kofi = (await page.locator('nav[aria-label="Primary"]').getByRole('link', { name: 'Ko-fi', exact: true }).boundingBox())!
    const logo = (await page.getByRole('link', { name: 'n8builds.dev home' }).boundingBox())!
    expect(kofi.x).toBeGreaterThan(logo.x + logo.width)
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
    const last = menu.getByRole('link', { name: /Ko-fi/ })

    const panel = await menu.boundingBox()
    expect(panel!.y + panel!.height).toBeLessThanOrEqual(340)
    await last.scrollIntoViewIfNeeded()
    await expect(last).toBeInViewport()
  })
})
