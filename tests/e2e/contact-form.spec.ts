import { test, expect, type Page } from '@playwright/test'

/**
 * The homepage contact form, driven like a visitor would. Runs against the
 * test-mode server: Turnstile uses Cloudflare's always-pass test site key and
 * no email is sent.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

// Give each test its own client IP so the per-IP rate limit (5/hour) never
// carries over between tests. Tests that also intercept /api/contact must use
// route.fallback() so the request still reaches this handler.
test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 256)
  const ip = `10.${octet()}.${octet()}.${octet()}`
  await page.route('/api/contact', (route) =>
    route.continue({ headers: { ...route.request().headers(), 'x-real-ip': ip } })
  )
})

async function fillForm(page: Page) {
  const form = page.locator('#contact form')
  await form.getByLabel('Your Name').fill('Test Visitor')
  await form.getByLabel('Email Address').fill('visitor@example.com')
  await form.getByLabel("What's this about?").selectOption('consulting')
  await form.getByLabel('Tell me more').fill('Hello! This is an end-to-end test message.')
}

async function waitForTurnstileToken(page: Page) {
  await expect(page.locator('#contact input[name="cf-turnstile-response"]')).toHaveValue(/.+/)
}

async function openContactForm(page: Page) {
  await page.goto('/#contact')
  await page.locator('#contact form').scrollIntoViewIfNeeded()
}

test('a visitor can send a message', async ({ page }) => {
  await openContactForm(page)
  await waitForTurnstileToken(page)
  await fillForm(page)
  await page.getByRole('button', { name: /Send Message/ }).click()

  await expect(page.getByText('Message sent successfully!')).toBeVisible()
})

test('shows the server message on failure, and a retry succeeds with a fresh Turnstile token', async ({ page }) => {
  const limitMessage = "Your message didn't go through due to our submission limit."
  const tokens: string[] = []
  let calls = 0

  await page.route('/api/contact', async (route) => {
    calls++
    tokens.push(route.request().postDataJSON().turnstile)
    if (calls === 1) {
      await route.fulfill({ status: 429, json: { error: limitMessage, type: 'rate_limit' } })
    } else {
      await route.fallback()
    }
  })

  await openContactForm(page)
  await waitForTurnstileToken(page)
  await fillForm(page)
  await page.getByRole('button', { name: /Send Message/ }).click()
  await expect(page.locator('#contact form').getByText(limitMessage)).toBeVisible()

  // Retry straight away: the spent token was discarded, so the form waits for
  // the remounted widget's fresh one before sending.
  await page.getByRole('button', { name: /Send Message/ }).click()
  await expect(page.getByText('Message sent successfully!')).toBeVisible()

  expect(calls).toBe(2)
  expect(tokens.every(Boolean)).toBe(true)
})

test('clicking Send before Turnstile is ready waits for the token, then sends', async ({ page }) => {
  // Hold Turnstile's script back so the visitor beats it to the button.
  let releaseTurnstile = () => {}
  const turnstileReleased = new Promise<void>((resolve) => (releaseTurnstile = resolve))
  await page.route('https://challenges.cloudflare.com/turnstile/**', async (route) => {
    await turnstileReleased
    await route.continue()
  })

  await openContactForm(page)
  await fillForm(page)
  await page.getByRole('button', { name: /Send Message/ }).click()
  await expect(page.getByRole('button', { name: /Verifying/ })).toBeVisible()

  releaseTurnstile()
  await expect(page.getByText('Message sent successfully!')).toBeVisible()
})

test('if Turnstile never loads, the visitor gets an explanation instead of a dead button', async ({ page }) => {
  test.setTimeout(60_000)
  await page.route('https://challenges.cloudflare.com/**', (route) => route.abort())

  await openContactForm(page)
  await fillForm(page)
  await page.getByRole('button', { name: /Send Message/ }).click()
  await expect(page.getByRole('button', { name: /Verifying/ })).toBeVisible()

  await expect(page.locator('#contact form').getByText("We couldn't verify your browser")).toBeVisible({ timeout: 20_000 })
})

test('network failures show the generic message', async ({ page }) => {
  await page.route('/api/contact', (route) => route.abort())

  await openContactForm(page)
  await waitForTurnstileToken(page)
  await fillForm(page)
  await page.getByRole('button', { name: /Send Message/ }).click()

  await expect(page.locator('#contact form').getByText('Oops! Something went wrong. Please try again or email me directly.')).toBeVisible()
})

test('client-side validation blocks an empty submission', async ({ page }) => {
  let calls = 0
  await page.route('/api/contact', (route) => {
    calls++
    return route.fallback()
  })

  await openContactForm(page)
  await page.getByRole('button', { name: /Send Message/ }).click()
  await expect(page.getByText('Name must be at least 2 characters')).toBeVisible()
  expect(calls).toBe(0)
})
