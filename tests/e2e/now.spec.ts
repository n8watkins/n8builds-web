import { test, expect, type Page } from '@playwright/test'
import { APP_JS } from './app-js'

/**
 * "What I'm working on" (#now): an ad for Tech for Pros, headed by its icon
 * and techforpros.com. Since 2026-11-02: "Websites built for pros", copy about
 * the service (never a list of trades), its features as a compact set, its
 * templates one after another in a browser frame with a picker, and "Request
 * a quote" into the contact form (the booking page and the site get buttons
 * once they exist). The build detail sits behind a What's new dialog.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const now = (page: Page) => page.locator('#now')
/** The ad's main button: a quote, through the contact form. */
const quote = (page: Page) => now(page).getByRole('link', { name: /^Request a quote/ })
const carousel = (page: Page) => now(page).getByRole('group', { name: 'Tech for Pros templates' })
const frame = (page: Page) => carousel(page).locator('[data-slide]').first().locator('xpath=..')
const showing = (page: Page) => carousel(page).locator('[data-slide][aria-hidden="false"]')
const TEMPLATES = ['Pool', 'HVAC', 'Landscaping', 'Roofing']

test('the card reads like an ad: headline, the service, its features, a quote button and the templates', async ({ page }) => {
  await page.goto('/')
  const section = now(page)
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByText('Websites built for pros.')).toBeVisible()
  // About the service, not about particular trades: those are the templates' job.
  // (The closed What's new dialog's text isn't visible, so it isn't read here.)
  for (const text of await section.locator('p, li').filter({ visible: true }).allInnerTexts()) expect(text).not.toMatch(/pool|hvac|landscap|roofing/i)
  const features = section.getByRole('list', { name: 'What Tech for Pros does' }).getByRole('listitem')
  await expect(features).toHaveText(['A pro site, fast', 'Every lead captured', 'Review requests', 'Reminders, next up'])
  // Headed by its icon and address, with no badge.
  const title = section.getByRole('heading', { level: 3, name: 'techforpros.com' })
  await expect(title).toBeVisible()
  await expect(title.locator('xpath=..').locator('img[src*="techforpros"]')).toBeVisible()
  await expect(section).not.toContainText(/launching soon|coming soon/i)
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
    for (const name of [...TEMPLATES.slice(1), TEMPLATES[0]]) await expect(showing(page)).toHaveAttribute('data-slide', name, { timeout: 8000 })
    // The timer never speaks: only a pick is announced.
    await expect(carousel(page).locator('[aria-live="polite"]')).toHaveText('')
    // Hovered: it holds.
    await carousel(page).hover()
    await expect(carousel(page)).not.toHaveAttribute('data-playing', '')
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
  await expect(page.getByRole('textbox', { name: 'Message' })).toBeInViewport()
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

test('recent activity is not on the card face; What\'s new opens it in a labelled dialog that Escape closes', async ({ page }) => {
  await page.goto('/')
  const section = now(page)
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByText(/Automated follow-up for leads/)).toBeHidden()

  const button = section.getByRole('button', { name: "What's new at Tech for Pros" })
  await expect(button).toBeEnabled()
  await button.click()
  const dialog = page.getByRole('dialog', { name: "What's new at Tech for Pros" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/Automated follow-up for leads/)).toBeVisible()
  await expect(dialog).toContainText('Right now')
  await expect(dialog).toContainText('The goal')
  await expect(dialog.getByRole('listitem').filter({ hasText: 'Cloudflare' })).toBeVisible()
  // Focus moved into the modal.
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(button).toBeFocused()

  // The close button works too.
  await button.click()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()
})

test('What\'s new waits for hydration instead of swallowing an early click', async ({ page }) => {
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route(APP_JS, async (route) => {
    await held
    await route.continue()
  })
  await page.goto('/', { waitUntil: 'commit' })
  const button = now(page).getByRole('button', { name: "What's new at Tech for Pros" })
  await expect(button).toBeDisabled()
  // The dialog's content is in the server HTML, even before it opens.
  await expect(page.locator('#now dialog')).toContainText('missed-call text-back')
  release()
  await expect(button).toBeEnabled()
  await button.click()
  await expect(page.getByRole('dialog', { name: "What's new at Tech for Pros" })).toBeVisible()
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
  test(`at ${width}px nothing in the ad overflows, and each feature and the picker keep to one line`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const section = now(page)
    await section.scrollIntoViewIfNeeded()
    const overflow = await section.evaluate((el) => {
      const right = el.getBoundingClientRect().right
      return [...el.querySelectorAll('a, button, p, li, img')]
        .filter((n) => !n.closest('dialog'))
        .filter((n) => n.getBoundingClientRect().right > right + 0.5)
        .map((n) => n.textContent?.trim().slice(0, 40) || n.tagName)
    })
    expect(overflow).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    for (const li of await section.getByRole('list', { name: 'What Tech for Pros does' }).getByRole('listitem').all()) {
      const h = (await li.boundingBox())!.height
      expect(h, (await li.textContent()) ?? '').toBeLessThan(30)
    }
    const tops = await carousel(page).getByRole('button', { name: /^Show the / }).evaluateAll((b) => b.map((x) => Math.round(x.getBoundingClientRect().top)))
    expect(new Set(tops).size, 'picker rows').toBe(1)
  })
}

/**
 * Round 3 (2026-10-26): no "Building now" line, and What's new sits on the
 * buttons' row, at its far right (full width under the buttons on phones).
 */
test('What\'s new is on the buttons\' row, at its far right, and there is no "Building now" line', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  const section = now(page)
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByText(/Building now/)).toHaveCount(0)
  const cta = (await quote(page).boundingBox())!
  const button = section.getByRole('button', { name: "What's new at Tech for Pros" })
  const box = (await button.boundingBox())!
  // Same row, same height as the buttons.
  expect(Math.abs(box.y + box.height / 2 - (cta.y + cta.height / 2))).toBeLessThanOrEqual(1)
  expect(Math.abs(box.height - cta.height)).toBeLessThanOrEqual(1)
  expect(box.x).toBeGreaterThan(cta.x + cta.width)
  // At the far right: level with the right edge of the templates' frame.
  const shot = (await frame(page).boundingBox())!
  expect(box.x + box.width).toBeGreaterThanOrEqual(shot.x + shot.width - 2)
})

test('on a phone What\'s new is a full-width button under Request a quote', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const section = now(page)
  await section.scrollIntoViewIfNeeded()
  const cta = (await quote(page).boundingBox())!
  const box = (await section.getByRole('button', { name: "What's new at Tech for Pros" }).boundingBox())!
  expect(box.y).toBeGreaterThan(cta.y + cta.height)
  expect(Math.abs(box.width - cta.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.x - cta.x)).toBeLessThanOrEqual(1)
})
