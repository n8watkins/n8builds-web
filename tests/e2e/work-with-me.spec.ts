import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * "Two ways to put me to work" (components/sections/WorkWithMe.tsx): two
 * stacked cards, pictures alternating sides. The developer card's portfolio
 * shot scrolls in its frame (paused off screen, still under reduced motion),
 * with no phone since round 5 of 2026-11-02; the Tech for Pros card mirrors
 * the top of the page (its template window and phone) and takes a quote
 * request by email.
 */

const section = (page: Page) => page.locator('#work-with-me')
const card = (page: Page, name: RegExp) => section(page).getByRole('article', { name })
const box = async (l: Locator) => {
  const b = await l.boundingBox()
  expect(b).not.toBeNull()
  return b!
}

// The scrolling screenshots, with their animation state (not the Tech for Pros phone, which is the top section's own).
const scrollState = (page: Page) =>
  section(page)
    .locator('img[class*="scroll"]:not(.now-phone-scroll)')
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
      const shots = await box(c.locator('[data-shots]'))
      const heading = await box(c.getByRole('heading', { level: 3 }))
      if (shotsOnRight) expect(shots.x).toBeGreaterThan(heading.x)
      else expect(shots.x).toBeLessThan(heading.x)
    }
  })

  test('each card has its own doors', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/')
    const dev = card(page, /Like the builds/)
    await expect(dev.getByText('Need a developer?')).toBeVisible()
    await expect(dev.getByRole('link', { name: /See my portfolio/ })).toHaveAttribute('href', 'https://portfolio.n8builds.dev')
    await expect(dev.getByRole('link', { name: 'Or send me a message' })).toHaveAttribute('href', '/#contact')

    const apt = card(page, /Run a service business/)
    // The top section's voice, its templates and its phone (round 5 of 2026-11-02).
    await expect(apt.getByRole('heading', { level: 3 })).toHaveText('Run a service business? Websites built for pros.')
    await expect(apt).toContainText('A few details about your business become a launch')
    await expect(apt.getByRole('group', { name: 'Tech for Pros templates' })).toHaveCount(1)
    await expect(apt.locator('img[src*="hvac-phone-full"]')).toHaveCount(1)
    await expect(apt.getByRole('list', { name: 'Next up' })).toHaveCount(0)
    // techforpros.com isn't live yet, so its name in the header is plain text, and nothing links there.
    await expect(apt.locator('[data-tfp-domain]')).toHaveText('techforpros.com')
    await expect(apt.getByRole('link', { name: /techforpros|Visit Tech for Pros/i })).toHaveCount(0)
    await expect(apt.locator('img[src*="techforpros"]').first()).toBeVisible()
    // The quote request: an email field and "Get my quote".
    await expect(apt.getByRole('textbox', { name: 'Where should the quote go?' })).toHaveAttribute('type', 'email')
    await expect(apt.getByRole('button', { name: 'Get my quote' })).toBeVisible()
  })

  test('the quote field sends just the email, tagged as a Tech for Pros quote, and says so', async ({ page }) => {
    await page.goto('/')
    const apt = card(page, /Run a service business/)
    const field = apt.getByRole('textbox', { name: 'Where should the quote go?' })
    const send = apt.getByRole('button', { name: 'Get my quote' })
    await field.scrollIntoViewIfNeeded()
    await expect(send).toBeEnabled({ timeout: 20_000 })
    // A bad address stays on the form, said out loud, and nothing is sent.
    let posted: unknown = null
    page.on('request', (r) => {
      if (r.url().endsWith('/api/contact') && r.method() === 'POST') posted = r.postDataJSON()
    })
    await field.fill('not an email')
    await send.click()
    await expect(apt.getByRole('alert')).toHaveText('Please enter a valid email address.')
    await expect(field).toBeFocused()
    expect(posted).toBeNull()

    await field.fill('owner@pools.example.com')
    await send.click()
    const done = apt.getByRole('status')
    await expect(done).toContainText('Got it. Your quote is on its way.', { timeout: 15_000 })
    await expect(done).toContainText('owner@pools.example.com')
    expect(posted).toMatchObject({ kind: 'techforpros-quote', email: 'owner@pools.example.com', honeypot: '' })
    expect(Object.keys(posted as object).sort()).toEqual(['email', 'honeypot', 'kind', 'turnstile'])
  })

  test('the screenshot links stay out of the tab order; the buttons are reachable', { tag: '@cross-browser' }, async ({ page }) => {
    await page.goto('/')
    const dev = card(page, /Like the builds/)
    // The developer card's screenshot (the Tech for Pros window has its own picker buttons).
    await expect(section(page).locator('a[aria-hidden="true"][tabindex="-1"]')).toHaveCount(1)
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

    test('the full-length screenshots scroll in view and pause off screen', { tag: '@cross-browser' }, async ({ page }) => {
      await page.goto('/')
      // The portfolio's desktop shot (no phone since round 5 of 2026-11-02).
      await expect(section(page).locator('img[class*="scroll"]:not(.now-phone-scroll)')).toHaveCount(1)
      // The Tech for Pros phone scrolls as at the top of the page, and pauses off screen too.
      const phone = card(page, /Run a service business/).locator('img.now-phone-scroll')
      await expect(phone).toHaveCount(1)
      const phoneState = () => phone.evaluate((img) => img.getAnimations()[0]?.playState ?? 'none')

      // At the top of the page the cards are off screen: paused.
      await expect.poll(async () => (await scrollState(page)).map((s) => s.playState)).toEqual(['paused'])
      await expect.poll(phoneState).toBe('paused')
      // The card, not the image: the phone's full-length page is far taller than its frame,
      // and WebKit scrolls the whole image into view, leaving the card off screen.
      await card(page, /Run a service business/).locator('[data-shots]').scrollIntoViewIfNeeded()
      await expect.poll(phoneState).toBe('running')

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

    test('the screenshots hold still at the top of the page', { tag: '@cross-browser' }, async ({ page }) => {
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

  test('the screenshots sit above the copy, and nothing overflows', { tag: '@cross-browser' }, async ({ page }) => {
    await page.goto('/')
    for (const name of [/Like the builds/, /Run a service business/]) {
      const c = card(page, name)
      await c.scrollIntoViewIfNeeded()
      const shots = await box(c.locator('[data-shots]'))
      const heading = await box(c.getByRole('heading', { level: 3 }))
      expect(shots.y + shots.height).toBeLessThanOrEqual(heading.y)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  })
})
