import { test, expect, type Locator } from '@playwright/test'
import { ALL_SOCIALS, SOCIALS } from '../../data/socials'

/**
 * The social links (data/socials.ts) in the homepage contact card and the
 * site footer: the owner's order, and only the enabled ones.
 */

const contactSocials = (page: import('@playwright/test').Page) =>
  page.locator('#contact').getByRole('navigation', { name: 'Contact social media links' })
const footerSocials = (page: import('@playwright/test').Page) =>
  page.locator('footer').last().getByRole('navigation', { name: 'Footer social media links' })

const labels = (nav: Locator) => nav.getByRole('link').evaluateAll((as) => as.map((a) => a.getAttribute('aria-label')))

test('the contact card and the footer list the enabled socials in order', async ({ page }) => {
  await page.goto('/')
  const expected = SOCIALS.map((s) => s.label)
  for (const nav of [contactSocials(page), footerSocials(page)]) {
    await nav.scrollIntoViewIfNeeded()
    expect(await labels(nav)).toEqual(expected)
    for (const s of SOCIALS) {
      await expect(nav.getByRole('link', { name: s.label, exact: true })).toHaveAttribute('href', s.href)
    }
    // Hidden links (enabled: false) are nowhere in the row.
    for (const s of ALL_SOCIALS.filter((x) => !x.enabled)) {
      await expect(nav.getByRole('link', { name: s.label, exact: true })).toHaveCount(0)
    }
  }
})

test('the footer socials are on every page', async ({ page }) => {
  await page.goto('/privacy')
  expect(await labels(footerSocials(page))).toEqual(SOCIALS.map((s) => s.label))
})

test('Follow the build links the build log and notions, and only enabled socials', async ({ page }) => {
  await page.goto('/')
  const follow = page.locator('#contact p', { hasText: 'Everything I ship lands in the' })
  await follow.scrollIntoViewIfNeeded()
  await expect(follow.getByRole('link', { name: 'build log' })).toHaveAttribute('href', '/builds')
  await expect(follow.getByRole('link', { name: "N8's Notions" })).toHaveAttribute('href', '/blog')
  for (const s of ALL_SOCIALS.filter((x) => ['GitHub', 'X (Twitter)', 'Twitch', 'YouTube'].includes(x.label))) {
    const name = s.label === 'X (Twitter)' ? 'X' : s.label
    // Named "GitHub (opens in a new tab)" and so on.
    await expect(follow.getByRole('link', { name: new RegExp(`^${name} \\(opens`) })).toHaveCount(s.enabled ? 1 : 0)
  }
  if (!ALL_SOCIALS.some((s) => ['Twitch', 'YouTube'].includes(s.label) && s.enabled)) {
    await expect(follow).not.toContainText('watch me build live')
  }

  const work = page.locator('#contact p', { hasText: 'I usually reply within a day' })
  await expect(work.getByRole('link', { name: 'the form' })).toHaveAttribute('href', '#contact-form')
  await expect(work.getByRole('link', { name: 'contact@n8builds.dev' })).toHaveAttribute('href', 'mailto:contact@n8builds.dev')
})

test('the footer carries the contact address and the copyright', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('footer').last()
  const sitemap = footer.getByRole('navigation', { name: 'Sitemap' })
  await expect(sitemap.getByRole('link', { name: 'contact@n8builds.dev' })).toHaveAttribute('href', 'mailto:contact@n8builds.dev')
  await expect(sitemap.getByRole('link', { name: 'Contact form' })).toHaveAttribute('href', '/#contact')
  await expect(footer).toContainText('© 2026 n8builds.dev. All rights reserved.')
})

for (const width of [375, 320]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } })

    test('the contact card socials fit on one row', async ({ page }) => {
      await page.goto('/')
      const nav = contactSocials(page)
      await nav.scrollIntoViewIfNeeded()
      const tops = await nav.getByRole('link').evaluateAll((as) => as.map((a) => Math.round(a.getBoundingClientRect().top)))
      expect(new Set(tops).size, 'one row').toBe(1)
      const navBox = (await nav.boundingBox())!
      const last = (await nav.getByRole('link').last().boundingBox())!
      expect(last.x + last.width).toBeLessThanOrEqual(navBox.x + navBox.width + 0.5)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    })

    test('nothing in the contact card is cut off at the right edge', async ({ page }) => {
      await page.goto('/')
      const form = page.locator('#contact form')
      await form.scrollIntoViewIfNeeded()
      // The card clips its overflow, so a too-wide child would be hidden, not scrolled.
      const overflow = await page.locator('#contact .rounded-3xl').first().evaluate((cardEl) => {
        const right = cardEl.getBoundingClientRect().right
        return [...cardEl.querySelectorAll('p, h2, h3, a, input, select, textarea, button')]
          .filter((el) => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().right > right + 0.5)
          .map((el) => el.textContent?.trim().slice(0, 40) || el.tagName)
      })
      expect(overflow).toEqual([])
    })
  })
}
