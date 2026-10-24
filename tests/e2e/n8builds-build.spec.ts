import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { getBuild } from '../../data/builds'

/**
 * The build page for this site itself (/builds/n8builds), and the featured row
 * on the homepage that links to it.
 */

const PATH = '/builds/n8builds'
const build = getBuild('n8builds')!

test.use({ contextOptions: { reducedMotion: 'reduce' } })

/** Wait until an image has actually decoded (not just been requested). */
async function expectImagesLoaded(page: Page, selector: string) {
  const images = page.locator(selector)
  const count = await images.count()
  expect(count, `${selector} images`).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    const image = images.nth(i)
    await image.scrollIntoViewIfNeeded()
    await expect
      .poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth), {
        message: `${await image.getAttribute('alt')} loads`,
      })
      .toBeGreaterThan(0)
  }
  return count
}

test('the n8builds build page renders its case study and every screenshot', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  const response = await page.goto(PATH)
  expect(response?.status()).toBe(200)
  await expect(page.locator('h1')).toHaveText('n8builds.dev')
  await expect(page.getByRole('link', { name: 'View source' })).toHaveAttribute('href', 'https://github.com/n8watkins/n8builds-web')

  const shown = await expectImagesLoaded(page, 'section[aria-label="Screenshots"] img')
  expect(shown).toBe(build.images.length)
  for (const image of build.images) {
    await expect(page.getByRole('img', { name: image.alt })).toBeAttached()
  }

  await expect(page.getByRole('region', { name: 'Process notes' }).locator('li')).toHaveCount(build.process.length)
  expect(errors).toEqual([])
})

test('the n8builds build page has no serious accessibility violations', async ({ page }) => {
  await page.goto(PATH)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
})

test('the homepage features n8builds with its gallery and a link to the build page', async ({ page }) => {
  await page.goto('/')
  const featured = page.locator('#featured')
  const link = featured.locator(`a[href="${PATH}"]`)
  await link.scrollIntoViewIfNeeded()
  await expect(link).toBeVisible()

  // The row's gallery switches the main image to the Lighthouse report.
  const row = featured.locator('div.items-center', { has: page.locator('h3', { hasText: 'n8builds.dev' }) })
  const main = row.getByRole('img', { name: /n8builds\.dev: the homepage/ })
  await expect(main).toHaveAttribute('src', /home-hero/)
  await row.getByRole('button', { name: 'n8builds.dev image 2' }).click()
  await expect(main).toHaveAttribute('src', /lighthouse/)
  await expectImagesLoaded(page, '#featured img[src*="n8builds"]')
})
