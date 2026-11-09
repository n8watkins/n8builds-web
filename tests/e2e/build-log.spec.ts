import { test, expect, type Page } from '@playwright/test'
import { APP_JS } from './app-js'

/**
 * The /builds log, against the recorded GitHub fixture (BUILD_LOG_FIXTURE=1 in
 * playwright.config.ts), so these never depend on live activity.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const feed = (page: Page) => page.locator('#activity')
const feedEntries = (page: Page) => feed(page).locator('li[data-kind]')
const chip = (page: Page, name: string) => feed(page).getByRole('group', { name: 'Filter by build' }).getByRole('button', { name })
const kindChip = (page: Page, name: string | RegExp) => feed(page).getByRole('group', { name: 'Filter updates by kind' }).getByRole('button', { name })

/**
 * Click a filter chip, retrying a click that lands before hydration. The inner
 * wait is generous because a busy CI runner can take seconds per step (a 500ms
 * wait failed at random on WebKit).
 */
async function pick(page: Page, name: string, which: typeof chip = chip) {
  const button = which(page, name)
  await expect(async () => {
    if ((await button.getAttribute('aria-pressed')) !== 'true') await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 3000 })
  }).toPass({ timeout: 20_000 })
}

test('the build log leads with the builds, most recently active first', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/builds')
  await expect(page.getByRole('heading', { level: 1, name: 'The build log' })).toBeVisible()

  const cards = page.getByRole('list', { name: 'Builds by latest activity' }).locator(':scope > li')
  // The builds, then the projects without a build page the log follows since round 5 of
  // 2026-11-02 (data/logBuilds.ts); in the fixture those have nothing yet, so they come last.
  await expect(cards).toHaveCount(17)
  expect(await cards.evaluateAll((els) => els.map((el) => el.getAttribute('data-build')))).toEqual([
    'n8builds',
    'solara',
    'tldw',
    'openping',
    'scribe',
    'portfolio-rank',
    'tubevault',
    'voicedock',
    'relink',
    'strollz',
    'keysready',
    'feelium',
    'vibelog',
    'release-kit',
    'pass-env',
    'devguard',
    'pr-post',
  ])
  // A project with nothing logged yet is a quiet card that links where the site shows it.
  const relink = cards.and(page.locator('[data-build="relink"]'))
  await expect(relink).toContainText('Nothing logged yet')
  await expect(relink.getByRole('link', { name: 'Full story of Relink' })).toHaveAttribute('href', '/upcoming#relink')
  await expect(cards.and(page.locator('[data-build="pr-post"]')).getByRole('link', { name: 'Full story of PR Post' })).toHaveAttribute('href', '/#pr-post-edition')
  await expect(cards.first()).toContainText('Last shipped Oct 2026')
  // Quiet builds read as finished, not abandoned.
  await expect(page.getByRole('list', { name: 'Builds by latest activity' })).not.toContainText(/\bago\b/)

  // A card's "Full story" opens its build page.
  // Found by its build, not its position, so a new build doesn't move it.
  await cards.and(page.locator('[data-build="scribe"]')).getByRole('link', { name: 'Full story of Scribe' }).click()
  await expect(page).toHaveURL(/\/builds\/scribe$/)
})

test('a build card filters the activity below to that build, shows it is picked, and a second click clears it', { tag: '@cross-browser' }, async ({ page }) => {
  await page.goto('/builds')
  const card = page.getByRole('list', { name: 'Builds by latest activity' }).locator('[data-build="openping"]')
  const button = card.getByRole('button', { name: /^OpenPing/ })
  await expect(button).toHaveAttribute('aria-pressed', 'false')
  // Retried: a click before hydration does nothing.
  await expect(async () => {
    await button.click()
    await expect(page).toHaveURL(/\/builds\?build=openping$/, { timeout: 2000 })
  }).toPass({ timeout: 20_000 })
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(card).toHaveAttribute('data-selected', '')
  const builds = await feedEntries(page).evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute('data-build')))])
  expect(builds).toEqual(['openping'])
  // The chip below agrees.
  await expect(chip(page, 'OpenPing')).toHaveAttribute('aria-pressed', 'true')
  await button.click()
  await expect(page).toHaveURL(/\/builds$/)
  await expect(button).toHaveAttribute('aria-pressed', 'false')
  await expect(card).not.toHaveAttribute('data-selected')
})

test('the feed groups entries by month, with highlights pinned and releases shown as versions', async ({ page }) => {
  await page.goto('/builds')
  const months = feed(page).getByRole('heading', { level: 3 })
  // Each month heading, then its counts.
  await expect(months.first()).toHaveText(/^October 2026\d+ updates?/)
  await expect(months.nth(1)).toHaveText(/^July 2026\d+ updates?/)

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

test('the build filter narrows the feed and lives in the URL', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/builds')
  const total = await feedEntries(page).count()
  expect(total).toBeGreaterThan(20)

  await pick(page, 'Scribe')
  await expect(page).toHaveURL(/\/builds\?build=scribe$/)
  await expect(feedEntries(page).first()).toContainText('Shipped v0.8.0')
  const builds = await feedEntries(page).evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute('data-build')))])
  expect(builds).toEqual(['scribe'])

  await pick(page, 'All', kindChip)
  await expect(page).toHaveURL(/\/builds$/)
  await expect(feedEntries(page)).toHaveCount(total)
})

test('the kind filter narrows the feed and its build chips, and lives in the URL', async ({ page }) => {
  await page.goto('/builds')
  // Each kind chip counts its entries (older ones too, as All does); the counts add up to All's.
  const counts = await feed(page)
    .getByRole('group', { name: 'Filter updates by kind' })
    .getByRole('button')
    .evaluateAll((els) => els.map((el) => Number(el.querySelector('span')?.textContent)))
  expect(counts.slice(1).reduce((a, b) => a + b, 0)).toBe(counts[0])

  await pick(page, 'Chrome extensions', kindChip)
  await expect(page).toHaveURL(/\/builds\?kind=extensions$/)
  const builds = await feedEntries(page).evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute('data-build')))])
  expect(builds.length).toBeGreaterThan(0)
  expect(builds.every((b) => ['tldw', 'tubevault', 'voicedock'].includes(b!))).toBe(true)
  // Only that kind's builds are offered, each with its icon.
  const offered = feed(page).getByRole('group', { name: 'Filter by build' }).getByRole('button')
  // Each with its count of updates (round 4 of 2026-11-08).
  expect((await offered.allInnerTexts()).map((t) => t.replace(/\s*\d+\s*updates?$/, '').trim())).toEqual(['TL;DW', 'TubeVault', 'VoiceDock'])
  expect((await offered.allInnerTexts()).every((t) => /\d+\s*updates?$/.test(t.trim()))).toBe(true)
  expect(await offered.evaluateAll((els) => els.every((el) => !!el.querySelector('img')))).toBe(true)

  // A build within the kind narrows further; unpicking it goes back to the kind.
  await pick(page, 'TubeVault')
  await expect(page).toHaveURL(/\/builds\?kind=extensions&build=tubevault$/)
  await chip(page, 'TubeVault').click()
  await expect(page).toHaveURL(/\/builds\?kind=extensions$/)
})

test('the feed is one continuous list: month headers, more loading as you scroll and with Load more', async ({ page }) => {
  await page.goto('/builds')
  // No box scrolling on its own (round 4 of 2026-11-08): the page scrolls.
  await expect(feed(page).locator('[data-log-scroll]')).toHaveCount(0)
  const first = await feedEntries(page).count()
  expect(first).toBe(30)
  const more = feed(page).getByRole('button', { name: /^Load more/ })
  await expect(more).toBeVisible()
  await more.click()
  await expect.poll(() => feedEntries(page).count()).toBeGreaterThan(first)
  // The month headers stay under the navbar as their months scroll by.
  const header = feed(page).locator('section h3').first()
  expect(await header.evaluate((h) => getComputedStyle(h).position)).toBe('sticky')
  // Reaching the foot loads the rest.
  for (let i = 0; i < 10 && (await more.count()); i++) {
    await feed(page).locator('[data-log-list] > div').last().evaluate((el) => el.scrollIntoView({ block: 'end', behavior: 'instant' }))
    await page.waitForTimeout(200)
  }
  await expect(more).toHaveCount(0)
})

test('every entry has the same icon frame, and a release says so with a badge', async ({ page }) => {
  await page.goto('/builds')
  const frames = await feedEntries(page).locator('img').evaluateAll((imgs) => [...new Set(imgs.map((i) => getComputedStyle(i).boxShadow))])
  expect(frames).toHaveLength(1)
  const release = feedEntries(page).filter({ hasText: /Shipped v\d/ }).first()
  await expect(release.getByText('Release', { exact: true })).toBeVisible()
  await expect(feedEntries(page).filter({ hasNotText: /Shipped v\d/ }).first().getByText('Release', { exact: true })).toHaveCount(0)
})

test('each entry carries its build icon on the timeline', async ({ page }) => {
  await page.goto('/builds')
  const first = feedEntries(page).first()
  await expect(first.locator('img')).toHaveCount(1)
  // The build cards lead with the icon too.
  const card = page.getByRole('list', { name: 'Builds by latest activity' }).locator('[data-build="scribe"]')
  await expect(card.locator('h3 img')).toHaveCount(1)
})

test('a filtered link opens the feed already filtered', { tag: '@smoke' }, async ({ page }) => {
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
  await page.route(APP_JS, async (route) => {
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

test('the feed is in the HTML, visible before any JavaScript, and hydrated in place', async ({ page }) => {
  // Hold back the app's JavaScript, as on a slow phone.
  let release = () => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route(APP_JS, async (route) => {
    await held
    await route.continue()
  })

  await page.goto('/builds#activity', { waitUntil: 'commit' })
  const first = feedEntries(page).first()
  await expect(first).toBeAttached()
  // Readable straight from the HTML: no entry waits for a script to fade it in.
  expect(await first.evaluate((el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true }))).toBe(true)
  await first.evaluate((el) => el.setAttribute('data-prerendered', ''))

  release()
  // React hydrates the prerendered entries rather than replacing them: the
  // first entry React owns is still the one the HTML had (a feed rendered again
  // on the client blanked it and faded every month back in).
  const owned = () =>
    page.evaluate(() => {
      const el = document.querySelector('#activity li[data-kind]')
      return el && Object.keys(el).some((key) => key.startsWith('__reactFiber')) ? el.hasAttribute('data-prerendered') : null
    })
  await expect.poll(owned, { timeout: 15_000 }).not.toBeNull()
  expect(await owned()).toBe(true)
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

test.describe('navigation to the build log', () => {
  test("desktop: the Lab menu's first item scrolls to the build log, and the top bar has no Log link of its own", { tag: '@cross-browser' }, async ({ page, isMobile }) => {
    test.skip(isMobile, 'the desktop navbar is hidden on phones')
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/loadout')
    const primary = page.getByRole('navigation', { name: 'Primary' })
    await expect(primary.getByRole('link', { name: 'Log', exact: true })).toHaveCount(0)
    await primary.getByRole('link', { name: 'Lab' }).hover()
    const menu = primary.getByRole('link', { name: /Build log/ })
    // First in the menu, before the Lab's other parts.
    // The menu's items are a label over a description.
    await expect(primary.locator('a:has(> span + span)').first()).toHaveAttribute('href', '/#build-log')
    await menu.click()
    await expect(page).toHaveURL(/\/#build-log$/)
    await expect(page.locator('#build-log')).toBeInViewport()

    // Already on the homepage: it scrolls there from anywhere on the page.
    await page.locator('#contact').scrollIntoViewIfNeeded()
    await primary.getByRole('link', { name: 'Lab' }).hover()
    await menu.click()
    await expect(page.locator('#build-log')).toBeInViewport()
    await expect(page).toHaveURL(/\/#build-log$/)
  })

  test('desktop: with the build log missing from the homepage, the menu item opens the full log', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the desktop navbar is hidden on phones')
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    // Hydrated (the Lab rail's script is running), so the menu's own handler takes the click.
    await expect(page.getByTestId('lab-section-nav')).toHaveAttribute('data-ready', '', { timeout: 20_000 })
    // As when GitHub can't be read: the strip is left out of the page.
    await page.locator('#build-log').evaluate((el) => el.remove())
    const primary = page.getByRole('navigation', { name: 'Primary' })
    await primary.getByRole('link', { name: 'Lab' }).hover()
    await primary.getByRole('link', { name: /Build log/ }).click()
    await expect(page).toHaveURL(/\/builds$/)
    await expect(page.getByRole('heading', { level: 1, name: 'The build log' })).toBeVisible()
  })

  test('the footer sitemap links to it', async ({ page }) => {
    await page.goto('/loadout')
    const sitemap = page.getByRole('navigation', { name: 'Sitemap' })
    await sitemap.scrollIntoViewIfNeeded()
    await sitemap.getByRole('link', { name: 'Full build log' }).click()
    await expect(page).toHaveURL(/\/builds$/)
    await expect(page.getByRole('heading', { level: 1, name: 'The build log' })).toBeVisible()
  })

  test.describe('mobile menu', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

    test("the Build log link, the Lab menu's first, reaches the build log", { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
      await page.goto('/loadout')
      const button = page.getByRole('button', { name: 'Menu' })
      await expect(async () => {
        if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click()
        await expect(button).toHaveAttribute('aria-expanded', 'true', { timeout: 500 })
      }).toPass()
      const menu = page.locator('#mobile-menu')
      await expect(menu.getByRole('link').first()).toHaveText('Build log')
      await menu.getByRole('link', { name: 'Build log', exact: true }).click()
      await expect(page).toHaveURL(/\/#build-log$/)
      await expect(page.locator('#build-log')).toBeInViewport()
    })
  })
})

test('the feed links are big enough to tap (WCAG 2.5.8: at least 24px), and none overlap', { tag: '@cross-browser' }, async ({ page }) => {
  // An entry's title link was 19px tall, and Lighthouse's target-size audit
  // failed /builds on it.
  await page.goto('/builds')
  const boxes = await feed(page)
    .locator('li[data-kind]')
    .evaluateAll((items) =>
      items.map((item) =>
        [...item.querySelectorAll('a')].map((a) => {
          const r = a.getBoundingClientRect()
          return { text: a.textContent?.trim().slice(0, 40), top: r.top, bottom: r.bottom, height: r.height }
        })
      )
    )
  expect(boxes.length).toBeGreaterThan(0)
  for (const links of boxes) {
    for (const link of links) expect(link.height, `"${link.text}" height`).toBeGreaterThanOrEqual(24)
    for (let i = 1; i < links.length; i++) {
      expect(links[i].top, `"${links[i].text}" overlaps "${links[i - 1].text}"`).toBeGreaterThanOrEqual(links[i - 1].bottom - 0.5)
    }
  }
})
