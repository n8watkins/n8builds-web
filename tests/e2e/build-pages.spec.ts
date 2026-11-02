import { expect, test } from '@playwright/test'

/**
 * A build's page (2026-10-27, the owner's round 13): the app icon first, the
 * kind and tech pills under the title, the main action near the top, the live
 * site with the other actions (never on the screenshot, since round 5 of
 * 2026-11-02), a checklist of what it does, and the Details dialog's "how it's
 * built" explainer.
 */
test.describe('a build page', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('Scribe leads with its icon, its tech and a download', async ({ page }) => {
    await page.goto('/builds/scribe')
    const header = page.locator('main header').first()
    await expect(header.getByRole('heading', { level: 1, name: 'Scribe' })).toBeVisible()
    await expect(header.getByText('Speech-to-text for Windows')).toBeVisible()

    // The kind and the tech pills sit under the title, not beside the buttons.
    const title = (await header.getByRole('heading', { level: 1 }).boundingBox())!
    const kind = (await header.getByText('Desktop app', { exact: true }).boundingBox())!
    expect(kind.y).toBeGreaterThan(title.y + title.height - 1)
    const tech = header.getByRole('list', { name: 'Scribe is built with' })
    for (const name of ['Tauri', 'Rust', 'whisper.cpp', 'SQLite', 'React']) await expect(tech.getByText(name, { exact: true })).toBeVisible()
    const source = (await header.getByRole('link', { name: /View source/ }).boundingBox())!
    expect(source.y).toBeGreaterThan((await tech.boundingBox())!.y)

    // The download is up top, through the same route as the Lab.
    await expect(header.getByRole('link', { name: 'Download for Windows' })).toHaveAttribute('href', '/download/scribe')

    // The landing page sits with the other actions, after the download.
    const download = (await header.getByRole('link', { name: 'Download for Windows' }).boundingBox())!
    const live = (await header.getByRole('link', { name: /Visit the landing page/ }).boundingBox())!
    expect(live.y).toBeGreaterThanOrEqual(download.y)
    expect(Math.abs(live.x - download.x)).toBeLessThan(2)
  })

  // Round 5 of 2026-11-02: over the screenshot it covered the app's Start button
  // and window controls. It never overlaps the picture, at any width.
  for (const width of [1440, 1024, 820, 390, 320]) {
    for (const slug of ['scribe', 'openping', 'solara']) {
      test(`${slug}'s live site never covers its screenshot at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`/builds/${slug}`)
        const header = page.locator('main header').first()
        const shot = (await header.locator('img[alt]:not([alt=""])').last().boundingBox())!
        const live = (await header.getByRole('link', { name: /Visit the landing page/ }).boundingBox())!
        const apart =
          live.x + live.width <= shot.x || live.x >= shot.x + shot.width || live.y + live.height <= shot.y || live.y >= shot.y + shot.height
        expect(apart, `${slug} at ${width}px`).toBe(true)
      })
    }
  }

  test('says what it does, how it is built, and shows each technology', async ({ page }) => {
    await page.goto('/builds/scribe')
    const checklist = page.getByRole('region', { name: 'What Scribe does' })
    await expect(checklist.getByRole('listitem')).toHaveCount(6)
    const how = page.getByRole('region', { name: "How it's built" })
    await how.scrollIntoViewIfNeeded()
    for (const tab of ['Frontend', 'Backend', 'Cloud']) await expect(how.getByRole('button', { name: tab })).toBeVisible()
    await how.getByRole('button', { name: 'Backend' }).click()
    await expect(how.getByText('whisper.cpp', { exact: true })).toBeVisible()
    // Every Stack card carries its technology's mark.
    const stack = page.getByRole('region', { name: 'Tech stack' })
    const cards = stack.getByRole('listitem')
    expect(await cards.count()).toBeGreaterThan(3)
    for (const card of await cards.all()) await expect(card.locator('svg, img').first()).toBeAttached()
  })

  test('a build without a download leads with its landing page', async ({ page }) => {
    await page.goto('/builds/openping')
    const header = page.locator('main header').first()
    await expect(header.getByRole('link', { name: /Download/ })).toHaveCount(0)
    // Named for what it opens (round 4 of 2026-11-02): OpenPing's site is its landing page.
    await expect(header.getByRole('link', { name: /Visit the landing page/ })).toHaveAttribute('href', 'https://openping.n8builds.dev')
    await expect(header.getByRole('link', { name: /Visit live site/ })).toHaveCount(0)
    // With no download, the landing page is the first action, before the source.
    const live = (await header.getByRole('link', { name: /Visit the landing page/ }).boundingBox())!
    const source = (await header.getByRole('link', { name: /View source/ }).boundingBox())!
    expect(live.y < source.y || (Math.abs(live.y - source.y) < 2 && live.x < source.x)).toBe(true)
  })

  test('fits a phone with no sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    for (const path of ['/builds/scribe', '/builds/openping', '/builds']) {
      await page.goto(path)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), path).toBeLessThanOrEqual(0)
    }
  })
})

test('the build log opens with its figures, and each month counts its updates', async ({ page }) => {
  await page.goto('/builds')
  for (const label of ['builds tracked', 'updates in 12 months', 'releases in 12 months']) {
    await expect(page.getByRole('definition').filter({ hasText: /^\d+$/ }).first()).toBeVisible()
    await expect(page.getByRole('term').filter({ hasText: label })).toHaveCount(1)
  }
  const month = page.locator('#activity h3').first()
  await expect(month).toContainText(/\d+ updates?/)
})
