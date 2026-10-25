import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Every page renders without errors and has no serious accessibility issues.
 */

const STATIC_PAGES = ['/', '/blog', '/builds', '/loadout', '/privacy', '/builds/solara']

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

/**
 * Path of the first post on the blog index. Read from the HTML via the API
 * client rather than by visiting /blog in the page under test: navigating away
 * aborts /blog's route prefetches, which WebKit reports as uncaught
 * "access control checks" errors.
 */
async function firstBlogPostPath(request: APIRequestContext): Promise<string> {
  const html = await (await request.get('/blog')).text()
  const href = html.match(/href="(\/blog\/[^"?#]+)"/)?.[1]
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

// The suite runs with reduced motion, where marquees render as plain lists.
// Audit the animated layout too: its repeated marquee copies must stay out of
// the accessibility tree.
test.describe('motion allowed', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  for (const path of ['/', '/loadout']) {
    test(`${path} has no serious accessibility violations`, async ({ page }) => {
      await page.goto(path)
      await page.waitForTimeout(SETTLE_MS)
      await expectNoSeriousA11yViolations(page)
    })
  }
})

test.describe('blog post', () => {
  test('renders without errors', async ({ page, request }) => {
    const path = await firstBlogPostPath(request)
    const errors = trackErrors(page)
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible()
    await page.waitForTimeout(SETTLE_MS)
    expect(errors).toEqual([])
  })

  test('has no serious accessibility violations', async ({ page, request }) => {
    await page.goto(await firstBlogPostPath(request))
    await page.waitForTimeout(SETTLE_MS)
    await expectNoSeriousA11yViolations(page)
  })
})

test('the skip link moves focus past the navbar on every route', async ({ page, request }) => {
  for (const path of [...STATIC_PAGES, await firstBlogPostPath(request), '/definitely-not-a-page']) {
    await page.goto(path)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to main content' }), path).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('main#main-content'), path).toBeFocused()
    // The navbar is outside <main>, so this really skips it.
    await expect(page.locator('main#main-content nav[aria-label="Primary"]'), path).toHaveCount(0)
  }
})

test('unknown routes return the 404 page', async ({ page }) => {
  const response = await page.goto('/definitely-not-a-page')
  expect(response?.status()).toBe(404)
})

test('legacy shelf routes redirect to homepage anchors', async ({ page }) => {
  for (const [from, anchor] of [
    ['/lab', '#lab'],
    // Tools is gone (Scribe and OpenPing are featured rows now).
    ['/tools', '#featured'],
    ['/resources', '#lab'],
    ['/builds/canihost', '#lab'],
  ]) {
    await page.goto(from)
    expect(new URL(page.url()).pathname).toBe('/')
    expect(new URL(page.url()).hash).toBe(anchor)
  }
})
