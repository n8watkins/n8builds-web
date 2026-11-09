import { expect, type Locator, type Page } from '@playwright/test'

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
 * navbar (a first row: on its band's top), still lit.
 */
export async function expectCleanJump(
  page: Page,
  rail: Locator,
  name: string,
  id: string,
  /** Where the jump lands, when not on the part itself (a first row lands on its band's top). */
  land: { selector: string; top: number } = { selector: `#${id}`, top: 80 }
) {
  const link = rail.getByRole('link', { name, exact: true })
  await page.evaluate(() => {
    const w = window as unknown as { __rail: { lit: string[]; moved: number | null; t0: number } }
    // `moved`: the frame (counted from the click) on which the page had moved.
    w.__rail = { lit: [], moved: null, t0: 0 }
    const y0 = window.scrollY
    document.addEventListener(
      'click',
      () => {
        w.__rail.t0 = performance.now()
        const tick = () => {
          const lit = document.querySelector('[data-section-rail] a[aria-current]')?.getAttribute('href') ?? ''
          w.__rail.lit.push(lit)
          if (w.__rail.moved === null && Math.abs(window.scrollY - y0) > 4) w.__rail.moved = w.__rail.lit.length
          if (performance.now() - w.__rail.t0 < 1500) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { capture: true, once: true }
    )
  })
  await link.click()
  await expect
    .poll(() => page.locator(land.selector).evaluate((el) => Math.round(el.getBoundingClientRect().top)), { timeout: 10_000 })
    .toBe(land.top)
  await page.waitForTimeout(1600)
  const { lit, moved } = await page.evaluate(() => (window as unknown as { __rail: { lit: string[]; moved: number | null } }).__rail)
  expect(new Set(lit), 'only the clicked row lights during the scroll').toEqual(new Set([`#${id}`]))
  expect(moved, 'the scroll starts at once').not.toBeNull()
  // Within the first few frames (a busy machine's frames can be long, so frames, not
  // milliseconds); the browser's own smooth scroll had barely moved after six.
  expect(moved!).toBeLessThanOrEqual(3)
  await expect(link).toHaveAttribute('aria-current', 'location')
}

/**
 * Scroll so a part's heading icon (its `[data-part-icon]`) has its middle `offset` px
 * below the window's middle line (negative: above it), and keep at it until it stays
 * there, then send the scroll event the rail listens for.
 */
export async function placeIcon(page: Page, partId: string, offset: number) {
  await expect
    .poll(
      () =>
        page.evaluate(
          ([id, offset]) => {
            const icon = document.getElementById(id as string)!.querySelector('[data-part-icon]')!
            const box = icon.getBoundingClientRect()
            const now = box.top + box.height / 2 - innerHeight / 2
            if (Math.abs(now - (offset as number)) <= 1) return true
            window.scrollTo({ top: window.scrollY + now - (offset as number), behavior: 'instant' })
            return false
          },
          [partId, offset] as const
        ),
      { timeout: 20_000 }
    )
    .toBe(true)
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')))
}

/**
 * Round 10 of 2026-11-09 (owner): a rail's item switches to a part when that part's
 * heading icon is halfway up the window, its middle on the window's middle line, so
 * the rail's icon and the heading's play together. For each part after the first:
 * with its icon a little under the line the part before is still lit, and a little
 * over it, this one is.
 */
export async function expectSwitchAtIconMidline(page: Page, rail: Locator, parts: readonly { id: string; label: string }[]) {
  for (let i = 1; i < parts.length; i++) {
    await placeIcon(page, parts[i].id, 12)
    await expect(rail.locator('[aria-current]'), `${parts[i].id}: icon under the line`).toHaveAccessibleName(parts[i - 1].label)
    await placeIcon(page, parts[i].id, -12)
    await expect(rail.locator('[aria-current]'), `${parts[i].id}: icon over the line`).toHaveAccessibleName(parts[i].label)
  }
}
