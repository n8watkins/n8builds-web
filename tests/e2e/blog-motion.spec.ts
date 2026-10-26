import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * Nate's Notions fades in like the rest of the site, without ever holding
 * content back: what is on screen at load fades in with CSS (components/ui/FadeIn.tsx),
 * straight from the server HTML, and what is below the fold fades up as it
 * scrolls into view (components/ui/Reveal.tsx). Reduced motion shows it all at once.
 */

// See reveal.spec.ts: WebKit's frames crawl on a loaded machine.
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

/** The element's transform, or its nearest transformed ancestor's. */
const ancestorTransform = (locator: Locator) =>
  locator.evaluate((el) => {
    for (let node: Element | null = el; node; node = node.parentElement) {
      const transform = getComputedStyle(node).transform
      if (transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)') return transform
    }
    return 'none'
  })

/** Animations running on the element or any of its ancestors. */
const ancestorAnimations = (locator: Locator) =>
  locator.evaluate((el) => {
    let count = 0
    for (let node: Element | null = el; node; node = node.parentElement) {
      count += node.getAnimations().filter((a) => a.playState === 'running').length
    }
    return count
  })

/** Path of the first post on the blog index, read from its server HTML. */
async function firstPostPath(page: Page) {
  const html = await (await page.request.get('/blog')).text()
  const path = html.match(/href="(\/blog\/[^"?#]+)"/)?.[1]
  expect(path, 'blog index links to at least one post').toBeTruthy()
  return path!
}

const cards = (page: Page) => page.locator('main a[href^="/blog/"]').filter({ has: page.locator('h3') })

test.describe('without JavaScript (the server HTML alone)', () => {
  test.use({ javaScriptEnabled: false })

  test('the blog heading and the first row of cards still fade in', async ({ page }) => {
    await page.goto('/blog')
    await expect.poll(() => seenOpacity(page.locator('h1')), FADE).toBe(1)
    const first = cards(page).first()
    await expect.poll(() => seenOpacity(first), FADE).toBe(1)
    expect(await ancestorTransform(first)).toBe('none')
  })

  test("a post's heading, cover and body still fade in", async ({ page }) => {
    await page.goto(await firstPostPath(page))
    await expect.poll(() => seenOpacity(page.locator('h1')), FADE).toBe(1)
    await expect.poll(() => seenOpacity(page.locator('article img').first()), FADE).toBe(1)
    await expect.poll(() => seenOpacity(page.locator('article p').first()), FADE).toBe(1)
  })
})

test('the first blog cards fade up on load, staggered', async ({ page }) => {
  await page.goto('/blog')
  const fades = await cards(page).evaluateAll((links) =>
    links.slice(0, 3).map((link) => {
      const style = getComputedStyle(link.parentElement!)
      return { name: style.animationName, delay: style.animationDelay }
    })
  )
  expect(fades.length).toBeGreaterThan(0)
  for (const fade of fades) expect(fade.name).toBe('fade-up')
  // Each card starts a little after the one before it.
  const delays = fades.map((f) => parseFloat(f.delay))
  expect(delays).toEqual([...delays].sort((a, b) => a - b))
  if (delays.length > 1) expect(delays[1]).toBeGreaterThan(delays[0])
  for (const card of (await cards(page).all()).slice(0, 3)) {
    await expect.poll(() => seenOpacity(card), FADE).toBe(1)
  }
})

test('blog cards past the first row are hidden until scrolled to, then fade in', async ({ page }) => {
  await page.goto('/blog')
  await expect(cards(page).first()).toBeVisible()
  test.skip((await cards(page).count()) < 4, 'needs a second row of posts')
  const card = cards(page).nth(3)
  // Hidden from the server HTML on, until it scrolls into view.
  await expect.poll(() => seenOpacity(card), FADE).toBe(0)
  await expect
    .poll(async () => {
      await card.scrollIntoViewIfNeeded()
      return seenOpacity(card)
    }, FADE)
    .toBe(1)
})

test("a post's related notes fade in as they scroll into view", async ({ page }) => {
  await page.goto(await firstPostPath(page))
  const related = page.getByRole('region', { name: 'More notes' })
  test.skip((await related.count()) === 0, 'the post has no related notes')
  const card = related.locator('a').first()
  await expect.poll(() => seenOpacity(card), FADE).toBe(0)
  await expect
    .poll(async () => {
      await card.scrollIntoViewIfNeeded()
      return seenOpacity(card)
    }, FADE)
    .toBe(1)
})

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('the blog is simply shown: no fade, no rise, nothing to wait for', async ({ page }) => {
    await page.goto('/blog')
    for (const target of [page.locator('h1'), cards(page).first()]) {
      expect(await seenOpacity(target)).toBe(1)
      expect(await ancestorAnimations(target)).toBe(0)
      expect(await ancestorTransform(target)).toBe('none')
    }
    // Below the fold too, once hydrated (FADE covers a slow hydration).
    const last = cards(page).last()
    await expect
      .poll(async () => {
        await last.scrollIntoViewIfNeeded()
        return seenOpacity(last)
      }, FADE)
      .toBe(1)
    expect(await ancestorTransform(last)).toBe('none')
  })

  test('a post is simply shown', async ({ page }) => {
    await page.goto(await firstPostPath(page))
    for (const target of [page.locator('h1'), page.locator('article img').first(), page.locator('article p').first()]) {
      expect(await seenOpacity(target)).toBe(1)
      expect(await ancestorAnimations(target)).toBe(0)
      expect(await ancestorTransform(target)).toBe('none')
    }
  })
})
