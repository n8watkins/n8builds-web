import { expect, test } from '@playwright/test'

/**
 * A build's page (2026-10-27, the owner's round 13): the app icon first, the
 * kind and tech pills under the title, the main action near the top, the live
 * site on the right of the screenshot, a checklist of what it does, and the
 * Details dialog's "how it's built" explainer.
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

    // The live site sits on the right of its screenshot.
    const shot = (await header.getByRole('img', { name: /talk, it types/i }).boundingBox())!
    const live = (await header.getByRole('link', { name: /Visit live site/ }).boundingBox())!
    expect(live.x).toBeGreaterThan(shot.x + shot.width / 2)
    expect(live.y).toBeGreaterThanOrEqual(shot.y - 40)
  })

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

  test('a build without a download offers its live site on the screenshot', async ({ page }) => {
    await page.goto('/builds/openping')
    const header = page.locator('main header').first()
    await expect(header.getByRole('link', { name: /Download/ })).toHaveCount(0)
    await expect(header.getByRole('link', { name: /Visit live site/ })).toHaveAttribute('href', 'https://openping.n8builds.dev')
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
