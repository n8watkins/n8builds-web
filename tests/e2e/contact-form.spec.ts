import { test, expect, type Page } from '@playwright/test'

/**
 * The homepage contact form, driven like a visitor would. Runs against the
 * test-mode server: Turnstile uses Cloudflare's always-pass test site key and
 * no email is sent.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

// A successful send chains a real Cloudflare script load, a Turnstile token,
// the API call, and the success transition. That legitimately takes longer
// than the default 5s on a loaded CI runner.
const SEND_TIMEOUT = 15_000

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
  // Not 'load': Turnstile's script, injected on hydration, delays the load
  // event when it starts first, so a test holding that script back would hang
  // whenever the page's other resources are slow. Tests wait on hydration-
  // dependent state instead (the token, or the Send button being enabled).
  await page.goto('/#contact', { waitUntil: 'domcontentloaded' })
  await page.locator('#contact form').scrollIntoViewIfNeeded()
}

test('a visitor can send a message', async ({ page }) => {
  await openContactForm(page)
  await waitForTurnstileToken(page)
  await fillForm(page)
  await page.getByRole('button', { name: /Send Message/ }).click()

  await expect(page.getByText('Message sent successfully!')).toBeVisible({ timeout: SEND_TIMEOUT })
  // This file runs with reduced motion: no confetti (lottie ignores the CSS rule).
  await expect(page.locator('[data-confetti]')).toHaveCount(0)
})

test.describe('motion allowed', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('a successful send celebrates with confetti', async ({ page }) => {
    await openContactForm(page)
    await waitForTurnstileToken(page)
    await fillForm(page)
    await page.getByRole('button', { name: /Send Message/ }).click()

    await expect(page.getByText('Message sent successfully!')).toBeVisible({ timeout: SEND_TIMEOUT })
    await expect(page.locator('[data-confetti] svg')).toBeVisible()
  })

  // Needs motion allowed: with reduced motion the confetti is never loaded.
  test('a sent message still shows success if the confetti chunk fails to load', async ({ page }) => {
    await openContactForm(page)
    await waitForTurnstileToken(page)
    // As after a deploy since the page was opened: chunks not loaded yet are gone.
    await page.route('**/_next/static/chunks/**', (route) => route.fulfill({ status: 404, body: '' }))
    const chunkFailed = page.waitForResponse((r) => r.url().includes('/_next/static/chunks/') && r.status() === 404)
    await fillForm(page)
    await page.getByRole('button', { name: /Send Message/ }).click()

    // The success screen renders before the confetti chunk fails, so check it
    // again once the failure has had time to propagate.
    await expect(page.getByText('Message sent successfully!')).toBeVisible({ timeout: SEND_TIMEOUT })
    await chunkFailed
    await page.waitForTimeout(1000)
    await expect(page.getByText('Message sent successfully!')).toBeVisible()
    await expect(page.getByText('Something went wrong')).toHaveCount(0)
  })
})

test('shows the server message on failure, and a retry succeeds with a fresh Turnstile token', async ({ page }) => {
  const limitMessage = "Your message didn't go through due to our submission limit."
  const tokens: string[] = []
  let calls = 0

  // Cloudflare's test key issues the same dummy token every time, so comparing
  // tokens proves nothing. Instead, hold the remounted widget back after the
  // first send: a retry that reused the spent token would send right away
  // rather than wait for the fresh one.
  let holdTurnstile = false
  let releaseTurnstile = () => {}
  const turnstileReleased = new Promise<void>((resolve) => (releaseTurnstile = resolve))
  await page.route('https://challenges.cloudflare.com/**', async (route) => {
    if (holdTurnstile) await turnstileReleased
    await route.continue()
  })

  await page.route('/api/contact', async (route) => {
    calls++
    tokens.push(route.request().postDataJSON().turnstile)
    if (calls === 1) {
      holdTurnstile = true
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
  await expect(page.getByRole('button', { name: /Verifying/ })).toBeVisible()
  expect(calls).toBe(1)

  releaseTurnstile()
  await expect(page.getByText('Message sent successfully!')).toBeVisible({ timeout: SEND_TIMEOUT })
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
  await expect(page.getByText('Message sent successfully!')).toBeVisible({ timeout: SEND_TIMEOUT })
})

test('on a slow connection, Send is not clickable until the form can handle it', async ({ page }) => {
  // Hold all JS back so the server-rendered form is on screen before it can
  // hydrate. Released in one go (not a per-request delay, which adds up across
  // the chunk waterfall).
  let releaseJs = () => {}
  const jsReleased = new Promise<void>((resolve) => (releaseJs = resolve))
  await page.route('**/_next/static/chunks/**', async (route) => {
    await jsReleased
    await route.continue()
  })
  await page.route('https://challenges.cloudflare.com/turnstile/**', () => {}) // never answers

  await page.goto('/#contact', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('button', { name: /Send Message/ })).toBeDisabled()
  await fillForm(page)

  // Playwright's click waits for the button to become enabled, as a visitor would.
  releaseJs()
  await page.getByRole('button', { name: /Send Message/ }).click()
  await expect(page.getByRole('button', { name: /Verifying/ })).toBeVisible()
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

test('Send shows a focus indicator when reached by keyboard', async ({ page }) => {
  await openContactForm(page)
  const send = page.getByRole('button', { name: /Send Message/ })
  await expect(send).toBeEnabled() // hydrated, so focus won't be reset under us
  await page.locator('#contact form').getByLabel('Tell me more').focus()
  await page.keyboard.press('Tab')
  await expect(send).toBeFocused()
  expect(await send.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none')
})

test('client-side validation blocks an empty submission', async ({ page }) => {
  let calls = 0
  await page.route('/api/contact', (route) => {
    calls++
    return route.fallback()
  })

  await openContactForm(page)
  // The widget only renders after hydration; clicking before then would hit a
  // button with no handler yet (flaky under load).
  await waitForTurnstileToken(page)
  await page.getByRole('button', { name: /Send Message/ }).click()
  await expect(page.getByText('Name must be at least 2 characters')).toBeVisible()
  expect(calls).toBe(0)
})
