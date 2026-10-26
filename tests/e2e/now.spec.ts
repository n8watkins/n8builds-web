import { test, expect, type Page } from '@playwright/test'

/**
 * "What I'm working on" (#now): an ad for Appturnity with real template
 * screenshots, its two buttons, and the build detail (recent activity) behind
 * a What's new dialog instead of on the card face.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const now = (page: Page) => page.locator('#now')

test('the card reads like an ad: headline, selling points, both buttons and real template screenshots', async ({ page }) => {
  await page.goto('/')
  const section = now(page)
  await section.scrollIntoViewIfNeeded()
  await expect(section).toContainText('Your free website, built for your trade.')
  for (const perk of ['Built and launched for free', 'Templates for your trade', 'Review requests add-on']) {
    await expect(section.getByRole('listitem').filter({ hasText: perk })).toBeVisible()
  }
  await expect(section.getByRole('link', { name: /Claim your free website/ })).toHaveAttribute('href', 'https://appturnity.com/#free-website')
  await expect(section.getByRole('link', { name: /See example sites/ })).toHaveAttribute('href', 'https://appturnity.com/examples')

  // Appturnity's own template previews, loaded and laid out in their frames.
  for (const name of ['pool-clearline-template', 'hvac-template-phone']) {
    const img = section.locator(`img[src*="${name}"]`)
    await expect(img, name).toBeVisible()
    await expect(img, name).toHaveAttribute('width')
    await expect(img, name).toHaveAttribute('height')
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { message: name }).toBe(true)
  }

  // Appturnity's repo is never linked.
  await expect(section.locator('a[href*="github.com"]')).toHaveCount(0)
})

test('recent activity is not on the card face; What\'s new opens it in a labelled dialog that Escape closes', async ({ page }) => {
  await page.goto('/')
  const section = now(page)
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByText('Recent activity', { exact: true })).toBeHidden()
  await expect(section.getByText(/Booking data layer landed/)).toBeHidden()

  const button = section.getByRole('button', { name: "What's new at Appturnity" })
  await expect(button).toBeEnabled()
  await button.click()
  const dialog = page.getByRole('dialog', { name: "What's new at Appturnity" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Recent activity', { exact: true })).toBeVisible()
  await expect(dialog.getByText(/Booking data layer landed/)).toBeVisible()
  await expect(dialog).toContainText('Right now')
  await expect(dialog).toContainText('The goal')
  await expect(dialog.getByRole('listitem').filter({ hasText: 'Cloudflare Workers' })).toBeVisible()
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
  await page.route('**/_next/static/chunks/**', async (route) => {
    await held
    await route.continue()
  })
  await page.goto('/', { waitUntil: 'commit' })
  const button = now(page).getByRole('button', { name: "What's new at Appturnity" })
  await expect(button).toBeDisabled()
  // The dialog's content is in the server HTML, even before it opens.
  await expect(page.locator('#now dialog')).toContainText('Booking data layer landed')
  release()
  await expect(button).toBeEnabled()
  await button.click()
  await expect(page.getByRole('dialog', { name: "What's new at Appturnity" })).toBeVisible()
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
    const cta = await section.getByRole('link', { name: /Claim your free website/ }).boundingBox()
    const shot = await section.locator('img[src*="pool-clearline-template"]').boundingBox()
    // The screenshots sit beside the copy, not under it.
    expect(shot!.x).toBeGreaterThan(cta!.x + cta!.width)
    expect((await section.boundingBox())!.height).toBeLessThan(860)
  })
}

for (const width of [375, 320]) {
  test(`at ${width}px nothing in the ad overflows`, async ({ page }) => {
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
    // Each selling point fits on one line.
    for (const li of await section.locator('ul:not(dialog ul) > li').all()) {
      const h = (await li.boundingBox())!.height
      expect(h, (await li.textContent()) ?? '').toBeLessThan(30)
    }
  })
}
