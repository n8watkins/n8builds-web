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

    // A quiet header (owner, 2026-11-08): the kind is one small line over the
    // name, and the tech pills moved down to Stack & choices.
    const title = (await header.getByRole('heading', { level: 1 }).boundingBox())!
    const kind = (await header.getByText('Desktop app', { exact: true }).boundingBox())!
    expect(kind.y + kind.height).toBeLessThanOrEqual(title.y + 1)
    await expect(header.getByRole('list', { name: 'Scribe is built with' })).toHaveCount(0)
    const tech = page.getByRole('region', { name: 'Tech stack' }).getByRole('list', { name: 'Scribe is built with' })
    for (const name of ['Tauri', 'Rust', 'whisper.cpp', 'SQLite', 'React']) await expect(tech.getByText(name, { exact: true })).toBeVisible()
    // The main action has a line of its own, larger than the rest.
    const [main, other] = await Promise.all(
      [header.getByRole('link', { name: 'Download for Windows' }), header.getByRole('link', { name: /Visit the landing page/ })].map((l) => l.boundingBox()),
    )
    expect(main!.height).toBeGreaterThan(other!.height)
    expect(other!.y).toBeGreaterThan(main!.y + main!.height - 1)

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

test.describe('build page screenshots', () => {
  for (const [label, viewport, touch] of [
    ['desktop', { width: 1280, height: 900 }, false],
    ['phone', { width: 390, height: 844 }, true],
  ] as const) {
    test.describe(label, () => {
      test.use({ viewport, hasTouch: touch })
      test('every screenshot opens large in a lightbox: arrows, Escape, and focus back where it was', { tag: '@cross-browser' }, async ({ page }) => {
        await page.goto('/builds/openping')
        const shots = page.getByRole('button', { name: /^Open screenshot/ })
        await expect(shots).toHaveCount(3)
        const second = shots.nth(1)
        await second.scrollIntoViewIfNeeded()
        await expect(second).toBeEnabled()
        await second.click()
        const dialog = page.getByRole('dialog', { name: 'OpenPing screenshots' })
        await expect(dialog).toBeVisible()
        await expect(dialog.getByRole('img')).toHaveAccessibleName(/status page/)
        await expect(dialog).toContainText('2 / 3')
        // The keys step through, wrapping round.
        await page.keyboard.press('ArrowRight')
        await expect(dialog).toContainText('3 / 3')
        await page.keyboard.press('ArrowRight')
        await expect(dialog).toContainText('1 / 3')
        // So do the buttons.
        await dialog.getByRole('button', { name: 'Previous screenshot' }).click()
        await expect(dialog).toContainText('3 / 3')
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
        await expect(second).toBeFocused()
        // The header picture opens too, and the close button shuts it.
        const first = shots.first()
        await first.scrollIntoViewIfNeeded()
        await first.click()
        await expect(dialog).toContainText('1 / 3')
        await dialog.getByRole('button', { name: 'Close screenshots' }).click()
        await expect(dialog).toBeHidden()
        await expect(first).toBeFocused()
      })
    })
  }
})

test('every build page ends with More builds: three others, the featured ones first, never itself', async ({ page }) => {
  for (const [slug, expected] of [
    ['openping', ['Solara', 'Scribe', 'Portfolio Rank']],
    ['solara', ['OpenPing', 'Scribe', 'Portfolio Rank']],
    ['tubevault', ['OpenPing', 'Solara', 'Scribe']],
    ['n8builds', ['OpenPing', 'Solara', 'Scribe']],
  ] as const) {
    await page.goto(`/builds/${slug}`)
    const more = page.getByRole('region', { name: 'More builds' })
    const cards = more.getByRole('link')
    await expect(cards, slug).toHaveCount(3)
    for (const [i, name] of expected.entries()) await expect(cards.nth(i), slug).toContainText(name)
  }
  await page.getByRole('region', { name: 'More builds' }).getByRole('link', { name: /OpenPing/ }).click()
  await expect(page).toHaveURL(/\/builds\/openping$/)
})

test('the section headings are centred', async ({ page }) => {
  await page.goto('/builds/openping')
  for (const name of ["How it's built", 'Stack & choices', 'Process notes', 'Build log', 'More builds']) {
    const heading = page.getByRole('heading', { level: 2, name, exact: true })
    await expect(heading, name).toHaveCSS('text-align', 'center')
  }
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
