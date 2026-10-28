import { test, expect, type Page } from '@playwright/test'
import { SEND_TIMEOUT } from '../e2e-env'

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
  await form.getByLabel('Name').fill('Test Visitor')
  await form.getByLabel('Email').fill('visitor@example.com')
  await form.getByRole('group', { name: 'Topic' }).getByText('Consulting', { exact: true }).click()
  await form.getByLabel('Message').fill('Hello! This is an end-to-end test message.')
}

async function waitForTurnstileToken(page: Page) {
  // The token comes from Cloudflare's real script, loaded after hydration, so
  // it gets the same budget as a send (5s was flaky in WebKit under load).
  await expect(page.locator('#contact input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: SEND_TIMEOUT })
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
  // The form that had focus is gone; focus lands on the result instead of <body>.
  await expect(page.getByRole('heading', { name: 'Message sent successfully!' })).toBeFocused()
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
  // Two full Turnstile round trips against Cloudflare's servers: on a busy CI
  // runner (mobile WebKit in the nightly) that alone can take most of 30s.
  test.setTimeout(60_000)
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
  await page.locator('#contact form').getByLabel('Message').focus()
  await page.keyboard.press('Tab')
  await expect(send).toBeFocused()
  expect(await send.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none')
})

test('the topic is three cards: Tab reaches them, arrow keys choose, a click chooses', async ({ page }) => {
  await openContactForm(page)
  await expect(page.getByRole('button', { name: /Send Message/ })).toBeEnabled() // hydrated
  const form = page.locator('#contact form')
  const topics = form.getByRole('group', { name: 'Topic' })
  const radio = (name: RegExp) => topics.getByRole('radio', { name })
  await expect(topics.getByRole('radio')).toHaveCount(3)

  // From Email, Tab lands on the first card (none chosen yet), with a visible ring.
  await form.getByLabel('Email').focus()
  await page.keyboard.press('Tab')
  await expect(radio(/^New project/)).toBeFocused()
  const ring = (name: RegExp) =>
    radio(name).evaluate((input) => getComputedStyle(input.closest('label')!).boxShadow)
  expect(await ring(/^New project/)).not.toBe('none')

  // Arrow keys move and choose, as in any radio group.
  await page.keyboard.press('ArrowRight')
  await expect(radio(/^Consulting/)).toBeChecked()
  await expect(radio(/^Consulting/)).toBeFocused()
  // Tab leaves the group for the message.
  await page.keyboard.press('Tab')
  await expect(form.getByLabel('Message')).toBeFocused()

  // A click on a card chooses it, and only it.
  await form.getByText('Just saying hi').click()
  await expect(radio(/^Networking/)).toBeChecked()
  await expect(topics.getByRole('radio', { checked: true })).toHaveCount(1)
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
  // No topic is pre-selected; leaving it blank is an error, not a silent default.
  await expect(page.locator('#contact form').getByRole('radio', { checked: true })).toHaveCount(0)
  await page.getByRole('button', { name: /Send Message/ }).click()
  await expect(page.getByText('Name must be at least 2 characters')).toBeVisible()
  await expect(page.getByText('Please choose a topic')).toBeVisible()
  expect(calls).toBe(0)
})

test('pressing Enter in a field submits the form, like Go on a phone keyboard', async ({ page }) => {
  await openContactForm(page)
  await waitForTurnstileToken(page)
  await fillForm(page)
  await page.locator('#contact form').getByLabel('Email').press('Enter')

  await expect(page.getByText('Message sent successfully!')).toBeVisible({ timeout: SEND_TIMEOUT })
})

test('validation errors are tied to their fields for screen readers', async ({ page }) => {
  await openContactForm(page)
  await waitForTurnstileToken(page)
  await page.getByRole('button', { name: /Send Message/ }).click()

  const form = page.locator('#contact form')
  const name = form.getByLabel('Name')
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  await expect(name).toHaveAccessibleDescription('Name must be at least 2 characters')
  // Every topic radio carries the group's error.
  const topics = form.getByRole('group', { name: 'Topic' }).getByRole('radio')
  await expect(topics).toHaveCount(3)
  for (const radio of await topics.all()) {
    await expect(radio).toHaveAttribute('aria-invalid', 'true')
    await expect(radio).toHaveAccessibleDescription('Please choose a topic')
  }
  // The first invalid field is focused, and its label clears the fixed navbar.
  await expect(name).toBeFocused()
  const navBottom = await page.locator('nav[aria-label="Primary"]').evaluate((el) => el.getBoundingClientRect().bottom)
  const labelTop = await form.locator('label[for="name"]').evaluate((el) => el.getBoundingClientRect().top)
  expect(labelTop).toBeGreaterThanOrEqual(navBottom)
})

test("Vercel's firewall 429 gets a readable message, not the raw error object", async ({ page }) => {
  // The WAF rate limit answers before the app does, with its own JSON shape.
  await page.route('/api/contact', (route) =>
    route.fulfill({
      status: 429,
      json: { error: { code: '429', message: 'Too Many Requests', id: 'sfo1::test' } },
    })
  )

  await openContactForm(page)
  await waitForTurnstileToken(page)
  await fillForm(page)
  await page.getByRole('button', { name: /Send Message/ }).click()

  const form = page.locator('#contact form')
  await expect(form.getByText(/too many messages/i)).toBeVisible()
  await expect(form.getByText('[object Object]')).toHaveCount(0)
})
