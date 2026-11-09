import { test, expect, type Page } from '@playwright/test'

/**
 * The homepage's compact build log (#build-log), right under "What I'm working
 * on" (2026-11-08): the month's two latest updates (round 3 of 2026-11-08; a
 * paged list of four before), a card cycling through the month's figures, a
 * one-line release-kit ad and a link to /builds. Against the recorded GitHub
 * fixture (BUILD_LOG_FIXTURE=1), whose capture time is the strip's "now", so
 * these don't drift as the months pass.
 *
 * Reduced motion by default (nothing moves by itself); the card's own motion
 * tests ask for it.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const strip = (page: Page) => page.locator('#build-log')
/** The latest updates (two at most since round 3 of 2026-11-08; a paged list of four before). */
const list = (page: Page) => strip(page).getByRole('list', { name: /^Latest/ })
const rows = (page: Page) => list(page).getByRole('listitem')
const stats = (page: Page) => strip(page).getByRole('group', { name: /^Shipped / })
const slides = (page: Page) => stats(page).locator('[data-stat]')
const current = (page: Page) => stats(page).locator('[data-stat][aria-hidden="false"]')
const dots = (page: Page) => stats(page).getByRole('button', { name: /^Show / })
/** October in the recorded fixture: every update, newest first. */
const OCTOBER_UPDATES = 7

test("sits right under What I'm working on, above the Lab, in the server-rendered HTML", async ({ page, request }) => {
  const html = await (await request.get('/')).text()
  const at = (id: string) => html.indexOf(`id="${id}"`)
  expect(at('build-log')).toBeGreaterThan(at('now'))
  for (const later of ['lab', 'featured', 'extensions', 'upcoming']) expect(at('build-log')).toBeLessThan(at(later))

  await page.goto('/')
  await strip(page).scrollIntoViewIfNeeded()
  // Headed like a Lab part, with its coloured bar and animated scroll icon (2026-11-08).
  // "Build log" is the heading, with no eyebrow; the month is named once, on the card (round 4 of 2026-11-08).
  await expect(strip(page).getByRole('heading', { level: 3 })).toHaveText('Build log')
  await expect(strip(page).locator('.part-icon-scroll')).toBeVisible()
  await expect(strip(page)).not.toContainText('pulled from GitHub')
  await expect(strip(page)).toHaveAccessibleName('Build log')
  await expect(strip(page).locator('[data-month-line]')).toHaveCount(0)
  await expect(strip(page)).not.toContainText('Shipped this month')
  await expect(strip(page).locator('[data-month]')).toHaveText('October 2026')
  await expect(strip(page)).not.toContainText('every project')
  await expect(strip(page)).toHaveClass(/lab-accent-buildlog/)
  expect(await page.locator('main').innerText()).not.toContain('—')
})

test("shows the month's updates two at a time, newest first, with arrows to step through them", async ({ page }) => {
  await page.goto('/')
  await strip(page).scrollIntoViewIfNeeded()
  await expect(list(page)).toHaveAccessibleName('Latest this month')
  await expect(rows(page)).toHaveCount(2)
  const dates = await rows(page).locator('time').evaluateAll((els) => els.map((el) => el.getAttribute('datetime')!))
  expect(dates).toEqual([...dates].sort().reverse())
  expect(dates.every((d) => d.startsWith('2026-10'))).toBe(true)
  // One icon frame for every row; a release says so with a badge (round 4 of 2026-11-08).
  const frames = await rows(page).locator('img').evaluateAll((imgs) => imgs.map((i) => getComputedStyle(i).boxShadow))
  expect(new Set(frames).size).toBe(1)
  const position = strip(page).locator('[data-position]')
  await expect(position).toHaveText(`1 / ${OCTOBER_UPDATES}`)
  // Under reduced motion it never moves by itself; the arrows step one update either way, and round.
  await strip(page).getByRole('button', { name: 'Older update' }).click()
  await expect(position).toHaveText(`2 / ${OCTOBER_UPDATES}`)
  await expect(rows(page)).toHaveCount(2)
  await strip(page).getByRole('button', { name: 'Newer update' }).click()
  await strip(page).getByRole('button', { name: 'Newer update' }).click()
  await expect(position).toHaveText(`${OCTOBER_UPDATES} / ${OCTOBER_UPDATES}`)
})

test('a row opens its build in the full log, filtered', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/')
  const first = rows(page).first()
  await first.scrollIntoViewIfNeeded()
  const link = first.getByRole('link')
  // Screen readers hear the build and the entry, not the build alone.
  const title = (await first.locator('p').nth(1).innerText()).trim()
  await expect(link).toHaveAccessibleName(new RegExp(`^\\S.+ ${title.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
  const build = new URL((await link.getAttribute('href'))!, 'http://x').searchParams.get('build')!
  await link.click()
  await expect(page).toHaveURL(new RegExp(`/builds\\?build=${build}$`))
  await expect(page.locator('#activity li[data-kind]').first()).toHaveAttribute('data-build', build)
})

test("the card shows the month's changes, a bar per day and the other figures, all in the HTML", async ({ page, request }) => {
  // Server-rendered: the card is complete, with its final numbers, before any JavaScript runs.
  const html = await (await request.get('/')).text()
  expect(html).toContain('changes shipped')
  expect(html).toContain('builds touched')
  expect(html).toContain('busiest build')
  expect(html).not.toContain('last 6 months')

  await page.goto('/')
  await stats(page).scrollIntoViewIfNeeded()
  await expect(stats(page)).toHaveAttribute('aria-roledescription', 'carousel')
  await expect(stats(page)).toContainText('October')
  // The headline: the month's changes, read out whole.
  const headline = stats(page).locator('[data-headline]')
  await expect(headline.locator('.sr-only')).toHaveText(/^\d+ changes shipped$/)
  const total = (await headline.locator('.sr-only').innerText()).split(' ')[0]
  await expect(headline.locator('[data-count]')).toHaveText(total)
  // A bar per day of October, summed up for screen readers.
  await expect(stats(page).locator('[data-bars] [data-day]')).toHaveCount(31)
  await expect(stats(page).locator('[data-bars]')).toHaveAttribute('aria-label', /^Changes per day: something shipped on \d+ of \d+ days so far, the most on Oct \d+ \(\d+\)\.$/)
  // The other figures, the busiest build (with its icon) first.
  const ids = await slides(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-stat')))
  expect(ids[0]).toBe('busiest')
  expect(ids).toContain('builds')
  expect(ids).toContain('days')
  expect(ids).not.toContain('changes')
  await expect(dots(page)).toHaveCount(ids.length)
  await expect(current(page)).toHaveCount(1)
  await expect(current(page)).toHaveAttribute('data-stat', 'busiest')
  await expect(current(page)).toContainText(/busiest build, \d+ changes?$/)
  await expect(slides(page).and(page.locator('[data-stat="busiest"]')).locator('img')).toHaveCount(1)
})

test('reduced motion holds the first figure and shows the final number at once; a dot picks one and announces it', async ({ page }) => {
  await page.goto('/')
  await stats(page).scrollIntoViewIfNeeded()
  await page.waitForTimeout(4600)
  await expect(current(page)).toHaveAttribute('data-stat', 'busiest')
  await expect(stats(page)).toHaveAttribute('data-entrance', 'idle')
  const total = (await stats(page).locator('[data-headline] .sr-only').innerText()).split(' ')[0]
  await expect(stats(page).locator('[data-count]')).toHaveText(total)

  const live = stats(page).locator('[aria-live="polite"]')
  await expect(live).toHaveText('')
  const second = await slides(page).nth(1).getAttribute('data-stat')
  await expect(async () => {
    await dots(page).nth(1).click()
    await expect(current(page)).toHaveAttribute('data-stat', second!, { timeout: 2000 })
  }).toPass({ timeout: 15_000 })
  await expect(dots(page).nth(1)).toHaveAttribute('aria-current', 'true')
  await expect(live).not.toHaveText('')
})

test.describe('with motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('moves on by itself while in view, and holds while hovered', { tag: '@cross-browser' }, async ({ page }) => {
    await page.goto('/')
    // An instant jump: with motion allowed the site scrolls smoothly.
    await stats(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    // The timer starts once the hydrated watcher sees the card, which a loaded
    // CI runner can delay by seconds (the mobile-chrome flake on #112); wait
    // for that, then give the 7s timer (4s until round 3 of 2026-11-08) its margin.
    await expect(stats(page)).toHaveAttribute('data-in-view', '', { timeout: 20_000 })
    const second = await slides(page).nth(1).getAttribute('data-stat')
    await expect(current(page)).toHaveAttribute('data-stat', second!, { timeout: 12_000 })
    // The timer never speaks: only a picked figure is announced.
    await expect(stats(page).locator('[aria-live="polite"]')).toHaveText('')

    await stats(page).hover()
    const held = await current(page).getAttribute('data-stat')
    await page.waitForTimeout(8000)
    await expect(current(page)).toHaveAttribute('data-stat', held!)
  })

  test('the number counts up and the bars rise the first time the card comes into view', { tag: '@cross-browser' }, async ({ page }) => {
    await page.goto('/')
    const card = stats(page)
    // Off screen once hydrated: armed, waiting at zero with the bars flat.
    await expect(card).toHaveAttribute('data-entrance', 'armed', { timeout: 20_000 })
    await expect(card.locator('[data-count]')).toHaveText('0')
    const total = (await card.locator('[data-headline] .sr-only').innerText()).split(' ')[0]
    await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await expect(card).toHaveAttribute('data-entrance', 'played')
    await expect(card.locator('[data-count]')).toHaveText(total, { timeout: 5000 })
    await expect
      .poll(() => card.locator('[data-bars] [data-day]').first().evaluate((bar) => getComputedStyle(bar).transform))
      .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/)
  })
})

/**
 * The months before (round 5 of 2026-11-02): arrows beside the card's month
 * go back through the months with updates, as far as the /builds feed's
 * 12-month window, and forward again, going round at either end (round 4 of
 * 2026-11-08); each is a whole month, its own figures, bars and updates.
 * Only the month on screen is mounted.
 */
test('the month arrows go back through the year and round, each month with its year', async ({ page }) => {
  await page.goto('/')
  await stats(page).scrollIntoViewIfNeeded()
  const months = strip(page).getByRole('group', { name: 'Months' })
  const back = months.getByRole('button', { name: /^Previous month/ })
  const forward = months.getByRole('button', { name: /^Next month/ })
  // The arrows go round (owner, round 4 of 2026-11-08): on from the newest month is the oldest.
  await expect(forward).toBeEnabled()
  await expect(back).toHaveAccessibleName(/^Previous month: \w+ 2026$/)
  const previous = (await back.getAttribute('title'))!
  const oldest = (await forward.getAttribute('title'))!

  await expect(async () => {
    await back.click()
    await expect(strip(page).locator('[data-month]')).toHaveText(previous, { timeout: 2000 })
  }).toPass({ timeout: 15_000 })
  // Its own updates, from that month; its own card.
  const earlier = strip(page).getByRole('list', { name: `Latest in ${previous}` })
  await expect(earlier).toBeVisible()
  const month = previous.split(' ')[0].slice(0, 3).toUpperCase()
  // textContent: on phones the row's <time> is hidden (its day rides on the name line).
  const days = await earlier.locator('li time').allTextContents()
  expect(days.length).toBeGreaterThan(0)
  expect(days.every((d) => d.toUpperCase().startsWith(month))).toBe(true)
  await expect(stats(page)).toHaveAccessibleName(`Shipped ${previous}`)
  // A past month has no "days in a row, and counting".
  await expect(stats(page).locator('[data-stat="streak"]')).toHaveCount(0)
  await expect(strip(page).locator('[aria-live="polite"]').filter({ hasText: `Showing ${previous}` })).toHaveCount(1)

  // Back to the newest month as it was.
  await forward.click()
  await expect(strip(page).locator('[data-month]')).toHaveText('October 2026')
  await expect(rows(page)).toHaveCount(2)

  // On from the newest goes round to the oldest, named with its year; back from there is the newest again.
  await forward.click()
  await expect(strip(page).locator('[data-month]')).toHaveText(oldest)
  await back.click()
  await expect(strip(page).locator('[data-month]')).toHaveText('October 2026')
})

test('"See the full build log" goes to /builds', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/')
  await strip(page).getByRole('link', { name: 'See the full build log' }).click()
  await expect(page).toHaveURL(/\/builds$/)
  await expect(page.getByRole('heading', { level: 1, name: 'The build log' })).toBeVisible()
})

test('works from the keyboard: the button, the figures, each row, then release-kit', { tag: '@cross-browser' }, async ({ page }) => {
  await page.goto('/')
  const button = strip(page).getByRole('link', { name: 'See the full build log' })
  await button.scrollIntoViewIfNeeded()
  const rowCount = await rows(page).count()
  const dotCount = await dots(page).count()
  await button.focus()
  // The figures card sits left of the rows: the month's arrows (both ways, they go round),
  // the figure itself (it moves on to the next one), its dots, then the updates' arrows and rows.
  await page.keyboard.press('Tab')
  await expect(stats(page).getByRole('button', { name: /^Previous month: / })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(stats(page).getByRole('button', { name: /^Next month: / })).toBeFocused()
  await page.keyboard.press('Tab')
  const figure = stats(page).getByRole('button', { name: /^n8builds.dev busiest build/ })
  await expect(figure).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(current(page)).toHaveAttribute('data-stat', (await slides(page).nth(1).getAttribute('data-stat'))!)
  for (let i = 0; i < dotCount; i++) await page.keyboard.press('Tab')
  await expect(dots(page).last()).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(strip(page).getByRole('button', { name: 'Newer update' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(strip(page).getByRole('button', { name: 'Older update' })).toBeFocused()
  const order: string[] = []
  for (let i = 0; i < rowCount; i++) {
    await page.keyboard.press('Tab')
    order.push(await page.evaluate(() => document.activeElement?.getAttribute('href') ?? ''))
  }
  expect(order.every((href) => href.startsWith('/builds?build='))).toBe(true)
  // Then the release-kit ad's link.
  await page.keyboard.press('Tab')
  await expect(strip(page).getByRole('link', { name: /^Get release-kit/ })).toBeFocused()

  // The focused row shows a ring.
  await rows(page).first().locator('a').first().focus()
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement!, '::after').boxShadow)
  expect(ring).not.toBe('none')
})

test('phones show two updates at a time too, with the date on the name line', { tag: '@cross-browser' }, async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await strip(page).scrollIntoViewIfNeeded()
  await expect(rows(page)).toHaveCount(2)
  await expect(rows(page).first().locator('time')).toBeHidden()
  await expect(rows(page).first().locator('p').first()).toContainText(/Oct \d+/)
  // Nothing in the strip is wider than the screen.
  expect(await strip(page).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
})

test('beside the log, a compact note says release-kit writes it and links its repo on GitHub', { tag: '@cross-browser' }, async ({ page }) => {
  await page.goto('/')
  const ad = strip(page).getByRole('complementary', { name: /This log writes itself with release-kit/ })
  await ad.scrollIntoViewIfNeeded()
  await expect(ad).toContainText('commits in, versions and release notes out')
  const link = ad.getByRole('link', { name: /^Get release-kit/ })
  await expect(link).toHaveAttribute('href', 'https://github.com/n8watkins/release-kit')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAccessibleName(/on GitHub/)
  // GitHub's mark and the arrow out.
  await expect(link.locator('svg')).toHaveCount(2)
  // "release-kit" never breaks at its hyphen.
  const lines = await ad.locator('.font-mono').evaluate((el) => new Set([...el.getClientRects()].map((r) => Math.round(r.top))).size)
  expect(lines).toBe(1)
  // From 1024px it is the card's third column, beside the updates (round 4 of 2026-11-08).
  if ((page.viewportSize()?.width ?? 0) >= 1100) {
    const [note, updates] = [(await ad.boundingBox())!, (await list(page).boundingBox())!]
    expect(note.x).toBeGreaterThan(updates.x + updates.width)
  }
})

test.describe('the updates with motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('move on one by one while in view, and hold while hovered', async ({ page }) => {
    await page.goto('/')
    const updates = strip(page).locator('[data-watching]:has(ul[aria-label^="Latest"])')
    await list(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await page.mouse.move(0, 0)
    await expect(updates).toHaveAttribute('data-cycling', '', { timeout: 20_000 })
    const position = strip(page).locator('[data-position]')
    await expect(position).toHaveText(`2 / ${OCTOBER_UPDATES}`, { timeout: 12_000 })
    await list(page).hover()
    await expect(updates).not.toHaveAttribute('data-cycling')
  })
})
