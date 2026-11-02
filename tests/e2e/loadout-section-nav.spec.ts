import { test, expect, type Page } from '@playwright/test'
import { contentLeft, labelLines, railShape } from './section-rail'

/**
 * The Loadout's floating side nav (components/sections/LoadoutSectionNav.tsx,
 * on components/ui/SectionRail.tsx, the same rail as the Lab's): a
 * desktop-only rail in the left gutter that marks the part of /loadout on
 * screen and jumps to it. It appears once Dev setup's heading reaches the
 * middle of the window (after the header and its pills), then holds there to
 * the page's foot. On phones and tablets the header pills do the job.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const PARTS = [
  { id: 'dev-setup', label: 'Dev setup' },
  { id: 'workflow', label: 'How I work' },
  { id: 'in-apps', label: 'Inside my apps' },
  { id: 'tools-i-built', label: 'Tools I built and use' },
  { id: 'tools-i-use', label: 'Tools I use' },
  { id: 'gear', label: 'The gear' },
] as const

const rail = (page: Page) => page.getByRole('navigation', { name: 'Loadout contents' })
const pills = (page: Page) => page.getByRole('navigation', { name: 'Loadout sections' })
// The rail fades in on a frame after the scroll; a loaded CI machine (WebKit especially) can take several seconds.
const SHOW = { timeout: 15_000 }

/** Open /loadout and wait until the rail's script is running (see the Lab's spec). */
async function openLoadout(page: Page) {
  await page.goto('/loadout')
  await expect(page.getByTestId('loadout-section-nav')).toHaveAttribute('data-ready', '', {
    timeout: 20_000,
  })
}

/**
 * Scroll so the element's top sits `top` px from the window's top, and keep
 * at it until it stays there: the scroll reveals above can still shift the
 * layout just after the jump on a loaded machine.
 */
async function place(page: Page, id: string, top = 120) {
  await expect
    .poll(
      () =>
        page.evaluate(
          ([id, top]) => {
            const el = document.getElementById(id as string)!
            const now = el.getBoundingClientRect().top
            if (Math.abs(now - (top as number)) <= 2) return true
            window.scrollTo({ top: now + window.scrollY - (top as number), behavior: 'instant' })
            return false
          },
          [id, top] as const
        ),
      { timeout: 20_000 }
    )
    .toBe(true)
  // An instant programmatic scroll may not fire a scroll event in every engine; the rail listens for one.
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')))
}

test.describe('at 1440px', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('lists the same parts as the header pills, which stay at the top', async ({ page }) => {
    await openLoadout(page)
    await expect(pills(page).getByRole('link')).toHaveText(PARTS.map((p) => p.label))
    await place(page, 'workflow')
    const links = rail(page).getByRole('link')
    await expect(rail(page)).toBeVisible(SHOW)
    for (const [i, part] of PARTS.entries()) {
      await expect(links.nth(i)).toHaveAccessibleName(part.label)
      await expect(links.nth(i)).toHaveAttribute('href', `#${part.id}`)
    }
    await expect(links).toHaveCount(PARTS.length)
  })

  test('hidden beside the header, then marks the part being read', async ({ page }) => {
    await openLoadout(page)
    const nav = rail(page)
    // The header and its pills on screen: no rail.
    await expect(pills(page)).toBeInViewport()
    await expect(nav).toBeHidden()

    for (const part of PARTS) {
      await place(page, part.id)
      await expect(nav).toBeVisible(SHOW)
      await expect(nav).toBeInViewport()
      await expect(nav.locator('[aria-current]'), part.id).toHaveAccessibleName(part.label)
      await expect(nav.locator('[aria-current]')).toHaveCount(1)
    }
  })

  test('a part takes over once its top passes the middle of the window', async ({ page }) => {
    await openLoadout(page)
    const current = rail(page).locator('[aria-current]')
    await place(page, 'tools-i-use', 500)
    await expect(rail(page)).toBeVisible(SHOW)
    await expect(current).toHaveAccessibleName('Tools I built and use')
    await place(page, 'tools-i-use', 400)
    await expect(current).toHaveAccessibleName('Tools I use')
  })

  test('a click jumps to the part, below the sticky navbar, and marks it', async ({ page }) => {
    // Several jumps in a row: under a full parallel run each can take a few seconds.
    test.setTimeout(60_000)
    await openLoadout(page)
    await place(page, 'workflow')
    const nav = rail(page)
    await expect(nav).toBeVisible(SHOW)
    // Inside my apps is short, so the part after it passes the middle as soon
    // as it lands: the part jumped to must still be the one marked.
    for (const part of [PARTS[4], PARTS[5], PARTS[4], PARTS[2], PARTS[0]]) {
      await nav.getByRole('link', { name: part.label, exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`#${part.id}$`))
      // Lands at the page's scroll-padding-top (80px), clear of the 68px navbar, like the Lab's parts.
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

  test('holds at the middle of the window, and rides out with the page at its foot', async ({
    page,
  }) => {
    await openLoadout(page)
    const nav = rail(page)
    await place(page, 'tools-i-built', 300)
    await expect(nav).toBeVisible(SHOW)
    const box = (await nav.boundingBox())!
    expect(Math.abs(box.y + box.height / 2 - 450)).toBeLessThanOrEqual(2)
    // At the foot of the page it never hangs over the footer.
    await page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
      window.dispatchEvent(new Event('scroll'))
    })
    await expect(nav.locator('[aria-current]')).toHaveAccessibleName('The gear')
    const foot = (await nav.boundingBox())!
    const mainBottom = await page
      .locator('#main-content')
      .evaluate((m) => m.getBoundingClientRect().bottom)
    expect(foot.y + foot.height).toBeLessThanOrEqual(mainBottom + 1)
  })

  test('keyboard: Tab reaches each part in order and Enter jumps there', async ({ page }) => {
    await openLoadout(page)
    await place(page, 'workflow')
    const nav = rail(page)
    await expect(nav).toBeVisible(SHOW)
    await nav.getByRole('link').first().focus()
    for (const [i, part] of PARTS.entries()) {
      if (i) await page.keyboard.press('Tab')
      await expect(nav.getByRole('link', { name: part.label, exact: true })).toBeFocused()
    }
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#gear$/)
    await expect(nav.getByRole('link', { name: 'The gear', exact: true })).toHaveAttribute(
      'aria-current',
      'location'
    )
  })

  test('the links are at least 24px on each side', async ({ page }) => {
    await openLoadout(page)
    await place(page, 'workflow')
    await expect(rail(page)).toBeVisible(SHOW)
    for (const link of await rail(page).getByRole('link').all()) {
      const box = (await link.boundingBox())!
      expect(box.height).toBeGreaterThanOrEqual(24)
      expect(box.width).toBeGreaterThanOrEqual(24)
    }
  })

  test('reduced motion: nothing moves (no comet spin, no sliding)', async ({ page }) => {
    await openLoadout(page)
    await place(page, 'tools-i-use')
    await expect(rail(page)).toBeVisible(SHOW)
    const motion = await page.locator('nav[aria-label="Loadout contents"]').evaluate((n) => {
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

test.describe('with motion', () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    contextOptions: { reducedMotion: 'no-preference' },
  })

  test('the current chip has its comet, and a click still lands on the part', async ({ page }) => {
    await openLoadout(page)
    await place(page, 'workflow')
    const nav = rail(page)
    await expect(nav).toBeVisible(SHOW)
    await expect(nav.locator('[aria-current] .animate-spin')).toHaveCount(1)
    await nav.getByRole('link', { name: 'The gear', exact: true }).click()
    // A smooth scroll: wait for it to settle.
    await expect
      .poll(
        () => page.locator('#gear').evaluate((el) => Math.round(el.getBoundingClientRect().top)),
        { timeout: 10_000 }
      )
      .toBe(80)
    await expect(nav.getByRole('link', { name: 'The gear', exact: true })).toHaveAttribute(
      'aria-current',
      'location'
    )
  })
})

for (const width of [1280, 1366, 1440, 1536, 1920]) {
  test(`at ${width}px it sits beside the content without overlapping it or scrolling sideways`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await openLoadout(page)
    const nav = rail(page)
    const shape = await railShape(page)
    if (!shape.rail) {
      // Just under the breakpoint (WebKit at 1280px): no rail, so nothing to overlap.
      await place(page, 'workflow')
      await expect(page.getByTestId('loadout-section-nav')).toBeHidden()
      return
    }
    for (const part of PARTS) {
      await place(page, part.id)
      await expect(nav).toBeInViewport({ timeout: 15_000 })
      const navBox = (await nav.boundingBox())!
      expect(navBox.x, 'inside the window').toBeGreaterThanOrEqual(8)
      const left = await contentLeft(page.locator(`#${part.id}`))
      expect(left, `${part.id} has content on screen`).toBeLessThan(width)
      expect(navBox.x + navBox.width, `${part.id} content`).toBeLessThanOrEqual(left - 8)
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true)
    // The heading only in the wide shape.
    if (shape.labels) await expect(nav.getByText('Loadout', { exact: true })).toBeVisible()
    else await expect(nav.getByText('Loadout', { exact: true })).toBeHidden()
    expect(await labelLines(nav), 'lines per label').toEqual(PARTS.map(() => 1))
    // Where the gutter is tight, Tools I built and use shows as "My tools" instead of wrapping.
    const built = nav.getByRole('link', { name: 'Tools I built and use' })
    await expect(built).toHaveAccessibleName('Tools I built and use')
    const short = built.getByText('My tools', { exact: true })
    if (shape.shortLabel) await expect(short).toBeVisible()
    else await expect(short).toBeHidden()
  })
}

test('works without JavaScript: plain links to each part', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  await page.goto('/loadout')
  const links = rail(page).getByRole('link')
  for (const [i, part] of PARTS.entries()) {
    await expect(links.nth(i)).toHaveAccessibleName(part.label)
    await expect(links.nth(i)).toHaveAttribute('href', `#${part.id}`)
  }
  await context.close()
})

for (const { width, height } of [
  { width: 810, height: 1080 },
  { width: 390, height: 844 },
  { width: 320, height: 640 },
]) {
  test(`at ${width}px (tablet and phone) the pills lead to each part, with no rail`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height })
    await openLoadout(page)
    await place(page, 'tools-i-use')
    await expect(rail(page)).toBeHidden()
    await expect(page.getByTestId('loadout-section-nav')).toBeHidden()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true)
    // The header pills still jump to each part, landing under the navbar.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await pills(page).getByRole('link', { name: 'Inside my apps', exact: true }).click()
    await expect(page).toHaveURL(/#in-apps$/)
    await expect
      .poll(() =>
        page.locator('#in-apps').evaluate((el) => Math.round(el.getBoundingClientRect().top))
      )
      .toBe(80)
  })
}
