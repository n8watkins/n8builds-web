import { test, expect, type Locator } from '@playwright/test'

/**
 * Sections below the fold fade up as they scroll into view (components/ui/Reveal.tsx).
 */

/** The element's opacity multiplied through its ancestors: what the eye sees. */
const seenOpacity = (locator: Locator) =>
  locator.evaluate((el) => {
    let opacity = 1
    for (let node: Element | null = el; node; node = node.parentElement) {
      opacity *= Number(getComputedStyle(node).opacity)
    }
    return opacity
  })

test('a section below the fold is hidden until scrolled to, then fades in', async ({ page }) => {
  await page.goto('/')
  const tools = page.locator('#tools')
  await expect(tools).toBeAttached()
  expect(await seenOpacity(tools)).toBe(0)

  await tools.scrollIntoViewIfNeeded()
  await expect.poll(() => seenOpacity(tools)).toBe(1)
})

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('sections still end up fully visible, without movement', async ({ page }) => {
    await page.goto('/')
    const tools = page.locator('#tools')
    await tools.scrollIntoViewIfNeeded()
    await expect.poll(() => seenOpacity(tools)).toBe(1)
    const transform = await tools.evaluate((el) => getComputedStyle(el.parentElement!).transform)
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform)
  })
})
