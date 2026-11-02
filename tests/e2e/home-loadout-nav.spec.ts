import { test, expect, type Page } from '@playwright/test'
import { contentLeft, labelLines, railShape } from './section-rail'

/**
 * The homepage Loadout's floating side nav (components/sections/HomeLoadoutNav.tsx,
 * on components/ui/SectionRail.tsx, the same rail as the Lab's; the owner's
 * ask, 2026-11-02): a desktop-only rail in the left gutter of the Loadout band
 * (after People I follow) that marks the part on screen (AI kit, Default
 * stack, Tools I built and use, Dev setup) and jumps to it. It lives in its
 * own band, several bands below the Lab, so it never shows with the Lab's.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const PARTS = [
  { id: 'ai-kit', label: 'AI kit' },
  { id: 'default-stack', label: 'Default stack' },
  { id: 'tools-i-built', label: 'Tools I built and use' },
  { id: 'my-setup', label: 'Dev setup' },
] as const

const rail = (page: Page) => page.getByRole('navigation', { name: 'Loadout contents' })
const labRail = (page: Page) => page.getByRole('navigation', { name: 'Lab contents' })
// The rail fades in on a frame after the scroll; a loaded CI machine (WebKit especially) can take several seconds.
const SHOW = { timeout: 15_000 }

/** Open the homepage and wait until the rail's script is running (see the Lab's spec). */
async function openHome(page: Page) {
  await page.goto('/')
  await expect(page.getByTestId('home-loadout-nav')).toHaveAttribute('data-ready', '', {
    timeout: 20_000,
  })
}

/**
 * Scroll so the element's top sits `top` px from the window's top (by default
 * where a jump lands it, under the navbar), and keep at it until it stays
 * there: images and reveals above can still shift the layout just after.
 */
async function place(page: Page, id: string, top = 80) {
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

  test('shows only in the Loadout band, never with the Lab rail, and marks the part being read', async ({
    page,
  }) => {
    await openHome(page)
    const nav = rail(page)
    // In the Lab: the Lab's rail, not this one.
    await place(page, 'featured')
    await expect(labRail(page)).toBeVisible(SHOW)
    await expect(nav).toBeHidden()
    // Between the two (People I follow): neither.
    await place(page, 'people')
    await expect(nav).toBeHidden()
    await expect(labRail(page)).toBeHidden()

    for (const part of PARTS.slice(0, 3)) {
      await place(page, part.id)
      await expect(nav).toBeVisible(SHOW)
      await expect(nav).toBeInViewport()
      await expect(labRail(page)).toBeHidden()
      await expect(nav.locator('[aria-current]'), part.id).toHaveAccessibleName(part.label)
      await expect(nav.locator('[aria-current]')).toHaveCount(1)
    }
    for (const [i, part] of PARTS.entries())
      await expect(nav.getByRole('link').nth(i)).toHaveAccessibleName(part.label)
    // The setup line closes the band: scrolled to it, it is the part marked,
    // the rail riding out with the band's foot, never below it.
    await place(page, 'my-setup', 400)
    await expect(nav.locator('[aria-current]')).toHaveAccessibleName('Dev setup')
    const box = (await nav.boundingBox())!
    const bandBottom = await page
      .locator('#loadout-band')
      .evaluate((band) => band.getBoundingClientRect().bottom)
    expect(box.y + box.height).toBeLessThanOrEqual(bandBottom + 1)
    // Past the band (the contact form) it is gone.
    await page.locator('#contact').scrollIntoViewIfNeeded()
    await expect(nav).not.toBeInViewport()
  })

  test('appears once the Loadout reaches the middle of the window, level with its AI kit', async ({ page }) => {
    await openHome(page)
    const nav = rail(page)
    // The band's heading on screen, the AI kit still in the lower half: no rail.
    await place(page, 'ai-kit', 620)
    await page.waitForTimeout(300)
    await expect(nav).toBeHidden()
    await place(page, 'ai-kit', 470)
    await page.waitForTimeout(300)
    await expect(nav).toBeHidden()
    // The AI kit reaches the middle of the window (owner, 2026-11-02): the rail shows, level with it, whole.
    await place(page, 'ai-kit', 448)
    await expect(nav).toBeVisible(SHOW)
    await expect(nav).toBeInViewport({ ratio: 1 })
    const kitTop = await page.locator('#ai-kit').evaluate((el) => el.getBoundingClientRect().top)
    expect(Math.abs((await nav.boundingBox())!.y - kitTop)).toBeLessThanOrEqual(3)
  })

  test('a click jumps to the part, below the sticky navbar, and marks it', async ({ page }) => {
    test.setTimeout(60_000)
    await openHome(page)
    await place(page, 'ai-kit')
    const nav = rail(page)
    await expect(nav).toBeVisible(SHOW)
    for (const part of [PARTS[2], PARTS[1], PARTS[0]]) {
      await nav.getByRole('link', { name: part.label, exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`#${part.id}$`))
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

  test('reduced motion: nothing moves (no comet spin, no sliding)', async ({ page }) => {
    await openHome(page)
    await place(page, 'default-stack')
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

for (const width of [1280, 1366, 1440, 1536, 1920]) {
  test(`at ${width}px it sits beside the Loadout without overlapping it or scrolling sideways`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await openHome(page)
    const nav = rail(page)
    const shape = await railShape(page)
    if (!shape.rail) {
      // Just under the breakpoint (WebKit at 1280px): no rail, so nothing to overlap.
      await place(page, 'ai-kit')
      await expect(page.getByTestId('home-loadout-nav')).toBeHidden()
      return
    }
    for (const part of PARTS.slice(0, 3)) {
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
    if (shape.labels) await expect(nav.getByText('Loadout', { exact: true })).toBeVisible()
    else await expect(nav.getByText('Loadout', { exact: true })).toBeHidden()
    expect(await labelLines(nav), 'lines per label').toEqual(PARTS.map(() => 1))
  })
}

test('works without JavaScript: plain links to the parts', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  await page.goto('/')
  const links = rail(page).getByRole('link')
  for (const [i, part] of PARTS.entries()) {
    await expect(links.nth(i)).toHaveAccessibleName(part.label)
    await expect(links.nth(i)).toHaveAttribute('href', `#${part.id}`)
  }
  await context.close()
})

test('is absent on a phone and a tablet', async ({ page }) => {
  for (const width of [390, 820]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await place(page, 'ai-kit')
    await expect(rail(page)).toBeHidden()
    await expect(page.getByTestId('home-loadout-nav')).toBeHidden()
  }
})
