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

test('the logo goes home from any page', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/loadout')
  await page.getByRole('link', { name: 'n8builds.dev home' }).click()
  await expect(page).toHaveURL(/\/$/)
})

/** Ko-fi left the header (2026-11-08): neither the navbar nor the mobile menu has it; the footer does. */
const KOFI = 'https://ko-fi.com/n8watkins'

test('Ko-fi is not in the header, only in the footer', { tag: '@smoke' }, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.locator(`nav[aria-label="Primary"] a[href="${KOFI}"], #mobile-menu a[href="${KOFI}"]`)).toHaveCount(0)
  await expect(page.locator(`footer a[href="${KOFI}"]`).first()).toBeAttached()
})

/** "Contact" in the navbar and the mobile menu (2026-10-28): it jumps to the homepage's contact form. */
test.describe('the Contact link', () => {
  const form = (page: Page) => page.locator('#contact form')

  test('scrolls to the form on the homepage', { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await expect(form(page)).not.toBeInViewport()
    await page.locator('nav[aria-label="Primary"]').getByRole('link', { name: 'Contact', exact: true }).click()
    await expect(form(page)).toBeInViewport()
    await expect(page).toHaveURL(/\/#contact$/)
  })

  test('takes you to the form from another page', { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/loadout')
    await page.locator('nav[aria-label="Primary"]').getByRole('link', { name: 'Contact', exact: true }).click()
    await expect(page).toHaveURL(/\/#contact$/)
    await expect(form(page)).toBeInViewport()
  })

  test('is in the mobile menu', { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
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
 * The navbar's Tech for Pros link (2026-11-01): a bordered pill like
 * Portfolio, holding its icon and techforpros.com over a clean curved
 * underline (round 3 of 2026-11-02: one smooth arc, static, never animated).
 */
const techForPros = (page: Page) => page.locator('nav[aria-label="Primary"]').getByRole('link', { name: /^techforpros\.com/ })
const underline = (page: Page) => techForPros(page).locator('svg.tfp-underline path')

test('the navbar links techforpros.com in a pill like Portfolio, through the counted short link', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const link = techForPros(page)
  await expect(link).toHaveAttribute('href', '/techforpros?from=navbar')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link.locator('img[src*="techforpros"]')).toBeVisible()
  // The same height, radius and border as the buttons beside it.
  const portfolio = page.locator('nav[aria-label="Primary"]').getByRole('link', { name: 'Portfolio', exact: true })
  const style = (el: HTMLElement | SVGElement) => {
    const s = getComputedStyle(el)
    return { radius: s.borderTopLeftRadius, border: s.borderTopWidth, style: s.borderTopStyle, height: el.getBoundingClientRect().height }
  }
  expect(await link.evaluate(style)).toEqual(await portfolio.evaluate(style))
  // A curve under the text, not a straight text underline, and no gradient fill.
  await expect(link.getByText('techforpros.com', { exact: true })).not.toHaveCSS('text-decoration-line', 'underline')
  expect(await link.evaluate((el) => getComputedStyle(el).backgroundImage)).toBe('none')
  const text = (await link.getByText('techforpros.com', { exact: true }).boundingBox())!
  const curve = (await underline(page).boundingBox())!
  // Under the letters: its lowest point is below the text's line box.
  expect(curve.y + curve.height).toBeGreaterThan(text.y + text.height)
  expect(curve.y).toBeGreaterThan(text.y + text.height / 2)
  // Close under the letters (round 5 of 2026-11-02): its top within a few pixels of the text's line box.
  expect(curve.y - (text.y + text.height)).toBeLessThan(3)
  // Nearly the label's width (its inset and symmetry are checked in the drawing's own units below).
  expect(curve.width).toBeGreaterThan(text.width * 0.85)
})

test('the techforpros.com underline is one shallow, symmetric arch that never animates', { tag: '@cross-browser' }, async ({ page, isMobile }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const path = underline(page)
  await expect(path).toHaveCSS('animation-name', 'none')
  await expect(path).toHaveCSS('stroke-dasharray', 'none')
  // One cubic segment: no S or second C joining wobbles together.
  expect((await path.getAttribute('d'))!.match(/[CSQ]/gi)).toHaveLength(1)
  // Round 5 of 2026-11-02: symmetric, centred under the label, and a gentle arch: the
  // middle is its highest point, the ends lower and level, by only a little.
  const shape = await path.evaluate((el: SVGPathElement) => {
    const length = el.getTotalLength()
    const [start, middle, end] = [0, 0.5, 1].map((f) => el.getPointAtLength(length * f))
    return { start: [start.x, start.y], middle: [middle.x, middle.y], end: [end.x, end.y], width: (el.ownerSVGElement!.viewBox.baseVal.width) }
  })
  expect(Math.abs(shape.start[0] - (shape.width - shape.end[0]))).toBeLessThan(0.01)
  expect(Math.abs(shape.middle[0] - shape.width / 2)).toBeLessThan(0.5)
  expect(Math.abs(shape.start[1] - shape.end[1])).toBeLessThan(0.01)
  expect(shape.middle[1]).toBeLessThan(shape.start[1])
  expect(shape.start[1] - shape.middle[1]).toBeLessThan(2)
  await techForPros(page).hover()
  await expect(techForPros(page).locator('svg.tfp-underline')).toHaveCSS('animation-name', 'none')
  // It brightens on hover (a touch screen has none).
  if (!isMobile) await expect(techForPros(page).locator('svg.tfp-underline')).toHaveCSS('opacity', '1')
})

// On phones the link sits between the logo and the menu button, on one line.
for (const width of [320, 375, 390]) {
  test(`at ${width}px the techforpros.com link fits between the logo and the menu button`, { tag: width === 320 ? '@cross-browser' : [] }, async ({ page }) => {
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

  test('nothing in the navbar is pushed off-screen, and the menu button is there', { tag: '@cross-browser' }, async ({ page }) => {
    await page.goto('/')
    const box = await techForPros(page).boundingBox()
    expect(box!.x + box!.width).toBeLessThanOrEqual(810)
    await expect(menuButton(page)).toBeVisible()
    // Portfolio fits too, clear of the logo.
    const portfolio = (await page.locator('nav[aria-label="Primary"]').getByRole('link', { name: 'Portfolio', exact: true }).boundingBox())!
    const logo = (await page.getByRole('link', { name: 'n8builds.dev home' }).boundingBox())!
    expect(portfolio.x).toBeGreaterThan(logo.x + logo.width)
  })
})

test.describe('mobile menu', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('opens as an overlay: announced, scroll-locked, closed by Escape or the backdrop', { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
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

  test('is modal: Tab stays in the navbar and menu, and the page behind is inert until it closes', { tag: '@cross-browser' }, async ({ page }) => {
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

  test('scrolls, so every link can be reached', { tag: '@cross-browser' }, async ({ page }) => {
    await page.goto('/')
    await openMenu(page)
    const menu = page.locator('#mobile-menu')
    const last = menu.getByRole('link').last()

    const panel = await menu.boundingBox()
    expect(panel!.y + panel!.height).toBeLessThanOrEqual(340)
    await last.scrollIntoViewIfNeeded()
    await expect(last).toBeInViewport()
  })
})

// Round 5 of 2026-11-02: a client-side visit to the homepage logged React's "Encountered a
// script tag" error (the old /#my-tools redirect lived in the page; it is in the layout now).
test('moving between pages logs no console errors', { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/loadout')
  await page.getByRole('link', { name: 'n8builds.dev home' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('#lab')).toBeAttached()
  await page.goto('/builds')
  await page.getByRole('link', { name: 'n8builds.dev home' }).click()
  await expect(page.locator('#lab')).toBeAttached()
  await page.waitForTimeout(1000)
  expect(errors.filter((e) => /script tag|hydrat/i.test(e))).toEqual([])
})

/**
 * Link consistency (2026-11-08): every Portfolio link on the homepage goes
 * through the counted /portfolio short link, tagged by where it sits, in a
 * new tab; and LinkedIn is one URL everywhere.
 */
test('every Portfolio link is counted and opens in a new tab; LinkedIn is one URL', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  for (const [where, from] of [
    ['nav[aria-label="Primary"]', 'navbar'],
    ['#home', 'hero'],
    ['#template', 'lab'],
    ['nav[aria-label="Sitemap"]', 'footer'],
  ] as const) {
    const link = page.locator(`${where} a[href="/portfolio?from=${from}"]`).first()
    await expect(link, where).toBeAttached()
    await expect(link, where).toHaveAttribute('target', '_blank')
  }
  const linkedIn = await page.locator('a[href*="linkedin.com"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')))])
  expect(linkedIn).toEqual(['https://linkedin.com/in/n8watkins'])
})
