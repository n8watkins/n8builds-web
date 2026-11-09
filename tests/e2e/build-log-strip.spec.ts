import { test, expect, type Page } from '@playwright/test'

/**
 * The homepage's compact build log (#build-log), right under "What I'm working
 * on" (2026-11-08): the month's two latest updates (round 3 of 2026-11-08; a
 * paged list of four before), a card cycling through the month's figures, a
 * release-kit ad and a link to /builds. Against the recorded GitHub
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

test('the heading icon keeps writing its lines, softly, and holds still under reduced motion', async ({ browser }) => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    const context = await browser.newContext({ reducedMotion })
    const page = await context.newPage()
    await page.goto('/')
    const icon = strip(page).locator('.part-icon-scroll')
    await icon.scrollIntoViewIfNeeded()
    await expect(strip(page).locator('.reveal[data-revealed]').first()).toBeAttached()
    // The lines' loop (owner, 2026-11-09): CSS only, on both lines, after the scroll has unrolled.
    const loops = () =>
      icon.locator('.scroll-line').evaluateAll((lines) =>
        lines.map((line) => getComputedStyle(line).animationName.split(', ').includes('part-scroll-rewrite')),
      )
    if (reducedMotion === 'reduce') expect(await loops()).toEqual([false, false])
    else await expect.poll(loops).toEqual([true, true])
    await context.close()
  }
})

test("shows three of the month's updates at a time, newest first, each with a line of what's in it", async ({ page }) => {
  await page.goto('/')
  await strip(page).scrollIntoViewIfNeeded()
  await expect(strip(page).getByText("Some of the latest changes I've made")).toBeVisible()
  await expect(list(page)).toHaveAccessibleName('Latest this month')
  await expect(rows(page)).toHaveCount(3)
  const dates = await rows(page).locator('time').evaluateAll((els) => els.map((el) => el.getAttribute('datetime')!))
  expect(dates).toEqual([...dates].sort().reverse())
  expect(dates.every((d) => d.startsWith('2026-10'))).toBe(true)
  // One icon frame for every row; a release says so with a badge (round 4 of 2026-11-08).
  const frames = await rows(page).locator('img').evaluateAll((imgs) => imgs.map((i) => getComputedStyle(i).boxShadow))
  expect(new Set(frames).size).toBe(1)
  // A release's note shows under its title, on one line.
  const note = rows(page).filter({ hasText: /Shipped v1\.1\.1/ }).locator('p').last()
  await expect(note).toContainText('The portrait fades in with the hero')
  await expect(note).toHaveCSS('-webkit-line-clamp', '1')
  // Every entry is two lines under its name, note or not, so all three are the same height (owner, 2026-11-09).
  const heights = await rows(page).evaluateAll((items) => items.map((li) => Math.round(li.getBoundingClientRect().height)))
  expect(new Set(heights).size, heights.join(', ')).toBe(1)
  // Under reduced motion it holds still (no filling timer), but the arrows still step by hand.
  await expect(strip(page).locator('[data-latest-timer] .template-timer')).toHaveCount(0)
  await expect(strip(page).getByRole('button', { name: 'Next update' })).toBeVisible()
})

/**
 * Round 7 of 2026-11-09 (owner): visitors step through "Some of the latest
 * changes I've made" themselves, with arrows either side of the progress bar,
 * and a click on the bar jumps there. Reduced motion here, so only the
 * visitor moves it.
 */
test('the arrows and the progress bar step through the updates by hand, and say where they are', async ({ page }) => {
  await page.goto('/')
  const updates = strip(page).locator('[data-watching]:has(ul[aria-label^="Latest"])')
  await list(page).scrollIntoViewIfNeeded()
  await expect(updates).toHaveAttribute('data-watching', '')
  const firstRow = await rows(page).first().getAttribute('data-row')
  await strip(page).getByRole('button', { name: 'Next update' }).click()
  await expect(updates).toHaveAttribute('data-position', '2')
  // The one that was second moves up to first.
  await expect(rows(page).first()).toHaveAttribute('data-row', String(Number(firstRow) + 1))
  await expect(strip(page).locator('[aria-live="polite"]').filter({ hasText: /^Updates 2 to 4 of \d+$/ })).toHaveCount(1)
  await strip(page).getByRole('button', { name: 'Previous update' }).click()
  await expect(updates).toHaveAttribute('data-position', '1')
  // Back from the first goes round to the last.
  await strip(page).getByRole('button', { name: 'Previous update' }).click()
  const last = Number(await updates.getAttribute('data-position'))
  expect(last).toBeGreaterThan(3)
  // A click near the end of the bar jumps to the last step, near its start to the first.
  const bar = (await updates.locator('[data-latest-timer]').boundingBox())!
  await page.mouse.click(bar.x + 2, bar.y + bar.height / 2)
  await expect(updates).toHaveAttribute('data-position', '1')
  await page.mouse.click(bar.x + bar.width - 2, bar.y + bar.height / 2)
  await expect(updates).toHaveAttribute('data-position', String(last))
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
  await expect(rows(page)).toHaveCount(3)

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
  const order: string[] = []
  for (let i = 0; i < rowCount; i++) {
    await page.keyboard.press('Tab')
    order.push(await page.evaluate(() => document.activeElement?.getAttribute('href') ?? ''))
  }
  expect(order.every((href) => href.startsWith('/builds?build='))).toBe(true)
  // Then the updates' arrows (round 7 of 2026-11-09): Enter steps on, and focus stays put.
  await page.keyboard.press('Tab')
  await expect(strip(page).getByRole('button', { name: 'Previous update' })).toBeFocused()
  await page.keyboard.press('Tab')
  const next = strip(page).getByRole('button', { name: 'Next update' })
  await expect(next).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(strip(page).locator('[data-position="2"]')).toHaveCount(1)
  await expect(next).toBeFocused()
  // Then the release-kit ad's link.
  await page.keyboard.press('Tab')
  await expect(strip(page).getByRole('link', { name: /^Get release-kit/ })).toBeFocused()

  // The focused row shows a ring.
  await rows(page).first().locator('a').first().focus()
  // The whole row is its link, so the ring is its own outline.
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)
  expect(ring).not.toBe('none')
})

test('phones show three updates at a time too, with the date on the name line', { tag: '@cross-browser' }, async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await strip(page).scrollIntoViewIfNeeded()
  await expect(rows(page)).toHaveCount(3)
  await expect(rows(page).first().locator('time')).toBeHidden()
  await expect(rows(page).first().locator('p').first()).toContainText(/Oct \d+/)
  // Nothing in the strip is wider than the screen.
  expect(await strip(page).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
})

test('beside the log, an ad for release-kit: what it sets up, its one-command install, and Get release-kit with its stars', { tag: '@cross-browser' }, async ({ page }) => {
  await page.goto('/')
  // A product ad, not a note (round 6 of 2026-11-09).
  const ad = strip(page).getByRole('complementary', { name: 'release-kit Releases that write themselves' })
  await ad.scrollIntoViewIfNeeded()
  await expect(ad).toContainText('Open source · MIT')
  // What it does, so people want to try it (round 8 of 2026-11-09): four checks and the install.
  await expect(ad.getByRole('list', { name: 'What release-kit sets up' }).getByRole('listitem')).toHaveText([
    'Checks every commit message',
    'Picks each version for you',
    'Writes the notes, and this log',
    'Briefs your coding agents too',
  ])
  await expect(ad).toContainText('Set it up with one command')
  await expect(ad.locator('[data-release-kit-install]')).toHaveText('$ npx --allow-git=root github:n8watkins/release-kit .')
  const link = ad.getByRole('link', { name: /^Get release-kit/ })
  await expect(link).toHaveAttribute('href', 'https://github.com/n8watkins/release-kit')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAccessibleName(/on GitHub/)
  await expect(link.locator('svg')).toHaveCount(1)
  // Its star, beside it: the live count when it has one (the fixture has none for release-kit, so just the star).
  const star = ad.getByRole('link', { name: /^Star release-kit on GitHub/ })
  await expect(star).toHaveAttribute('href', 'https://github.com/n8watkins/release-kit')
  await expect(star.locator('[data-stars]')).toHaveCount(0)
  // "release-kit" never breaks at its hyphen.
  const lines = await ad.locator('#release-kit-name').evaluate((el) => new Set([...el.getClientRects()].map((r) => Math.round(r.top))).size)
  expect(lines).toBe(1)
  // Nothing in it spills past its column.
  expect(await ad.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
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
    // A thin line fills along the foot until the next step.
    await expect(updates.locator('[data-latest-timer] .template-timer')).toHaveCSS('animation-play-state', 'running')
    // Quicker since round 8 of 2026-11-09: 4 seconds a step (6.5 before).
    await expect(updates.locator('[data-latest-timer] .template-timer')).toHaveCSS('animation-duration', '4s')
    await expect(updates).toHaveAttribute('data-position', '2', { timeout: 12_000 })
    await list(page).hover()
    await expect(updates).not.toHaveAttribute('data-cycling')
    await expect(updates.locator('[data-latest-timer] .template-timer')).toHaveCSS('animation-play-state', 'paused')
  })
})

/**
 * Round 7 of 2026-11-09 (owner): a month's day bars fill in from left to right,
 * day by day, when the visitor switches months (CSS, nothing under reduced motion).
 */
test.describe('switching months with motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test("the month's bars fill in from left to right, a day at a time", async ({ page }) => {
    await page.goto('/')
    await stats(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await expect(stats(page)).toHaveAttribute('data-in-view', '')
    // Not before a switch: the first month's bars are as rendered.
    await expect(stats(page).locator('[data-bars] .log-bar-fill')).toHaveCount(0)
    await strip(page).getByRole('button', { name: /^Previous month/ }).click()
    const bars = stats(page).locator('[data-bars] [data-day]')
    const timing = await bars.evaluateAll((list) =>
      list.map((bar) => {
        const s = getComputedStyle(bar)
        return { name: s.animationName, delay: parseFloat(s.animationDelay) }
      }),
    )
    expect(timing.every((t) => t.name === 'log-bar-fill')).toBe(true)
    // Each day a step after the one before it.
    for (let i = 1; i < timing.length; i++) expect(timing[i].delay).toBeGreaterThan(timing[i - 1].delay)
    // And they all end standing.
    await expect
      .poll(() => bars.last().evaluate((bar) => getComputedStyle(bar).transform), { timeout: 3000 })
      .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/)
  })
})

test('under reduced motion the bars of a new month are just there', async ({ page }) => {
  await page.goto('/')
  await stats(page).scrollIntoViewIfNeeded()
  await strip(page).getByRole('button', { name: /^Previous month/ }).click()
  const names = await stats(page).locator('[data-bars] [data-day]').evaluateAll((list) => list.map((bar) => getComputedStyle(bar).animationName))
  expect(names.every((n) => n === 'none')).toBe(true)
})

for (const width of [1280, 820, 390]) {
  test(`every month's card is the same height, and so is every latest change (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const card = strip(page).locator('[data-log-months]')
    await card.scrollIntoViewIfNeeded()
    const months = Number(await card.getAttribute('data-log-months'))
    expect(months).toBeGreaterThan(2)
    const seen: { month: string; card: number; rows: number[]; text: number[] }[] = []
    for (let i = 0; i < months; i++) {
      seen.push(
        await card.evaluate((el) => ({
          month: el.querySelector('[data-month]')!.textContent!,
          card: el.getBoundingClientRect().height,
          rows: [...el.querySelectorAll('ul[aria-label^="Latest"] > li')].map((li) => li.getBoundingClientRect().height),
          // Two lines of text under the mono line in every row, the detail line kept when empty.
          text: [...el.querySelectorAll('[data-row-text]')].map((t) => t.children.length),
        })),
      )
      await strip(page).getByRole('button', { name: /^Previous month/ }).click()
    }
    expect(new Set(seen.map((m) => m.month)).size).toBe(months)
    const heights = seen.map((m) => m.card)
    expect(Math.max(...heights) - Math.min(...heights), JSON.stringify(seen)).toBeLessThan(0.5)
    const rows = seen.flatMap((m) => m.rows)
    expect(Math.max(...rows) - Math.min(...rows)).toBeLessThan(0.5)
    expect(seen.flatMap((m) => m.text).every((n) => n === 2)).toBe(true)
    // Stepping through a month's changes keeps it too.
    const before = await card.evaluate((el) => el.getBoundingClientRect().height)
    for (let i = 0; i < 4; i++) await strip(page).getByRole('button', { name: 'Next update' }).click()
    expect(Math.abs((await card.evaluate((el) => el.getBoundingClientRect().height)) - before)).toBeLessThan(0.5)
  })
}

test('the release-kit column is as wide as the month card, so the card is symmetric', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await stats(page).scrollIntoViewIfNeeded()
  const month = (await stats(page).locator('xpath=..').boundingBox())!
  const ad = (await strip(page).getByRole('complementary').locator('xpath=..').boundingBox())!
  expect(Math.abs(month.width - ad.width)).toBeLessThan(1.5)
})

/**
 * Round 7 of 2026-11-09 (owner): a white box showed when the card's controls
 * were clicked or tapped. None of them draws a box for a pointer (no tap
 * highlight, no background behind the figure, no text selection on a quick
 * double click); the keyboard still gets a ring, and a month arrow keeps focus
 * when its month changes.
 */
test('no box for a click or a tap on the card, a ring for the keyboard, and the arrow keeps focus', async ({ page }) => {
  await page.goto('/')
  await stats(page).scrollIntoViewIfNeeded()
  const card = strip(page).locator('[data-log-months]')
  await expect(card).toHaveCSS('-webkit-tap-highlight-color', 'rgba(0, 0, 0, 0)')
  const figure = stats(page).locator('button:has([data-stat])')
  await figure.hover()
  await expect(figure).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await figure.dblclick()
  expect(await page.evaluate(() => String(getSelection()))).toBe('')
  for (const control of [figure, dots(page).first(), strip(page).getByRole('button', { name: 'Next update' })]) {
    await expect(control).toHaveCSS('user-select', 'none')
  }
  // The keyboard: Enter on a month arrow changes the month and leaves focus on the arrow, with its ring.
  const back = strip(page).getByRole('button', { name: /^Previous month/ })
  await back.focus()
  await page.keyboard.press('Enter')
  await expect(strip(page).locator('[data-month]')).not.toHaveText('October 2026')
  await expect(back).toBeFocused()
  expect(await back.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none')
})
