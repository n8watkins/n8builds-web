import { test, expect } from '@playwright/test'

/**
 * The hero at the narrowest phone width still in use (iPhone SE, 1st gen).
 * The section clips its overflow, so text pushed past the screen edge would be
 * cut off silently instead of making the page scroll sideways.
 */

test.use({ viewport: { width: 320, height: 568 }, hasTouch: true, contextOptions: { reducedMotion: 'reduce' } })

test('the heading, subheader and idea -> repeat chips all fit on a 320px screen', async ({ page }) => {
  await page.goto('/')
  const hero = page.locator('#home')
  const targets = [
    hero.getByRole('heading', { level: 1, name: 'n8builds' }),
    hero.getByText('Spending tokens, shipping features.'),
    hero.getByText('idea', { exact: true }),
    hero.getByText('repeat', { exact: true }),
  ]
  for (const target of targets) {
    const box = await target.boundingBox()
    expect(box, `${target} is rendered`).not.toBeNull()
    expect(box!.x, `${target} left edge`).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width, `${target} right edge`).toBeLessThanOrEqual(320)
  }
  // Nothing on the page scrolls sideways (clientWidth excludes a desktop scrollbar).
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  expect(scroll).toBeLessThanOrEqual(client)
})
