import { expect, test } from '@playwright/test'

/**
 * A build page's product stage and sidebar (owner, 2026-11-09): the product
 * full width under the header, its clip on a desktop or a phone, and Try it
 * live, a plain link to the real product in a new tab (never embedded); and
 * from 1024px a sidebar with the build's basics and links to each part.
 */
const LIVE = {
  openping: 'https://openping.n8builds.dev/tools/is-it-down',
  solara: 'https://solara-uv.web.app/app/',
  wren: 'https://wren.n8builds.dev',
}

test.describe('the product stage on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('plays the clip, embeds nothing, and Try it live opens the real product in a new tab', async ({ page }) => {
    for (const slug of ['openping', 'solara', 'wren'] as const) {
      await page.goto(`/builds/${slug}`)
      const stage = page.getByTestId('product-stage')
      await expect(stage.locator('[data-tour] video').filter({ visible: true }), slug).toHaveCount(1)
      await expect(page.locator('iframe'), slug).toHaveCount(0)
      const live = stage.getByRole('link', { name: /^Try it live/ })
      await expect(live, slug).toHaveAttribute('href', LIVE[slug])
      await expect(live, slug).toHaveAttribute('target', '_blank')
      await expect(live, slug).toHaveAttribute('rel', 'noopener noreferrer')
      await expect(live, slug).toHaveAccessibleName(/opens in a new tab/)
      // Never the public status page.
      await expect(page.locator('main a[href*="/status"]'), slug).toHaveCount(0)
    }
  })

  test('the Phone switch shows the phone take in a phone, and Desktop brings the desktop take back', async ({ page }) => {
    await page.goto('/builds/openping')
    const stage = page.getByTestId('product-stage')
    const video = stage.locator('[data-tour] video').filter({ visible: true })
    await expect(stage.getByRole('button', { name: 'Desktop' })).toHaveAttribute('aria-pressed', 'true')
    await expect(video).toHaveAttribute('aria-label', /^A short clip of OpenPing/)

    await stage.getByRole('button', { name: 'Phone' }).click()
    await expect(stage.getByRole('button', { name: 'Phone' })).toHaveAttribute('aria-pressed', 'true')
    await expect(stage.locator('[data-device="phone"]')).toBeVisible()
    await expect(video).toHaveAttribute('aria-label', /^The same on a phone/)
    expect(Math.round((await video.boundingBox())!.width)).toBe(390)

    await stage.getByRole('button', { name: 'Desktop' }).click()
    await expect(stage.locator('[data-device="desktop"]')).toBeVisible()
    await expect(video).toHaveAttribute('aria-label', /^A short clip of OpenPing/)
  })

  test('a build without a clip keeps its screenshot', async ({ page }) => {
    await page.goto('/builds/scribe')
    await expect(page.locator('#demo')).toHaveCount(0)
    await expect(page.locator('[data-build-picture]').getByRole('button', { name: /^Open screenshot/ })).toBeVisible()
  })
})

test.describe('the product stage on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('plays the phone take with no switch, and Try it live opens the real product in a new tab', { tag: '@cross-browser' }, async ({ page }) => {
    await page.goto('/builds/openping')
    await expect(page.getByTestId('product-stage')).toBeHidden()
    const compact = page.getByTestId('product-stage-compact')
    await expect(compact.locator('[data-tour] video').filter({ visible: true })).toHaveAttribute('aria-label', /^The same on a phone/)
    await expect(compact.getByRole('button', { name: 'Phone' })).toHaveCount(0)
    const live = compact.getByRole('link', { name: /^Try it live/ })
    await expect(live).toBeVisible()
    await expect(live).toHaveAttribute('href', LIVE.openping)
    await expect(live).toHaveAttribute('target', '_blank')
    await expect(page.locator('iframe')).toHaveCount(0)
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
    await expect(nav.getByRole('link')).toHaveText(['See it in use', 'What it does', 'Problem and build', "How it's built", 'Process notes', 'Build log', 'More builds'])

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
