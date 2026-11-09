import { test, expect, type Page } from '@playwright/test'

/**
 * Scribe's row shows the app, not its landing page (round 4 of 2026-11-02): a
 * silent, looping screen recording of someone using it (round 5), like a GIF, where the other rows
 * have screenshots. It plays only on screen, stays on its first frame under
 * reduced motion. Its landing page is on its build page (owner, 2026-11-08).
 */

const tourOf = (page: Page, path: string) =>
  page.locator('#tools-i-built').getByRole('article', { name: 'Scribe' }).locator('[data-tour] video').first()

const isPlaying = (page: Page, path: string) => tourOf(page, path).evaluate((v: HTMLVideoElement) => !v.paused)

for (const path of ['/loadout', '/']) {
  test.describe(`Scribe's tour on ${path}`, () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } })

    test('is a muted, looping, inline video of the app, WebM first, with its first frame as the poster', { tag: '@cross-browser' }, async ({ page }) => {
      await page.goto(path)
      const row = page.locator('#tools-i-built').getByRole('article', { name: 'Scribe' })
      const video = tourOf(page, path)
      // The row's own, the only one (there is no Details dialog).
      await expect(row.locator('[data-tour] video')).toHaveCount(1)
      // Its first frame is a lazy image behind the video, not a poster fetched with the page.
      await expect(video).not.toHaveAttribute('poster')
      await expect(row.locator('[data-tour] img[data-tour-poster][src*="tour-poster.webp"]').first()).toHaveAttribute('loading', 'lazy')
      await expect(video).toHaveAttribute('aria-label', /A tour of the Scribe app, recorded as someone uses it/)
      // No sources until it first plays, so nothing but the poster loads before then.
      await expect(video.locator('source')).toHaveCount(0)
      await video.scrollIntoViewIfNeeded()
      await expect(video.locator('source')).toHaveCount(2)
      expect(await video.locator('source').evaluateAll((list) => list.map((s) => [s.getAttribute('src'), s.getAttribute('type')]))).toEqual([
        ['/builds/scribe/tour.webm', 'video/webm'],
        ['/builds/scribe/tour.mp4', 'video/mp4'],
      ])
      const flags = await video.evaluate((v: HTMLVideoElement) => ({ loop: v.loop, inline: v.hasAttribute('playsinline'), controls: v.controls }))
      expect(flags).toEqual({ loop: true, inline: true, controls: false })
      // No landing-page screenshots and no gallery: the tour is the picture.
      await expect(row.locator('img[src*="landing"], img[src*="features"]')).toHaveCount(0)
      await expect(row.getByRole('group', { name: 'Scribe screenshots' })).toHaveCount(0)
      // The 16:10 frame matches the video's, so nothing is cropped or jumps.
      const box = (await video.boundingBox())!
      expect(Math.abs(box.width / box.height - 1.6)).toBeLessThan(0.02)
    })

    test('plays on screen, muted, pauses off screen, and its button pauses and resumes it', { tag: path === '/' ? ['@cross-browser', '@smoke'] : '@cross-browser' }, async ({ page }) => {
      await page.goto(path)
      const video = tourOf(page, path)
      // Nothing loads or plays before the row is in view.
      expect(await isPlaying(page, path)).toBe(false)
      await expect(video.locator('source')).toHaveCount(0)
      await video.scrollIntoViewIfNeeded()
      await expect.poll(() => isPlaying(page, path)).toBe(true)
      expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true)

      const toggle = page.getByRole('button', { name: 'Pause the Scribe tour' }).filter({ visible: true })
      await toggle.click()
      await expect.poll(() => isPlaying(page, path)).toBe(false)
      const resume = page.getByRole('button', { name: 'Play the Scribe tour' }).filter({ visible: true })
      await expect(resume).toHaveAttribute('aria-pressed', 'true')
      await resume.click()
      await expect.poll(() => isPlaying(page, path)).toBe(true)

      // Scrolled away, it holds still.
      await page.evaluate(() => window.scrollTo(0, 0))
      await expect.poll(() => isPlaying(page, path)).toBe(false)
    })
  })

  test.describe(`Scribe's tour on ${path} under reduced motion`, () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } })

    test('stays on its first frame: it never plays or loads, and has no pause button', { tag: '@cross-browser' }, async ({ page }) => {
      const requested: string[] = []
      page.on('request', (r) => {
        if (/\/builds\/scribe\/tour\.(webm|mp4)/.test(r.url())) requested.push(r.url())
      })
      await page.goto(path)
      const video = tourOf(page, path)
      await video.scrollIntoViewIfNeeded()
      await page.waitForTimeout(800)
      expect(await isPlaying(page, path)).toBe(false)
      await expect(video.locator('xpath=preceding-sibling::img[@data-tour-poster]')).toBeVisible()
      await expect(page.getByRole('button', { name: /(Pause|Play) the Scribe tour/ })).toHaveCount(0)
      expect(requested).toEqual([])
    })
  })
}

test("Scribe's row offers its download, its full story and GitHub; the landing page is on its build page", async ({ page }) => {
  await page.goto('/loadout')
  const row = page.locator('#tools-i-built').getByRole('article', { name: 'Scribe' })
  await expect(row.getByRole('link', { name: 'Download for Windows' })).toBeVisible()
  await expect(row.getByRole('link', { name: 'Full story of Scribe', exact: true })).toHaveAttribute('href', '/builds/scribe')
  await expect(row.getByRole('link', { name: 'Scribe on GitHub (opens in a new tab)', exact: true })).toBeVisible()
  await expect(row.locator('a[href="https://scribe.n8builds.dev"]')).toHaveCount(0)
  await page.goto('/builds/scribe')
  const landing = page.locator('main header').getByRole('link', { name: /^Visit the landing page/ })
  await expect(landing).toHaveAttribute('href', 'https://scribe.n8builds.dev')
  await expect(landing).toHaveAttribute('target', '_blank')
})

test("the tour's files and its poster are served", async ({ request }) => {
  for (const [src, type] of [
    ['/builds/scribe/tour.webm', 'video/webm'],
    ['/builds/scribe/tour.mp4', 'video/mp4'],
    ['/builds/scribe/tour-poster.webp', 'image/webp'],
  ]) {
    const response = await request.get(src)
    expect(response.status(), src).toBe(200)
    expect(response.headers()['content-type'], src).toContain(type)
  }
})
