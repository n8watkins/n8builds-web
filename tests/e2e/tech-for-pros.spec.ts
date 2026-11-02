import { test, expect } from '@playwright/test'

/**
 * Tech for Pros (the owner's SaaS for service businesses) took over from
 * Appturnity on 2026-11-01: "What I'm working on" is its ad, the work-with-me
 * card and the contact card name it. The site links to it everywhere
 * (2026-11-01): the navbar, the cards, the contact card and the footer, each
 * through the counted n8builds.dev/techforpros short link, and nothing links
 * to Appturnity any more (n8builds.dev/appturnity still redirects).
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

test("Tech for Pros' buttons take Appturnity's place, and nothing links to Appturnity", async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('nav[aria-label="Primary"]').getByRole('link', { name: /^techforpros\.com/ })).toHaveAttribute(
    'href',
    '/techforpros?from=navbar'
  )
  // Every link to it is counted: none goes straight to techforpros.com.
  await expect(page.locator('a[href*="techforpros.com"]')).toHaveCount(0)
  expect(await page.locator('a[href^="/techforpros"]').count()).toBeGreaterThanOrEqual(5)
  await expect(page.locator('a[href*="appturnity"]')).toHaveCount(0)
  // Live: nothing says it is on its way.
  for (const part of ['#now', '#work-with-me', '#contact'])
    await expect(page.locator(part), part).not.toContainText(/coming soon|launching soon|will soon/i)
})

test('"What I\'m working on" advertises Tech for Pros for service businesses', async ({ page }) => {
  await page.goto('/')
  const now = page.locator('#now')
  await expect(now.getByRole('heading', { level: 3, name: 'techforpros.com' })).toBeVisible()
  await expect(now).toContainText('service businesses')
  await expect(now).not.toContainText('local service')
  await expect(page.getByRole('link', { name: 'Check out the lab' })).toHaveCount(0)
})

test('the project-work card is Tech for Pros, with its button', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('#work-with-me').getByRole('article', { name: /Run a service business\? I built this for you/ })
  await card.scrollIntoViewIfNeeded()
  await expect(card).toContainText('Tech for Pros is my company')
  await expect(card.getByRole('link', { name: /Visit Tech for Pros/ })).toHaveAttribute('href', '/techforpros?from=card')
  await expect(card).not.toContainText(/free website/i)
})

test('the contact card names Tech for Pros for service businesses, not consulting', async ({ page }) => {
  await page.goto('/')
  // The card's intro, next to the contact form (whose Topic menu is separate).
  const intro = page.locator('#contact p', { hasText: 'Run a service business?' })
  await intro.scrollIntoViewIfNeeded()
  await expect(intro).not.toContainText(/consulting/i)
  await expect(intro).toContainText(/Tech for Pros( \(opens in a new tab\))? puts your business online/)
  await expect(intro.getByRole('link', { name: /Tech for Pros/ })).toHaveAttribute('href', '/techforpros?from=footer')
})

test('the footer has a sitemap and the public contact address', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('footer').last()
  await footer.scrollIntoViewIfNeeded()
  await expect(footer).not.toContainText('The Consulting Studio')
  await expect(footer.locator('#apt-grad')).toHaveCount(0)
  const sitemap = footer.getByRole('navigation', { name: 'Sitemap' })
  for (const name of ['Featured builds', 'Build log', 'Notions', 'Developer portfolio', 'Privacy']) {
    await expect(sitemap.getByRole('link', { name: new RegExp(name) }), name).toBeAttached()
  }
  await expect(sitemap.getByRole('link', { name: /Appturnity/ })).toHaveCount(0)
  // Tech for Pros, with its icon, under Work with me (2026-11-01).
  const tfp = sitemap.getByRole('link', { name: /^techforpros\.com/ })
  await expect(tfp).toHaveAttribute('href', '/techforpros?from=footer')
  await expect(tfp.locator('img[src*="techforpros"]')).toBeAttached()
  await expect(footer.locator('a[href^="mailto:"]').first()).toHaveAttribute('href', 'mailto:contact@n8builds.dev')
  await expect(footer.locator('a[href*="gmail"]')).toHaveCount(0)
})

test('the contact form labels and placeholders do not repeat each other', async ({ page }) => {
  await page.goto('/')
  const form = page.locator('#contact form')
  await form.scrollIntoViewIfNeeded()
  for (const [label, placeholder] of [
    ['Name', 'Jane Smith'],
    ['Email', 'jane@company.com'],
    ['Message', 'What are you building, and where can I help?'],
  ]) {
    await expect(form.getByLabel(label)).toHaveAttribute('placeholder', placeholder)
  }
})
