import type { Locator, Page } from '@playwright/test'

/**
 * Shared checks for the floating side rails (components/ui/SectionRail.tsx):
 * the homepage Lab's (lab-section-nav.spec.ts) and the Loadout's
 * (loadout-section-nav.spec.ts).
 */

/**
 * Which shape the rail's breakpoints give this window. Asked of the page, not
 * worked out from the window width: WebKit's media queries see the window
 * minus its scrollbar (a 1440px window is 1432px there), so each breakpoint
 * lands a scrollbar's width later than in Chromium and Firefox.
 */
export const railShape = (page: Page) =>
  page.evaluate(() => {
    const atLeast = (rem: number) => matchMedia(`(min-width: ${rem}rem)`).matches
    return { rail: atLeast(80), labels: atLeast(90), shortLabel: atLeast(90) && !atLeast(96) }
  })

/**
 * The left edge of everything visible in a part: its text, its media and
 * every box that paints (a border or a fill: cards, buttons, pills). Layout
 * wrappers paint nothing, and full-bleed bands (the parts' and rows'
 * background washes) are backdrop, so both are skipped.
 */
export const contentLeft = (part: Locator) =>
  part.evaluate((root) => {
    let left = Infinity
    const onScreen = (r: DOMRect) =>
      r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < window.innerHeight
    for (const el of [root, ...root.querySelectorAll<HTMLElement>('*')]) {
      const r = el.getBoundingClientRect()
      if (!onScreen(r) || r.width >= window.innerWidth * 0.9) continue
      const cs = getComputedStyle(el)
      const paints =
        /^(IMG|SVG|VIDEO|CANVAS|PICTURE)$/i.test(el.tagName) ||
        parseFloat(cs.borderLeftWidth) > 0 ||
        (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') ||
        cs.backgroundImage !== 'none'
      if (paints && cs.visibility !== 'hidden' && cs.opacity !== '0') left = Math.min(left, r.left)
      for (const node of el.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent!.trim()) continue
        const range = document.createRange()
        range.selectNodeContents(node)
        for (const t of range.getClientRects()) if (onScreen(t)) left = Math.min(left, t.left)
      }
    }
    return left
  })

/** How many lines each of the rail's labels takes on screen, in order. */
export const labelLines = (rail: Locator) =>
  rail.getByRole('link').evaluateAll((links) =>
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
    })
  )

/**
 * Clicks a rail row with motion on and checks the jump (round 5 of
 * 2026-11-02): the page starts moving at once (within a few frames, not after
 * the browser's slow ease-in), only the clicked row is lit for the whole
 * scroll (no part it passes lights up), and it lands on the part, under the
 * navbar, still lit.
 */
export async function expectCleanJump(page: Page, rail: Locator, name: string, id: string) {
  const link = rail.getByRole('link', { name, exact: true })
  await page.evaluate(() => {
    const w = window as unknown as { __rail: { lit: string[]; moved: number | null; t0: number } }
    w.__rail = { lit: [], moved: null, t0: 0 }
    const y0 = window.scrollY
    document.addEventListener(
      'click',
      () => {
        w.__rail.t0 = performance.now()
        const tick = () => {
          const lit = document.querySelector('[data-section-rail] a[aria-current]')?.getAttribute('href') ?? ''
          w.__rail.lit.push(lit)
          if (w.__rail.moved === null && Math.abs(window.scrollY - y0) > 4) w.__rail.moved = performance.now() - w.__rail.t0
          if (performance.now() - w.__rail.t0 < 1500) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { capture: true, once: true }
    )
  })
  await link.click()
  await expect
    .poll(() => page.locator(`#${id}`).evaluate((el) => Math.round(el.getBoundingClientRect().top)), { timeout: 10_000 })
    .toBe(80)
  await page.waitForTimeout(1600)
  const { lit, moved } = await page.evaluate(() => (window as unknown as { __rail: { lit: string[]; moved: number | null } }).__rail)
  expect(new Set(lit), 'only the clicked row lights during the scroll').toEqual(new Set([`#${id}`]))
  expect(moved, 'the scroll starts at once').not.toBeNull()
  // A few frames, with room for a loaded CI machine; the browser's own smooth scroll barely moved in its first 100ms.
  expect(moved!).toBeLessThan(250)
  await expect(link).toHaveAttribute('aria-current', 'location')
}
