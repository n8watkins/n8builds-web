import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { SEND_TIMEOUT } from '../e2e-env'

/**
 * The newsletter on Kit, driven like a reader would. The test server runs in
 * CONTACT_TEST_MODE: Kit is an in-memory stand-in (lib/newsletter/kitFake.ts,
 * read back through /api/test/kit), nothing is emailed, and Turnstile uses
 * Cloudflare's always-pass test key. The owner's switch is off in the test
 * database, as it is by default; a test turns the newsletter on for its own
 * browser with the `n8-newsletter-test=on` cookie, so the waitlist's own
 * tests (which expect it off) are never affected.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

// Each test gets its own client IP, so the per-IP limits never carry over.
test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 256)
  const ip = `10.${octet()}.${octet()}.${octet()}`
  for (const path of ['/api/newsletter', '/api/waitlist']) {
    await page.route(path, (route) => route.continue({ headers: { ...route.request().headers(), 'x-real-ip': ip } }))
  }
})

const uniqueEmail = () => `reader+${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`

async function turnOn(context: BrowserContext, baseURL: string | undefined) {
  await context.addCookies([{ name: 'n8-newsletter-test', value: 'on', url: baseURL! }])
}

type KitRecord = { state: string; tags: string[]; forms: string[]; referrer: string | null } | null

async function inKit(page: Page, email: string): Promise<KitRecord> {
  return (await (await page.request.get(`/api/test/kit?email=${encodeURIComponent(email)}`)).json()).subscriber
}

async function outbox(page: Page, to: string): Promise<unknown[]> {
  return (await (await page.request.get(`/api/test/outbox?to=${encodeURIComponent(to)}`)).json()).emails
}

const topic = (section: ReturnType<Page['locator']>, name: string) => section.getByRole('checkbox', { name })

test('with the switch off (the default) there is no newsletter anywhere', { tag: '@smoke' }, async ({ page }) => {
  const status = page.waitForResponse('/api/newsletter/status')
  await page.goto('/blog')
  expect(await (await status).json()).toEqual({ on: false })
  // Hydrated and asked: still nothing.
  await expect(page.locator('[data-newsletter]')).toHaveCount(0)

  await page.goto('/upcoming')
  await expect(page.getByRole('button', { name: 'Join the waitlist' }).first()).toBeEnabled()
  await expect(page.locator('#waitlist')).toContainText('No newsletter, and you can leave any time.')
  await expect(page.locator('#waitlist')).not.toContainText('Kit')
})

test('a reader picks topics on /blog and is signed up in Kit, which sends the confirm email', { tag: '@smoke' }, async ({ page, context, baseURL }) => {
  await turnOn(context, baseURL)
  const email = uniqueEmail()
  await page.goto('/blog')
  const section = page.locator('[data-newsletter="index"]')
  await expect(section.getByRole('button', { name: 'Subscribe' })).toBeEnabled()

  // Everything is the default; picking a single topic clears it, and picking it again clears the rest.
  await expect(topic(section, 'Everything')).toBeChecked()
  await topic(section, 'New launches').check({ force: true })
  await expect(topic(section, 'Everything')).not.toBeChecked()
  await topic(section, "N8's Notions posts").check({ force: true })
  await topic(section, 'Everything').check({ force: true })
  await expect(topic(section, 'New launches')).not.toBeChecked()
  await topic(section, 'New launches').check({ force: true })
  await topic(section, "N8's Notions posts").check({ force: true })

  await section.getByRole('textbox', { name: 'Email' }).fill(email)
  // Turnstile runs on the first input (hooks/useTurnstileOnIntent.tsx).
  await expect(section.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: SEND_TIMEOUT })
  await section.getByRole('button', { name: 'Subscribe' }).click()
  await expect(section.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({ timeout: SEND_TIMEOUT })
  await expect(section).toContainText('from Kit')

  expect(await inKit(page, email)).toEqual({
    email,
    state: 'inactive',
    tags: ['New launches', 'n8 Notions posts'],
    forms: ['4242'],
    referrer: 'https://n8builds.dev/blog',
  })
  // Kit sends the confirm email, not the site.
  expect(await outbox(page, email)).toEqual([])
})

test('the form checks the address and the topics before sending, and sits at the end of every post', async ({ page, context, baseURL, request }) => {
  await turnOn(context, baseURL)
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

  await section.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail())
  await topic(section, 'Everything').uncheck({ force: true })
  await section.getByRole('button', { name: 'Subscribe' }).click()
  await expect(section.getByRole('alert')).toHaveText('Pick at least one topic.')
  expect(sent).toBe(false)

  const html = await (await request.get('/blog')).text()
  const post = html.match(/href="(\/blog\/[a-z0-9-]+)"/)?.[1]
  expect(post).toBeTruthy()
  await page.goto(post!)
  await expect(page.locator('[data-newsletter="post"]').getByRole('heading', { name: 'Liked this? Get the next one by email' })).toBeVisible()
})

test('while it is on, the waitlist signs people up in Kit with a tag per project', async ({ page, context, baseURL }) => {
  await turnOn(context, baseURL)
  const email = uniqueEmail()
  await page.goto('/upcoming?interest=feelium')
  const form = page.locator('#waitlist')
  await expect(form.getByRole('button', { name: 'Join the waitlist' })).toBeEnabled()
  await expect(form).toContainText('sent with Kit. Unsubscribe from any email.')
  await form.getByRole('textbox', { name: 'Email' }).fill(email)
  await expect(form.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: SEND_TIMEOUT })
  await form.getByRole('button', { name: 'Join the waitlist' }).click()
  await expect(form.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({ timeout: SEND_TIMEOUT })
  await expect(form).toContainText('Kit, the service that sends my emails')

  expect(await inKit(page, email)).toMatchObject({ state: 'inactive', tags: ['Waitlist: Feelium'], forms: ['4242'] })
  expect(await outbox(page, email)).toEqual([])
})

test("the old newsletter links go to the blog", async ({ page }) => {
  await page.goto('/newsletter/confirm?t=abcdefghijklmnopqrstuvwxyz')
  await expect(page).toHaveURL(/\/blog$/)
})
