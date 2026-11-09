import { test, expect, type Page } from '@playwright/test'

/**
 * "What I'm working on" (#now): an ad for Tech for Pros, headed by its icon
 * and techforpros.com. Since round 3 of 2026-11-02: "Websites built for pros",
 * copy about the service (never a list of trades) and no feature list; its
 * templates slide side to side in a browser window, with a timer line along
 * its bottom, a phone in front, labelled chips per trade under the window
 * and "Don't see yours? We'll build it." under them (2026-11-08). The quote
 * request (an email field and "Get my quote") is on the card itself since
 * 2026-11-08 (the booking page and the site get buttons once they exist).
 * No What's new.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const now = (page: Page) => page.locator('#now')
/** The ad's quote request, right on the card (2026-11-08). */
const quoteField = (page: Page) => now(page).getByRole('textbox', { name: 'Where should the quote go?' })
const quoteButton = (page: Page) => now(page).getByRole('button', { name: 'Get my quote' })
const carousel = (page: Page) => now(page).getByRole('group', { name: 'Tech for Pros templates' })
const frame = (page: Page) => carousel(page).locator('[data-slide]').first().locator('xpath=..')
const showing = (page: Page) => carousel(page).locator('[data-slide][aria-hidden="false"]')
const TEMPLATES = ['Pool', 'HVAC', 'Landscaping', 'Roofing']

test('the card reads like an ad: headline, the service, the quote field and the templates', async ({ page }) => {
  await page.goto('/')
  const section = now(page)
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByText('Websites built for pros.')).toBeVisible()
  // About the service, not about particular trades: those are the templates' job.
  // (The picture's labels name the templates; the copy doesn't.)
  for (const text of await section.locator('p, li').filter({ visible: true }).allInnerTexts())
    if (!/template/i.test(text)) expect(text).not.toMatch(/pool|hvac|landscap|roofing/i)
  // No feature list (round 3), and no What's new (it went stale).
  await expect(section.getByRole('list')).toHaveCount(0)
  await expect(section).not.toContainText(/Reminders|next up|A pro site/)
  await expect(section.getByRole('button', { name: /What's new/ })).toHaveCount(0)
  await expect(section.locator('dialog')).toHaveCount(0)
  await expect(section.getByText("Don't see yours? We'll build it.", { exact: true })).toBeVisible()
  // Headed by its icon and address, with no badge.
  const title = section.getByRole('heading', { level: 3, name: 'techforpros.com' })
  await expect(title).toBeVisible()
  await expect(title.locator('xpath=..').locator('img[src*="techforpros"]')).toBeVisible()
  await expect(section).not.toContainText(/launching soon/i)
  // The quote request in place, with no label or note on show (round 3 of 2026-11-08):
  // the field is still named for screen readers.
  await expect(quoteField(page)).toHaveAttribute('type', 'email')
  await expect(quoteButton(page)).toBeVisible()
  await expect(section.getByText('Where should the quote go?')).toHaveClass(/sr-only/)
  await expect(section).not.toContainText("this site doesn't store or share it")
  await expect(section.getByRole('link', { name: /^Get a quote/ })).toHaveCount(0)
  // The site, twice: its name and mark at the top, and "Visit techforpros.com", both in a new
  // tab through the counted short link. No booking page yet.
  for (const link of [section.getByRole('link', { name: /^techforpros\.com/ }), section.getByRole('link', { name: /^Visit techforpros\.com/ })]) {
    await expect(link).toHaveAttribute('href', '/techforpros?from=hero')
    await expect(link).toHaveAttribute('target', '_blank')
  }
  await expect(section.getByRole('link', { name: /Book an intro call/ })).toHaveCount(0)
  // "Don't see yours? We'll build it." is a small ad of its own: it goes to the quote field.
  await expect(section.getByRole('link', { name: "Don't see yours? We'll build it." })).toHaveAttribute('href', '#quote')
  await expect(section.locator('a[href*="techforpros.com"], a[href*="appturnity"], a[href*="github.com"]')).toHaveCount(0)
  await expect(section).not.toContainText(/free website/i)

  // The four templates are all in the page, the first showing and loaded in its frame.
  await expect(carousel(page)).toHaveAttribute('aria-roledescription', 'carousel')
  await expect(carousel(page).locator('[data-slide]')).toHaveCount(4)
  await expect(showing(page)).toHaveAttribute('data-slide', 'Pool')
  const img = showing(page).locator('img')
  await expect(img).toHaveAttribute('width', '1200')
  await expect(img).toHaveAttribute('height', '750')
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
  // The picker: a labelled chip per trade (2026-11-08), under the window.
  const chips = carousel(page).getByRole('button', { name: /^Show the / })
  await expect(chips).toHaveText(TEMPLATES)
  expect((await chips.first().boundingBox())!.y).toBeGreaterThan((await frame(page).boundingBox())!.y + (await frame(page).boundingBox())!.height)
  // A phone in front of the browser window, holding a full-length page.
  const phone = carousel(page).locator('img.now-phone-scroll')
  await expect(phone).toBeVisible()
  const [phoneBox, frameBox] = [(await phone.boundingBox())!, (await frame(page).boundingBox())!]
  expect(phoneBox.x).toBeLessThan(frameBox.x)
  // Under reduced motion there is no timer line.
  await expect(carousel(page).locator('[data-template-timer]')).toHaveCount(0)
})

test('the picker jumps to a template and says which; reduced motion never moves on by itself', async ({ page }) => {
  await page.goto('/')
  await carousel(page).scrollIntoViewIfNeeded()
  await expect(carousel(page)).toHaveAttribute('data-watching', '', { timeout: 20_000 })
  await page.waitForTimeout(5500)
  await expect(showing(page)).toHaveAttribute('data-slide', 'Pool')
  await expect(carousel(page)).not.toHaveAttribute('data-playing', '')
  await carousel(page).getByRole('button', { name: 'Show the Landscaping template' }).click()
  await expect(showing(page)).toHaveAttribute('data-slide', 'Landscaping')
  await expect(carousel(page).getByRole('button', { name: 'Show the Landscaping template' })).toHaveAttribute('aria-current', 'true')
  await expect(carousel(page).locator('[data-template-label]')).toHaveText('Landscaping template')
  await expect(carousel(page).locator('[aria-live="polite"]')).toHaveText('Landscaping template')
})

test.describe('with motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('the templates move on by themselves while on screen, in order and round again, and hold while hovered', { tag: '@cross-browser' }, async ({ page }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')
    await now(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await expect(carousel(page)).toHaveAttribute('data-watching', '', { timeout: 20_000 })
    await page.mouse.move(2, 2)
    await expect(carousel(page)).toHaveAttribute('data-playing', '')
    // The timer line fills along the window's bottom edge.
    const timer = carousel(page).locator('[data-template-timer]')
    // Measured in one go: the card may still be settling from its scroll reveal.
    const { gap, height } = await timer.evaluate((el) => {
      const t = el.getBoundingClientRect()
      const w = el.parentElement!.getBoundingClientRect()
      return { gap: Math.abs(w.bottom - t.bottom), height: t.height }
    })
    expect(gap).toBeLessThanOrEqual(2)
    expect(height).toBeLessThanOrEqual(4)
    await expect(timer.locator('.template-timer')).toHaveCSS('animation-play-state', 'running')
    for (const name of [...TEMPLATES.slice(1), TEMPLATES[0]]) await expect(showing(page)).toHaveAttribute('data-slide', name, { timeout: 8000 })
    // The timer never speaks: only a pick is announced.
    await expect(carousel(page).locator('[aria-live="polite"]')).toHaveText('')
    // Hovered: it holds.
    await carousel(page).hover()
    await expect(carousel(page)).not.toHaveAttribute('data-playing', '')
    await expect(timer.locator('.template-timer')).toHaveCSS('animation-play-state', 'paused')
    const held = await showing(page).getAttribute('data-slide')
    await page.waitForTimeout(5500)
    await expect(showing(page)).toHaveAttribute('data-slide', held!)
    // Scrolled away: it holds too.
    await page.mouse.move(2, 2)
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
    await expect(carousel(page)).not.toHaveAttribute('data-playing', '')
  })
})

test('/#quote lands on the quote field, ready to type', { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
  await page.goto('/#quote')
  await expect(quoteButton(page)).toBeEnabled({ timeout: 20_000 })
  await expect(quoteField(page)).toBeFocused()
  await expect(quoteField(page)).toBeInViewport()
})

test('the quote field sends just the email, tagged as a Tech for Pros quote, and says so', async ({ page }) => {
  await page.goto('/')
  const field = quoteField(page)
  const send = quoteButton(page)
  await field.scrollIntoViewIfNeeded()
  await expect(send).toBeEnabled({ timeout: 20_000 })
  // A bad address stays on the form, said out loud, and nothing is sent.
  let posted: unknown = null
  page.on('request', (r) => {
    if (r.url().endsWith('/api/contact') && r.method() === 'POST') posted = r.postDataJSON()
  })
  await field.fill('not an email')
  await send.click()
  await expect(now(page).getByRole('alert')).toHaveText('Please enter a valid email address.')
  await expect(field).toBeFocused()
  expect(posted).toBeNull()

  await field.fill('owner@pools.example.com')
  await send.click()
  const done = now(page).getByRole('status')
  await expect(done).toContainText('Got it. Your quote is on its way.', { timeout: 15_000 })
  await expect(done).toContainText('owner@pools.example.com')
  expect(posted).toMatchObject({ kind: 'techforpros-quote', email: 'owner@pools.example.com', honeypot: '' })
  expect(Object.keys(posted as object).sort()).toEqual(['email', 'honeypot', 'kind', 'turnstile'])
})

test('a link to the quote preset from elsewhere fills the form on arrival, then tidies the address', async ({ page }) => {
  await page.goto('/?inquiry=techforpros-quote#contact')
  await expect(page.locator('#contact-form input[value="project_opportunity"]')).toBeChecked({ timeout: 20_000 })
  await expect(page.getByRole('textbox', { name: 'Message' })).toHaveValue(/Tech for Pros/)
  await expect(page).toHaveURL(/\/#contact$/)
})

test("a preset never overwrites a message the visitor already wrote", async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#contact-form button[type="submit"]')).toBeEnabled({ timeout: 20_000 })
  await page.getByRole('textbox', { name: 'Message' }).fill('My own words about the job.')
  // As a preset link on the page does (components/ui/ContactPresetLink.tsx).
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('contact:preset', { detail: 'techforpros-quote' })))
  await expect(page.locator('#contact-form input[value="project_opportunity"]')).toBeChecked()
  await expect(page.getByRole('textbox', { name: 'Message' })).toHaveValue('My own words about the job.')
})

test('the section heading stays at the top of #now', async ({ page }) => {
  await page.goto('/')
  const section = now(page)
  const heading = section.getByRole('heading', { level: 2, name: "What I'm working on" })
  const [sectionBox, headingBox] = [await section.boundingBox(), await heading.boundingBox()]
  // Only the section's padding and the "Currently building" eyebrow sit above it.
  expect(headingBox!.y - sectionBox!.y).toBeLessThan(110)
})

for (const width of [1280, 1440]) {
  test(`at ${width}px the ad is two columns and stays short`, { tag: width === 1280 ? '@cross-browser' : [] }, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const section = now(page)
    await section.scrollIntoViewIfNeeded()
    const cta = (await quoteButton(page).boundingBox())!
    const shot = (await frame(page).boundingBox())!
    // The templates sit beside the copy, not under it.
    expect(shot.x).toBeGreaterThan(cta.x + cta.width)
    expect((await section.boundingBox())!.height).toBeLessThan(760)
  })
}

for (const width of [1024, 820, 390, 375, 320]) {
  test(`at ${width}px nothing in the ad overflows, and the picker's chips sit in tidy rows`, { tag: width === 1024 || width === 320 ? '@cross-browser' : [] }, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const section = now(page)
    await section.scrollIntoViewIfNeeded()
    const overflow = await section.evaluate((el) => {
      const right = el.getBoundingClientRect().right
      return [...el.querySelectorAll('a, button, p, li, img')]
        // The templates waiting off stage, clipped by their frame, aren't on screen.
        .filter((n) => !n.closest('[data-slide][aria-hidden="true"]'))
        .filter((n) => n.getBoundingClientRect().right > right + 0.5)
        .map((n) => n.textContent?.trim().slice(0, 40) || n.tagName)
    })
    expect(overflow).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    // One row of chips from 640px; two by two on phones, where one row doesn't fit (2026-11-08).
    const chips = await carousel(page).getByRole('button', { name: /^Show the / }).evaluateAll((b) => b.map((x) => x.getBoundingClientRect().toJSON() as DOMRect))
    expect(new Set(chips.map((c) => Math.round(c.top))).size, 'picker rows').toBe(width < 640 ? 2 : 1)
    if (width < 640) for (const c of chips) expect(Math.abs(c.width - chips[0].width)).toBeLessThan(1)
  })
}

// The caption under the window never runs over the phone.
for (const width of [320, 390, 820, 1440]) {
  test(`at ${width}px the template chips and caption stay clear of the phone`, { tag: width === 320 ? '@cross-browser' : [] }, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const caption = now(page).getByText("Don't see yours? We'll build it.", { exact: true })
    await caption.scrollIntoViewIfNeeded()
    const overlaps = await caption.evaluate((cap) => {
      const phone = cap.closest('[role="group"]')!.querySelector('[class*="rotate-"]')!.getBoundingClientRect()
      const range = document.createRange()
      range.selectNodeContents(cap)
      const hits = (r: DOMRect) => !(r.right <= phone.left || r.left >= phone.right || r.bottom <= phone.top || r.top >= phone.bottom)
      const chips = [...cap.closest('[role="group"]')!.querySelectorAll('button')].map((b) => b.getBoundingClientRect())
      return [...range.getClientRects()].some(hits) || chips.some(hits)
    })
    expect(overlaps).toBe(false)
  })
}
