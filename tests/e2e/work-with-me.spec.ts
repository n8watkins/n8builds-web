import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * "Two ways to put me to work" (components/sections/WorkWithMe.tsx): two
 * stacked cards, screenshots alternating sides, full-length shots scrolling
 * inside their frames (paused off screen, still under reduced motion).
 */

const section = (page: Page) => page.locator('#work-with-me')
const card = (page: Page, name: RegExp) => section(page).getByRole('article', { name })
const box = async (l: Locator) => {
  const b = await l.boundingBox()
  expect(b).not.toBeNull()
  return b!
}

// The scrolling screenshots, with their animation state.
const scrollState = (page: Page) =>
  section(page)
    .locator('img[class*="scroll"]')
    .evaluateAll((imgs) =>
      imgs.map((img) => {
        const anim = img.getAnimations()[0]
        const transform = getComputedStyle(img).transform
        return { playState: anim?.playState ?? 'none', transform, y: new DOMMatrix(transform === 'none' ? undefined : transform).m42 }
      })
    )

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('two stacked cards, the screenshots on the right then the left', async ({ page, isMobile }) => {
    test.skip(isMobile, 'a desktop layout; the phone describe below covers touch devices')
    await page.goto('/')
    const dev = card(page, /Like the builds/)
    const apt = card(page, /Run a service business/)
    await apt.scrollIntoViewIfNeeded()

    // Layout boxes, not boundingBox(): a card the page jumped past has not
    // played its scroll reveal yet, so it is still translated down a little
    // and would look like it overlaps the next one.
    const layout = (c: Locator) =>
      c.evaluate((el) => {
        const wrapper = el.parentElement as HTMLElement
        return { top: wrapper.offsetTop, height: wrapper.offsetHeight, width: wrapper.offsetWidth }
      })
    const devBox = await layout(dev)
    const aptBox = await layout(apt)
    expect(aptBox.top, 'stacked, not side by side').toBeGreaterThanOrEqual(devBox.top + devBox.height)
    expect(Math.abs(aptBox.width - devBox.width)).toBeLessThan(2)

    for (const [c, shotsOnRight] of [
      [dev, true],
      [apt, false],
    ] as const) {
      const shots = await box(c.locator('a[aria-hidden="true"]'))
      const heading = await box(c.getByRole('heading', { level: 3 }))
      if (shotsOnRight) expect(shots.x).toBeGreaterThan(heading.x)
      else expect(shots.x).toBeLessThan(heading.x)
    }
  })

  test('each card has its own doors', async ({ page }) => {
    await page.goto('/')
    const dev = card(page, /Like the builds/)
    await expect(dev.getByText('Need a developer?')).toBeVisible()
    await expect(dev.getByRole('link', { name: /See my portfolio/ })).toHaveAttribute('href', 'https://portfolio.n8builds.dev')
    await expect(dev.getByRole('link', { name: 'Or send me a message' })).toHaveAttribute('href', '/#contact')

    const apt = card(page, /Run a service business/)
    await expect(apt.getByRole('link', { name: /Claim your free website/ })).toHaveAttribute('href', 'https://appturnity.com/#free-website')
    await expect(apt.getByRole('link', { name: /See the plans/ })).toHaveAttribute('href', 'https://appturnity.com/pricing')
    // Planned features are labelled as such, never as included.
    await expect(apt.getByRole('list', { name: 'Coming soon' }).getByRole('listitem')).toHaveCount(6)
  })

  test('the screenshot links stay out of the tab order; the buttons are reachable', async ({ page }) => {
    await page.goto('/')
    const dev = card(page, /Like the builds/)
    await expect(section(page).locator('a[aria-hidden="true"][tabindex="-1"]')).toHaveCount(2)
    const portfolio = dev.getByRole('link', { name: /See my portfolio/ })
    await portfolio.focus()
    await expect(portfolio).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(dev.getByRole('link', { name: 'Or send me a message' })).toBeFocused()
    // New-tab links say so to screen readers.
    await expect(portfolio).toContainText('(opens in a new tab)')
  })

  test.describe('motion allowed', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } })

    test('the full-length screenshots scroll in view and pause off screen', async ({ page }) => {
      await page.goto('/')
      // Desktop and phone shots of the portfolio, and Appturnity's phone shot.
      await expect(section(page).locator('img[class*="scroll"]')).toHaveCount(3)

      // At the top of the page the cards are off screen: paused.
      await expect.poll(async () => (await scrollState(page)).map((s) => s.playState)).toEqual(['paused', 'paused', 'paused'])

      await card(page, /Like the builds/).locator('a[aria-hidden="true"]').scrollIntoViewIfNeeded()
      await expect.poll(async () => (await scrollState(page))[0].playState).toBe('running')
      // It moves: past the first pause the image has travelled up.
      await expect
        .poll(async () => (await scrollState(page))[0].y, { timeout: 10_000 })
        .toBeLessThan(-1)

      await page.evaluate(() => window.scrollTo(0, 0))
      await expect.poll(async () => (await scrollState(page))[0].playState).toBe('paused')
    })
  })

  test.describe('reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } })

    test('the screenshots hold still at the top of the page', async ({ page }) => {
      await page.goto('/')
      await card(page, /Like the builds/).scrollIntoViewIfNeeded()
      await page.waitForTimeout(1500)
      for (const s of await scrollState(page)) {
        expect(s.playState).toBe('none')
        expect(s.transform).toBe('none')
      }
    })
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('the screenshots sit above the copy, and nothing overflows', async ({ page }) => {
    await page.goto('/')
    for (const name of [/Like the builds/, /Run a service business/]) {
      const c = card(page, name)
      await c.scrollIntoViewIfNeeded()
      const shots = await box(c.locator('a[aria-hidden="true"]'))
      const heading = await box(c.getByRole('heading', { level: 3 }))
      expect(shots.y + shots.height).toBeLessThanOrEqual(heading.y)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  })
})
