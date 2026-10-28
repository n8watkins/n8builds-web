import { test, expect, type Page } from '@playwright/test'

/**
 * The Lab's floating side nav (components/sections/LabSectionNav.tsx): a
 * desktop-only rail in the left gutter that marks the Lab part on screen
 * (My tools, Featured, Chrome Extensions) and jumps to it. It appears once
 * the first part's heading reaches the middle of the window (level with it,
 * not beside the Lab's intro), then holds there while the Lab scrolls by.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const PARTS = [
  { id: 'my-tools', label: 'My tools' },
  { id: 'featured', label: 'Featured' },
  { id: 'extensions', label: 'Chrome Extensions' },
] as const

const rail = (page: Page) => page.getByRole('navigation', { name: 'Lab contents' })
// The rail fades in on a frame after the scroll; a loaded CI machine (WebKit especially) can take several seconds.
const SHOW = { timeout: 15_000 }

/**
 * Open the homepage and wait until the rail's script is running. The rail is
 * a progressive enhancement that shows once hydrated, which on a loaded
 * machine (WebKit, many workers) can take longer than an assertion's timeout.
 */
async function openHome(page: Page) {
  await page.goto('/')
  await expect(page.getByTestId('lab-section-nav')).toHaveAttribute('data-ready', '', {
    timeout: 20_000,
  })
}

/**
 * Scroll so the part's top sits a little under the navbar, and keep at it
 * until it stays there: images and reveals above can still shift the layout
 * just after the jump (on a loaded CI machine), which left the page short of
 * the Lab, with the rail rightly hidden.
 */
async function scrollToPart(page: Page, id: string) {
  await expect
    .poll(() =>
      page.evaluate((id) => {
        const el = document.getElementById(id)!
        const top = el.getBoundingClientRect().top
        if (Math.abs(top - 120) <= 2) return true
        window.scrollTo({ top: top + window.scrollY - 120, behavior: 'instant' })
        return false
      }, id),
      // The page can still be settling (images, fades) on a slow CI machine: keep nudging it.
      { timeout: 20_000 }
    )
    .toBe(true)
  // A visitor's scroll always fires a scroll event; an instant programmatic one
  // may not in every engine, so send one, as the rail listens for it.
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')))
}

test.describe('at 1440px', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('shows only while the Lab is on screen, and marks the part being read', async ({ page }) => {
    await openHome(page)
    const nav = rail(page)
    // Above the Lab (the hero) it is hidden.
    await expect(nav).toBeHidden()
    await scrollToPart(page, PARTS[0].id)
    for (const [i, part] of PARTS.entries())
      await expect(nav.getByRole('link').nth(i)).toHaveAccessibleName(part.label)

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
    // Three smooth-scroll jumps in a row: under a full parallel run each can take
    // several seconds, so the 30s default is too tight.
    test.setTimeout(60_000)
    await openHome(page)
    await scrollToPart(page, 'my-tools')
    const nav = rail(page)
    for (const part of [PARTS[2], PARTS[1], PARTS[0]]) {
      await nav.getByRole('link', { name: part.label, exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`#${part.id}$`))
      // Lands at the page's scroll-padding-top (80px), clear of the 68px navbar.
      await expect
        .poll(() =>
          page.locator(`#${part.id}`).evaluate((el) => Math.round(el.getBoundingClientRect().top))
        )
        .toBe(80)
      await expect(nav.getByRole('link', { name: part.label, exact: true })).toHaveAttribute(
        'aria-current',
        'location'
      )
    }
  })

  test('the links are focusable and at least 24px on each side', async ({ page }) => {
    await openHome(page)
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

test.describe('placement at 1440px', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  /** Scroll so the first part's heading sits `top` px from the window's top. */
  async function headingAt(page: Page, top: number) {
    await page.evaluate((top) => {
      const h = document.querySelector<HTMLElement>('#my-tools :is(h2, h3)')!
      window.scrollTo({
        top: h.getBoundingClientRect().top + window.scrollY - top,
        behavior: 'instant',
      })
    }, top)
  }
  const headingTop = (page: Page) =>
    page
      .locator('#my-tools')
      .locator('h2, h3')
      .first()
      .evaluate((h) => h.getBoundingClientRect().top)

  test('stays hidden beside the Lab intro and appears level with the first heading', async ({
    page,
  }) => {
    await openHome(page)
    const nav = rail(page)
    // The intro on screen, the first heading still in the lower half: no rail.
    await headingAt(page, 650)
    await expect(page.getByRole('navigation', { name: 'Lab sections' })).toBeInViewport()
    await expect(nav).toBeHidden()

    // The heading reaches the rail's centred spot: the rail shows, level with it.
    const navHeight = await page
      .locator('nav[aria-label="Lab contents"]')
      .evaluate((n) => (n as HTMLElement).offsetHeight)
    const centre = Math.floor((900 - navHeight) / 2)
    await headingAt(page, centre - 2)
    await expect(nav).toBeVisible(SHOW)
    const top = (await nav.boundingBox())!.y
    expect(Math.abs(top - (await headingTop(page)))).toBeLessThanOrEqual(3)
  })

  test('holds at the middle of the window through the Lab', async ({ page }) => {
    await openHome(page)
    const nav = rail(page)
    for (const part of PARTS) {
      await page.evaluate((id) => {
        const el = document.getElementById(id)!
        // The part's top at 300px: being read, with the Lab well below the window's foot.
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY - 300,
          behavior: 'instant',
        })
      }, part.id)
      await expect(nav).toBeVisible(SHOW)
      const box = (await nav.boundingBox())!
      expect(Math.abs(box.y + box.height / 2 - 450), part.id).toBeLessThanOrEqual(2)
    }
    // At the Lab's foot it rides out with the Lab, never below it.
    await page.evaluate(() => {
      const lab = document.getElementById('lab')!
      window.scrollTo({
        top: lab.getBoundingClientRect().bottom + window.scrollY - 300,
        behavior: 'instant',
      })
    })
    const box = (await nav.boundingBox())!
    const labBottom = await page.locator('#lab').evaluate((l) => l.getBoundingClientRect().bottom)
    expect(box.y + box.height).toBeLessThanOrEqual(labBottom + 1)
  })

  test('the template offer between Featured and Chrome Extensions counts as Featured', async ({
    page,
  }) => {
    await openHome(page)
    const nav = rail(page)
    const current = nav.locator('[aria-current]')
    // Scroll so the element's top sits `top` px from the window's top.
    const place = (id: string, top: number) =>
      page.evaluate(
        ([id, top]) => {
          const el = document.getElementById(id as string)!
          window.scrollTo({
            top: el.getBoundingClientRect().top + window.scrollY - (top as number),
            behavior: 'instant',
          })
        },
        [id, top] as const
      )
    // The template offer coming in, filling the window, and leaving until its
    // foot is just under the middle of the window: still Featured.
    const height = await page
      .locator('#template')
      .evaluate((el) => el.getBoundingClientRect().height)
    for (const top of [500, 100, Math.round(470 - height)]) {
      await place('template', top)
      await expect(current, `template at ${top}px`).toHaveAccessibleName('Featured')
    }
    // Chrome Extensions takes over only once its own top passes the middle of the window.
    await place('extensions', 500)
    await expect(current).toHaveAccessibleName('Featured')
    await place('extensions', 400)
    await expect(current).toHaveAccessibleName('Chrome Extensions')
  })

  test('keyboard: Tab reaches each part in order and Enter jumps there', async ({ page }) => {
    await openHome(page)
    await scrollToPart(page, 'featured')
    const nav = rail(page)
    await expect(nav).toBeVisible(SHOW)
    await nav.getByRole('link').first().focus()
    await expect(nav.getByRole('link', { name: 'My tools', exact: true })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(nav.getByRole('link', { name: 'Featured', exact: true })).toBeFocused()
    await page.keyboard.press('Tab')
    const extensions = nav.getByRole('link', { name: 'Chrome Extensions', exact: true })
    await expect(extensions).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#extensions$/)
    await expect(extensions).toHaveAttribute('aria-current', 'location')
  })

  test('reduced motion: nothing moves (no comet spin, no sliding)', async ({ page }) => {
    await openHome(page)
    await scrollToPart(page, 'featured')
    const nav = page.locator('nav[aria-label="Lab contents"]')
    await expect(rail(page)).toBeVisible(SHOW)
    const motion = await nav.evaluate((n) => {
      const all = [n, ...n.querySelectorAll<HTMLElement>('*')].map((el) => getComputedStyle(el))
      return {
        animations: all.filter((cs) => cs.animationName !== 'none').length,
        moving: all.filter(
          (cs) =>
            /translate|top|height/.test(cs.transitionProperty) && cs.transitionDuration !== '0s'
        ).length,
      }
    })
    expect(motion).toEqual({ animations: 0, moving: 0 })
  })
})

test.describe('icons only, 1280-1439px', () => {
  // 1366, not 1280: WebKit's media queries see the window minus its scrollbar,
  // so a 1280px window there is just under the rail's 1280px breakpoint.
  test.use({ viewport: { width: 1366, height: 900 } })

  test('each icon names its part in a tooltip on hover and on keyboard focus', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Desktop only: a touch screen has no hover, and phones never show the rail')
    await openHome(page)
    await scrollToPart(page, 'featured')
    const nav = rail(page)
    await expect(nav).toBeVisible(SHOW)
    // No heading and no inline labels: the rail is just the icons.
    await expect(nav.getByText('The Lab', { exact: true })).toBeHidden()
    const tooltip = (name: string) =>
      nav.getByRole('link', { name, exact: true }).getByText(name, { exact: true })
    for (const part of PARTS) await expect(tooltip(part.label)).toHaveCSS('opacity', '0')

    await nav.getByRole('link', { name: 'Featured', exact: true }).hover()
    await expect(tooltip('Featured')).toHaveCSS('opacity', '1')
    await page.mouse.move(700, 450)
    await expect(tooltip('Featured')).toHaveCSS('opacity', '0')

    await nav.getByRole('link', { name: 'My tools', exact: true }).focus()
    await page.keyboard.press('Tab')
    await expect(tooltip('Featured')).toHaveCSS('opacity', '1')
    // The links keep their full names for screen readers.
    for (const [i, part] of PARTS.entries())
      await expect(nav.getByRole('link').nth(i)).toHaveAccessibleName(part.label)
  })
})

test('works without JavaScript: plain links to the three parts', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  await page.goto('/')
  const links = rail(page).getByRole('link')
  for (const [i, part] of PARTS.entries())
    await expect(links.nth(i)).toHaveAccessibleName(part.label)
  for (const [i, part] of PARTS.entries())
    await expect(links.nth(i)).toHaveAttribute('href', `#${part.id}`)
  await context.close()
})

/**
 * Which shape the rail's breakpoints give this window. Asked of the page, not
 * worked out from the window width: WebKit's media queries see the window
 * minus its scrollbar (a 1440px window is 1432px there), so each breakpoint
 * lands a scrollbar's width later than in Chromium and Firefox.
 */
const railShape = (page: Page) =>
  page.evaluate(() => {
    const atLeast = (rem: number) => matchMedia(`(min-width: ${rem}rem)`).matches
    return { rail: atLeast(80), labels: atLeast(90), shortLabel: atLeast(90) && !atLeast(96) }
  })

for (const width of [1280, 1366, 1440, 1536, 1920]) {
  test(`at ${width}px it sits beside the content without overlapping it or scrolling sideways`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await openHome(page)
    const nav = rail(page)
    const shape = await railShape(page)
    if (!shape.rail) {
      // Just under the breakpoint (WebKit at 1280px): no rail, so nothing to overlap.
      await scrollToPart(page, 'featured')
      await expect(page.getByTestId('lab-section-nav')).toBeHidden()
      return
    }
    for (const part of PARTS) {
      await scrollToPart(page, part.id)
      // The rail shows from its scroll and intersection callbacks, which a
      // loaded CI runner's WebKit delivers seconds late (its trace showed the
      // rail turning visible just after the default 5s), so wait longer here.
      await expect(nav).toBeInViewport({ timeout: 15_000 })
      const navBox = (await nav.boundingBox())!
      expect(navBox.x, 'inside the window').toBeGreaterThanOrEqual(8)
      // Everything visible in the part starts right of the rail: its text, its
      // media and every box that paints (a border or a fill: cards, buttons,
      // pills). Layout wrappers paint nothing, and full-bleed bands (the
      // parts' and rows' background washes) are backdrop, so both are skipped.
      const contentLeft = await page.locator(`#${part.id}`).evaluate((root) => {
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
          if (paints && cs.visibility !== 'hidden' && cs.opacity !== '0')
            left = Math.min(left, r.left)
          for (const node of el.childNodes) {
            if (node.nodeType !== Node.TEXT_NODE || !node.textContent!.trim()) continue
            const range = document.createRange()
            range.selectNodeContents(node)
            for (const t of range.getClientRects()) if (onScreen(t)) left = Math.min(left, t.left)
          }
        }
        return left
      })
      expect(contentLeft, `${part.id} has content on screen`).toBeLessThan(width)
      expect(navBox.x + navBox.width, `${part.id} content`).toBeLessThanOrEqual(contentLeft - 8)
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true)
    // No heading in the icons-only shape.
    if (shape.labels) await expect(nav.getByText('The Lab', { exact: true })).toBeVisible()
    else await expect(nav.getByText('The Lab', { exact: true })).toBeHidden()
    // Every label stays on one line (from 1440px; below that it is a one-line tooltip).
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
      })
    )
    expect(lines, 'lines per label').toEqual([1, 1, 1])
    // Where the gutter is tight, the long label shows its short form instead of wrapping.
    const extensions = nav.getByRole('link', { name: 'Chrome Extensions' })
    await expect(extensions).toHaveAccessibleName('Chrome Extensions')
    const short = extensions.getByText('Extensions', { exact: true })
    if (shape.shortLabel) await expect(short).toBeVisible()
    else await expect(short).toBeHidden()
  })
}

test('is absent on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  await scrollToPart(page, 'featured')
  await expect(rail(page)).toBeHidden()
  // The pill links under the Lab heading still lead to each part.
  await expect(page.getByRole('navigation', { name: 'Lab sections' }).getByRole('link')).toHaveText(
    PARTS.map((p) => p.label)
  )
})
