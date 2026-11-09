import { test, expect } from '@playwright/test'

/**
 * Tech for Pros (the owner's SaaS for service businesses) took over from
 * Appturnity on 2026-11-01: "What I'm working on" is its ad (with the quote
 * request since 2026-11-08) and the contact card names it. The site links to it everywhere
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
  // The navbar, the ad (its heading and "Don't see yours?", to its templates), the contact card and the footer.
  expect(await page.locator('a[href^="/techforpros"]').count()).toBeGreaterThanOrEqual(5)
  await expect(page.locator('a[href*="appturnity"]')).toHaveCount(0)
  // Live: nothing says it is on its way (only more templates are, round 3 of 2026-11-02).
  for (const part of ['#now', '#contact'])
    await expect(page.locator(part), part).not.toContainText(/(?<!templates )coming soon|launching soon|will soon/i)
})

test('"What I\'m working on" advertises Tech for Pros for service businesses', async ({ page }) => {
  await page.goto('/')
  const now = page.locator('#now')
  await expect(now.getByRole('heading', { level: 3, name: 'techforpros.com' })).toBeVisible()
  // About the service for a business (its tagline left with the What's new dialog, 2026-11-02).
  await expect(now).toContainText('your business')
  await expect(now).not.toContainText('local service')
  await expect(page.getByRole('link', { name: 'Check out the lab' })).toHaveCount(0)
})

test('the Work with me section is gone, and the contact card offers Tech for Pros to any business', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#work-with-me')).toHaveCount(0)
  await expect(page.getByText('Two ways to put me to work')).toHaveCount(0)
  // The card's intro, next to the contact form (whose Topic menu is separate).
  const intro = page.locator('#contact p', { hasText: 'Need technical help with your business?' })
  await intro.scrollIntoViewIfNeeded()
  await expect(intro).not.toContainText(/consulting|service business/i)
  await expect(intro).toContainText(/Tech for Pros( \(opens in a new tab\))? can help\./)
  await expect(intro.getByRole('link', { name: /Tech for Pros/ })).toHaveAttribute('href', '/techforpros?from=footer')
})

test('the footer has a sitemap and the public contact address', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('footer').last()
  await footer.scrollIntoViewIfNeeded()
  await expect(footer).not.toContainText('The Consulting Studio')
  await expect(footer.locator('#apt-grad')).toHaveCount(0)
  const sitemap = footer.getByRole('navigation', { name: 'Sitemap' })
  for (const name of ['Featured builds', 'Full build log', 'Notions', 'Developer portfolio', 'Privacy']) {
    await expect(sitemap.getByRole('link', { name: new RegExp(name) }), name).toBeAttached()
  }
  await expect(sitemap.getByRole('link', { name: /Appturnity/ })).toHaveCount(0)
  // Tech for Pros, with its icon, under Work with me (2026-11-01).
  const tfp = sitemap.getByRole('link', { name: /^techforpros\.com/ })
  await expect(tfp).toHaveAttribute('href', '/techforpros?from=footer')
  await expect(tfp.locator('img[src*="techforpros"]')).toBeAttached()
  await expect(footer.locator('a[href^="mailto:"]').first()).toHaveAttribute('href', 'mailto:contact@n8builds.dev')
  await expect(sitemap.getByRole('link', { name: 'contact@n8builds.dev' })).toHaveAttribute('href', 'mailto:contact@n8builds.dev')
  await expect(sitemap.getByRole('link', { name: 'Contact form' })).toHaveAttribute('href', '/#contact')
  await expect(footer.locator('a[href*="gmail"]')).toHaveCount(0)
  await expect(footer).toContainText('© 2026 n8builds.dev. All rights reserved.')
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
