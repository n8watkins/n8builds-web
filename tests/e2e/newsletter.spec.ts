import { test, expect, type Page } from '@playwright/test'
import { SEND_TIMEOUT } from '../e2e-env'

/**
 * The blog newsletter, driven like a reader would. The test server runs in
 * CONTACT_TEST_MODE: sign-ups go to the local D1 database (wrangler's
 * simulation, with the real migrations), nothing is sent through mailroom
 * (the email waits in /api/test/outbox instead), and Turnstile uses
 * Cloudflare's always-pass test key.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

// Each test gets its own client IP, so the per-IP limit never carries over.
test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 256)
  const ip = `10.${octet()}.${octet()}.${octet()}`
  await page.route('/api/newsletter**', (route) => route.continue({ headers: { ...route.request().headers(), 'x-real-ip': ip } }))
})

const uniqueEmail = () => `reader+${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`

type OutboxEmail = { subject: string; text: string; headers?: Record<string, string> }

async function outbox(page: Page, to: string): Promise<OutboxEmail[]> {
  return (await (await page.request.get(`/api/test/outbox?to=${encodeURIComponent(to)}`)).json()).emails
}

/** The newest link of a kind in the test-mode emails to an address, as a path on the test server. */
async function emailedLink(page: Page, to: string, path: '/newsletter/confirm' | '/newsletter/unsubscribe'): Promise<string> {
  let link = ''
  await expect(async () => {
    const urls = (await outbox(page, to)).flatMap((e) => e.text.match(/https:\/\/n8builds\.dev\/newsletter\/(?:confirm|unsubscribe)\?t=[\w-]+/g) ?? [])
    link = urls.filter((url) => url.includes(path)).at(-1) ?? ''
    expect(link).not.toBe('')
  }).toPass({ timeout: SEND_TIMEOUT })
  return link.replace('https://n8builds.dev', '')
}

async function subscribe(page: Page, form: string, email: string) {
  const section = page.locator(`[data-newsletter="${form}"]`)
  await expect(section.getByRole('button', { name: 'Subscribe' })).toBeEnabled()
  await section.getByRole('textbox', { name: 'Email' }).fill(email)
  // Turnstile runs on the first input (hooks/useTurnstileOnIntent.tsx).
  await expect(section.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: SEND_TIMEOUT })
  await section.getByRole('button', { name: 'Subscribe' }).click()
  await expect(section.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({ timeout: SEND_TIMEOUT })
}

test('a reader subscribes on /blog, confirms from the email, and unsubscribes with one click', { tag: '@smoke' }, async ({ page }) => {
  const email = uniqueEmail()
  await page.goto('/blog')
  await subscribe(page, 'index', email)

  const [confirmEmail] = await outbox(page, email)
  expect(confirmEmail.subject).toBe("Confirm your N8's Notions subscription")
  expect(confirmEmail.headers).toMatchObject({
    'List-Unsubscribe': expect.stringMatching(/^<https:\/\/n8builds\.dev\/api\/newsletter\/unsubscribe\?t=[\w-]+>$/),
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  })

  // The confirm link works once.
  const confirm = await emailedLink(page, email, '/newsletter/confirm')
  await page.goto(confirm)
  await page.getByRole('button', { name: 'Confirm my subscription' }).click()
  await expect(page.locator('main').getByRole('status')).toContainText("You're subscribed")
  await page.goto(confirm)
  await page.getByRole('button', { name: 'Confirm my subscription' }).click()
  await expect(page.locator('main').getByRole('alert')).toContainText('expired or was already used')

  // Signing up again with a confirmed address answers the same, and sends nothing.
  await page.goto('/blog')
  await subscribe(page, 'index', email)
  expect(await outbox(page, email)).toHaveLength(1)

  // The unsubscribe page deletes the address.
  const unsubscribe = await emailedLink(page, email, '/newsletter/unsubscribe')
  await page.goto(unsubscribe)
  await page.getByRole('button', { name: 'Unsubscribe' }).click()
  await expect(page.locator('main').getByRole('status')).toContainText("You're unsubscribed")

  // Gone: a new sign-up is a new subscriber, with a new confirm email.
  await page.goto('/blog')
  await subscribe(page, 'index', email)
  await expect.poll(async () => (await outbox(page, email)).length).toBe(2)
})

test("mail clients' one-click unsubscribe (RFC 8058) deletes the address", async ({ page }) => {
  const email = uniqueEmail()
  await page.goto('/blog')
  await subscribe(page, 'index', email)
  const [{ headers }] = await outbox(page, email)
  const url = headers!['List-Unsubscribe'].slice(1, -1).replace('https://n8builds.dev', '')

  const response = await page.request.post(url, { form: { 'List-Unsubscribe': 'One-Click' } })
  expect(response.status()).toBe(200)

  // The confirm link no longer works: the row is gone.
  await page.goto(await emailedLink(page, email, '/newsletter/confirm'))
  await page.getByRole('button', { name: 'Confirm my subscription' }).click()
  await expect(page.locator('main').getByRole('alert')).toContainText('expired or was already used')
})

test('the form checks the address before sending anything, and sits at the end of every post', { tag: '@smoke' }, async ({ page, request }) => {
  await page.goto('/blog')
  let sent = false
  page.on('request', (r) => {
    if (r.url().endsWith('/api/newsletter')) sent = true
  })
  const section = page.locator('[data-newsletter="index"]')
  await expect(section.getByRole('button', { name: 'Subscribe' })).toBeEnabled()
  await section.getByRole('textbox', { name: 'Email' }).fill('not-an-email')
  await section.getByRole('button', { name: 'Subscribe' }).click()
  await expect(section.getByRole('alert')).toHaveText('Please enter a valid email address.')
  await expect(section.getByRole('textbox', { name: 'Email' })).toBeFocused()
  expect(sent).toBe(false)

  const html = await (await request.get('/blog')).text()
  const post = html.match(/href="(\/blog\/[a-z0-9-]+)"/)?.[1]
  expect(post).toBeTruthy()
  await page.goto(post!)
  await expect(page.locator('[data-newsletter="post"]').getByRole('heading', { name: 'Liked this? Get the next one by email' })).toBeVisible()
})
