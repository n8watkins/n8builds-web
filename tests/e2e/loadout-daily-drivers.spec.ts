import { test, expect } from '@playwright/test'

/**
 * /loadout's "My daily drivers" (the owner's call, 2026-11-01): the apps the
 * owner built and uses every day (Scribe) moved here from the homepage Lab's
 * "My tools", as the Lab's own rows, between How I work and Tools I built.
 * OpenPing went the other way, into the Lab's Featured builds. The row's own
 * behaviour (download, gallery, Details) is covered in lab.spec.ts.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

test('/loadout has My daily drivers, with Scribe as a Lab row, between How I work and Tools I built', async ({ page }) => {
  await page.goto('/loadout')
  const part = page.getByRole('region', { name: 'My daily drivers' })
  await expect(part.getByRole('heading', { level: 2 })).toHaveText('My daily drivers')
  await expect(part).toContainText('~/loadout/daily')
  await expect(part).toContainText('Apps I built for myself and run every day. Free and open source.')
  await expect(part.getByRole('article')).toHaveCount(1)
  const scribe = part.getByRole('article', { name: 'Scribe' })
  await expect(scribe.getByRole('heading', { level: 3 })).toHaveText('Scribe')
  await expect(scribe.getByRole('link', { name: 'Download for Windows' })).toHaveAttribute('href', '/download/scribe')
  // OpenPing is not here: it is a featured build in the homepage Lab.
  await expect(page.getByRole('article', { name: 'OpenPing' })).toHaveCount(0)
  // In page order, right before Tools I built (the small CLIs).
  const order = await page.locator('main h2').allTextContents()
  expect(order.slice(order.indexOf('How I work with AI'), order.indexOf('Tools I built') + 1)).toEqual([
    'How I work with AI',
    'My daily drivers',
    'Tools I built',
  ])
})

for (const width of [1440, 810, 390]) {
  test(`at ${width}px the row lines up with the page's column, and its wash reaches the page edge`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/loadout')
    const part = page.locator('#daily-drivers')
    await part.scrollIntoViewIfNeeded()
    const [heading, title, wash, built] = await Promise.all([
      part.getByRole('heading', { level: 2 }).boundingBox(),
      part.getByRole('heading', { level: 3, name: 'Scribe' }).boundingBox(),
      part.getByRole('article', { name: 'Scribe' }).boundingBox(),
      page.getByRole('heading', { level: 2, name: 'Tools I built' }).boundingBox(),
    ])
    // The row's text starts with the part's heading and the next part's (the
    // Scribe icon sits left of its title, so the title starts further in).
    expect(Math.abs(heading!.x - built!.x)).toBeLessThan(1)
    expect(title!.x).toBeGreaterThan(heading!.x)
    // Full-bleed: the row's colour wash spans the page (the page's width, its
    // scrollbar gutter aside), without sideways scrolling.
    const main = (await page.locator('main').boundingBox())!
    expect(wash!.x).toBe(main.x)
    expect(Math.abs(wash!.width - main.width)).toBeLessThan(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  })
}

test('old links to the Lab\'s "My tools" (/#my-tools) land on My daily drivers', async ({ page }) => {
  await page.goto('/#my-tools')
  await expect(page).toHaveURL(/\/loadout#daily-drivers$/)
  await expect(page.getByRole('heading', { level: 2, name: 'My daily drivers' })).toBeInViewport()
})

test("the navbar's Lab menu lists Featured with OpenPing in it, and no My tools", async ({ page }) => {
  await page.goto('/loadout')
  const nav = page.getByRole('navigation', { name: 'Primary' })
  await expect(nav.locator('a[href="/#featured"]').first()).toContainText('OpenPing, Solara and Portfolio Rank')
  await expect(nav.locator('a[href="/#my-tools"]')).toHaveCount(0)
})
