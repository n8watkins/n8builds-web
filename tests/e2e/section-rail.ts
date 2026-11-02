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
