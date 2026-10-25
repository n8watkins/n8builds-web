import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { E2E_BASE_URL } from '../e2e-env'

/**
 * The live corner player, the navbar live dot and their offline behavior,
 * against the server's fake live mode (LIVE_TEST_MODE=1 in
 * playwright.config.ts). Each test picks a scenario with the `n8-live-test`
 * cookie. The Twitch and YouTube players are stubbed at the network layer,
 * after the browser's CSP check, so tests never depend on the real platforms.
 */

const LIVE_TIMEOUT = 20_000
const DESKTOP = { width: 1280, height: 800 }
const PHONE = { width: 390, height: 844 }

const STUB = '<html><body style="margin:0;background:#111"></body></html>'

async function goLive(context: BrowserContext, scenario: string) {
  await context.addCookies([{ name: 'n8-live-test', value: scenario, url: E2E_BASE_URL }])
  await context.route('https://player.twitch.tv/**', (route) => route.fulfill({ contentType: 'text/html', body: STUB }))
  await context.route('https://www.youtube-nocookie.com/**', (route) => route.fulfill({ contentType: 'text/html', body: STUB }))
}

const player = (page: Page) => page.locator('[data-live-player]')
const frame = (page: Page) => player(page).locator('iframe')

async function openHome(page: Page) {
  const answered = page.waitForResponse((r) => r.url().endsWith('/api/live'), { timeout: LIVE_TIMEOUT })
  await page.goto('/')
  await answered
}

async function waitForPlayer(page: Page) {
  await expect(player(page)).toBeVisible({ timeout: LIVE_TIMEOUT })
}

test.describe('desktop', () => {
  test.use({ viewport: DESKTOP })

  test('offline: no player, no live dot, and no player code or frames are downloaded', async ({ page, context, browser }) => {
    await goLive(context, 'none')
    const offlineScripts = new Set<string>()
    const thirdParty: string[] = []
    page.on('request', (r) => {
      if (r.resourceType() === 'script') offlineScripts.add(new URL(r.url()).pathname)
      if (/twitch\.tv|youtube/.test(r.url())) thirdParty.push(r.url())
    })
    await openHome(page)
    await page.waitForTimeout(1500)
    await expect(player(page)).toHaveCount(0)
    await expect(page.locator('[data-nav-live-dot]')).toHaveCount(0)
    await expect(page.locator('iframe[src*="twitch"], iframe[src*="youtube"]')).toHaveCount(0)
    expect(thirdParty).toEqual([])

    // The same page while live downloads the player as an extra chunk, which
    // the offline load above never fetched.
    const liveContext = await browser.newContext({ viewport: DESKTOP })
    await goLive(liveContext, 'twitch')
    const livePage = await liveContext.newPage()
    const liveScripts = new Set<string>()
    livePage.on('request', (r) => {
      if (r.resourceType() === 'script') liveScripts.add(new URL(r.url()).pathname)
    })
    await openHome(livePage)
    await waitForPlayer(livePage)
    const extra = [...liveScripts].filter((s) => !offlineScripts.has(s))
    expect(extra.length, 'the live page loads player code the offline page does not').toBeGreaterThan(0)
    await liveContext.close()
  })

  test('live on Twitch: muted embed, Unmute, Watch on Twitch, and the navbar dot', async ({ page, context }) => {
    await goLive(context, 'twitch')
    await openHome(page)
    await waitForPlayer(page)

    const region = page.getByRole('region', { name: 'Live stream player' })
    await expect(region).toContainText('Building the live player, live')
    const src = new URL((await frame(page).getAttribute('src'))!)
    expect(src.origin).toBe('https://player.twitch.tv')
    expect(src.searchParams.get('channel')).toBe('n8watkins')
    expect(src.searchParams.get('parent')).toBe('localhost')
    expect(src.searchParams.get('muted')).toBe('true')

    await region.getByRole('button', { name: 'Unmute' }).click()
    await expect(frame(page)).toHaveAttribute('src', /muted=false/)
    await expect(region.getByRole('button', { name: 'Mute' })).toBeVisible()

    const watch = region.getByRole('link', { name: /Watch on Twitch/ })
    await expect(watch).toHaveAttribute('href', 'https://twitch.tv/n8watkins')
    await expect(watch).toHaveAttribute('target', '_blank')

    const navTwitch = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: /Twitch/ })
    await expect(navTwitch.locator('[data-nav-live-dot]')).toBeVisible()
    await expect(navTwitch).toContainText('(live now)')
  })

  test('live on both: tabs, Twitch first, switching to YouTube', async ({ page, context }) => {
    await goLive(context, 'both')
    await openHome(page)
    await waitForPlayer(page)

    const tabs = page.getByRole('tablist', { name: 'Live streams' }).getByRole('tab')
    await expect(tabs).toHaveText(['Twitch', 'YouTube'])
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
    await expect(frame(page)).toHaveAttribute('src', /player\.twitch\.tv/)

    await tabs.nth(1).click()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    const src = new URL((await frame(page).getAttribute('src'))!)
    expect(src.origin).toBe('https://www.youtube-nocookie.com')
    expect(src.pathname).toBe('/embed/n8LiveTest1')
    expect(src.searchParams.get('mute')).toBe('1')
    await expect(page.getByRole('link', { name: /Watch on YouTube/ })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=n8LiveTest1')
    // Only the selected stream plays.
    await expect(frame(page)).toHaveCount(1)
  })

  test('live on X: a card with Watch on X, and no embed', async ({ page, context }) => {
    await goLive(context, 'x')
    await openHome(page)
    await waitForPlayer(page)
    await expect(player(page)).toContainText('Live on X: Q&A')
    await expect(page.getByRole('link', { name: /Watch on X/ })).toHaveAttribute('href', 'https://x.com/n8watkins/status/1850000000000000000')
    await expect(frame(page)).toHaveCount(0)
    // X isn't Twitch: no dot on the Twitch link.
    await expect(page.locator('[data-nav-live-dot]')).toHaveCount(0)
  })

  test('a stream YouTube refuses to embed gets the fallback card', async ({ page, context }) => {
    await goLive(context, 'youtube-no-embed')
    await openHome(page)
    await waitForPlayer(page)
    await expect(player(page)).toContainText('can’t play here')
    await expect(page.getByRole('link', { name: /Watch on YouTube/ })).toBeVisible()
    await expect(frame(page)).toHaveCount(0)
  })

  test('moves between corners, and remembers the corner', async ({ page, context }) => {
    await goLive(context, 'twitch')
    await openHome(page)
    await waitForPlayer(page)
    await expect(player(page)).toHaveAttribute('data-corner', 'bottom-right')
    const before = await player(page).boundingBox()

    await page.getByRole('button', { name: 'Move player to the bottom left corner' }).click()
    await expect(player(page)).toHaveAttribute('data-corner', 'bottom-left')
    await page.getByRole('button', { name: 'Move player to the top left corner' }).click()
    await expect(player(page)).toHaveAttribute('data-corner', 'top-left')
    await expect.poll(async () => (await player(page).boundingBox())!.y).toBeLessThan(before!.y)
    // Clear of the navbar.
    expect((await player(page).boundingBox())!.y).toBeGreaterThanOrEqual(68)

    await page.reload()
    await waitForPlayer(page)
    await expect(player(page)).toHaveAttribute('data-corner', 'top-left')
  })

  test('expands and shrinks', async ({ page, context }) => {
    await goLive(context, 'twitch')
    await openHome(page)
    await waitForPlayer(page)
    const width = async () => (await page.getByRole('region', { name: 'Live stream player' }).boundingBox())!.width
    const small = await width()
    await page.getByRole('button', { name: 'Expand player' }).click()
    await expect.poll(width).toBeGreaterThan(small + 100)
    await page.getByRole('button', { name: 'Shrink player' }).click()
    await expect.poll(width).toBe(small)
  })

  test('minimizes to a Live pill, remembered across pages', async ({ page, context }) => {
    await goLive(context, 'twitch')
    await openHome(page)
    await waitForPlayer(page)
    await page.getByRole('button', { name: 'Minimize live player' }).click()
    await expect(player(page)).toHaveAttribute('data-state', 'minimized')
    await expect(frame(page)).toHaveCount(0)
    const pill = page.getByRole('button', { name: /Live.*open the live player/ })
    await expect(pill).toContainText('Twitch')

    await page.goto('/loadout')
    await waitForPlayer(page)
    await expect(player(page)).toHaveAttribute('data-state', 'minimized')
    await page.getByRole('button', { name: /open the live player/ }).click()
    await expect(page.getByRole('region', { name: 'Live stream player' })).toBeVisible()
    await expect(frame(page)).toHaveCount(1)
  })

  test('closing hides this stream for good, but a new stream shows again', async ({ page, context }) => {
    await goLive(context, 'twitch')
    await openHome(page)
    await waitForPlayer(page)
    await page.getByRole('region', { name: 'Live stream player' }).getByRole('button', { name: 'Close live player' }).click()
    await expect(player(page)).toHaveCount(0)

    await openHome(page)
    await page.waitForTimeout(1000)
    await expect(player(page)).toHaveCount(0)
    // The navbar still says it's live.
    await expect(page.locator('[data-nav-live-dot]')).toBeVisible()

    await context.addCookies([{ name: 'n8-live-test', value: 'both', url: E2E_BASE_URL }])
    await openHome(page)
    await waitForPlayer(page)
    // Only the new stream: the closed Twitch stream stays closed, so there is
    // no Twitch tab and YouTube is the one playing.
    const region = page.getByRole('region', { name: 'Live stream player' })
    await expect(region.getByRole('tab', { name: 'Twitch' })).toHaveCount(0)
    await expect(region.getByRole('link', { name: /Watch on YouTube/ })).toBeVisible()
    await expect(region.getByRole('link', { name: /Watch on Twitch/ })).toHaveCount(0)
  })

  test('keyboard: every control is reachable, Escape minimizes, focus follows', async ({ page, context }) => {
    await goLive(context, 'both')
    await openHome(page)
    await waitForPlayer(page)

    const minimize = page.getByRole('button', { name: 'Minimize live player' })
    await minimize.focus()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('region', { name: 'Live stream player' }).getByRole('button', { name: 'Close live player' })).toBeFocused()
    await page.keyboard.press('Tab')
    const twitchTab = page.getByRole('tab', { name: 'Twitch' })
    await expect(twitchTab).toBeFocused()
    await page.keyboard.press('ArrowRight')
    const youtubeTab = page.getByRole('tab', { name: 'YouTube' })
    await expect(youtubeTab).toBeFocused()
    await expect(youtubeTab).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('Escape')
    const pill = page.getByRole('button', { name: /open the live player/ })
    await expect(pill).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(minimize).toBeFocused()
  })

  test('the CSP allows the players', async ({ page, context }) => {
    await goLive(context, 'both')
    const violations: string[] = []
    page.on('console', (m) => {
      if (/Content[- ]Security[- ]Policy|Refused to (load|frame)/i.test(m.text())) violations.push(m.text())
    })
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => console.error(`Content-Security-Policy: ${e.effectiveDirective} ${e.blockedURI}`))
    })
    await openHome(page)
    await waitForPlayer(page)
    await expect(frame(page)).toHaveAttribute('src', /player\.twitch\.tv/)
    await page.getByRole('tab', { name: 'YouTube' }).click()
    await expect(frame(page)).toHaveAttribute('src', /youtube-nocookie/)
    await page.waitForTimeout(1000)
    expect(violations).toEqual([])
  })
})

test.describe('phone', () => {
  test.use({ viewport: PHONE })

  test('starts as the Live pill at the bottom and opens full width', async ({ page, context }) => {
    await goLive(context, 'twitch')
    // Even a visitor who left it open on desktop gets the pill on a phone.
    await page.addInitScript(() => localStorage.setItem('n8-live:prefs', JSON.stringify({ corner: 'top-left', minimized: false })))
    await openHome(page)
    await waitForPlayer(page)
    await expect(player(page)).toHaveAttribute('data-state', 'minimized')
    await expect(frame(page)).toHaveCount(0)
    const pill = (await player(page).boundingBox())!
    expect(pill.y + pill.height).toBeGreaterThan(PHONE.height - 40)
    expect(pill.height).toBeLessThanOrEqual(48)
    expect(pill.width).toBeLessThan(PHONE.width - 40)

    await page.getByRole('button', { name: /open the live player/ }).click()
    const region = page.getByRole('region', { name: 'Live stream player' })
    await expect(region).toBeVisible()
    // Full width, with a small margin on each side of the area fixed elements
    // use: the navbar's (left-0 right-0). Desktop browsers and Playwright's
    // Linux WebKit take a scrollbar out of it that phones don't have.
    const margins = () =>
      page.evaluate(() => {
        const box = document.querySelector('[aria-label="Live stream player"]')!.getBoundingClientRect()
        const area = document.querySelector('nav[aria-label="Primary"]')!.getBoundingClientRect()
        return [box.left - area.left, area.right - box.right].map((m) => Math.round(m))
      })
    await expect.poll(margins).toEqual([8, 8])
    // No corner moving or expanding on a phone.
    await expect(page.getByRole('button', { name: /Move player|Expand player/ })).toHaveCount(0)

    // It is never remembered open on a phone.
    await page.reload()
    await waitForPlayer(page)
    await expect(player(page)).toHaveAttribute('data-state', 'minimized')
  })

  test('the pill can be closed', async ({ page, context }) => {
    await goLive(context, 'x')
    await openHome(page)
    await waitForPlayer(page)
    await page.getByRole('button', { name: 'Close live player' }).click()
    await expect(player(page)).toHaveCount(0)
  })
})

test.describe('reduced motion', () => {
  test.use({ viewport: DESKTOP, contextOptions: { reducedMotion: 'reduce' } })

  test('the live dots do not pulse', async ({ page, context }) => {
    await goLive(context, 'twitch')
    await openHome(page)
    await waitForPlayer(page)
    const pulse = player(page).locator('[data-live-pulse]')
    await expect(pulse).toHaveCount(1)
    expect(await pulse.evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
    expect(await page.locator('[data-nav-live-dot] > span').first().evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
  })
})

test.describe('motion allowed', () => {
  test.use({ viewport: DESKTOP, contextOptions: { reducedMotion: 'no-preference' } })

  test('the live dot pulses', async ({ page, context }) => {
    await goLive(context, 'twitch')
    await openHome(page)
    await waitForPlayer(page)
    expect(await player(page).locator('[data-live-pulse]').evaluate((el) => getComputedStyle(el).animationName)).not.toBe('none')
  })
})
