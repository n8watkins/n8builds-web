import { test, expect, type Page } from '@playwright/test'
import { SEND_TIMEOUT } from '../e2e-env'

/**
 * /upcoming: the projects I'm outlining and their waitlist, driven like a
 * visitor would. The test server runs in CONTACT_TEST_MODE: sign-ups go to a
 * local D1 database (wrangler's simulation, with the real migrations), no
 * email is sent (it waits in /api/test/outbox instead), and Turnstile uses
 * Cloudflare's always-pass test key.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

// Each test gets its own client IP, so the per-IP limit never carries over.
test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 256)
  const ip = `10.${octet()}.${octet()}.${octet()}`
  await page.route('/api/waitlist**', (route) => route.continue({ headers: { ...route.request().headers(), 'x-real-ip': ip } }))
})

const uniqueEmail = () => `visitor+${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`

/** Hydrated: a field filled before then is typed into a form React isn't listening to yet. */
async function waitForForm(page: Page) {
  await expect(page.getByRole('button', { name: 'Join the waitlist' })).toBeEnabled()
}

async function waitForTurnstileToken(page: Page) {
  // Its Turnstile runs on the first focus or input in the form (hooks/useTurnstileOnIntent.tsx),
  // so call this after filling a field (once the form has hydrated: waitForForm).
  await expect(page.locator('#waitlist input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: SEND_TIMEOUT })
}

const project = (page: Page, name: string) => page.locator('#waitlist-projects').getByRole('checkbox', { name: new RegExp(name) })

test('shows each project with its own anchor, and is titled for the site', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/upcoming')
  await expect(page).toHaveTitle('Upcoming | n8builds')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What’s cookin’')
  // In group order: for your habits and health, then for two (round 7 of 2026-11-09; these groups since 2026-11-11).
  const articles = page.locator('main article')
  await expect(articles).toHaveCount(Object.keys(NAMES).length)
  expect(await articles.evaluateAll((list) => list.map((a) => a.id))).toEqual(Object.keys(NAMES))
  for (const [id, name] of Object.entries(NAMES)) {
    const card = page.locator(`article#${id}`)
    await expect(card.getByRole('heading', { level: 2 })).toContainText(name)
    // A teaser (round 11 of 2026-11-09): its landing page's picture, its status and one line,
    // no list of points.
    await expect(card.getByRole('listitem')).toHaveCount(0)
    await expect(card.locator('img[src*="upcoming%2Fshots"], img[src*="/upcoming/shots/"]')).toHaveCount(1)
    await expect(card.locator('[data-status]')).toHaveCount(1)
  }
  // Statuses, as each landing page says: three are working apps today, KeysReady is in development.
  for (const id of Object.keys(NAMES)) {
    await expect(page.locator(`article#${id} [data-status]`)).toHaveText(id === 'keysready' ? 'In development' : 'Try it now')
  }
  // The new copy (2026-11-26): each card has its tagline and its one line, and nothing of the old tagline.
  for (const [id, [tagline, line]] of Object.entries(COPY)) {
    await expect(page.locator(`article#${id}`)).toContainText(tagline)
    await expect(page.locator(`article#${id} [data-summary]`)).toHaveText(line)
  }
  await expect(page.locator('main')).not.toContainText('What did I do, how did I feel')
  await expect(page.locator('main')).not.toContainText('A pause button for everyday urges')
  await expect(page.locator('#waitlist-projects').getByRole('checkbox')).toHaveCount(Object.keys(NAMES).length)
})

test('lays the teaser cards out two by two (beside the waitlist on wide screens), one column on phones', { tag: '@cross-browser' }, async ({ page }) => {
  // Round 11 of 2026-11-09: short teasers, two to a row from 640px.
  for (const [width, columns] of [
    [1280, 2],
    [1040, 2],
    [1000, 2],
    [810, 2],
    [390, 1],
  ]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/upcoming')
    const lefts = await page.locator('main article').evaluateAll((cards) => cards.map((c) => Math.round(c.getBoundingClientRect().left)))
    expect(new Set(lefts).size, `columns at ${width}px`).toBe(columns)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
    // Four cards: two by two from 640px (an even count, so none spans a row), one column on a phone.
    const [first, second, third, fourth] = await Promise.all(['#feelium', '#pivot', '#cutelyaskme', '#keysready'].map(async (id) => (await page.locator(id).boundingBox())!))
    const [picture, name] = await Promise.all([page.locator('#keysready img[src*="shots"]').boundingBox(), page.locator('#keysready h2').boundingBox()])
    if (columns === 2) {
      expect(Math.abs(third.x - first.x), `the third card starts the second row at ${width}px`).toBeLessThan(1)
      expect(Math.abs(fourth.x - second.x), `the fourth card sits under the second at ${width}px`).toBeLessThan(1)
      expect(Math.abs(fourth.width - first.width), `every card is one column wide at ${width}px`).toBeLessThan(1)
    } else {
      expect(Math.abs(fourth.width - first.width)).toBeLessThan(1)
    }
    // A card's words sit under its picture, never beside it.
    expect(name!.y).toBeGreaterThan(picture!.y + picture!.height)
    // Tablets and phones: the waitlist comes after the cards.
    if (width < 1000) {
      const last = (await page.locator('#keysready').boundingBox())!
      const form = (await page.locator('#waitlist').boundingBox())!
      expect(form.y, `the waitlist after the cards at ${width}px`).toBeGreaterThan(last.y + last.height)
    }
  }
})

test('a landing page link preselects its project and lands on its card', { tag: '@cross-browser' }, async ({ page }) => {
  await page.goto('/upcoming?interest=pivot#pivot')
  await expect(project(page, 'Pivot')).toBeChecked()
  await expect(project(page, 'Feelium')).not.toBeChecked()
  await expect(page.locator('article#pivot')).toBeInViewport()
})

/**
 * Projects taken off the waitlist (owner, 2026-11-26): they are live, so there is nothing to wait for.
 * An old landing-page link still lands on the plain page, with nothing ticked and no error.
 */
const RETIRED: Record<string, string> = {
  fitflow7: 'FitFlow 7',
  whoami: 'Who Am I?',
  strollz: 'Strollz',
  vibelog: 'VibeLog',
  'asset-arsenal': 'Asset Arsenal',
}

for (const [slug, name] of Object.entries(RETIRED)) {
  test(`an old link for ${name} lands on the plain upcoming page, nothing preselected`, async ({ context }) => {
    const errors: string[] = []
    for (const url of [`/upcoming?interest=${slug}#waitlist`, `/upcoming?interest=${slug}#${slug}`, `/?interest=${slug}#waitlist`]) {
      // One fresh page per link, with its errors read before it is closed. Leaving a page (a
      // second goto, or the test ending) aborts its prefetches and the live poll, which WebKit
      // reports as uncaught "access control checks" errors: noise from a page being left, not
      // from the old link (pages.spec.ts avoids the same noise).
      const page = await context.newPage()
      const pageErrors: string[] = []
      page.on('pageerror', (e) => pageErrors.push(e.message))
      expect((await page.goto(url))?.status(), url).toBe(200)
      await expect(page.locator('body')).not.toContainText(name)
      await expect(page.locator(`[id="${slug}"], input[value="${slug}"]`)).toHaveCount(0)
      await expect(page.locator('#waitlist-projects input:checked')).toHaveCount(0)
      if (url.startsWith('/upcoming')) await expect(page.locator('main article')).toHaveCount(Object.keys(NAMES).length)
      errors.push(...pageErrors)
      page.removeAllListeners('pageerror')
      await page.close()
    }
    expect(errors).toEqual([])
  })
}

test('an unknown interest value is ignored and the page shows normally', async ({ page }) => {
  await page.goto('/upcoming?interest=relink#relink')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('article')).toHaveCount(Object.keys(NAMES).length)
  await expect(page.locator('#waitlist-projects input:checked')).toHaveCount(0)
  await expect(page.locator('main')).not.toContainText('Relink')
})

test("a card's Join button ticks its project and brings the form into view", { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
  await page.goto('/upcoming')
  // Hydrated first: before that the link only jumps to the form, without ticking.
  await waitForForm(page)
  await page.locator('article#feelium').getByRole('link', { name: 'Join the waitlist for Feelium' }).click()
  await expect(project(page, 'Feelium')).toBeChecked()
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeInViewport()
})

test('a visitor can join the waitlist', { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
  await page.goto('/upcoming?interest=feelium#feelium', { waitUntil: 'domcontentloaded' })
  await waitForForm(page)
  await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail())
  await waitForTurnstileToken(page)
  await page.locator('#waitlist-projects label', { hasText: 'Pivot' }).click()
  await expect(project(page, 'Pivot')).toBeChecked()
  // No note field (owner, 2026-11-02): email and projects are all it asks.
  await expect(page.locator('#waitlist textarea')).toHaveCount(0)

  const request = page.waitForRequest('/api/waitlist')
  await page.getByRole('button', { name: 'Join the waitlist' }).click()
  const body = (await request).postDataJSON()
  expect(body).toMatchObject({ projects: ['feelium', 'pivot'], source: { interest: 'feelium' }, honeypot: '' })
  expect(body).not.toHaveProperty('note')

  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({ timeout: SEND_TIMEOUT })
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeFocused()
})

/** The link in the newest test-mode email to an address (lib/email/outbox.ts). */
async function emailedLink(page: Page, to: string, path: '/upcoming/confirm' | '/upcoming/leave'): Promise<string> {
  let link = ''
  await expect(async () => {
    const { emails } = await (await page.request.get(`/api/test/outbox?to=${encodeURIComponent(to)}`)).json()
    const urls = emails.flatMap((e: { text: string }) => e.text.match(/https:\/\/n8builds\.dev\/upcoming\/(?:confirm|leave)\?t=[\w-]+/g) ?? [])
    link = urls.filter((url: string) => url.includes(path)).at(-1) ?? ''
    expect(link).not.toBe('')
  }).toPass({ timeout: SEND_TIMEOUT })
  // The emails link to the live site; follow them on the test server.
  return link.replace('https://n8builds.dev', '')
}

test('a visitor joins, confirms from the email, and leaves again, with every step kept in the database', { tag: '@smoke' }, async ({ page }) => {
  const email = uniqueEmail()
  await page.goto('/upcoming?interest=feelium#feelium', { waitUntil: 'domcontentloaded' })
  await waitForForm(page)
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await waitForTurnstileToken(page)
  await page.locator('#waitlist-projects label', { hasText: 'Pivot' }).click()
  await page.getByRole('button', { name: 'Join the waitlist' }).click()
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({ timeout: SEND_TIMEOUT })

  // The confirm email: its button confirms both projects, once.
  const confirm = await emailedLink(page, email, '/upcoming/confirm')
  await page.goto(confirm)
  await page.getByRole('button', { name: 'Confirm my spot' }).click()
  await expect(page.locator('main').getByRole('status')).toContainText("You're on the list for Feelium and Pivot")
  await page.goto(confirm)
  await page.getByRole('button', { name: 'Confirm my spot' }).click()
  await expect(page.locator('main').getByRole('alert')).toContainText('expired')

  // Its leave link opens the manage page: untick a project to drop it, then
  // leave altogether; after that, the link does nothing.
  const leave = await emailedLink(page, email, '/upcoming/leave')
  await page.goto(leave)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Manage your waitlist')
  const save = page.getByRole('button', { name: 'Save my choices' })
  await expect(page.getByRole('checkbox', { name: /Pivot/ })).toBeChecked()
  await expect(save).toBeDisabled()
  await page.getByRole('checkbox', { name: /Pivot/ }).uncheck()
  await save.click()
  await expect(page.locator('main').getByRole('status')).toContainText("Saved. You're on the list for Feelium.")
  await expect(page.getByRole('checkbox')).toHaveCount(1)
  await page.getByRole('button', { name: 'Leave the waitlist' }).click()
  await expect(page.locator('main').getByRole('status')).toContainText('everything stored with it are deleted')
  await page.goto(leave)
  await expect(page.locator('main').getByRole('alert')).toContainText('no longer on the waitlist')
})

test('asks for a project and a valid email before sending anything', { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
  await page.goto('/upcoming')
  let sent = false
  page.on('request', (r) => {
    if (r.url().endsWith('/api/waitlist')) sent = true
  })
  const join = page.getByRole('button', { name: 'Join the waitlist' })
  await expect(join).toBeEnabled()

  await page.getByRole('textbox', { name: 'Email' }).fill('not-an-email')
  await join.click()
  await expect(page.getByText('Please enter a valid email address')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeFocused()

  await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail())
  await join.click()
  await expect(page.getByText('Pick at least one project')).toBeVisible()
  expect(sent).toBe(false)
})

test('shows the server error when the waitlist is unavailable', async ({ page }) => {
  await page.goto('/upcoming?interest=feelium')
  await page.route('/api/waitlist', (route) =>
    route.fulfill({ status: 503, json: { error: 'The waitlist is having trouble right now.', type: 'unavailable' } })
  )
  await waitForForm(page)
  await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail())
  await waitForTurnstileToken(page)
  await page.getByRole('button', { name: 'Join the waitlist' }).click()
  await expect(page.locator('main').getByRole('alert')).toHaveText('The waitlist is having trouble right now.')
})

test('Turnstile runs only once the visitor starts on a form', async ({ page }) => {
  // Not on page view or scroll (2026-11-10): Cloudflare warns about tokens that are never verified.
  const challenge: string[] = []
  page.on('request', (r) => {
    if (r.url().startsWith('https://challenges.cloudflare.com/')) challenge.push(r.url())
  })
  await page.goto('/upcoming')
  await waitForForm(page)
  await page.locator('#waitlist').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500)
  expect(challenge).toEqual([])

  // A pick from a card's Join button is intent too.
  await page.locator('article#feelium').getByRole('link', { name: 'Join the waitlist for Feelium' }).click()
  await waitForTurnstileToken(page)
  expect(challenge.length).toBeGreaterThan(0)
})

test('the confirm page acts only on a click, and explains an expired link', async ({ page }) => {
  let posted = false
  page.on('request', (r) => {
    if (r.url().endsWith('/api/waitlist/confirm')) posted = true
  })
  await page.goto(`/upcoming/confirm?t=${'x'.repeat(32)}`)
  const button = page.getByRole('button', { name: 'Confirm my spot' })
  await expect(button).toBeEnabled()
  // The secret leaves the address bar once read.
  await expect(page).toHaveURL(/\/upcoming\/confirm$/)
  expect(posted).toBe(false)
  await button.click()
  await expect(page.locator('main').getByRole('alert')).toContainText('expired')
})

test('the leave page without a link offers to email one', async ({ page }) => {
  let challenged = false
  page.on('request', (r) => {
    if (r.url().startsWith('https://challenges.cloudflare.com/')) challenged = true
  })
  await page.goto('/upcoming/leave', { waitUntil: 'domcontentloaded' })
  const send = page.getByRole('button', { name: 'Email me a link' })
  await expect(send).toBeEnabled() // hydrated
  // No challenge for a visitor who only reads the page.
  expect(challenged).toBe(false)
  await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail())
  // Sent at once: the send waits for Turnstile's token if it isn't ready yet.
  await send.click()
  await expect(page.locator('main').getByRole('status')).toContainText('If that address is on the waitlist')
})

test('is linked from the footer, and the privacy page explains the waitlist', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('navigation', { name: 'Sitemap' }).getByRole('link', { name: 'Upcoming' })).toHaveAttribute(
    'href',
    '/upcoming'
  )
  await expect(page.locator('#waitlist')).toContainText('Waitlist.')
  // The Lab menu leads to the homepage part (in the DOM even while the menu is closed).
  await expect(page.getByRole('navigation', { name: 'Primary' }).locator('a[href="/#upcoming"]').first()).toBeAttached()
})

/** Every project's tagline and its one line (data/upcoming.ts), as the owner wrote them on 2026-11-26. */
const COPY: Record<string, [string, string]> = {
  feelium: ['Find out what actually makes your days better.', 'Tap what you did, rate how you felt, and see what goes with your good days.'],
  pivot: ["Who you were isn't who you are now.", "When an old habit pulls, Pivot gives you one small step that belongs to the person you're becoming."],
  cutelyaskme: ["Finding a date is hard enough. Asking shouldn't be.", 'Send a cute invite; they pick the vibe, you plan the night.'],
  keysready: [
    'Stop wondering when your car is ready.',
    "You get told the moment it's done, and you agree to the work and the price before anyone picks up a wrench. No more haggling at the counter. They always know where their car is, so you can stay under the hood instead of on the phone.",
  ],
}

/** Every project, in group order, and its landing page. */
const LANDING: Record<string, string> = {
  feelium: 'https://feelium.n8builds.dev',
  pivot: 'https://pivot.n8builds.dev/welcome',
  cutelyaskme: 'https://cutelyaskme.n8builds.dev',
  keysready: 'https://keysready.n8builds.dev',
}
const NAMES: Record<string, string> = {
  feelium: 'Feelium',
  pivot: 'Pivot',
  cutelyaskme: 'Cutely Ask Me',
  keysready: 'KeysReady',
}
/** The homepage's groups (data/upcoming.ts), in order, with their projects. */
const GROUPS: [string, string[]][] = [
  ['For your habits & health', ['feelium', 'pivot']],
  ['For two', ['cutelyaskme']],
  ['For businesses', ['keysready']],
]

/**
 * Only public repositories get a GitHub button on
 * the homepage (checked 2026-11-09; every one left is public).
 */
const CODE: Record<string, string | undefined> = {
  feelium: 'https://github.com/n8watkins/feelium',
  cutelyaskme: 'https://github.com/n8watkins/cutelyaskme',
  pivot: 'https://github.com/n8watkins/pivot',
  keysready: 'https://github.com/n8watkins/keysready',
}

test('each card has two actions: Check it out (its landing page), then the waitlist (hrefs only: the sites may not be live yet)', async ({ page }) => {
  await page.goto('/upcoming')
  for (const [slug, href] of Object.entries(LANDING)) {
    const card = page.locator(`article#${slug}`)
    const name = NAMES[slug]
    const landing = card.getByRole('link', { name: `Check it out for ${name} (opens in a new tab)` })
    await expect(landing).toHaveAttribute('href', href)
    await expect(landing).toHaveAttribute('target', '_blank')
    const actions = card.getByRole('link')
    await expect(actions).toHaveCount(2)
    await expect(actions.nth(0)).toHaveAccessibleName(/^Check it out/)
    await expect(actions.nth(1)).toHaveAccessibleName(`Join the waitlist for ${name}`)
    // The code links stay on the homepage's What's cookin' rows (round 11 of 2026-11-09).
    await expect(card.getByRole('link', { name: /^View the code/ })).toHaveCount(0)
  }
})

test("the homepage Lab ends with a compact What's cookin' part: projects grouped by who they are for, and the waitlist in a modal", async ({ page }) => {
  await page.goto('/')
  const band = page.locator('#lab section#upcoming')
  // An animated pot in a chip beside the heading (2026-11-08; the 🍲 before), for the eye only.
  await expect(band.getByRole('heading', { level: 3 })).toHaveText('What’s cookin’')
  await expect(band.locator('.part-icon-pot')).toHaveAttribute('aria-hidden', 'true')
  await expect(band.getByText('Upcoming', { exact: true })).toBeVisible()
  // Grouped by who each is for (owner, round 7 of 2026-11-09), every project once.
  await expect(band.getByRole('heading', { level: 4 })).toHaveText(GROUPS.map(([label]) => label))
  await expect(band.locator('section[data-group] li')).toHaveCount(Object.keys(LANDING).length)
  for (const [label, slugs] of GROUPS) {
    const rows = band.getByRole('region', { name: label }).getByRole('listitem')
    await expect(rows).toHaveCount(slugs.length)
    for (const [i, slug] of slugs.entries()) {
      const name = NAMES[slug]
      const row = rows.nth(i)
      // Just the name and a few words: no tagline paragraph, no summary.
      await expect(row.locator('[data-upcoming-name]')).toContainText(name)
      await expect(row.locator('p')).toHaveCount(1)
      // The name is the landing page's link (round 8 of 2026-11-09: no "Landing page" button) ...
      const landing = row.getByRole('link', { name: `${name} landing page (opens in a new tab)` })
      await expect(landing).toHaveAttribute('href', LANDING[slug])
      await expect(landing).toHaveAttribute('target', '_blank')
      await expect(row.getByText('Landing page', { exact: true })).toHaveCount(0)
      // ... and a GitHub button follows when the repo is public.
      const github = row.getByRole('link', { name: `${name} on GitHub (opens in a new tab)` })
      if (CODE[slug]) {
        await expect(github).toHaveAttribute('href', CODE[slug]!)
        await expect(row.getByRole('link')).toHaveCount(2)
      } else {
        await expect(github).toHaveCount(0)
        await expect(row.getByRole('link')).toHaveCount(1)
      }
    }
  }
  await expect(band.getByText('See which habits go with how you feel')).toBeVisible()
  // No status labels: every project has a live landing page.
  await expect(band.getByText('Status:')).toHaveCount(0)

  // The waitlist: the same form as /upcoming, in a modal opened by one button, which sits
  // top right beside "See all upcoming" (round 10 of 2026-11-09), not under the groups.
  const join = band.getByRole('button', { name: 'Join the waitlist' })
  const all = band.getByRole('link', { name: 'See all upcoming' })
  const [joinBox, allBox, firstGroup] = [(await join.boundingBox())!, (await all.boundingBox())!, (await band.locator('section[data-group]').first().boundingBox())!]
  expect(joinBox.y + joinBox.height).toBeLessThan(firstGroup.y)
  expect(Math.abs(joinBox.y + joinBox.height / 2 - (allBox.y + allBox.height / 2))).toBeLessThan(2)
  expect(allBox.x).toBeGreaterThan(joinBox.x + joinBox.width)
  await expect(join).toHaveAttribute('aria-haspopup', 'dialog')
  const dialog = page.getByRole('dialog', { name: 'Join the waitlist' })
  await expect(dialog).toBeHidden()
  await join.click()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { level: 2, name: 'Join the waitlist' })).toBeVisible()
  await expect(dialog.getByRole('checkbox')).toHaveCount(Object.keys(LANDING).length)
  await expect(dialog.locator('textarea')).toHaveCount(0)
  // Focus moves into it, and the page behind doesn't scroll.
  await expect(dialog.locator(':focus')).toHaveCount(1)
  await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden')
  // What was typed survives closing it: Escape, then the close button, then the backdrop.
  await dialog.getByRole('textbox', { name: 'Email' }).fill('keep@example.com')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(join).toBeFocused()
  await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden')
  await join.click()
  await expect(dialog.getByRole('textbox', { name: 'Email' })).toHaveValue('keep@example.com')
  await dialog.getByRole('button', { name: 'Close the waitlist' }).click()
  await expect(dialog).toBeHidden()
  await join.click()
  await page.mouse.click(5, 5)
  await expect(dialog).toBeHidden()

  await band.getByRole('link', { name: 'See all upcoming' }).click()
  await expect(page).toHaveURL(/\/upcoming$/)
})

test('a landing page link to the homepage opens the waitlist there and ticks its project', async ({ page }) => {
  await page.goto('/?interest=pivot#waitlist')
  const form = page.getByRole('dialog', { name: 'Join the waitlist' })
  await expect(form).toBeVisible()
  await expect(form).toBeInViewport()
  await expect(form.locator('input[value="pivot"]')).toBeChecked()
  await expect(form.locator('input[value="feelium"]')).not.toBeChecked()
})

for (const [width, height] of [
  [1280, 800],
  [810, 1080],
  [390, 844],
  [320, 640],
] as const) {
  test(`What's cookin' fits its rows at ${width}px: one line each, its GitHub button on the row's right`, { tag: width === 1280 || width === 320 ? '@cross-browser' : [] }, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    const band = page.locator('#lab section#upcoming')
    const rows = band.locator('section[data-group] li')
    await rows.first().scrollIntoViewIfNeeded()
    const boxes = await rows.evaluateAll((list) =>
      list.map((li) => {
        const r = li.getBoundingClientRect()
        const a = li.querySelector('a')!
        const b = (li.querySelector('[data-upcoming-github]') ?? a).getBoundingClientRect()
        const short = li.querySelector('[data-upcoming-short]')!
        return {
          left: r.left,
          right: r.right,
          height: r.height,
          linkRight: b.right,
          fits: a.scrollWidth <= a.clientWidth,
          // The few words stay on one line (cut short with an ellipsis when they must).
          oneLine: short.getBoundingClientRect().height < parseFloat(getComputedStyle(short).lineHeight) * 1.5,
        }
      })
    )
    // Rows in one column, two from 1024px (the groups side by side), each link inside its row and its label on one line.
    expect(new Set(boxes.map((b) => Math.round(b.left))).size).toBe(width >= 1024 ? 2 : 1)
    for (const b of boxes) {
      expect(b.linkRight).toBeLessThanOrEqual(b.right)
      expect(b.fits).toBe(true)
      expect(b.oneLine).toBe(true)
    }
    // Every row is the same tight height.
    expect(Math.max(...boxes.map((b) => b.height)) - Math.min(...boxes.map((b) => b.height))).toBeLessThan(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
    if (width >= 1024) {
      // Side by side, the two columns start and end level.
      const box = async (id: string) => (await band.locator(`section[data-group="${id}"]`).boundingBox())!
      const [habits, two] = [await box('habits'), await box('two')]
      expect(Math.abs(habits.y - two.y)).toBeLessThan(1)
      expect(Math.abs(habits.y + habits.height - (two.y + two.height))).toBeLessThan(1)
      expect(two.x).toBeGreaterThan(habits.x + habits.width)
      // The same width, and together they fill the part's content width: no gap left beside them.
      expect(Math.abs(habits.width - two.width)).toBeLessThan(1)
    }
  })
}

/**
 * Round 5 of 2026-11-02: on wide screens the waitlist is a sticky column beside
 * the cards, so visitors can sign up while reading; on smaller ones it stays
 * after the cards. One form either way: ?interest= and the cards' Join tick it.
 */
test('on a wide screen the waitlist stays beside the cards as you read, and Join ticks it in place', { tag: '@cross-browser' }, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/upcoming?interest=pivot')
  const waitlist = page.locator('#waitlist')
  await expect(waitlist).toHaveCount(1)
  await expect(waitlist.getByRole('checkbox', { name: /Pivot/ })).toBeChecked()
  const cards = (await page.locator('#feelium').boundingBox())!
  const form = (await waitlist.boundingBox())!
  expect(form.x, 'beside the cards').toBeGreaterThan(cards.x + cards.width)
  // Still in view far down the page.
  await page.locator('#cutelyaskme').scrollIntoViewIfNeeded()
  await expect(waitlist).toBeInViewport()
  const y = await page.evaluate(() => window.scrollY)
  await page.locator('#cutelyaskme').getByRole('link', { name: /Join the waitlist/ }).click()
  await expect(waitlist.getByRole('checkbox', { name: /Cutely Ask Me/ })).toBeChecked()
  // Ticked where it is, with a glow, not a jump.
  await expect(waitlist).toHaveAttribute('data-flash', '')
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - y)).toBeLessThan(2)
})
