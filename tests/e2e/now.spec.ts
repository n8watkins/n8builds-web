import { test, expect, type Page } from '@playwright/test'

/**
 * "What I'm working on" (#now): an ad for Tech for Pros, headed by its icon
 * and techforpros.com. Since round 3 of 2026-11-02: "Websites built for pros",
 * copy about the service (never a list of trades) and no feature list; its
 * templates slide side to side in a browser window, with a timer line along
 * its bottom, a picker in its title bar, a phone in front and "More templates
 * coming soon" under it; "Request a quote" goes into the contact form (the
 * booking page and the site get buttons once they exist). No What's new.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const now = (page: Page) => page.locator('#now')
/** The ad's main button: a quote, through the contact form. */
const quote = (page: Page) => now(page).getByRole('link', { name: /^Request a quote/ })
const carousel = (page: Page) => now(page).getByRole('group', { name: 'Tech for Pros templates' })
const frame = (page: Page) => carousel(page).locator('[data-slide]').first().locator('xpath=..')
const showing = (page: Page) => carousel(page).locator('[data-slide][aria-hidden="false"]')
const TEMPLATES = ['Pool', 'HVAC', 'Landscaping', 'Roofing']

test('the card reads like an ad: headline, the service, a quote button and the templates', async ({ page }) => {
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
  await expect(section.getByText('More templates coming soon', { exact: true })).toBeVisible()
  // Headed by its icon and address, with no badge.
  const title = section.getByRole('heading', { level: 3, name: 'techforpros.com' })
  await expect(title).toBeVisible()
  await expect(title.locator('xpath=..').locator('img[src*="techforpros"]')).toBeVisible()
  await expect(section).not.toContainText(/launching soon/i)
  // A quote through the contact form; no booking page or site yet, so no buttons for them.
  await expect(quote(page)).toHaveAttribute('href', '/?inquiry=techforpros-quote#contact')
  await expect(section.getByRole('link', { name: /Book an intro call|Visit techforpros\.com/ })).toHaveCount(0)
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
  await expect(carousel(page).getByRole('button', { name: /^Show the / })).toHaveCount(4)
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

  test('the templates move on by themselves while on screen, in order and round again, and hold while hovered', async ({ page }) => {
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

test('Request a quote fills the contact form in place: the New project topic and a started message', async ({ page }) => {
  await page.goto('/')
  await quote(page).scrollIntoViewIfNeeded()
  await expect(page.locator('#contact-form button[type="submit"]')).toBeEnabled({ timeout: 20_000 })
  await quote(page).click()
  await expect(page).toHaveURL(/\/#contact$/)
  await expect(page.locator('#contact-form input[value="project_opportunity"]')).toBeChecked()
  await expect(page.getByRole('textbox', { name: 'Message' })).toHaveValue(/^I'd like a quote from Tech for Pros\./)
  // Scrolled to the contact part (on a phone the message box is further down it).
  await expect(page.locator('#contact')).toBeInViewport()
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
  await quote(page).click()
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
  test(`at ${width}px the ad is two columns and stays short`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const section = now(page)
    await section.scrollIntoViewIfNeeded()
    const cta = (await quote(page).boundingBox())!
    const shot = (await frame(page).boundingBox())!
    // The templates sit beside the copy, not under it.
    expect(shot.x).toBeGreaterThan(cta.x + cta.width)
    expect((await section.boundingBox())!.height).toBeLessThan(760)
  })
}

for (const width of [1024, 820, 390, 375, 320]) {
  test(`at ${width}px nothing in the ad overflows, and and the picker keeps to one line`, async ({ page }) => {
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
    const tops = await carousel(page).getByRole('button', { name: /^Show the / }).evaluateAll((b) => b.map((x) => Math.round(x.getBoundingClientRect().top)))
    expect(new Set(tops).size, 'picker rows').toBe(1)
  })
}
