import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { SEND_TIMEOUT } from '../e2e-env'

/**
 * Security headers are present, and the Content-Security-Policy blocks nothing
 * the site legitimately loads: every page, plus a full contact submission
 * through Cloudflare Turnstile.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const PAGES = ['/', '/blog', '/loadout', '/privacy', '/builds/solara']
const SETTLE_MS = 2000

/** Record CSP violations from the page itself and CSP errors from any frame. */
async function trackCspViolations(page: Page): Promise<() => Promise<string[]>> {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    if (/Content[- ]Security[- ]Policy|Refused to (load|execute|connect|frame|apply)/i.test(text)) {
      consoleErrors.push(`console: ${text}`)
    }
  })

  await page.addInitScript(() => {
    const violations: string[] = []
    ;(window as unknown as { __cspViolations: string[] }).__cspViolations = violations
    document.addEventListener('securitypolicyviolation', (event) => {
      violations.push(`${event.effectiveDirective} blocked ${event.blockedURI || '(inline)'} at ${event.sourceFile}:${event.lineNumber}`)
    })
  })

  return async () => {
    const fromEvents = await page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations)
    return [...fromEvents, ...consoleErrors]
  }
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

test.describe('response headers', () => {
  test('are set on pages and API routes', async ({ request }) => {
    for (const path of ['/', '/blog', '/api/health']) {
      const response = await request.get(path)
      const headers = response.headers()

      expect(headers['content-security-policy'], path).toBeTruthy()
      expect(headers['x-frame-options'], path).toBe('DENY')
      expect(headers['x-content-type-options'], path).toBe('nosniff')
      expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin')
      expect(headers['cross-origin-opener-policy'], path).toBe('same-origin')
      expect(headers['permissions-policy'], path).toContain('camera=()')
      expect(headers['x-xss-protection'], `${path} drops the obsolete X-XSS-Protection`).toBeUndefined()
    }
  })

  test('the CSP locks down the dangerous directives', async ({ request }) => {
    const csp = (await request.get('/')).headers()['content-security-policy']
    const directive = (name: string) => csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `))

    expect(directive('object-src')).toBe("object-src 'none'")
    expect(directive('base-uri')).toBe("base-uri 'self'")
    expect(directive('form-action')).toBe("form-action 'self'")
    expect(directive('frame-ancestors')).toBe("frame-ancestors 'none'")
    expect(directive('frame-src')).toContain('https://challenges.cloudflare.com')
    // Production builds never allow eval.
    expect(directive('script-src')).not.toContain("'unsafe-eval'")
  })
})

test.describe('the CSP blocks nothing the site uses', () => {
  for (const path of PAGES) {
    test(path, async ({ page }) => {
      const violations = await trackCspViolations(page)
      await page.goto(path)
      await page.waitForTimeout(SETTLE_MS)
      expect(await violations()).toEqual([])
    })
  }

  test('a blog post', async ({ page, request }) => {
    const path = await firstBlogPostPath(request)
    const violations = await trackCspViolations(page)
    await page.goto(path)
    await page.waitForTimeout(SETTLE_MS)
    expect(await violations()).toEqual([])
  })

  test('a full contact submission through Turnstile', async ({ page }) => {
    const octet = () => Math.floor(Math.random() * 256)
    const ip = `10.${octet()}.${octet()}.${octet()}`
    await page.route('/api/contact', (route) =>
      route.continue({ headers: { ...route.request().headers(), 'x-real-ip': ip } })
    )

    const violations = await trackCspViolations(page)
    await page.goto('/#contact')
    const form = page.locator('#contact form')
    await form.scrollIntoViewIfNeeded()
    await expect(page.locator('#contact input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: SEND_TIMEOUT })

    await form.getByLabel('Your Name').fill('Test Visitor')
    await form.getByLabel('Email Address').fill('visitor@example.com')
    await form.getByLabel("What's this about?").selectOption('consulting')
    await form.getByLabel('Tell me more').fill('Hello! This is an end-to-end CSP test message.')
    await page.getByRole('button', { name: /Send Message/ }).click()
    await expect(page.getByText('Message sent successfully!')).toBeVisible({ timeout: SEND_TIMEOUT })

    expect(await violations()).toEqual([])
  })
})
