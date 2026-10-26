import { test, expect, type Page } from '@playwright/test'

/**
 * The Lab's floating side nav (components/sections/LabSectionNav.tsx): a
 * desktop-only rail in the left gutter that marks the Lab part on screen
 * (My tools, Featured, Chrome extensions) and jumps to it.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const PARTS = [
  { id: 'my-tools', label: 'My tools' },
  { id: 'featured', label: 'Featured' },
  { id: 'extensions', label: 'Chrome extensions' },
] as const

const rail = (page: Page) => page.getByRole('navigation', { name: 'Lab contents' })

/** Scroll so the part's top sits a little under the navbar. */
async function scrollToPart(page: Page, id: string) {
  await page.evaluate((id) => {
    const el = document.getElementById(id)!
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'instant' })
  }, id)
}

test.describe('at 1440px', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('shows only while the Lab is on screen, and marks the part being read', async ({ page }) => {
    await page.goto('/')
    const nav = rail(page)
    for (const [i, part] of PARTS.entries()) await expect(nav.getByRole('link').nth(i)).toHaveAccessibleName(part.label)
    // Above the Lab (the hero) it is out of view.
    await expect(nav).not.toBeInViewport()

    for (const part of PARTS) {
      await scrollToPart(page, part.id)
      await expect(nav).toBeInViewport()
      const current = nav.getByRole('link', { name: part.label, exact: true })
      await expect(current).toHaveAttribute('aria-current', 'location')
      await expect(nav.locator('[aria-current]')).toHaveCount(1)
    }

    // Past the Lab it scrolls away with it.
    await page.locator('#contact').scrollIntoViewIfNeeded()
    await expect(nav).not.toBeInViewport()
  })

  test('a click jumps to the part, below the sticky navbar', async ({ page }) => {
    await page.goto('/')
    await scrollToPart(page, 'my-tools')
    const nav = rail(page)
    for (const part of [PARTS[2], PARTS[1], PARTS[0]]) {
      await nav.getByRole('link', { name: part.label, exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`#${part.id}$`))
      // Lands at the page's scroll-padding-top (80px), clear of the 68px navbar.
      await expect
        .poll(() => page.locator(`#${part.id}`).evaluate((el) => Math.round(el.getBoundingClientRect().top)))
        .toBe(80)
      await expect(nav.getByRole('link', { name: part.label, exact: true })).toHaveAttribute('aria-current', 'location')
    }
  })

  test('the links are focusable and at least 24px on each side', async ({ page }) => {
    await page.goto('/')
    await scrollToPart(page, 'featured')
    for (const link of await rail(page).getByRole('link').all()) {
      const box = (await link.boundingBox())!
      expect(box.height).toBeGreaterThanOrEqual(24)
      expect(box.width).toBeGreaterThanOrEqual(24)
    }
    await rail(page).getByRole('link', { name: 'Featured', exact: true }).focus()
    await expect(rail(page).getByRole('link', { name: 'Featured', exact: true })).toBeFocused()
  })
})

test('works without JavaScript: plain links to the three parts', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto('/')
  const links = rail(page).getByRole('link')
  for (const [i, part] of PARTS.entries()) await expect(links.nth(i)).toHaveAccessibleName(part.label)
  for (const [i, part] of PARTS.entries()) await expect(links.nth(i)).toHaveAttribute('href', `#${part.id}`)
  await context.close()
})

for (const width of [1280, 1440, 1536, 1920]) {
  test(`at ${width}px it sits beside the content without overlapping it or scrolling sideways`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const nav = rail(page)
    for (const part of PARTS) {
      await scrollToPart(page, part.id)
      await expect(nav).toBeInViewport()
      const navBox = (await nav.boundingBox())!
      expect(navBox.x, 'inside the window').toBeGreaterThanOrEqual(8)
      // Every visible box in the part (headings, rows, cards) starts right of the rail.
      const contentLeft = await page.locator(`#${part.id}`).evaluate((root) => {
        let left = Infinity
        for (const el of [root, ...root.querySelectorAll('*')]) {
          const r = el.getBoundingClientRect()
          if (r.width && r.height && r.bottom > 0 && r.top < window.innerHeight) left = Math.min(left, r.left)
        }
        return left
      })
      expect(navBox.x + navBox.width, `${part.id} content`).toBeLessThanOrEqual(contentLeft - 8)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    // Every label stays on one line (or one column, in the slim vertical rail).
    const lines = await nav.getByRole('link').evaluateAll((links) =>
      links.map((a) => {
        // The line boxes of the label's visible text: one line means one top
        // (one left, for vertical text).
        const vertical = getComputedStyle(a).writingMode.startsWith('vertical')
        const positions = new Set<number>()
        const walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT)
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          // Skip text only screen readers get (a 1px clipped box).
          if (node.parentElement!.getBoundingClientRect().width <= 1) continue
          const range = document.createRange()
          range.selectNodeContents(node)
          for (const r of range.getClientRects()) {
            if (r.width > 1 && r.height > 1) positions.add(Math.round(vertical ? r.left : r.top))
          }
        }
        return positions.size
      }),
    )
    expect(lines, 'lines per label').toEqual([1, 1, 1])
    // Where the gutter is tight, the long label shows its short form instead of wrapping.
    const extensions = nav.getByRole('link', { name: 'Chrome extensions' })
    await expect(extensions).toHaveAccessibleName('Chrome extensions')
    const short = extensions.getByText('Extensions', { exact: true })
    if (width >= 1440 && width < 1536) await expect(short).toBeVisible()
    else await expect(short).toBeHidden()
  })
}

test('is absent on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  await scrollToPart(page, 'featured')
  await expect(rail(page)).toBeHidden()
  // The pill links under the Lab heading still lead to each part.
  await expect(page.getByRole('navigation', { name: 'Lab sections' }).getByRole('link')).toHaveText(PARTS.map((p) => p.label))
})
