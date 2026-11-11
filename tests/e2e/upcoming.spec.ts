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
  // In group order: for businesses, for everyday life, for developers and creators (round 7, 2026-11-09).
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
  // Statuses are back (round 11), as each landing page says.
  for (const [id, status] of [
    ['feelium', 'Try it now'],
    ['vibelog', 'Early access'],
    ['relink', 'In development'],
    ['asset-arsenal', 'Concept'],
  ]) {
    await expect(page.locator(`article#${id} [data-status]`)).toHaveText(status)
  }
  await expect(page.locator('article#keysready')).toContainText('Stop answering “Is my car ready?”')
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
    // Tablets and phones: the waitlist comes after the cards.
    if (width < 1000) {
      const last = (await page.locator('#asset-arsenal').boundingBox())!
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
  // Hydrated first: before that the link only jumps to the form, without ticking.
  await waitForForm(page)
  await page.locator('article#relink').getByRole('link', { name: 'Join the waitlist for Relink' }).click()
  await expect(project(page, 'Relink')).toBeChecked()
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeInViewport()
})

test('a visitor can join the waitlist', { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
  await page.goto('/upcoming?interest=relink#relink', { waitUntil: 'domcontentloaded' })
  await waitForForm(page)
  await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail())
  await waitForTurnstileToken(page)
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
  await waitForForm(page)
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await waitForTurnstileToken(page)
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
  await page.locator('article#relink').getByRole('link', { name: 'Join the waitlist for Relink' }).click()
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

/** Every project, in group order, and its landing page. */
const LANDING: Record<string, string> = {
  relink: 'https://relink.n8builds.dev',
  keysready: 'https://keysready.n8builds.dev',
  strollz: 'https://strollz.n8builds.dev',
  feelium: 'https://feelium.n8builds.dev',
  cutelyaskme: 'https://cutelyaskme.n8builds.dev',
  fitflow7: 'https://fitflow7.n8builds.dev',
  pivot: 'https://pivot.n8builds.dev/welcome',
  whoami: 'https://whoami.n8builds.dev',
  vibelog: 'https://vibelogs.dev',
  'asset-arsenal': 'https://assetarsenal.n8builds.dev',
}
const NAMES: Record<string, string> = {
  relink: 'Relink',
  keysready: 'KeysReady',
  strollz: 'Strollz',
  feelium: 'Feelium',
  cutelyaskme: 'Cutely Ask Me',
  fitflow7: 'FitFlow 7',
  pivot: 'Pivot',
  whoami: 'Who Am I?',
  vibelog: 'VibeLog',
  'asset-arsenal': 'Asset Arsenal',
}
/** The homepage's groups (data/upcoming.ts), in order, with their projects. */
const GROUPS: [string, string[]][] = [
  ['For businesses', ['relink', 'keysready']],
  ['For everyday life', ['strollz', 'feelium', 'cutelyaskme', 'fitflow7', 'pivot', 'whoami']],
  ['For developers & creators', ['vibelog', 'asset-arsenal']],
]

/**
 * Only public repositories get a GitHub button on
 * the homepage (checked 2026-11-09: all public but Asset Arsenal; Relink's repo is still deadlink).
 */
const CODE: Record<string, string | undefined> = {
  relink: 'https://github.com/n8watkins/deadlink',
  strollz: 'https://github.com/n8watkins/strollz',
  vibelog: 'https://github.com/n8watkins/vibelog',
  keysready: 'https://github.com/n8watkins/keysready',
  feelium: 'https://github.com/n8watkins/feelium',
  cutelyaskme: 'https://github.com/n8watkins/cutelyaskme',
  fitflow7: 'https://github.com/n8watkins/fitflow7',
  pivot: 'https://github.com/n8watkins/pivot',
  whoami: 'https://github.com/n8watkins/who-am-i',
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

test("Relink's card says plainly what it does", async ({ page }) => {
  await page.goto('/upcoming')
  await expect(page.locator('article#relink')).toContainText('Turns broken links into the right page')
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
      // ... and a GitHub button follows when the repo is public (not Asset Arsenal's).
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
  await expect(band.getByText('Sends broken links to the right page')).toBeVisible()
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
  await page.goto('/?interest=strollz#waitlist')
  const form = page.getByRole('dialog', { name: 'Join the waitlist' })
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
      const [business, life, creators] = [await box('business'), await box('life'), await box('creators')]
      expect(Math.abs(business.y - life.y)).toBeLessThan(1)
      expect(Math.abs(creators.y + creators.height - (life.y + life.height))).toBeLessThan(1)
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
  await page.goto('/upcoming?interest=strollz')
  const waitlist = page.locator('#waitlist')
  await expect(waitlist).toHaveCount(1)
  await expect(waitlist.getByRole('checkbox', { name: /Strollz/ })).toBeChecked()
  const cards = (await page.locator('#relink').boundingBox())!
  const form = (await waitlist.boundingBox())!
  expect(form.x, 'beside the cards').toBeGreaterThan(cards.x + cards.width)
  // Still in view far down the page.
  await page.locator('#asset-arsenal').scrollIntoViewIfNeeded()
  await expect(waitlist).toBeInViewport()
  const y = await page.evaluate(() => window.scrollY)
  await page.locator('#asset-arsenal').getByRole('link', { name: /Join the waitlist/ }).click()
  await expect(waitlist.getByRole('checkbox', { name: /Asset Arsenal/ })).toBeChecked()
  // Ticked where it is, with a glow, not a jump.
  await expect(waitlist).toHaveAttribute('data-flash', '')
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - y)).toBeLessThan(2)
})
