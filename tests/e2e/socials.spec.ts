import { test, expect, type Locator } from '@playwright/test'
import { ALL_SOCIALS, SOCIALS, isExternal } from '../../data/socials'

/** A social's accessible name: an outside one also says it opens a new tab (round 7, 2026-11-09). */
const named = (s: { label: string; href: string }) => (isExternal(s.href) ? `${s.label} (opens in a new tab)` : s.label)

/**
 * The social links (data/socials.ts) in the homepage contact card and the
 * site footer: the owner's order, and only the enabled ones.
 */

const contactSocials = (page: import('@playwright/test').Page) =>
  page.locator('#contact').getByRole('navigation', { name: 'Contact social media links' })
const footerSocials = (page: import('@playwright/test').Page) =>
  page.locator('footer').last().getByRole('navigation', { name: 'Footer social media links' })

const labels = (nav: Locator) => nav.getByRole('link').evaluateAll((as) => as.map((a) => a.getAttribute('aria-label')))

test('the contact card and the footer list the enabled socials in order', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/')
  const expected = SOCIALS.map(named)
  for (const nav of [contactSocials(page), footerSocials(page)]) {
    await nav.scrollIntoViewIfNeeded()
    expect(await labels(nav)).toEqual(expected)
    for (const s of SOCIALS) {
      await expect(nav.getByRole('link', { name: named(s), exact: true })).toHaveAttribute('href', s.href)
    }
    // Hidden links (enabled: false) are nowhere in the row.
    for (const s of ALL_SOCIALS.filter((x) => !x.enabled)) {
      await expect(nav.getByRole('link', { name: named(s), exact: true })).toHaveCount(0)
    }
  }
})

test('the footer socials are on every page', async ({ page }) => {
  await page.goto('/privacy')
  expect(await labels(footerSocials(page))).toEqual(SOCIALS.map(named))
})

test('the contact card says it briefly: a message, Tech for Pros, and only the enabled streaming links', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('#contact')
  await card.scrollIntoViewIfNeeded()
  // Short since 2026-11-08: no "Hiring, have a project..." and no build log line.
  await expect(card.getByText('Shoot me a message.', { exact: true })).toBeVisible()
  await expect(card).not.toContainText('Hiring, have a project')
  await expect(card).not.toContainText('Everything I ship lands in the')
  // The address stays in view, at the form's foot.
  await expect(card.getByRole('link', { name: 'contact@n8builds.dev' }).first()).toHaveAttribute('href', 'mailto:contact@n8builds.dev')
  // A streaming link only once streaming starts.
  for (const s of ALL_SOCIALS.filter((x) => ['Twitch', 'YouTube'].includes(x.label))) {
    await expect(card.locator('p').getByRole('link', { name: new RegExp(`^${s.label} \\(opens`) })).toHaveCount(s.enabled ? 1 : 0)
  }
  if (!ALL_SOCIALS.some((s) => ['Twitch', 'YouTube'].includes(s.label) && s.enabled)) {
    await expect(card).not.toContainText('Watch me build live')
  }
})

/**
 * The contact card clips with overflow: clip (2026-11-08): with overflow: hidden it
 * was a scroll container, and a jump to the form inside it scrolled the card by
 * 53px, cutting off the avatar and name.
 */
test('nothing inside the contact card can scroll it', { tag: '@cross-browser' }, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 724 })
  await page.goto('/')
  const card = page.locator('#contact .rounded-3xl').first()
  await card.scrollIntoViewIfNeeded()
  await page.evaluate(() => {
    window.location.hash = 'contact-form'
  })
  await page.getByRole('textbox', { name: 'Name' }).focus()
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab')
  expect(await card.evaluate((el) => el.scrollTop)).toBe(0)
  // The avatar and name sit inside the card's top, not scrolled up out of it.
  const [box, name] = [(await card.boundingBox())!, (await card.getByText('Nathan "n8" Watkins').boundingBox())!]
  expect(name.y).toBeGreaterThan(box.y)
})

for (const width of [375, 320]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } })

    test('the contact card socials fit on one row', { tag: width === 320 ? '@cross-browser' : [] }, async ({ page }) => {
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

    test('nothing in the contact card is cut off at the right edge', { tag: width === 320 ? '@cross-browser' : [] }, async ({ page }) => {
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
