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
    // The main action has a line of its own, larger than the rest.
    const [main, other] = await Promise.all(
      [header.getByRole('link', { name: 'Download for Windows' }), header.getByRole('link', { name: /Visit the landing page/ })].map((l) => l.boundingBox()),
    )
    expect(main!.height).toBeGreaterThan(other!.height)
    expect(other!.y).toBeGreaterThan(main!.y + main!.height - 1)

    // The download is up top, through the same route as the Lab.
    await expect(header.getByRole('link', { name: 'Download for Windows' })).toHaveAttribute('href', '/download/scribe')

    // The landing page sits with the other actions, after the download, and
    // the header is one centred column (owner, 2026-11-09).
    const download = (await header.getByRole('link', { name: 'Download for Windows' }).boundingBox())!
    const live = (await header.getByRole('link', { name: /Visit the landing page/ }).boundingBox())!
    expect(live.y).toBeGreaterThanOrEqual(download.y)
    const box = (await header.boundingBox())!
    expect(Math.abs(download.x + download.width / 2 - (box.x + box.width / 2))).toBeLessThan(2)
    expect(Math.abs(title.x + title.width / 2 - (box.x + box.width / 2))).toBeLessThan(50)
  })

  // Round 5 of 2026-11-02: over the screenshot the live site covered the app's
  // Start button and window controls. Since 2026-11-09 the product sits full
  // width under the header: every action is above it, at any width.
  for (const width of [1440, 1024, 820, 390, 320]) {
    for (const slug of ['scribe', 'openping', 'solara']) {
      test(`${slug}'s actions sit above its product, never over it, at ${width}px`, { tag: width === 1024 || width === 320 ? '@cross-browser' : [] }, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`/builds/${slug}`)
        const header = page.locator('main header').first()
        const picture = (await page.locator('[data-build-picture]').boundingBox())!
        for (const link of await header.getByRole('link').all()) {
          const box = (await link.boundingBox())!
          expect(box.y + box.height, `${slug} at ${width}px: ${await link.textContent()}`).toBeLessThanOrEqual(picture.y)
        }
      })
    }
  }

  test('says what it does, and how it is built: a tab per layer with its stack cards', async ({ page }) => {
    await page.goto('/builds/scribe')
    const checklist = page.getByRole('region', { name: 'What Scribe does' })
    await expect(checklist.getByRole('listitem')).toHaveCount(6)
    // One section (owner, 2026-11-08): no separate Stack & choices, no animation box.
    await expect(page.getByRole('heading', { name: 'Stack & choices' })).toHaveCount(0)
    const how = page.getByRole('region', { name: "How it's built" })
    await how.scrollIntoViewIfNeeded()
    const tabs = how.getByRole('tab')
    await expect(tabs).toHaveText(['Frontend', 'Backend', 'Cloud'])
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
    const panel = how.getByRole('tabpanel')
    await expect(panel).toHaveCount(1)
    await expect(panel).toContainText('React · TypeScript · Vite')
    const height = (await how.boundingBox())!.height
    await tabs.nth(1).click()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    for (const name of ['Tauri 2 · Rust', 'whisper.cpp', 'SQLite']) await expect(how.getByRole('tabpanel').getByText(name, { exact: true })).toBeVisible()
    // The arrow keys move between tabs, and the section keeps its height.
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(2)).toBeFocused()
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')
    await expect(how.getByRole('tabpanel')).toContainText('GitHub Actions · Releases')
    expect(Math.abs((await how.boundingBox())!.height - height)).toBeLessThan(1)
    // Every card carries its technology's mark.
    for (const card of await how.getByRole('tabpanel').getByRole('listitem').all()) await expect(card.locator('svg, img').first()).toBeAttached()
    // A build without a layer shows no tab for it: VoiceDock runs on your machine, nothing in the cloud.
    await page.goto('/builds/voicedock')
    await expect(page.getByRole('region', { name: "How it's built" }).getByRole('tab')).toHaveText(['Frontend', 'Backend'])
  })

  test('OpenPing and Solara show a short clip of the product in use, loaded lazily, with a phone take', async ({ page }) => {
    for (const slug of ['openping', 'solara']) {
      await page.goto(`/builds/${slug}`)
      const video = page.locator('#demo [data-tour] video').filter({ visible: true })
      await expect(video, slug).toHaveCount(1)
      await expect(video, slug).toHaveAttribute('aria-label', /A short clip of/)
      await expect(video, slug).toHaveAttribute('preload', 'none')
      for (const file of ['clip.webm', 'clip.mp4', 'clip-poster.webp', 'clip-phone.webm', 'clip-phone.mp4', 'clip-phone-poster.webp']) {
        const response = await page.request.get(`/builds/${slug}/${file}`)
        expect(response.status(), `${slug}/${file}`).toBe(200)
        expect(Number(response.headers()['content-length'] ?? (await response.body()).length), `${slug}/${file} is small`).toBeLessThan(1_500_000)
      }
    }
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
      test('each feature shows its screenshot, which opens large in a lightbox: arrows, Escape, focus back', { tag: '@cross-browser' }, async ({ page }) => {
        await page.goto('/builds/openping')
        const features = page.getByRole('region', { name: 'What OpenPing does' })
        await features.scrollIntoViewIfNeeded()
        let opener
        if (!touch) {
          // From 1024px: hovering or clicking a feature puts its screenshot in the panel.
          const feature = features.getByRole('button', { name: /^Schedule-aware/ })
          await feature.hover()
          await expect(feature).toHaveAttribute('aria-pressed', 'true')
          opener = features.getByRole('button', { name: /^Open screenshot: Schedule-aware/ })
        } else {
          // Phones: each feature with a screenshot carries a thumbnail that opens it.
          opener = features.getByRole('button', { name: /^Open screenshot: Schedule-aware/ })
        }
        await expect(opener).toBeVisible()
        await expect(opener).toBeEnabled()
        await opener.click()
        const dialog = page.getByRole('dialog', { name: 'OpenPing screenshots' })
        await expect(dialog).toBeVisible()
        await expect(dialog.getByRole('img')).toHaveAccessibleName(/Schedule-aware/)
        await expect(dialog).toContainText('3 / 5')
        await page.keyboard.press('ArrowRight')
        await expect(dialog).toContainText('4 / 5')
        await dialog.getByRole('button', { name: 'Previous screenshot' }).click()
        await expect(dialog).toContainText('3 / 5')
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
        await expect(opener).toBeFocused()
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
  for (const name of ["How it's built", 'Process notes', 'Build log', 'More builds']) {
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
