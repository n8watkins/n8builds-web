import { test, expect, type Page } from '@playwright/test'
import { SEND_TIMEOUT } from '../e2e-env'

/**
 * /upcoming: the projects I'm outlining and their waitlist, driven like a
 * visitor would. The test server runs in CONTACT_TEST_MODE: sign-ups go to an
 * in-memory store, no email is sent, and Turnstile uses Cloudflare's
 * always-pass test key.
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
  await expect(page.locator('#waitlist input[name="cf-turnstile-response"]')).toHaveValue(/.+/, { timeout: SEND_TIMEOUT })
}

const project = (page: Page, name: string) => page.locator('#waitlist-projects').getByRole('checkbox', { name: new RegExp(name) })

test('shows each project with its own anchor, and is titled for the site', async ({ page }) => {
  await page.goto('/upcoming')
  await expect(page).toHaveTitle('Upcoming | n8builds')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What’s cookin’')
  await expect(page.locator('main article')).toHaveCount(4)
  for (const [id, name, status] of [
    ['relink', 'Relink', 'Outlining'],
    ['strollz', 'Strollz', 'Outlining'],
    ['vibelog', 'VibeLog', 'Outlining'],
    ['keysready', 'KeysReady', 'Concept'],
  ]) {
    const card = page.locator(`article#${id}`)
    await expect(card.getByRole('heading', { level: 2 })).toContainText(name)
    await expect(card.getByText(`Status: ${status}`)).toBeVisible()
    await expect(card.getByRole('listitem')).toHaveCount(4)
  }
  await expect(page.locator('article#keysready')).toContainText('Stop answering “Is my car ready?”')
  await expect(page.locator('#waitlist-projects').getByRole('checkbox')).toHaveCount(4)
})

test('lays the four cards out two by two on wide screens and in one column below', async ({ page }) => {
  for (const [width, columns] of [
    [1280, 2],
    [1024, 2],
    [810, 1],
    [390, 1],
  ]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/upcoming')
    const lefts = await page.locator('main article').evaluateAll((cards) => cards.map((c) => Math.round(c.getBoundingClientRect().left)))
    expect(new Set(lefts).size, `columns at ${width}px`).toBe(columns)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  }
})

test("KeysReady's landing page link preselects it and lands on its card", async ({ page }) => {
  await page.goto('/upcoming?interest=keysready#keysready')
  await expect(project(page, 'KeysReady')).toBeChecked()
  await expect(project(page, 'Relink')).not.toBeChecked()
  await expect(page.locator('article#keysready')).toBeInViewport()
})

test('a landing page link preselects its project and lands on its card', async ({ page }) => {
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

test("a card's Join button ticks its project and brings the form into view", async ({ page }) => {
  await page.goto('/upcoming')
  await page.locator('article#relink').getByRole('link', { name: 'Join the waitlist for Relink' }).click()
  await expect(project(page, 'Relink')).toBeChecked()
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeInViewport()
})

test('a visitor can join the waitlist', async ({ page }) => {
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

test('asks for a project and a valid email before sending anything', async ({ page }) => {
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
}
const NAMES: Record<string, string> = { relink: 'Relink', strollz: 'Strollz', vibelog: 'VibeLog', keysready: 'KeysReady' }

/** Only public repositories get a "View the code" link: all four are public since 2026-11-02 (Relink's repo is still deadlink). */
const CODE: Record<string, string | undefined> = {
  relink: 'https://github.com/n8watkins/deadlink',
  strollz: 'https://github.com/n8watkins/strollz',
  vibelog: 'https://github.com/n8watkins/vibelog',
  keysready: 'https://github.com/n8watkins/keysready',
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

test("the homepage Lab ends with a short What's cookin' part: each project's summary and landing page, beside the waitlist", async ({ page }) => {
  await page.goto('/')
  const band = page.locator('#lab section#upcoming')
  await expect(band.getByRole('heading', { level: 3 })).toHaveText('What’s cookin’')
  await expect(band.getByText('Upcoming', { exact: true })).toBeVisible()
  await expect(band.locator('ul > li')).toHaveCount(4)
  // The same form as /upcoming, picking several projects (owner, 2026-11-02), without the note.
  await expect(band.locator('#waitlist').getByRole('heading', { level: 4, name: 'Join the waitlist' })).toBeVisible()
  await expect(band.locator('#waitlist').getByRole('checkbox')).toHaveCount(4)
  await expect(band.locator('#waitlist textarea')).toHaveCount(0)
  const cards = band.locator('ul > li')
  for (const [i, [slug, href]] of Object.entries(LANDING).entries()) {
    const name = NAMES[slug]
    const card = cards.nth(i)
    await expect(card.getByRole('heading', { level: 4 })).toHaveText(name)
    // A plain summary under the tagline: what it does, for whom.
    await expect(card.locator('p').nth(1)).toHaveText(/^\S.{40,}\.$/)
    // The landing page ("Live site") and the code side by side in one row; the
    // visitor picks projects in the form, so no per-card Join.
    const landing = card.getByRole('link', { name: `Live site for ${name} (opens in a new tab)` })
    await expect(landing).toHaveAttribute('href', href)
    const [landingBox, codeBox] = [(await landing.boundingBox())!, (await card.getByRole('link', { name: /^View the code/ }).boundingBox())!]
    expect(Math.abs(landingBox.y - codeBox.y)).toBeLessThan(1)
    expect(Math.abs(landingBox.height - codeBox.height)).toBeLessThan(1)
    expect(codeBox.x).toBeGreaterThan(landingBox.x + landingBox.width)
    await expect(card.getByRole('link', { name: /Join the waitlist/ })).toHaveCount(0)
    const code = card.getByRole('link', { name: /^View the code/ })
    if (CODE[slug]) await expect(code).toHaveAttribute('href', CODE[slug]!)
    else await expect(code).toHaveCount(0)
  }
  await expect(cards.first()).toContainText('When a visitor follows a broken link to your website')
  // The full detail stays on /upcoming.
  await expect(band.getByText('Status:')).toHaveCount(0)
  await band.getByRole('link', { name: 'See all upcoming' }).click()
  await expect(page).toHaveURL(/\/upcoming$/)
})

test('a landing page link to the homepage ticks its project in the waitlist there', async ({ page }) => {
  await page.goto('/?interest=strollz#waitlist')
  const form = page.locator('#lab section#upcoming #waitlist')
  await expect(form.locator('input[value="strollz"]')).toBeChecked()
  await expect(form.locator('input[value="relink"]')).not.toBeChecked()
})

// Cards two by two beside the waitlist from 1024px, two by two above it on tablets, one column on phones.
// 1040, not 1024: WebKit's media queries see the window minus its scrollbar,
// so a 1024px window there is still in the tablet layout.
for (const [width, height, columns, beside] of [
  [1440, 900, 2, true],
  [1280, 800, 2, true],
  [1040, 768, 2, true],
  [810, 1080, 2, false],
  [390, 844, 1, false],
  [320, 640, 1, false],
] as const) {
  test(`What's cookin' lays its cards and waitlist out evenly at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    const band = page.locator('#lab section#upcoming')
    const items = band.locator('ul > li')
    await expect(items).toHaveCount(4)
    await items.first().scrollIntoViewIfNeeded()
    const boxes = await items.evaluateAll((list) =>
      list.map((li) => ({ top: Math.round(li.getBoundingClientRect().top), height: li.getBoundingClientRect().height }))
    )
    const rows = new Map<number, number[]>()
    for (const { top, height } of boxes) rows.set(top, [...(rows.get(top) ?? []), height])
    // A balanced grid: every row full, so no card is left alone, and the cards in a row the same height.
    expect([...rows.values()].map((row) => row.length)).toEqual(Array(4 / columns).fill(columns))
    for (const heights of rows.values()) expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1)
    // Each button's label stays on one line inside it (its icons too), the buttons level across a row.
    const buttons = await items
      .getByRole('link', { name: /^(Live site|View the code)/ })
      .evaluateAll((links) =>
        links.map((a) => ({ height: a.getBoundingClientRect().height, fits: a.scrollWidth <= a.clientWidth, top: Math.round(a.getBoundingClientRect().top) }))
      )
    expect(buttons).toHaveLength(8)
    expect(await items.locator('a svg').evaluateAll((icons) => icons.every((svg) => svg.getBoundingClientRect().width >= 12))).toBe(true)
    for (const { height, fits } of buttons) {
      expect(height).toBeLessThanOrEqual(44)
      expect(fits).toBe(true)
    }
    if (columns === 2) expect(new Set(buttons.map((b) => b.top)).size).toBe(2)

    const grid = await items.evaluateAll((list) => {
      const r = list.map((li) => li.getBoundingClientRect())
      return { top: Math.min(...r.map((b) => b.top)), bottom: Math.max(...r.map((b) => b.bottom)), right: Math.max(...r.map((b) => b.right)) }
    })
    const panel = (await band.locator('#waitlist').boundingBox())!
    if (beside) {
      // The waitlist sits to the right of the cards, level with them top and bottom.
      expect(panel.x).toBeGreaterThan(grid.right)
      expect(Math.abs(panel.y - grid.top)).toBeLessThan(1)
      expect(Math.abs(panel.y + panel.height - grid.bottom)).toBeLessThan(1)
      // Cards and waitlist read as one screen on a laptop (1440x900, 1280x800): together they fit under the navbar.
      const navbar = (await page.getByRole('navigation', { name: 'Primary' }).first().boundingBox())!.height
      if (width >= 1280) expect(grid.bottom - grid.top).toBeLessThanOrEqual(height - navbar)
      // The whole part, from its eyebrow to the cards' bottom, fits too (1440x900 and, since round 3, 1280x800).
      const eyebrow = (await band.getByText('Upcoming', { exact: true }).boundingBox())!
      if (width >= 1280) expect(grid.bottom - eyebrow.y).toBeLessThanOrEqual(height - navbar - 16)
    } else {
      expect(panel.y).toBeGreaterThan(grid.bottom)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  })
}
