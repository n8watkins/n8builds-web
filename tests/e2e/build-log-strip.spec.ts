import { test, expect, type Page } from '@playwright/test'

/**
 * The homepage's compact build log (#build-log), right under "What I'm working
 * on": this month's newest entries across builds, a card cycling through the
 * month's figures, and a link to /builds. Against the recorded GitHub fixture
 * (BUILD_LOG_FIXTURE=1), whose capture time is the strip's "now", so these
 * don't drift as the months pass.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const strip = (page: Page) => page.locator('#build-log')
const rows = (page: Page) => strip(page).getByRole('listitem').filter({ has: page.locator('a[href^="/builds?build="]') })
const stats = (page: Page) => strip(page).getByRole('group', { name: /^Shipped / })
const slides = (page: Page) => stats(page).locator('[data-stat]')
const current = (page: Page) => stats(page).locator('[data-stat][aria-hidden="false"]')
const dots = (page: Page) => stats(page).getByRole('button', { name: /^Show / })

test('sits between "What I\'m working on" and the Lab, in the server-rendered HTML', async ({ page, request }) => {
  const html = await (await request.get('/')).text()
  const at = (id: string) => html.indexOf(`id="${id}"`)
  expect(at('build-log')).toBeGreaterThan(at('now'))
  expect(at('build-log')).toBeLessThan(at('lab'))

  await page.goto('/')
  await strip(page).scrollIntoViewIfNeeded()
  await expect(strip(page).getByRole('heading', { level: 2 })).toHaveText('Shipped this month')
  expect(await page.locator('main').innerText()).not.toContain('—')
})

test("lists this month's newest entries across builds, newest first, at most three a build", async ({ page }) => {
  await page.goto('/')
  await strip(page).scrollIntoViewIfNeeded()
  const list = rows(page)
  await expect(list.first()).toBeVisible()
  // Three to five: a month with few builds shows fewer rows rather than one build's whole month.
  const count = await list.count()
  expect(count).toBeGreaterThanOrEqual(3)
  expect(count).toBeLessThanOrEqual(5)

  const items = await list.evaluateAll((els) =>
    els.map((el) => ({
      build: new URL(el.querySelector('a')!.href).searchParams.get('build'),
      date: el.querySelector('time')!.getAttribute('datetime')!,
      icon: !!el.querySelector('img'),
    })),
  )
  expect(items.map((i) => i.date)).toEqual(items.map((i) => i.date).sort().reverse())
  expect(items.every((i) => i.date.startsWith('2026-10'))).toBe(true)
  expect(items.every((i) => i.icon)).toBe(true)
  // Across builds: more than one, and no build fills the strip.
  const perBuild = new Map<string, number>()
  for (const i of items) perBuild.set(i.build!, (perBuild.get(i.build!) ?? 0) + 1)
  expect(perBuild.size).toBeGreaterThan(1)
  expect([...perBuild.values()].every((n) => n <= 3)).toBe(true)

  // A release reads as a version, as on /builds.
  await expect(list.filter({ hasText: /Shipped v\d+\.\d+\.\d+/ }).first()).toBeVisible()
})

test('a row opens its build in the full log, filtered', async ({ page }) => {
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

test("the card shows the month's figures, every one in the HTML, the first showing", async ({ page, request }) => {
  // Server-rendered: the card is complete before any JavaScript runs.
  const html = await (await request.get('/')).text()
  expect(html).toContain('changes shipped')
  expect(html).toContain('builds touched')
  expect(html).not.toContain('last 6 months')

  await page.goto('/')
  await stats(page).scrollIntoViewIfNeeded()
  await expect(stats(page)).toHaveAttribute('aria-roledescription', 'carousel')
  await expect(stats(page)).toContainText('October 2026')
  const ids = await slides(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-stat')))
  expect(ids.slice(0, 2)).toEqual(['changes', 'builds'])
  expect(ids).toContain('busiest')
  expect(ids).toContain('days')
  await expect(dots(page)).toHaveCount(ids.length)
  await expect(current(page)).toHaveCount(1)
  await expect(current(page)).toHaveAttribute('data-stat', 'changes')
  await expect(current(page)).toContainText(/^\d+changes shipped$/)
  // The busiest build shows with its icon.
  await expect(slides(page).and(page.locator('[data-stat="busiest"]')).locator('img')).toHaveCount(1)
})

test('reduced motion holds the first figure; a dot picks one and announces it', async ({ page }) => {
  await page.goto('/')
  await stats(page).scrollIntoViewIfNeeded()
  await page.waitForTimeout(4600)
  await expect(current(page)).toHaveAttribute('data-stat', 'changes')

  const live = stats(page).locator('[aria-live="polite"]')
  await expect(live).toHaveText('')
  await expect(async () => {
    await dots(page).nth(1).click()
    await expect(current(page)).toHaveAttribute('data-stat', 'builds', { timeout: 2000 })
  }).toPass({ timeout: 15_000 })
  await expect(dots(page).nth(1)).toHaveAttribute('aria-current', 'true')
  await expect(live).toHaveText(/^\d+ builds? touched$/)
})

test.describe('with motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('moves on by itself while in view, and holds while hovered', async ({ page }) => {
    await page.goto('/')
    await stats(page).scrollIntoViewIfNeeded()
    await expect(current(page)).toHaveAttribute('data-stat', 'builds', { timeout: 8000 })
    // The timer never speaks: only a picked figure is announced.
    await expect(stats(page).locator('[aria-live="polite"]')).toHaveText('')

    await stats(page).hover()
    const held = await current(page).getAttribute('data-stat')
    await page.waitForTimeout(5000)
    await expect(current(page)).toHaveAttribute('data-stat', held!)
  })
})

test('"See the full build log" goes to /builds', async ({ page }) => {
  await page.goto('/')
  await strip(page).getByRole('link', { name: 'See the full build log' }).click()
  await expect(page).toHaveURL(/\/builds$/)
  await expect(page.getByRole('heading', { level: 1, name: 'The build log' })).toBeVisible()
})

test('works from the keyboard: the button, then each row, then the figures', async ({ page }) => {
  await page.goto('/')
  const button = strip(page).getByRole('link', { name: 'See the full build log' })
  await button.scrollIntoViewIfNeeded()
  const rowCount = await rows(page).count()
  await button.focus()
  const order: string[] = []
  for (let i = 0; i < rowCount + 2; i++) {
    await page.keyboard.press('Tab')
    order.push(await page.evaluate(() => document.activeElement?.getAttribute('href') ?? ''))
  }
  expect(order.slice(0, rowCount).every((href) => href.startsWith('/builds?build='))).toBe(true)
  // After the rows, the card's dots (buttons, no href).
  expect(order.slice(rowCount)).toEqual(['', ''])
  await expect(dots(page).nth(1)).toBeFocused()

  // The focused row shows a ring.
  await button.focus()
  await page.keyboard.press('Tab')
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement!, '::after').boxShadow)
  expect(ring).not.toBe('none')
})

test('phones show at most four rows, with the date on the name line', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await strip(page).scrollIntoViewIfNeeded()
  const counts = await rows(page).evaluateAll((els) => ({ all: els.length, visible: els.filter((el) => el.checkVisibility()).length }))
  expect(counts.visible).toBe(Math.min(counts.all, 4))
  await expect(rows(page).first().locator('time')).toBeHidden()
  await expect(rows(page).first().locator('p').first()).toContainText(/Oct \d+/)
  // Nothing in the strip is wider than the screen.
  expect(await strip(page).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
})
