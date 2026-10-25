import { test, expect, type Page } from '@playwright/test'

/**
 * The /builds log, against the recorded GitHub fixture (BUILD_LOG_FIXTURE=1 in
 * playwright.config.ts), so these never depend on live activity.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const feed = (page: Page) => page.locator('#activity')
const feedEntries = (page: Page) => feed(page).locator('li[data-kind]')
const chip = (page: Page, name: string) => feed(page).getByRole('group', { name: 'Filter by build' }).getByRole('button', { name })

/**
 * Click a filter chip, retrying a click that lands before hydration. The inner
 * wait is generous because a busy CI runner can take seconds per step (a 500ms
 * wait failed at random on WebKit).
 */
async function pick(page: Page, name: string) {
  const button = chip(page, name)
  await expect(async () => {
    if ((await button.getAttribute('aria-pressed')) !== 'true') await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 3000 })
  }).toPass({ timeout: 20_000 })
}

test('the build log leads with the builds, most recently active first', async ({ page }) => {
  await page.goto('/builds')
  await expect(page.getByRole('heading', { level: 1, name: 'The build log' })).toBeVisible()

  const cards = page.getByRole('list', { name: 'Builds by latest activity' }).locator(':scope > li')
  await expect(cards).toHaveCount(6)
  expect(await cards.evaluateAll((els) => els.map((el) => el.getAttribute('data-build')))).toEqual([
    'solara',
    'tldw',
    'scribe',
    'portfolio-rank',
    'tubevault',
    'piper-tts',
  ])
  await expect(cards.first()).toContainText('Last shipped Oct 2026')
  // Quiet builds read as finished, not abandoned.
  await expect(page.getByRole('list', { name: 'Builds by latest activity' })).not.toContainText(/\bago\b/)

  // A card opens its build page.
  await cards.nth(2).getByRole('link', { name: 'Scribe' }).click()
  await expect(page).toHaveURL(/\/builds\/scribe$/)
})

test('the feed groups entries by month, with highlights pinned and releases shown as versions', async ({ page }) => {
  await page.goto('/builds')
  const months = feed(page).getByRole('heading', { level: 3 })
  await expect(months.first()).toHaveText('October 2026')
  await expect(months.nth(1)).toHaveText('July 2026')

  // The hand-written highlight sits atop its month, styled as featured.
  const july = feed(page).getByRole('region', { name: 'July 2026' })
  const firstJuly = july.locator('li[data-kind]').first()
  await expect(firstJuly).toHaveAttribute('data-kind', 'highlight')
  await expect(firstJuly).toContainText('TL;DW 1.0 is packaged for the Chrome Web Store')

  await expect(july.locator('li[data-kind="release"]', { hasText: 'Shipped v0.8.0' })).toHaveCount(1)
  // Bot syncs and upkeep commits never reach the page.
  await expect(feed(page)).not.toContainText('sync portfolios from upstream')
  await expect(feed(page)).not.toContainText('HANDOFF')
  expect(await page.locator('main').innerText()).not.toContain('—')
})

test('the build filter narrows the feed and lives in the URL', async ({ page }) => {
  await page.goto('/builds')
  const total = await feedEntries(page).count()
  expect(total).toBeGreaterThan(20)

  await pick(page, 'Scribe')
  await expect(page).toHaveURL(/\/builds\?build=scribe$/)
  await expect(feedEntries(page).first()).toContainText('Shipped v0.8.0')
  const builds = await feedEntries(page).evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute('data-build')))])
  expect(builds).toEqual(['scribe'])

  await pick(page, 'All')
  await expect(page).toHaveURL(/\/builds$/)
  await expect(feedEntries(page)).toHaveCount(total)
})

test('a filtered link opens the feed already filtered', async ({ page }) => {
  await page.goto('/builds?build=tubevault#activity')
  await expect(chip(page, 'TubeVault')).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 })
  await expect(feedEntries(page).first()).toContainText('Shipped v0.3.80')
  await expect
    .poll(() => feedEntries(page).evaluateAll((els) => els.every((el) => el.getAttribute('data-build') === 'tubevault')))
    .toBe(true)
})

test('before the page is interactive, a filtered link shows no unfiltered feed', async ({ page }) => {
  // Hold back the app's JavaScript, as on a slow phone: only the server HTML
  // and the inline scripts run.
  let release = () => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/_next/static/chunks/**', async (route) => {
    await held
    await route.continue()
  })

  await page.goto('/builds?build=tubevault', { waitUntil: 'commit' })
  // The prerendered feed lists every build; none of the other builds may show.
  await expect(feed(page)).toBeAttached()
  const visibleOthers = () =>
    feed(page)
      .locator('li[data-kind]:not([data-build="tubevault"])')
      .evaluateAll((els) => els.filter((el) => el.checkVisibility({ visibilityProperty: true })).length)
  expect(await visibleOthers()).toBe(0)

  release()
  await expect(chip(page, 'TubeVault')).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 })
  await expect(feedEntries(page).first()).toBeVisible()
  await expect(feed(page).locator('li[data-kind]:not([data-build="tubevault"])')).toHaveCount(0)
})

test('a build page shows its recent activity and links to its part of the log', async ({ page }) => {
  await page.goto('/builds/tubevault')
  const section = page.getByRole('region', { name: 'Recent activity' })
  await expect(section).toBeVisible()
  const entries = section.locator('li[data-kind]')
  await expect(entries).toHaveCount(5)
  await expect(entries.first()).toContainText('Shipped v0.3.80')
  await expect(entries.first()).toContainText('Cross-platform native-host setup (macOS/Linux), no hardcoded user')

  await section.getByRole('link', { name: 'Full log for TubeVault' }).click()
  await expect(page).toHaveURL(/\/builds\?build=tubevault#activity$/)
  await expect(chip(page, 'TubeVault')).toHaveAttribute('aria-pressed', 'true')
})

test.describe('navbar', () => {
  test('desktop: the Log link reaches the build log', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the desktop navbar is hidden on phones')
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/loadout')
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Log', exact: true }).click()
    await expect(page).toHaveURL(/\/builds$/)
    await expect(page.getByRole('heading', { level: 1, name: 'The build log' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Log', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test.describe('mobile menu', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

    test('the Log link reaches the build log', async ({ page }) => {
      await page.goto('/loadout')
      const button = page.getByRole('button', { name: 'Menu' })
      await expect(async () => {
        if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click()
        await expect(button).toHaveAttribute('aria-expanded', 'true', { timeout: 500 })
      }).toPass()
      await page.locator('#mobile-menu').getByRole('link', { name: 'Log', exact: true }).click()
      await expect(page).toHaveURL(/\/builds$/)
      await expect(page.getByRole('heading', { level: 1, name: 'The build log' })).toBeVisible()
    })
  })
})
