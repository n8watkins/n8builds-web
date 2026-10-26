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
 * The first screen (2026-10-26): "What I'm working on" peeks in under the
 * hero, its heading and the top of its card, so the visitor sees there is
 * more. Laptop and tablet sizes only: on phones the portrait comes first and
 * the hero runs past the fold. Reduced motion so the scroll reveal doesn't
 * move the heading while it's measured.
 */
for (const [width, height] of [
  [1280, 800],
  [1440, 900],
  [1366, 768],
  [1536, 864],
  [1920, 1080],
  [768, 1024],
]) {
  test.describe(`the first screen at ${width}x${height}`, () => {
    test.use({ viewport: { width, height }, hasTouch: false, contextOptions: { reducedMotion: 'reduce' } })

    test('shows "What I\'m working on" and the top of its card as a sneak peek', async ({ page }) => {
      await page.goto('/')
      const heading = page.locator('#now').getByRole('heading', { level: 2, name: "What I'm working on" })
      const box = (await heading.boundingBox())!
      // The whole heading is on screen...
      expect(box.y + box.height, 'heading on screen').toBeLessThanOrEqual(height)
      // ...and so is the card's top edge (its gradient border and the start of
      // the logo row), but only the top of it.
      const card = await page.locator('#now h2').evaluate((h2) => h2.closest('div.mb-8')!.nextElementSibling!.getBoundingClientRect().top)
      expect(card, 'card top edge on screen').toBeLessThanOrEqual(height - 16)
      expect(card, 'only the top of the card').toBeGreaterThanOrEqual(height - 140)
      // From 800px tall, the card's logo row shows too.
      if (height >= 800) {
        const logo = await page.locator('#now h2').evaluate((h2) => h2.closest('div.mb-8')!.nextElementSibling!.querySelector('img')!.getBoundingClientRect().bottom)
        expect(logo, 'logo row on screen').toBeLessThanOrEqual(height)
      }
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
      expect(most, 'cells lit at once').toBeGreaterThanOrEqual(14)
      // They wander: more distinct spots were lit than cells at once.
      expect(moved.size).toBeGreaterThan(most + 3)
    })

    // Never an empty moment: once warmed up, plenty of cells are visibly lit
    // (bright enough, on screen, inside the fade mask, not under the
    // portrait) at every sample.
    for (const [w, h, min] of [
      [1280, 800, 14],
      [375, 812, 5],
    ] as const) {
      test(`always has cells lit on screen at ${w}x${h}`, async ({ page }) => {
        test.setTimeout(40_000)
        await page.setViewportSize({ width: w, height: h })
        await page.goto('/')
        await page.waitForTimeout(7000) // the warm-up
        const fewest: number[] = []
        for (let i = 0; i < 40; i++) {
          fewest.push(
            await page.evaluate(() => {
              const hero = document.getElementById('home')!.getBoundingClientRect()
              const portrait = document.querySelector('.hero-portrait-in')!.getBoundingClientRect()
              const width = document.documentElement.clientWidth
              return [...document.querySelectorAll('#home svg rect[data-cell]')].filter((r) => {
                const b = r.getBoundingClientRect()
                const x = b.left + b.width / 2
                const y = b.top + b.height / 2
                const under = x > portrait.left && x < portrait.right && y > portrait.top && y < portrait.bottom
                return Number(getComputedStyle(r).opacity) > 0.2 && x > 0 && x < width && y - hero.top < hero.height * 0.8 && !under
              }).length
            })
          )
          await page.waitForTimeout(250)
        }
        expect(Math.min(...fewest), `visibly lit cells per sample: ${fewest.join(' ')}`).toBeGreaterThanOrEqual(min)
      })
    }

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
      expect(first.length).toBeGreaterThanOrEqual(14)
      expect(touching(first)).toEqual([])
      await page.waitForTimeout(3000)
      expect(await litCells(page)).toEqual(first)
    })
  })
})

/**
 * Phones (2026-10-26): the portrait sits above the heading and is on the
 * first screen, and the tagline stays on one line.
 */
for (const [width, height] of [
  [375, 812],
  [390, 844],
  [320, 568],
]) {
  test.describe(`the hero on a ${width}x${height} phone`, () => {
    test.use({ viewport: { width, height }, hasTouch: true, contextOptions: { reducedMotion: 'reduce' } })

    test('shows the portrait above the heading, on the first screen', async ({ page }) => {
      await page.goto('/')
      const hero = page.locator('#home')
      const portrait = (await hero.getByRole('img', { name: /^Nathan Watkins/ }).boundingBox())!
      const heading = (await hero.getByRole('heading', { level: 1, name: 'n8builds' }).boundingBox())!
      expect(portrait.width, 'portrait size').toBeGreaterThanOrEqual(140)
      expect(portrait.y, 'portrait clears the navbar').toBeGreaterThanOrEqual(68)
      expect(portrait.y + portrait.height, 'portrait on the first screen').toBeLessThanOrEqual(height)
      expect(portrait.y + portrait.height, 'portrait above the heading').toBeLessThanOrEqual(heading.y)
      expect(heading.y, 'heading on the first screen').toBeLessThan(height)
    })

    test('keeps "Spending tokens, shipping features." on one line', async ({ page }) => {
      await page.goto('/')
      const tagline = page.locator('#home').getByText('Spending tokens, shipping features.')
      const { lines, right } = await tagline.evaluate((el) => {
        const range = document.createRange()
        range.selectNodeContents(el)
        const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)))
        return { lines: tops.size, right: el.getBoundingClientRect().right }
      })
      expect(lines).toBe(1)
      expect(right).toBeLessThanOrEqual(width - 16)
    })
  })
}

/**
 * The whoami terminal (2026-10-26): the name lives in its title bar, and the
 * body is two short sentences, the first one line even on a phone.
 */
test.describe('the whoami terminal', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true })

  test('names Nathan in its title bar and keeps the body short', async ({ page }) => {
    await page.goto('/')
    const terminal = page.locator('#home [data-terminal]')
    await expect(terminal.locator('[data-terminal-title]')).toHaveText("~/whoami :: Nathan 'N8' Watkins")
    await expect(terminal.getByText('AI-first software developer.', { exact: true })).toBeVisible()
    await expect(terminal.getByText('I build apps and tools I wish existed.', { exact: true })).toBeVisible()
    await expect(terminal).not.toContainText('in LA')
    await expect(terminal).not.toContainText('heavy lifting')
    const first = await terminal.getByText('AI-first software developer.', { exact: true }).evaluate((el) => {
      const range = document.createRange()
      range.selectNodeContents(el)
      return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size
    })
    expect(first, 'first sentence fits one line').toBe(1)
  })

  test('the title bar fits a 320px screen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/')
    const title = page.locator('#home [data-terminal-title]')
    const box = (await title.boundingBox())!
    expect(box.x + box.width).toBeLessThanOrEqual(300)
    // One line, never wrapped, and the whole name shows (nothing cut off).
    expect(box.height).toBeLessThan(24)
    await expect(title).toContainText("Nathan 'N8' Watkins")
    expect(await title.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  })
})

/**
 * The portrait swap (borrowed from the dev portfolio, 2026-10-26): after the
 * page has loaded, a watercolor version fades in and out over the photo.
 * The photo stays the first paint; reduced motion keeps the photo only.
 */
test.describe('the portrait swap', () => {
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: false })

  const swap = (page: import('@playwright/test').Page) => page.locator('#home img[data-portrait-swap]')
  const shown = (page: import('@playwright/test').Page) => swap(page).evaluate((img) => getComputedStyle(img).opacity)

  test.describe('with motion', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } })

    test('is not in the server HTML, then alternates with the photo', async ({ page }) => {
      test.setTimeout(30_000)
      const html = await (await page.request.get('/')).text()
      expect(html).not.toContain('portrait-watercolor')
      await page.goto('/')
      await expect(swap(page)).toHaveCount(1, { timeout: 10_000 })
      await expect.poll(() => shown(page), { timeout: 8_000 }).toBe('1')
      await expect.poll(() => shown(page), { timeout: 8_000 }).toBe('0')
    })

    test('holds still while the hero is off screen', async ({ page }) => {
      test.setTimeout(30_000)
      await page.goto('/')
      await expect(swap(page)).toHaveCount(1, { timeout: 10_000 })
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await expect(page.locator('#home')).toHaveAttribute('data-offscreen', '')
      await page.waitForTimeout(1000)
      const before = await shown(page)
      await page.waitForTimeout(7000)
      expect(await shown(page)).toBe(before)
    })
  })

  test.describe('with reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } })

    test('keeps the photo only', async ({ page }) => {
      await page.goto('/')
      await page.waitForTimeout(5000)
      await expect(swap(page)).toHaveCount(0)
      await expect(page.locator('#home').getByRole('img', { name: /^Nathan Watkins/ })).toBeVisible()
    })
  })
})
