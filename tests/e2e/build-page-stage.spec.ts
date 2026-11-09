import { expect, test, type Page } from '@playwright/test'

/**
 * A build page's product stage and sidebar (owner, 2026-11-09): the product
 * full width under the header, its clip or the live product (a sandboxed
 * frame of its public pages), on a desktop or a phone; and from 1024px a
 * sidebar with the build's basics and links to each part of the page.
 *
 * The suite runs with EMBED_FIXTURE=allow (every demo page counts as
 * framable); the framed pages themselves are stubbed here, so no test talks
 * to the live products.
 */
async function stubProducts(page: Page) {
  const framed: string[] = []
  await page.route(/^https:\/\/(openping\.n8builds\.dev|solara-uv\.web\.app)\//, (route) => {
    framed.push(route.request().url())
    return route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><meta name=viewport content="width=device-width"><title>stub</title><body style="margin:0;background:#111;color:#eee"><p id=w></p><script>w.textContent='width '+innerWidth</script>`,
    })
  })
  return framed
}

test.describe('the product stage on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('plays the clip first and loads nothing from the product until asked', async ({ page }) => {
    const framed = await stubProducts(page)
    await page.goto('/builds/openping')
    const stage = page.getByTestId('product-stage')
    await expect(stage.getByRole('button', { name: 'Watch it in use' })).toHaveAttribute('aria-pressed', 'true')
    await expect(stage.locator('[data-tour] video').filter({ visible: true })).toHaveCount(1)
    await expect(page.locator('iframe')).toHaveCount(0)
    expect(framed).toEqual([])
  })

  test('Try it live shows the real pages in a sandboxed frame, a tab each', async ({ page }) => {
    const framed = await stubProducts(page)
    await page.goto('/builds/openping')
    const stage = page.getByTestId('product-stage')
    await stage.getByRole('button', { name: 'Try it live' }).click()
    const frame = stage.locator('iframe').filter({ visible: true })
    await expect(frame).toHaveAttribute('src', 'https://openping.n8builds.dev/tools/is-it-down')
    await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox')
    await expect(frame).toHaveAccessibleName('OpenPing, live: Is it down?')
    await expect(stage.getByTestId('stage-address')).toHaveText('openping.n8builds.dev/tools/is-it-down')
    await expect(stage.getByRole('link', { name: 'Open OpenPing in a new tab' })).toHaveAttribute('href', 'https://openping.n8builds.dev/tools/is-it-down')

    const tabs = stage.getByRole('tablist', { name: 'OpenPing pages' }).getByRole('tab')
    await expect(tabs).toHaveText(['Is it down?', 'Free tools', 'Status page'])
    await tabs.nth(2).click()
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')
    await expect(stage.locator('iframe').filter({ visible: true })).toHaveAttribute('src', 'https://openping.n8builds.dev/status')
    // The arrow keys move between pages too.
    await page.keyboard.press('ArrowLeft')
    await expect(tabs.nth(1)).toBeFocused()
    await expect(stage.locator('iframe').filter({ visible: true })).toHaveAttribute('src', 'https://openping.n8builds.dev/tools')
    // Pages already opened stay loaded: switching back loads nothing again.
    const before = framed.length
    await tabs.nth(0).click()
    await expect(stage.locator('iframe').filter({ visible: true })).toHaveAttribute('src', /is-it-down$/)
    expect(framed.length).toBe(before)
  })

  test('the Phone switch shows the live product at a phone width, without reloading it', async ({ page }) => {
    const framed = await stubProducts(page)
    await page.goto('/builds/openping')
    const stage = page.getByTestId('product-stage')
    await stage.getByRole('button', { name: 'Try it live' }).click()
    const frame = stage.locator('iframe').filter({ visible: true })
    await expect(frame.contentFrame().locator('#w')).toHaveText(/width \d{4}/)
    const loads = framed.length

    await stage.getByRole('button', { name: 'Phone' }).click()
    await expect(stage.getByRole('button', { name: 'Phone' })).toHaveAttribute('aria-pressed', 'true')
    await expect(stage.locator('[data-device="phone"]')).toBeVisible()
    await expect.poll(async () => (await frame.boundingBox())!.width).toBe(390)
    // The same frame, resized: the product lays itself out again, nothing reloads.
    await expect(frame.contentFrame().locator('#w')).toHaveText(/width \d{4}/)
    expect(framed.length).toBe(loads)

    // The clip switches to its phone take.
    await stage.getByRole('button', { name: 'Watch it in use' }).click()
    const video = stage.locator('[data-tour] video').filter({ visible: true })
    await expect(video).toHaveAttribute('aria-label', /^The same on a phone/)
    await stage.getByRole('button', { name: 'Desktop' }).click()
    await expect(stage.locator('[data-tour] video').filter({ visible: true })).toHaveAttribute('aria-label', /^A short clip of OpenPing/)
  })

  test('a build with one live page shows no page tabs', async ({ page }) => {
    await stubProducts(page)
    await page.goto('/builds/solara')
    const stage = page.getByTestId('product-stage')
    await stage.getByRole('button', { name: 'Try it live' }).click()
    await expect(stage.getByRole('tablist')).toHaveCount(0)
    await expect(stage.locator('iframe')).toHaveAttribute('src', 'https://solara-uv.web.app/app/')
  })

  test('a build without a clip or a demo keeps its screenshot', async ({ page }) => {
    await page.goto('/builds/scribe')
    await expect(page.locator('#demo')).toHaveCount(0)
    await expect(page.locator('[data-build-picture]').getByRole('button', { name: /^Open screenshot/ })).toBeVisible()
  })
})

test.describe('the product stage on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('shows the phone take with no switches, and Try it live opens the product full screen', { tag: '@cross-browser' }, async ({ page }) => {
    await stubProducts(page)
    await page.goto('/builds/openping')
    await expect(page.getByTestId('product-stage')).toBeHidden()
    const compact = page.getByTestId('product-stage-compact')
    await expect(compact.locator('[data-tour] video').filter({ visible: true })).toHaveAttribute('aria-label', /^The same on a phone/)
    await expect(compact.getByRole('button', { name: 'Phone' })).toHaveCount(0)

    const opener = compact.getByRole('button', { name: 'Try it live' })
    await opener.click()
    const sheet = page.getByRole('dialog', { name: 'OpenPing, live' })
    await expect(sheet).toBeVisible()
    const frame = sheet.locator('iframe').filter({ visible: true })
    await expect(frame).toHaveAttribute('src', 'https://openping.n8builds.dev/tools/is-it-down')
    // Full screen: the product gets the phone's own width.
    expect((await frame.boundingBox())!.width).toBe(390)
    await sheet.getByRole('tab', { name: 'Status page' }).click()
    await expect(sheet.locator('iframe').filter({ visible: true })).toHaveAttribute('src', 'https://openping.n8builds.dev/status')
    await sheet.getByRole('button', { name: 'Close' }).click()
    await expect(sheet).toBeHidden()
    await expect(opener).toBeFocused()
  })
})

test.describe('the sidebar', () => {
  test('from 1024px it keeps the basics in view and lights the part being read', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/builds/openping')
    const sidebar = page.getByRole('complementary', { name: 'OpenPing at a glance' })
    await expect(sidebar).toBeVisible()
    await expect(sidebar.getByRole('term')).toHaveText(['What it is', 'Live at', 'Stack', 'License', 'Last shipped', 'Source'])
    await expect(sidebar.getByRole('link', { name: /openping\.n8builds\.dev/ })).toHaveAttribute('href', 'https://openping.n8builds.dev')
    await expect(sidebar.getByRole('list', { name: "OpenPing's stack" }).getByRole('listitem').first()).toHaveAttribute('title', 'Cloudflare Workers')
    await expect(sidebar.getByRole('definition').filter({ hasText: 'MIT' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: /n8watkins\/open-ping/ })).toHaveAttribute('href', 'https://github.com/n8watkins/open-ping')

    const nav = sidebar.getByRole('navigation', { name: 'On this page' })
    await expect(nav.getByRole('link')).toHaveText(['Try it live', 'What it does', 'Problem and build', "How it's built", 'Process notes', 'Build log', 'More builds'])

    // It stays in view while you read.
    await nav.getByRole('link', { name: 'Process notes' }).click()
    await expect(page).toHaveURL(/#process$/)
    await expect(nav.getByRole('link', { name: 'Process notes' })).toHaveAttribute('aria-current', 'location')
    const box = (await sidebar.boundingBox())!
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeLessThan(200)
    await page.locator('#log').scrollIntoViewIfNeeded()
    await page.evaluate(() => scrollBy(0, 200))
    await expect(nav.getByRole('link', { name: 'Build log' })).toHaveAttribute('aria-current', 'location')
  })

  test('on a phone the basics fold into one panel instead', { tag: '@cross-browser' }, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/builds/openping')
    await expect(page.getByRole('complementary', { name: 'OpenPing at a glance' })).toBeHidden()
    const panel = page.getByTestId('build-facts-panel')
    await expect(panel.getByRole('term').first()).toBeHidden()
    await panel.getByText('OpenPing at a glance').click()
    await expect(panel.getByRole('term').first()).toBeVisible()
    await expect(panel.getByRole('definition').filter({ hasText: 'MIT' })).toBeVisible()
  })
})
