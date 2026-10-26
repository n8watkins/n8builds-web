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

/**
 * The hero's text column (2026-10-26): no CTA button, and the route for
 * someone hiring sits above the social icons.
 */
test.describe('the hero text column', () => {
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: false })

  test('has no "See what I\'m building" button', async ({ page }) => {
    await page.goto('/')
    const hero = page.locator('#home')
    await expect(hero.getByRole('heading', { level: 1, name: 'n8builds' })).toBeVisible()
    await expect(hero.getByText(/See what I.m building/)).toHaveCount(0)
  })

  test('shows "Hiring? See my developer portfolio" above the social links', async ({ page }) => {
    await page.goto('/')
    const hero = page.locator('#home')
    const hiring = await hero.getByRole('link', { name: 'See my developer portfolio' }).boundingBox()
    const socials = await hero.getByRole('navigation', { name: 'Social links' }).boundingBox()
    expect(hiring!.y + hiring!.height).toBeLessThanOrEqual(socials!.y)
  })
})

/**
 * The first screen (2026-10-26): the "What I'm working on" heading peeks in
 * under the hero, so the visitor sees there is more, but the card under it
 * stays below the fold. Laptop sizes; reduced motion so the scroll reveal
 * doesn't move the heading while it's measured.
 */
for (const [width, height] of [
  [1280, 800],
  [1440, 900],
  [1366, 768],
  [1536, 864],
  [1920, 1080],
]) {
  test.describe(`the first screen at ${width}x${height}`, () => {
    test.use({ viewport: { width, height }, hasTouch: false, contextOptions: { reducedMotion: 'reduce' } })

    test('shows the top of "What I\'m working on" but not its card', async ({ page }) => {
      await page.goto('/')
      const heading = page.locator('#now').getByRole('heading', { level: 2, name: "What I'm working on" })
      const box = (await heading.boundingBox())!
      // At least the top third of the heading's line is on screen...
      expect(box.y + box.height / 3, 'heading peeks in').toBeLessThanOrEqual(height)
      // ...and the card (everything after the heading block) starts below the fold.
      const card = await page.locator('#now h2').evaluate((h2) => h2.closest('div.mb-8')!.nextElementSibling!.getBoundingClientRect().top)
      expect(card, 'card stays below the fold').toBeGreaterThanOrEqual(height)
    })
  })
}

/**
 * The background grid (components/sections/HeroGrid.tsx): its lit cells
 * wander, but never touch (no shared edge or corner, counting cells still
 * fading out), hold still while the hero is off screen, and stand still under
 * reduced motion.
 */
test.describe('the hero grid', () => {
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: false })

  /** The grid cells that are painted at all right now, as [x, y] cell indexes. */
  const litCells = (page: import('@playwright/test').Page) =>
    page.locator('#home svg rect[data-cell]').evaluateAll((rects) =>
      rects
        .filter((r) => Number(getComputedStyle(r).opacity) > 0.005)
        .map((r) => [Number(r.getAttribute('data-x')), Number(r.getAttribute('data-y'))] as [number, number])
    )

  const touching = (cells: [number, number][]) => {
    const pairs: string[] = []
    for (let a = 0; a < cells.length; a++)
      for (let b = a + 1; b < cells.length; b++)
        if (Math.abs(cells[a][0] - cells[b][0]) <= 1 && Math.abs(cells[a][1] - cells[b][1]) <= 1)
          pairs.push(`${cells[a]} & ${cells[b]}`)
    return pairs
  }

  test.describe('with motion', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } })

    test('lights many cells, and no two lit cells ever touch', async ({ page }) => {
      test.setTimeout(30_000)
      await page.goto('/')
      expect(await page.locator('#home svg rect[data-cell]').count()).toBeGreaterThanOrEqual(45)
      let most = 0
      const moved = new Set<string>()
      for (let i = 0; i < 70; i++) {
        const cells = await litCells(page)
        most = Math.max(most, cells.length)
        cells.forEach((c) => moved.add(String(c)))
        expect(touching(cells), `sample ${i}`).toEqual([])
        await page.waitForTimeout(150)
      }
      expect(most, 'cells lit at once').toBeGreaterThanOrEqual(35)
      // They wander: more distinct spots were lit than there are cells.
      expect(moved.size).toBeGreaterThan(48)
    })

    test('holds still while the hero is scrolled off screen', async ({ page }) => {
      await page.goto('/')
      await page.waitForTimeout(2000)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await expect(page.locator('#home')).toHaveAttribute('data-offscreen', '')
      const spots = () => page.locator('#home svg rect[data-cell]').evaluateAll((rects) => rects.map((r) => `${r.getAttribute('data-x')},${r.getAttribute('data-y')}`).join(' '))
      // Let any fade already under way finish, then nothing may move.
      await page.waitForTimeout(2000)
      const before = await spots()
      expect(before, 'the grid has cells').not.toBe('')
      await page.waitForTimeout(5000)
      expect(await spots()).toBe(before)
    })
  })

  test.describe('with reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } })

    test('shows a still pattern of separate cells', async ({ page }) => {
      await page.goto('/')
      await page.waitForTimeout(500)
      const first = await litCells(page)
      expect(first.length).toBeGreaterThanOrEqual(35)
      expect(touching(first)).toEqual([])
      await page.waitForTimeout(3000)
      expect(await litCells(page)).toEqual(first)
    })
  })
})
