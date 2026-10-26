import { test, expect } from '@playwright/test'

/**
 * The hero at the narrowest phone width still in use (iPhone SE, 1st gen).
 * The section clips its overflow, so text pushed past the screen edge would be
 * cut off silently instead of making the page scroll sideways.
 */

test.use({ viewport: { width: 320, height: 568 }, hasTouch: true, contextOptions: { reducedMotion: 'reduce' } })

test('the heading, subheader and prompt -> repeat chips all fit on a 320px screen', async ({ page }) => {
  await page.goto('/')
  const hero = page.locator('#home')
  // The chain is prompt -> build -> ship -> repeat, in that order ("idea" was dropped).
  await expect(hero.locator('.n8-cnode')).toHaveText(['prompt', 'build', 'ship', 'repeat'])
  await expect(hero.getByText('idea', { exact: true })).toHaveCount(0)
  const targets = [
    hero.getByRole('heading', { level: 1, name: 'n8builds' }),
    hero.getByText('Spending tokens, shipping features.'),
    hero.getByText('prompt', { exact: true }),
    hero.getByText('repeat', { exact: true }),
  ]
  for (const target of targets) {
    const box = await target.boundingBox()
    expect(box, `${target} is rendered`).not.toBeNull()
    expect(box!.x, `${target} left edge`).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width, `${target} right edge`).toBeLessThanOrEqual(320)
  }
  // Nothing on the page scrolls sideways (clientWidth excludes a desktop scrollbar).
  // On failure, name the elements that stick out past the edge.
  const { scroll, client, culprits } = await page.evaluate(() => {
    const client = document.documentElement.clientWidth
    const culprits = [...document.querySelectorAll('body *')]
      .filter((el) => {
        if (el.getBoundingClientRect().right <= client + 0.5) return false
        // Skip anything inside a box that clips it. Stop at <body>: its
        // overflow-y: scroll computes overflow-x to auto, which would skip everything.
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          if (getComputedStyle(p).overflowX !== 'visible') return false
        }
        return true
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.getAttribute('class')).slice(0, 80)}`)
    return { scroll: document.documentElement.scrollWidth, client, culprits }
  })
  expect(scroll, `overflowing: ${culprits.join(' | ')}`).toBeLessThanOrEqual(client)
})

/**
 * The portrait (the page's LCP element) fades in with the rest of the hero,
 * in CSS from the server HTML rather than after hydration, and shows at once
 * under reduced motion.
 */
test.describe('the hero portrait', () => {
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: false })

  const portrait = (page: import('@playwright/test').Page) => page.locator('#home').getByRole('img', { name: /^Nathan Watkins/ })

  /** The portrait's opacity as painted: its own times every ancestor's. */
  const paintedOpacity = (page: import('@playwright/test').Page) =>
    portrait(page).evaluate((img) => {
      let opacity = 1
      for (let el: Element | null = img; el; el = el.parentElement) opacity *= Number(getComputedStyle(el).opacity)
      return opacity
    })

  test.describe('with motion', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } })

    test('fades in from the server HTML and ends fully visible', async ({ page }) => {
      // JavaScript off: the entrance must not wait for hydration.
      await page.context().route('**/*.js', (route) => route.abort())
      await page.goto('/')
      const animation = await portrait(page).evaluate((img) => getComputedStyle(img.closest('.hero-portrait-in')!).animationName)
      expect(animation).toBe('hero-portrait-in')
      await expect.poll(() => paintedOpacity(page), { timeout: 5_000 }).toBe(1)
      await expect(portrait(page)).toBeVisible()
    })
  })

  test.describe('with reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } })

    test('is fully visible immediately, with no entrance', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      expect(await portrait(page).evaluate((img) => getComputedStyle(img.closest('.hero-portrait-in')!).animationName)).toBe('none')
      expect(await paintedOpacity(page)).toBe(1)
    })
  })
})
