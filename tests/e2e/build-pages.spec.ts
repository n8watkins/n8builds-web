import { expect, test } from '@playwright/test'

/**
 * A build's page (2026-10-27, the owner's round 13): the app icon first, the
 * kind and tech pills under the title, the main action near the top, the live
 * site with the other actions (never on the screenshot, since round 5 of
 * 2026-11-02), a checklist of what it does, and the "how it's built"
 * explainer. Since 2026-11-08 it is the build's full story: it carries the
 * stack, the features and every way in its Lab row leaves out.
 */
test.describe('a build page', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('Scribe leads with its icon, its tech and a download', { tag: '@smoke' }, async ({ page }) => {
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
    const source = (await header.getByRole('group', { name: 'Scribe on GitHub' }).boundingBox())!
    expect(source.y).toBeGreaterThan((await tech.boundingBox())!.y)

    // The download is up top, through the same route as the Lab.
    await expect(header.getByRole('link', { name: 'Download for Windows' })).toHaveAttribute('href', '/download/scribe')

    // The landing page sits with the other actions, after the download.
    const download = (await header.getByRole('link', { name: 'Download for Windows' }).boundingBox())!
    const live = (await header.getByRole('link', { name: /Visit the landing page/ }).boundingBox())!
    expect(live.y).toBeGreaterThanOrEqual(download.y)
    expect(Math.abs(live.x - download.x)).toBeLessThan(2)
  })

  // Round 5 of 2026-11-02: over the screenshot the live site covered the app's
  // Start button and window controls. No action overlaps the picture, at any width.
  for (const width of [1440, 1024, 820, 390, 320]) {
    for (const slug of ['scribe', 'openping', 'solara']) {
      test(`${slug}'s actions never cover its screenshot at ${width}px`, { tag: width === 1024 || width === 320 ? '@cross-browser' : [] }, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`/builds/${slug}`)
        const header = page.locator('main header').first()
        const shot = (await header.locator('img[alt]:not([alt=""])').last().boundingBox())!
        for (const link of await header.getByRole('link').all()) {
          const box = (await link.boundingBox())!
          const apart = box.x + box.width <= shot.x || box.x >= shot.x + shot.width || box.y + box.height <= shot.y || box.y >= shot.y + shot.height
          expect(apart, `${slug} at ${width}px: ${await link.textContent()}`).toBe(true)
        }
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
    // (Every build's parts are also laid out invisibly, to size it: only the shown one counts.)
    await expect(how.getByText('whisper.cpp', { exact: true }).filter({ visible: true })).toBeVisible()
    // Every Stack card carries its technology's mark.
    const stack = page.getByRole('region', { name: 'Tech stack' })
    const cards = stack.getByRole('listitem')
    expect(await cards.count()).toBeGreaterThan(3)
    for (const card of await cards.all()) await expect(card.locator('svg, img').first()).toBeAttached()
  })

  test('a build leads with its one main action, then the other ways in, then Star | GitHub', async ({ page }) => {
    await page.goto('/builds/openping')
    const header = page.locator('main header').first()
    await expect(header.getByRole('link', { name: /Download/ })).toHaveCount(0)
    // OpenPing's landing page is the product (owner, 2026-11-08), offered once.
    const actions = header.getByRole('link')
    const names = [/^Check it out/, /^Try the free tools/, /^Deploy your own/, /^Star OpenPing on GitHub/, /^OpenPing on GitHub/]
    await expect(actions).toHaveCount(names.length)
    for (const [i, name] of names.entries()) await expect(actions.nth(i)).toHaveAccessibleName(name)
    await expect(actions.first()).toHaveAttribute('href', 'https://openping.n8builds.dev')
    await expect(header.getByRole('link', { name: /Visit/ })).toHaveCount(0)
    // In reading order on screen.
    const boxes = await Promise.all((await actions.all()).map((a) => a.boundingBox()))
    for (let i = 1; i < boxes.length; i++) {
      const [a, b] = [boxes[i - 1]!, boxes[i]!]
      expect(b.y > a.y + 1 || (Math.abs(b.y - a.y) < 2 && b.x > a.x), `action ${i}`).toBe(true)
    }
  })

  test('fits a phone with no sideways scroll', { tag: '@cross-browser' }, async ({ page }) => {
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
