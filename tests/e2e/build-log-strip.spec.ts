import { test, expect, type Page } from '@playwright/test'

/**
 * The homepage's compact build log (#build-log), right under "What I'm working
 * on": this month's newest entries across builds, a six-month activity chart
 * and a link to /builds. Against the recorded GitHub fixture
 * (BUILD_LOG_FIXTURE=1), whose capture time is the strip's "now", so these
 * don't drift as the months pass.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const strip = (page: Page) => page.locator('#build-log')
const rows = (page: Page) => strip(page).getByRole('listitem').filter({ has: page.locator('a[href^="/builds?build="]') })
const bars = (page: Page) => strip(page).getByRole('list', { name: 'Changes by month' }).getByRole('listitem')

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

test('charts six months of changes; busy months open their part of the log', async ({ page }) => {
  await page.goto('/')
  await strip(page).scrollIntoViewIfNeeded()
  await expect(bars(page)).toHaveCount(6)
  // Each bar names its month and count for screen readers.
  await expect(bars(page).last()).toContainText(/October 2026: \d+ changes/)
  await expect(bars(page).first()).toContainText(/May 2026: \d+ change/)

  // Quiet months are not links.
  for (const quiet of ['August 2026', 'September 2026']) {
    const bar = bars(page).filter({ hasText: quiet })
    await expect(bar).toContainText(`${quiet}: 0 changes`)
    await expect(bar.getByRole('link')).toHaveCount(0)
  }

  await bars(page).last().getByRole('link').click()
  await expect(page).toHaveURL(/\/builds#month-2026-10$/)
  await expect(page.locator('#month-2026-10')).toBeInViewport()
})

test('"See the full build log" goes to /builds', async ({ page }) => {
  await page.goto('/')
  await strip(page).getByRole('link', { name: 'See the full build log' }).click()
  await expect(page).toHaveURL(/\/builds$/)
  await expect(page.getByRole('heading', { level: 1, name: 'The build log' })).toBeVisible()
})

test('works from the keyboard: the button, then each row, then the busy months', async ({ page }) => {
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
  expect(order.slice(rowCount).every((href) => href.startsWith('/builds#month-'))).toBe(true)

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
