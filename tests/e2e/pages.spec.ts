import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Every page renders without errors and has no serious accessibility issues.
 */

const STATIC_PAGES = ['/', '/blog', '/loadout', '/privacy', '/builds/asset-arsenal']

/**
 * How long to keep watching for errors after the load event. The homepage never
 * goes network-idle (icon carousels fetch images on a timer), so we observe a
 * fixed window instead of waiting for 'networkidle'.
 */
const SETTLE_MS = 2000

/** Collect uncaught exceptions and console errors for the life of the page. */
function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

async function firstBlogPostPath(page: Page): Promise<string> {
  await page.goto('/blog')
  const href = await page.locator('a[href^="/blog/"]').first().getAttribute('href')
  expect(href, 'blog index links to at least one post').toBeTruthy()
  return href!
}

async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const summary = serious.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
  expect(summary, 'serious/critical axe violations').toEqual([])
}

test.use({ contextOptions: { reducedMotion: 'reduce' } })

for (const path of STATIC_PAGES) {
  test.describe(path, () => {
    test('renders without errors', async ({ page }) => {
      const errors = trackErrors(page)
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page.locator('h1').first()).toBeVisible()
      await page.waitForTimeout(SETTLE_MS)
      expect(errors).toEqual([])
    })

    test('has no serious accessibility violations', async ({ page }) => {
      await page.goto(path)
      await page.waitForTimeout(SETTLE_MS)
      await expectNoSeriousA11yViolations(page)
    })
  })
}

test.describe('blog post', () => {
  test('renders without errors', async ({ page }) => {
    const path = await firstBlogPostPath(page)
    const errors = trackErrors(page)
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible()
    await page.waitForTimeout(SETTLE_MS)
    expect(errors).toEqual([])
  })

  test('has no serious accessibility violations', async ({ page }) => {
    await page.goto(await firstBlogPostPath(page))
    await page.waitForTimeout(SETTLE_MS)
    await expectNoSeriousA11yViolations(page)
  })
})

test('unknown routes return the 404 page', async ({ page }) => {
  const response = await page.goto('/definitely-not-a-page')
  expect(response?.status()).toBe(404)
})

test('legacy shelf routes redirect to homepage anchors', async ({ page }) => {
  for (const [from, anchor] of [['/lab', '#lab'], ['/tools', '#tools'], ['/resources', '#lab']]) {
    await page.goto(from)
    expect(new URL(page.url()).pathname).toBe('/')
    expect(new URL(page.url()).hash).toBe(anchor)
  }
})
