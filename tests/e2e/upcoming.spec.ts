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

async function waitForTurnstileToken(page: Page) {
  // Its Turnstile loads once the form nears the screen (hooks/useNearViewport.ts).
  await page.locator('#waitlist').scrollIntoViewIfNeeded()
  await expect(page.locator('#waitlist input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: SEND_TIMEOUT })
}

const project = (page: Page, name: string) => page.locator('#waitlist-projects').getByRole('checkbox', { name: new RegExp(name) })

test('shows each project with its own anchor, and is titled for the site', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/upcoming')
  await expect(page).toHaveTitle('Upcoming | n8builds')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What’s cookin’')
  await expect(page.locator('main article')).toHaveCount(6)
  for (const [id, name, status] of [
    ['relink', 'Relink', 'Outlining'],
    ['strollz', 'Strollz', 'Outlining'],
    ['vibelog', 'VibeLog', 'Outlining'],
    ['keysready', 'KeysReady', 'Concept'],
    ['asset-arsenal', 'Asset Arsenal', 'Outlining'],
    ['feelium', 'Feelium', 'Concept'],
  ]) {
    const card = page.locator(`article#${id}`)
    await expect(card.getByRole('heading', { level: 2 })).toContainText(name)
    await expect(card.getByText(`Status: ${status}`)).toBeVisible()
    await expect(card.getByRole('listitem')).toHaveCount(4)
  }
  await expect(page.locator('article#keysready')).toContainText('Stop answering “Is my car ready?”')
  await expect(page.locator('#waitlist-projects').getByRole('checkbox')).toHaveCount(6)
})

test('lays the cards out one to a row beside the waitlist on wide screens, two by two just below, one column on phones', { tag: '@cross-browser' }, async ({ page }) => {
  // 1040, not 1024: WebKit's media queries see the window minus its scrollbar.
  for (const [width, columns] of [
    [1280, 1],
    [1040, 1],
    [1000, 2],
    [810, 1],
    [390, 1],
  ]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/upcoming')
    const lefts = await page.locator('main article').evaluateAll((cards) => cards.map((c) => Math.round(c.getBoundingClientRect().left)))
    expect(new Set(lefts).size, `columns at ${width}px`).toBe(columns)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
    // Tablets and phones: the waitlist comes after the cards.
    if (width < 1000) {
      const last = (await page.locator('#keysready').boundingBox())!
      const form = (await page.locator('#waitlist').boundingBox())!
      expect(form.y, `the waitlist after the cards at ${width}px`).toBeGreaterThan(last.y + last.height)
    }
  }
})

test('a landing page link preselects its project and lands on its card', { tag: '@cross-browser' }, async ({ page }) => {
  await page.goto('/upcoming?interest=strollz#strollz')
  await expect(project(page, 'Strollz')).toBeChecked()
  await expect(project(page, 'Relink')).not.toBeChecked()
  await expect(page.locator('article#strollz')).toBeInViewport()
})

test("links from before Relink's rename still preselect it", async ({ page }) => {
  await page.goto('/upcoming?interest=rewire#rewire')
  await expect(project(page, 'Relink')).toBeChecked()
  await expect(page.locator('article#relink')).toBeInViewport()
})

test("a card's Join button ticks its project and brings the form into view", { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
  await page.goto('/upcoming')
  await page.locator('article#relink').getByRole('link', { name: 'Join the waitlist for Relink' }).click()
  await expect(project(page, 'Relink')).toBeChecked()
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeInViewport()
})

test('a visitor can join the waitlist', { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
  await page.goto('/upcoming?interest=relink#relink', { waitUntil: 'domcontentloaded' })
  await waitForTurnstileToken(page)
  await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail())
  await page.locator('#waitlist-projects label', { hasText: 'Strollz' }).click()
  await expect(project(page, 'Strollz')).toBeChecked()
  // No note field (owner, 2026-11-02): email and projects are all it asks.
  await expect(page.locator('#waitlist textarea')).toHaveCount(0)

  const request = page.waitForRequest('/api/waitlist')
  await page.getByRole('button', { name: 'Join the waitlist' }).click()
  const body = (await request).postDataJSON()
  expect(body).toMatchObject({ projects: ['relink', 'strollz'], source: { interest: 'relink' }, honeypot: '' })
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
  await waitForTurnstileToken(page)
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.locator('#waitlist-projects label', { hasText: 'KeysReady' }).click()
  await page.getByRole('button', { name: 'Join the waitlist' }).click()
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({ timeout: SEND_TIMEOUT })

  // The confirm email: its button confirms both projects, once.
  const confirm = await emailedLink(page, email, '/upcoming/confirm')
  await page.goto(confirm)
  await page.getByRole('button', { name: 'Confirm my spot' }).click()
  await expect(page.locator('main').getByRole('status')).toContainText("You're on the list for KeysReady and Feelium")
  await page.goto(confirm)
  await page.getByRole('button', { name: 'Confirm my spot' }).click()
  await expect(page.locator('main').getByRole('alert')).toContainText('expired')

  // Its leave link deletes the entry; after that, neither link does anything.
  const leave = await emailedLink(page, email, '/upcoming/leave')
  await page.goto(leave)
  await page.getByRole('button', { name: 'Remove me from the waitlist' }).click()
  await expect(page.locator('main').getByRole('status')).toContainText('everything stored with it are deleted')
  await page.goto(leave)
  await page.getByRole('button', { name: 'Remove me from the waitlist' }).click()
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
  await page.goto('/upcoming?interest=relink')
  await waitForTurnstileToken(page)
  await page.route('/api/waitlist', (route) =>
    route.fulfill({ status: 503, json: { error: 'The waitlist is having trouble right now.', type: 'unavailable' } })
  )
  await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail())
  await page.getByRole('button', { name: 'Join the waitlist' }).click()
  await expect(page.locator('main').getByRole('alert')).toHaveText('The waitlist is having trouble right now.')
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
  await page.goto('/upcoming/leave', { waitUntil: 'domcontentloaded' })
  await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail())
  const send = page.getByRole('button', { name: 'Email me a link' })
  // Enabled once Turnstile has issued a token.
  await expect(send).toBeEnabled({ timeout: SEND_TIMEOUT })
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

const LANDING = {
  relink: 'https://relink.n8builds.dev',
  strollz: 'https://strollz.n8builds.dev',
  vibelog: 'https://vibelogs.dev',
  keysready: 'https://keysready.n8builds.dev',
  'asset-arsenal': 'https://assetarsenal.n8builds.dev',
  feelium: 'https://feelium.n8builds.dev',
}
const NAMES: Record<string, string> = {
  relink: 'Relink',
  strollz: 'Strollz',
  vibelog: 'VibeLog',
  keysready: 'KeysReady',
  'asset-arsenal': 'Asset Arsenal',
  feelium: 'Feelium',
}

/**
 * Only public repositories get a "View the code" link: the first four are public since
 * 2026-11-02 (Relink's repo is still deadlink); Asset Arsenal's is not yet.
 */
const CODE: Record<string, string | undefined> = {
  relink: 'https://github.com/n8watkins/deadlink',
  strollz: 'https://github.com/n8watkins/strollz',
  vibelog: 'https://github.com/n8watkins/vibelog',
  keysready: 'https://github.com/n8watkins/keysready',
  feelium: 'https://github.com/n8watkins/feelium',
}

test('each card leads with its landing page, then Join, then its code where public (hrefs only: the sites may not be live yet)', async ({ page }) => {
  await page.goto('/upcoming')
  for (const [slug, href] of Object.entries(LANDING)) {
    const card = page.locator(`article#${slug}`)
    const name = NAMES[slug]
    const landing = card.getByRole('link', { name: `Check out the landing page for ${name} (opens in a new tab)` })
    await expect(landing).toHaveAttribute('href', href)
    await expect(landing).toHaveAttribute('target', '_blank')
    // The landing page is the first action, Join the second.
    const actions = card.getByRole('link', { name: /landing page|Join the waitlist|View the code/ })
    await expect(actions.nth(0)).toHaveAccessibleName(/^Check out the landing page/)
    await expect(actions.nth(1)).toHaveAccessibleName(`Join the waitlist for ${name}`)
    const code = card.getByRole('link', { name: /^View the code/ })
    if (CODE[slug]) await expect(code).toHaveAttribute('href', CODE[slug]!)
    else await expect(code).toHaveCount(0)
  }
})

test("Relink's card says plainly what it does", async ({ page }) => {
  await page.goto('/upcoming')
  await expect(page.locator('article#relink')).toContainText('Turns broken links into the right page')
})

test("the homepage Lab ends with a compact What's cookin' part: a row per project with its landing page, and the waitlist behind a button", async ({ page }) => {
  await page.goto('/')
  const band = page.locator('#lab section#upcoming')
  // An animated pot in a chip beside the heading (2026-11-08; the 🍲 before), for the eye only.
  await expect(band.getByRole('heading', { level: 3 })).toHaveText('What’s cookin’')
  await expect(band.locator('.part-icon-pot')).toHaveAttribute('aria-hidden', 'true')
  await expect(band.getByText('Upcoming', { exact: true })).toBeVisible()
  // Feelium is on /upcoming and in the waitlist, but not in the homepage list (data/upcoming.ts `homepage`).
  const rows = band.locator('ul > li')
  await expect(rows).toHaveCount(5)
  for (const [i, [slug, href]] of Object.entries(LANDING).filter(([slug]) => slug !== 'feelium').entries()) {
    const name = NAMES[slug]
    const row = rows.nth(i)
    await expect(row.getByRole('heading', { level: 4 })).toHaveText(name)
    // One line: the tagline, no summary paragraph.
    await expect(row.locator('p')).toHaveCount(1)
    // One link: the landing page; the code and the full cards are on /upcoming.
    await expect(row.getByRole('link')).toHaveCount(1)
    const landing = row.getByRole('link', { name: `Landing page for ${name} (opens in a new tab)` })
    await expect(landing).toHaveAttribute('href', href)
  }
  await expect(rows.first()).toContainText('Turns broken links into the right page')
  await expect(band.getByText('Status:')).toHaveCount(0)

  // The waitlist: the same form as /upcoming, opened by one button.
  const join = band.locator('button[aria-controls="waitlist"]')
  await expect(join).toHaveAccessibleName('Join the waitlist')
  const form = band.locator('#waitlist')
  await expect(join).toHaveAttribute('aria-expanded', 'false')
  await expect(form).toBeHidden()
  await join.click()
  await expect(join).toHaveAttribute('aria-expanded', 'true')
  await expect(form.getByRole('heading', { level: 4, name: 'Join the waitlist' })).toBeVisible()
  await expect(form.getByRole('checkbox')).toHaveCount(6)
  await expect(form.locator('textarea')).toHaveCount(0)
  await join.click()
  await expect(form).toBeHidden()

  await band.getByRole('link', { name: 'See all upcoming' }).click()
  await expect(page).toHaveURL(/\/upcoming$/)
})

test('a landing page link to the homepage opens the waitlist there and ticks its project', async ({ page }) => {
  await page.goto('/?interest=strollz#waitlist')
  const form = page.locator('#lab section#upcoming #waitlist')
  await expect(form).toBeVisible()
  await expect(form).toBeInViewport()
  await expect(form.locator('input[value="strollz"]')).toBeChecked()
  await expect(form.locator('input[value="relink"]')).not.toBeChecked()
})

for (const [width, height] of [
  [1280, 800],
  [810, 1080],
  [390, 844],
  [320, 640],
] as const) {
  test(`What's cookin' fits its rows at ${width}px: one row each, the landing page on the row's right`, { tag: width === 1280 || width === 320 ? '@cross-browser' : [] }, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    const band = page.locator('#lab section#upcoming')
    const rows = band.locator('ul > li')
    await rows.first().scrollIntoViewIfNeeded()
    const boxes = await rows.evaluateAll((list) =>
      list.map((li) => {
        const r = li.getBoundingClientRect()
        const a = li.querySelector('a')!
        const b = a.getBoundingClientRect()
        return { left: r.left, right: r.right, linkRight: b.right, fits: a.scrollWidth <= a.clientWidth }
      })
    )
    // Stacked rows, all the same width, each link inside its row and its label on one line.
    expect(new Set(boxes.map((b) => Math.round(b.left))).size).toBe(1)
    for (const b of boxes) {
      expect(b.linkRight).toBeLessThanOrEqual(b.right)
      expect(b.fits).toBe(true)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  })
}

/**
 * Round 5 of 2026-11-02: on wide screens the waitlist is a sticky column beside
 * the cards, so visitors can sign up while reading; on smaller ones it stays
 * after the cards. One form either way: ?interest= and the cards' Join tick it.
 */
test('on a wide screen the waitlist stays beside the cards as you read, and Join ticks it in place', { tag: '@cross-browser' }, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/upcoming?interest=strollz')
  const waitlist = page.locator('#waitlist')
  await expect(waitlist).toHaveCount(1)
  await expect(waitlist.getByRole('checkbox', { name: /Strollz/ })).toBeChecked()
  const cards = (await page.locator('#relink').boundingBox())!
  const form = (await waitlist.boundingBox())!
  expect(form.x, 'beside the cards').toBeGreaterThan(cards.x + cards.width)
  // Still in view far down the page.
  await page.locator('#keysready').scrollIntoViewIfNeeded()
  await expect(waitlist).toBeInViewport()
  const y = await page.evaluate(() => window.scrollY)
  await page.locator('#keysready').getByRole('link', { name: /Join the waitlist/ }).click()
  await expect(waitlist.getByRole('checkbox', { name: /KeysReady/ })).toBeChecked()
  // Ticked where it is, with a glow, not a jump.
  await expect(waitlist).toHaveAttribute('data-flash', '')
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - y)).toBeLessThan(2)
})
