import { test, expect, type Locator } from '@playwright/test'

/**
 * Sections below the fold fade up as they scroll into view (components/ui/Reveal.tsx).
 */

// The fade itself takes about half a second, but WebKit's animation frames
// crawl when many browser workers share a loaded machine (a fade was seen at
// 0.46 after 5s, while on its own it completes in under a second), so the
// checks allow 15s for the fade to finish.
const FADE = { timeout: 15_000 }

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
  const section = page.locator('#template')
  await expect(section).toBeAttached()
  expect(await seenOpacity(section)).toBe(0)

  // Scroll to it the way a reader keeps scrolling: the lazily loaded sections
  // above can still grow after the first scroll (on a busy CI runner), pushing
  // it back below the fold before it ever entered the viewport.
  await expect
    .poll(async () => {
      await section.scrollIntoViewIfNeeded()
      return seenOpacity(section)
    }, FADE)
    .toBe(1)
})

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('sections are simply shown: no fade, no rise, nothing to wait for', async ({ page }) => {
    await page.goto('/')
    const section = page.locator('#template')
    // Hydration applies it (FADE also covers a slow hydration on a loaded machine).
    await expect
      .poll(async () => {
        await section.scrollIntoViewIfNeeded()
        return seenOpacity(section)
      }, FADE)
      .toBe(1)
    const transform = await section.evaluate((el) => getComputedStyle(el.parentElement!).transform)
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform)
  })
})

test.describe('above the fold, without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  // components/ui/FadeIn.tsx: a CSS fade from the server HTML, never held back
  // until hydration (which, without JavaScript, never comes).
  for (const [path, text] of [
    ['/loadout', 'The tools, stack, and rig I actually run'],
    ['/live', 'Not live right now'],
    ['/privacy', 'Information I collect'],
  ]) {
    test(`${path} fades in its first screen`, async ({ page }) => {
      await page.goto(path)
      await expect.poll(() => seenOpacity(page.locator('h1')), FADE).toBe(1)
      await expect.poll(() => seenOpacity(page.getByText(text).first()), FADE).toBe(1)
    })
  }
})

test('the site footer fades in as it scrolls into view', async ({ page }) => {
  await page.goto('/privacy')
  const sitemap = page.getByRole('navigation', { name: 'Sitemap' })
  await expect(sitemap).toBeAttached()
  expect(await seenOpacity(sitemap)).toBe(0)
  await expect
    .poll(async () => {
      await sitemap.scrollIntoViewIfNeeded()
      return seenOpacity(sitemap)
    }, FADE)
    .toBe(1)
})
