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
  const cta = (await section.getByRole('link', { name: /Claim your free website/ }).boundingBox())!
  const examples = (await section.getByRole('link', { name: /See example sites/ }).boundingBox())!
  const button = section.getByRole('button', { name: "What's new at Appturnity" })
  const box = (await button.boundingBox())!
  // Same row, same height as the buttons.
  expect(Math.abs(box.y + box.height / 2 - (cta.y + cta.height / 2))).toBeLessThanOrEqual(1)
  expect(Math.abs(box.height - cta.height)).toBeLessThanOrEqual(1)
  expect(box.x).toBeGreaterThan(examples.x + examples.width)
  // At the far right: level with the right edge of the screenshots' column.
  const shot = (await section.locator('img[src*="pool-clearline-template"]').boundingBox())!
  expect(box.x + box.width).toBeGreaterThanOrEqual(shot.x + shot.width - 2)
})

test('on a phone What\'s new is a full-width button under the other two', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const section = now(page)
  await section.scrollIntoViewIfNeeded()
  const examples = (await section.getByRole('link', { name: /See example sites/ }).boundingBox())!
  const box = (await section.getByRole('button', { name: "What's new at Appturnity" }).boundingBox())!
  expect(box.y).toBeGreaterThan(examples.y + examples.height)
  expect(Math.abs(box.width - examples.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.x - examples.x)).toBeLessThanOrEqual(1)
})

/**
 * The phone shows the full-length HVAC page scrolling inside its frame (as on
 * Appturnity's own site), in CSS: it pauses while the card is off screen and
 * holds still under reduced motion. The frame keeps its size meanwhile.
 */
test.describe('the phone mockup', () => {
  const phone = (page: Page) => now(page).locator('img[src*="hvac-template-phone"]')

  test.describe('with motion', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } })

    test('scrolls the page inside the frame while on screen, and pauses off screen', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto('/')
      const img = phone(page)
      // Scrolled past it: paused.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await expect.poll(() => img.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused')
      await now(page).scrollIntoViewIfNeeded()
      await expect.poll(() => img.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('running')
      expect(await img.evaluate((el) => getComputedStyle(el).animationName)).toBe('now-phone-scroll')
      // Scrolled away again: it holds still again.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await expect.poll(() => img.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused')

      // The image is the tall page, clipped by its frame.
      const sizes = await img.evaluate((el) => ({
        frame: el.parentElement!.getBoundingClientRect().height,
        image: el.getBoundingClientRect().height,
        overflow: getComputedStyle(el.parentElement!).overflow,
      }))
      expect(sizes.image).toBeGreaterThan(sizes.frame * 8)
      expect(sizes.overflow).toBe('hidden')
      // At the bottom of its scroll it has gone well down the page, and its
      // end lines up with the frame's (never past it).
      const offset = await img.evaluate((el) => {
        const a = el.getAnimations()[0]
        a.pause()
        a.currentTime = 30_000
        const f = el.parentElement!.getBoundingClientRect()
        const i = el.getBoundingClientRect()
        return { top: f.top - i.top, bottomGap: i.bottom - f.bottom }
      })
      expect(offset.top).toBeGreaterThan(500)
      expect(Math.abs(offset.bottomGap)).toBeLessThanOrEqual(1.5)
    })
  })

  test.describe('with reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } })

    test('shows the top of the page, still', async ({ page }) => {
      await page.goto('/')
      await now(page).scrollIntoViewIfNeeded()
      const img = phone(page)
      expect(await img.evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
      expect(await img.evaluate((el) => el.getBoundingClientRect().top - el.parentElement!.getBoundingClientRect().top)).toBe(0)
    })
  })
})
