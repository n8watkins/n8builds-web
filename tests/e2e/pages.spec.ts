import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Every page renders without errors and has no serious accessibility issues.
 */

const STATIC_PAGES = ['/', '/blog', '/builds', '/loadout', '/privacy', '/builds/solara', '/upcoming']

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
  const href = html.match(/href="(\/blog\/[a-z0-9-]+)"/)?.[1]
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
    test('renders without errors', { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
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
  test('renders without errors', { tag: ['@cross-browser', '@smoke'] }, async ({ page, request }) => {
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

test('the skip link moves focus past the navbar on every route', { tag: ['@cross-browser', '@smoke'] }, async ({ page, request }) => {
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

test('legacy shelf routes redirect to homepage anchors, and /tools to /loadout', { tag: '@smoke' }, async ({ page }) => {
  for (const [from, anchor] of [
    ['/lab', '#lab'],
    ['/resources', '#lab'],
    ['/builds/canihost', '#lab'],
  ]) {
    await page.goto(from)
    expect(new URL(page.url()).pathname).toBe('/')
    expect(new URL(page.url()).hash).toBe(anchor)
  }
  // Tools are the ones the owner built and uses, Scribe first, on /loadout.
  await page.goto('/tools')
  expect(new URL(page.url()).pathname + new URL(page.url()).hash).toBe('/loadout#tools-i-built')
  await expect(page.getByRole('heading', { level: 2, name: "Tools I've built" })).toBeInViewport()
})

test('Piper TTS was renamed VoiceDock: its old page lands on the new one, which links the new repo', async ({ page, request }) => {
  const response = await request.get('/builds/piper-tts', { maxRedirects: 0 })
  expect(response.status()).toBe(308)
  expect(response.headers()['location']).toBe('/builds/voicedock')
  await page.goto('/builds/piper-tts')
  expect(new URL(page.url()).pathname).toBe('/builds/voicedock')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('VoiceDock')
  await expect(page.locator('a[href="https://github.com/n8watkins/voicedock"]').first()).toBeAttached()
  await expect(page.locator('a[href*="piper-tts"]')).toHaveCount(0)
})

test("the developer portfolio's page moved to /builds/portfolio: the old path lands on the new one", async ({ page, request }) => {
  const response = await request.get('/builds/dev-portfolio', { maxRedirects: 0 })
  expect(response.status()).toBe(308)
  expect(response.headers()['location']).toBe('/builds/portfolio')
  await page.goto('/builds/dev-portfolio')
  expect(new URL(page.url()).pathname).toBe('/builds/portfolio')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Developer portfolio')
  await expect(page.locator('a[href="https://github.com/n8watkins/dev-portfolio"]').first()).toBeAttached()
  await expect(page.locator('a[href^="/builds/dev-portfolio"]')).toHaveCount(0)
})
