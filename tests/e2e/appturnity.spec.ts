import { test, expect } from '@playwright/test'

/**
 * Appturnity on the homepage: "What I'm working on" is its ad, the work-with-me
 * card carries its brand, and the footer uses its real mark (no invented logo).
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

test('"What I\'m working on" advertises Appturnity, with its mark and the free-website offer', async ({ page }) => {
  await page.goto('/')
  const now = page.locator('#now')
  await expect(now.getByRole('heading', { level: 3, name: 'Appturnity' })).toBeVisible()
  await expect(now.locator('img[src*="appturnity.png"]').first()).toBeVisible()
  await expect(now).toContainText('local service businesses')
  await expect(now.getByRole('link', { name: /Claim your free website/ }).first()).toHaveAttribute('href', 'https://appturnity.com/#free-website')
  await expect(now.getByRole('link', { name: /See example sites/ }).first()).toHaveAttribute('href', 'https://appturnity.com/examples')
  await expect(page.getByRole('link', { name: 'Check out the lab' })).toHaveCount(0)
})

test('the project-work card is Appturnity, by name and mark', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('#work-with-me').getByRole('article', { name: /Run a local service business/ })
  await card.scrollIntoViewIfNeeded()
  await expect(card.getByRole('link', { name: /Claim your free website/ })).toHaveAttribute('href', 'https://appturnity.com/#free-website')
  await expect(card).toContainText('Appturnity is my company')
  await expect(card.locator('img[src*="appturnity.png"]')).toHaveCount(1)
})

test('the contact card offers local service businesses a free Appturnity website, not consulting', async ({ page }) => {
  await page.goto('/')
  // The card's intro, next to the contact form (whose Topic menu is separate).
  const intro = page.locator('#contact p', { hasText: 'I usually reply within a day' })
  await intro.scrollIntoViewIfNeeded()
  await expect(intro).not.toContainText(/consulting/i)
  await expect(intro).toContainText('Run a local service business?')
  await expect(intro.getByRole('link', { name: /free website/ })).toHaveAttribute('href', 'https://appturnity.com/#free-website')
})

test('the footer has a sitemap, the public contact address, and no invented Appturnity logo', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('footer').last()
  await footer.scrollIntoViewIfNeeded()
  await expect(footer).not.toContainText('The Consulting Studio')
  await expect(footer.locator('#apt-grad')).toHaveCount(0)
  const sitemap = footer.getByRole('navigation', { name: 'Sitemap' })
  for (const name of ['Featured builds', 'Build log', 'Notions', 'Developer portfolio', 'Appturnity', 'Privacy']) {
    await expect(sitemap.getByRole('link', { name: new RegExp(name) }), name).toBeAttached()
  }
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
