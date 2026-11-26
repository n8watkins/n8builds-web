import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * The build log card (components/build-log/BuildLogCard.tsx, shared byte for
 * byte with the portfolio, whose tests/home.spec.ts covers the same card;
 * owner, 2026-11-25: "the updated build log component we have in portfolio
 * should also be available to n8builds, both on the main page and also on the
 * build logs page"). On the homepage it sits in the build log beside the
 * latest changes; on /builds it leads the page at its wide size.
 *
 * Against the recorded GitHub fixture (BUILD_LOG_FIXTURE=1): October 2026 has
 * 13, 33, 32, 1, 21 and 1 changes on the 21st to the 26th (101 in all, the
 * 26th the last day so far), and the months before it are July, June and May.
 */

const PLACES = [
  { name: 'the homepage', path: '/', region: '#build-log' },
  { name: '/builds', path: '/builds', region: '[data-log-overview]' },
] as const

const cardIn = (page: Page, region: string) => page.locator(`${region} [data-build-log]`)
const dayButton = (card: Locator, name: string) =>
  card.getByRole('button', { name: new RegExp(`^${name}:`) })

/**
 * Brings the card to the middle of the screen and waits until it is hydrated
 * (its on-screen watcher has seen it), settled (no month or entrance on its
 * way in) and has finished arriving: the homepage fades it up 40px as it
 * scrolls in, /builds as the page loads. A pointer aimed at a day before then
 * lands beside it (the portfolio's #105).
 *
 * Then it holds the card on `month`: the pointer rests on the month's name
 * (a hovered card never moves on), and the arrows bring that month back if
 * the card had already moved on by itself. On a busy machine the 5 s before
 * it does can pass before a test aims at a day, and the day it aimed at was
 * gone (the portfolio's flaky hover test, 2026-11-25).
 */
async function showCard(page: Page, region: string, month = 'October 2026') {
  const card = cardIn(page, region)
  await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await expect(card).toHaveAttribute('data-build-log', 'ready')
  await expect(card).toHaveAttribute('data-in-view', '', { timeout: 20_000 })
  await stillOnPage(card)
  // From off the card: on a reloaded page a pointer already resting where the name now is
  // gets no mouseenter in Firefox, and the card would not know it is hovered. Moved there
  // by its place on screen, not `hover()`, whose own scrolling into view moved the page by
  // 500px on a phone and left the days below the fold.
  // Onto the card's own padding, which is there whatever month it is moving to.
  await page.mouse.move(0, 0)
  const box = (await card.boundingBox())!
  await page.mouse.move(box.x + 8, box.y + 8)
  await expect(card).not.toHaveAttribute('data-cycling', '')
  for (let i = 0; i < 12 && (await card.locator('[data-month]').textContent()) !== month; i++) {
    await expect(card).toHaveAttribute('data-settled', '', { timeout: 10_000 })
    await card.getByRole('button', { name: 'Newer month' }).click()
  }
  await expect(card.locator('[data-month]')).toHaveText(month)
  await expect(card).toHaveAttribute('data-settled', '', { timeout: 10_000 })
  await stillOnPage(card)
  // And the page has stopped scrolling.
  await expect
    .poll(async () => {
      const a = await page.evaluate(() => window.scrollY)
      await page.waitForTimeout(250)
      return (await page.evaluate(() => window.scrollY)) === a
    })
    .toBe(true)
  return card
}

/** Every box around the card at rest: no entrance moving or fading it. */
async function stillOnPage(card: Locator) {
  await expect
    .poll(() =>
      card.evaluate((el) => {
        const moving: string[] = []
        for (let at: Element | null = el; at && at !== document.body; at = at.parentElement) {
          const s = getComputedStyle(at)
          // An entrance that has ended may leave its last frame, an identity matrix.
          const still = s.transform === 'none' || s.transform === 'matrix(1, 0, 0, 1, 0, 0)'
          if (!still || s.opacity !== '1') moving.push(at.className)
        }
        return moving
      })
    )
    .toEqual([])
}

for (const place of PLACES) {
  test.describe(`on ${place.name}`, () => {
    test('shows the month, its total and a slot per day, each day so far a named button', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(place.path)
      const card = await showCard(page, place.region)
      await expect(card.locator('[data-month]')).toHaveText('October 2026')
      await expect(card.locator('[data-changes]')).toHaveText('101')
      await expect(card.locator('[data-chart] > *')).toHaveCount(31)
      await expect(card.locator('[data-chart] button')).toHaveCount(26)
      await expect(
        card.getByRole('button', { name: 'Thursday, October 22: 33 changes, the busiest day' })
      ).toBeVisible()
      await expect(card.locator('[data-readout]')).toContainText('Peak Oct 22 · 33')
      await expect(card.locator('[data-readout]')).toContainText('6 days active')
      await expect(card.locator('[data-readout]')).toContainText('6-day streak')
      // The month, for screen readers, in words.
      await expect(
        card.getByText(
          '101 changes shipped in October 2026, the busiest day Thursday, October 22 with 33.'
        )
      ).toBeAttached()
      // Never the portfolio's "I post everything here" or its n8builds.dev link: this is n8builds.dev.
      await expect(card).not.toContainText('I post everything here')
      await expect(card.getByRole('link', { name: /^n8builds\.dev/ })).toHaveCount(0)
      await expect(card.locator('a[target="_blank"]')).toHaveCount(0)
    })

    test('hovering a day lights it up, and the readout shows its date and numbers', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Hover is a desktop pointer; phones tap (see below).')
      await page.goto(place.path)
      const card = await showCard(page, place.region)
      const readout = card.locator('[data-readout]')
      const day = (name: string) => dayButton(card, name)
      await day('Thursday, October 22').hover()
      await expect(day('Thursday, October 22')).toHaveAttribute('aria-pressed', 'true')
      await expect(day('Thursday, October 22')).toHaveAttribute('data-d', '0')
      // Its neighbours lean in.
      await expect(day('Wednesday, October 21')).toHaveAttribute('data-d', '1')
      await expect(day('Tuesday, October 20')).toHaveAttribute('data-d', '2')
      await expect(card.locator('[data-chart]')).toHaveAttribute('data-exploring', '')
      await expect(readout.locator('[data-number]')).toHaveText('33')
      await expect(readout).toContainText(/changes on\s*Thu, Oct 22/)
      await expect(readout).toContainText('Busiest day')
      await expect(readout).toContainText('33% of month')
      await expect(readout).toContainText('6-day streak')
      // Sweep on to another day.
      await day('Sunday, October 25').hover()
      await expect(readout.locator('[data-number]')).toHaveText('21')
      await expect(readout).toContainText(/changes on\s*Sun, Oct 25/)
      await expect(readout).toContainText('#3 of 6 days')
      await expect(day('Thursday, October 22')).toHaveAttribute('aria-pressed', 'false')
      // Off the chart, the month again.
      await page.mouse.move(2, 2)
      await expect(card.locator('[data-chart]')).not.toHaveAttribute('data-exploring', '')
      await expect(card.locator('[data-changes]')).toHaveText('101')
      await expect(readout).toContainText('changes shipped')
    })

    test('the days can be walked with the arrow keys, Home and End, and let go with Escape', async ({
      page,
    }) => {
      await page.goto(place.path)
      const card = await showCard(page, place.region)
      const readout = card.locator('[data-readout]')
      // One stop in the tab order: the last day so far.
      const stop = card.locator('[data-chart] button[tabindex="0"]')
      await expect(stop).toHaveCount(1)
      await expect(stop).toHaveAccessibleName('Monday, October 26: 1 change')
      await stop.focus()
      const focused = page.locator(':focus')
      await expect(focused).toHaveAttribute('aria-pressed', 'true')
      await expect(readout).toContainText(/change on\s*Mon, Oct 26/)
      await page.keyboard.press('Home')
      await expect(focused).toHaveAccessibleName('Thursday, October 1: 0 changes')
      await expect(readout).toContainText('Nothing shipped')
      await page.keyboard.press('ArrowRight')
      await expect(focused).toHaveAccessibleName('Friday, October 2: 0 changes')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      await expect(focused).toHaveAccessibleName('Thursday, October 1: 0 changes')
      // End is the last day so far, not a day still to come, and the walk stops there.
      await page.keyboard.press('End')
      await page.keyboard.press('ArrowRight')
      await expect(focused).toHaveAccessibleName('Monday, October 26: 1 change')
      await page.keyboard.press('ArrowLeft')
      await expect(focused).toHaveAccessibleName('Sunday, October 25: 21 changes')
      await expect(readout.locator('[data-number]')).toHaveText('21')
      await page.keyboard.press('Escape')
      await expect(card.locator('[data-chart] [aria-pressed="true"]')).toHaveCount(0)
      await expect(card.locator('[data-changes]')).toHaveText('101')
    })

    /**
     * WebKit on the portfolio's CI once drew no frame for seconds (2026-11-25),
     * and the readout's number, which rolls on animation frames, stayed
     * mid-roll. Here the page gets a frame only every 6 s, each stamped a
     * little before it runs, as WebKit stamps them: the number must still settle.
     */
    test('the readout settles on the right number even when the page draws no frames', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        window.requestAnimationFrame = (cb) =>
          window.setTimeout(() => cb(performance.now() - 40), 6000) as unknown as number
        window.cancelAnimationFrame = (id) => window.clearTimeout(id)
      })
      await page.goto(place.path)
      const card = await showCard(page, place.region)
      const number = card.locator('[data-readout] [data-number]')
      await expect(number).toHaveText('101')
      await card.locator('[data-chart] button[tabindex="0"]').focus()
      // From the 26th back to the 22nd.
      await page.keyboard.press('End')
      for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowLeft')
      await expect(number).toHaveText('33')
      await page.keyboard.press('ArrowRight')
      await expect(number).toHaveText('32')
      await page.keyboard.press('Escape')
      await expect(number).toHaveText('101')
    })

    test('under reduced motion a day still lights up and shows its numbers, in place', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(place.path)
      const card = await showCard(page, place.region)
      const day = dayButton(card, 'Thursday, October 22')
      await day.focus()
      await expect(day).toHaveAttribute('aria-pressed', 'true')
      // The number is there at once, with no roll.
      await expect(card.locator('[data-readout] [data-number]')).toHaveText('33', { timeout: 100 })
      await expect(card.locator('[data-readout]')).toContainText('Busiest day')
      // Lit, but nothing lifts or slides: no transforms, and the blocks light all at once.
      const styles = await card.evaluate((el) => {
        const pick = (s: string) => getComputedStyle(el.querySelector(s)!)
        return {
          lift: pick('.logcard-day:has([aria-pressed="true"]) .logcard-stack').transform,
          neighbour: pick('.logcard-day[data-d="1"] .logcard-stack').transform,
          fill: pick('.logcard-day:has([aria-pressed="true"]) .logcard-lit').transitionDuration,
          lit: pick('.logcard-day:has([aria-pressed="true"]) .logcard-lit').transform,
        }
      })
      expect(styles.lift).toBe('none')
      expect(styles.neighbour).toBe('none')
      expect(parseFloat(styles.fill)).toBeLessThan(0.001)
      expect(styles.lit).toBe('matrix(1, 0, 0, 1, 0, 0)')
      // And the months hold still.
      await expect(card).not.toHaveAttribute('data-cycling', '')
    })

    /**
     * A new month flows in (owner, 2026-11-25: "a little more flowy"): every
     * bar eases to its new height in a wave while the name and readout cross
     * over, on one timeline, and the card itself never moves or resizes.
     */
    test('a month change flows in, holds the card still, and ends on the right month, bars and number', async ({
      page,
    }) => {
      // Watching the change take a while on a busy machine.
      test.setTimeout(60_000)
      await page.goto(place.path)
      const card = await showCard(page, place.region)
      // The card's box on the page (not the window, which a click may scroll).
      const box = () =>
        card.evaluate((el) => {
          const r = el.getBoundingClientRect()
          return `${r.x},${r.y + window.scrollY},${r.width},${r.height}`
        })
      const before = await box()
      await card.getByRole('button', { name: 'Older month' }).click()
      // On its way in, then settled; the card's box the same all the way.
      const boxes = new Set<string>()
      for (let i = 0; i < 16; i++) {
        boxes.add(await box())
        await page.waitForTimeout(40)
      }
      expect([...boxes]).toEqual([before])
      await expect(card).toHaveAttribute('data-settled', '', { timeout: 5000 })
      await expect(card.locator('[data-month]')).toHaveText('July 2026')
      await expect(card.locator('[data-changes]')).toHaveText('39')
      expect(await barMismatches(card)).toEqual([])
    })

    test('a month change interrupted by another, and by a day, lands where it was sent', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Hover is a desktop pointer.')
      await page.goto(place.path)
      const card = await showCard(page, place.region)
      const older = card.getByRole('button', { name: 'Older month' })
      // Twice, the second mid-way through the first, then a day of the second picked mid-way too.
      await older.click()
      await older.click()
      await dayButton(card, 'Saturday, June 20').hover()
      await expect(card.locator('[data-month]')).toHaveText('June 2026')
      await expect(card.locator('[data-readout] [data-number]')).toHaveText('43')
      await expect(card.locator('[data-readout]')).toContainText(/changes on\s*Sat, Jun 20/)
      await page.mouse.move(2, 2)
      await expect(card).toHaveAttribute('data-settled', '', { timeout: 5000 })
      await expect(card.locator('[data-changes]')).toHaveText('217')
      expect(await barMismatches(card)).toEqual([])
    })

    test('under reduced motion a new month is simply there', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(place.path)
      const card = await showCard(page, place.region)
      await card.getByRole('button', { name: 'Older month' }).click()
      await expect(card.locator('[data-changes]')).toHaveText('39', { timeout: 200 })
      await expect(card).toHaveAttribute('data-settled', '', { timeout: 200 })
      const moving = await card.evaluate(
        // Any that takes time: the site's reduced-motion rule leaves near-zero transitions,
        // which WebKit still lists.
        (el) =>
          [...el.querySelectorAll('.logcard-fill')]
            .flatMap((f) => f.getAnimations())
            .filter((a) => Number(a.effect?.getTiming().duration) > 1).length
      )
      expect(moving).toBe(0)
      expect(await barMismatches(card)).toEqual([])
    })

    test('a month change ends in the right state even when the page draws no frames', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        window.requestAnimationFrame = (cb) =>
          window.setTimeout(() => cb(performance.now() - 40), 6000) as unknown as number
        window.cancelAnimationFrame = (id) => window.clearTimeout(id)
      })
      await page.goto(place.path)
      const card = await showCard(page, place.region)
      await card.getByRole('button', { name: 'Older month' }).click()
      await expect(card).toHaveAttribute('data-settled', '', { timeout: 5000 })
      await expect(card.locator('[data-month]')).toHaveText('July 2026')
      await expect(card.locator('[data-changes]')).toHaveText('39')
      await expect.poll(() => barMismatches(card)).toEqual([])
    })
  })
}

/**
 * Each day's bar against the month it shows: its blocks (`--logcard-n`, the
 * day's share of the busiest day's, one dark block on a quiet day, none on a
 * day to come) and the height its colour and clip have come to rest at.
 * Returns what does not match, so a failure says which day.
 */
function barMismatches(card: Locator) {
  return card.evaluate((el) => {
    const css = getComputedStyle(el)
    const levels = Number(css.getPropertyValue('--logcard-levels'))
    const pitch = parseFloat(css.getPropertyValue('--logcard-pitch'))
    const block = parseFloat(css.getPropertyValue('--logcard-block'))
    const days = [...el.querySelectorAll<HTMLElement>('[data-chart] .logcard-day')]
    const counts = days.map((d) => {
      const label = d.querySelector('button')?.getAttribute('aria-label')
      return label ? Number(label.match(/: (\d+) change/)![1]) : null
    })
    const peak = Math.max(1, ...counts.map((c) => c ?? 0))
    const out: string[] = []
    days.forEach((d, i) => {
      const c = counts[i]
      const want = c === null ? 0 : c > 0 ? Math.max(1, Math.round((c / peak) * levels)) : 1
      const n = Number(d.style.getPropertyValue('--logcard-n'))
      if (n !== want) out.push(`day ${i + 1}: ${n} blocks, want ${want}`)
      const fill = d.querySelector<HTMLElement>('.logcard-fill')!
      const height = parseFloat(getComputedStyle(fill).backgroundSize.split(' ')[1] ?? '0')
      const wantHeight = Math.max(0, want * pitch - (pitch - block))
      if (Math.abs(height - wantHeight) > 0.5)
        out.push(`day ${i + 1}: ${height}px high, want ${wantHeight}`)
    })
    return out
  })
}

/**
 * The bars' entrance (owner, 2026-11-25): a card that is off screen when the
 * page loads waits with its bars flat and, once seen, raises them in the same
 * wave as a month change; it ends in the right state even with no frames.
 */
test('the homepage card raises its bars the first time it is seen, even when the page draws no frames', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.requestAnimationFrame = (cb) =>
      window.setTimeout(() => cb(performance.now() - 40), 6000) as unknown as number
    window.cancelAnimationFrame = (id) => window.clearTimeout(id)
  })
  await page.goto('/')
  const card = cardIn(page, '#build-log')
  // Below the fold when it hydrates: flat, waiting.
  await expect(card).toHaveAttribute('data-entrance', 'armed', { timeout: 20_000 })
  await expect(card).not.toHaveAttribute('data-settled', '')
  await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await expect(card).toHaveAttribute('data-settled', '', { timeout: 5000 })
  await expect(card).toHaveAttribute('data-entrance', 'idle')
  await expect(card.locator('[data-changes]')).toHaveText('101')
  await expect.poll(() => barMismatches(card)).toEqual([])
})

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true })

  for (const place of PLACES) {
    test(`a tap picks a day on ${place.name}; a tap elsewhere lets go`, async ({ page }) => {
      await page.goto(place.path)
      const card = await showCard(page, place.region)
      const day = dayButton(card, 'Thursday, October 22')
      const top = await page.evaluate(() => window.scrollY)
      await day.tap()
      await expect(day).toHaveAttribute('aria-pressed', 'true')
      await expect(card.locator('[data-readout]')).toContainText(/changes on\s*Thu, Oct 22/)
      // A tap only looks: the page stays where it is.
      expect(Math.abs((await page.evaluate(() => window.scrollY)) - top)).toBeLessThan(2)
      const box = (await card.boundingBox())!
      await page.touchscreen.tap(2, box.y + box.height / 2)
      await expect(day).toHaveAttribute('aria-pressed', 'false')
    })
  }

  test('on /builds, after a tap the card offers that day in the log, and goes there', async ({
    page,
  }) => {
    await page.goto('/builds')
    const card = await showCard(page, '[data-log-overview]')
    await expect(card.getByRole('link', { name: 'Every update' })).toHaveAttribute(
      'href',
      '#activity'
    )
    await dayButton(card, 'Thursday, October 22').tap()
    const see = card.getByRole('button', { name: /^See Oct 22 in the log\s*: \d+ updates?$/ })
    await see.tap()
    const first = page.locator('#activity li[data-day="2026-10-22"]').first()
    await expect(first).toBeInViewport()
    await expect(first).toHaveAttribute('data-picked', '')
  })
})

test.describe('on the homepage', () => {
  test('its one link is the full build log, and its months never move on by themselves', async ({
    page,
  }) => {
    await page.goto('/')
    const card = await showCard(page, '#build-log')
    await expect(card.getByRole('link')).toHaveCount(1)
    const log = card.getByRole('link', { name: 'Full build log' })
    await expect(log).toHaveAttribute('href', '/builds')
    await expect(log).not.toHaveAttribute('target', /./)
    // The updates beside it already move (build-log-strip.spec.ts); the card holds its month.
    await page.mouse.move(2, 2)
    await expect(card).not.toHaveAttribute('data-cycling', '')
  })
})

test.describe('on /builds', () => {
  test('leads the page, above the builds and the feed, at the wide size', async ({ page }) => {
    await page.goto('/builds')
    const card = await showCard(page, '[data-log-overview]')
    await expect(card).toHaveAttribute('data-size', 'wide')
    await expect(card.getByRole('heading', { level: 2, name: 'October 2026' })).toBeVisible()
    const [overview, builds, feed] = await Promise.all(
      ['[data-log-overview]', '#builds-heading', '#activity'].map(
        async (s) => (await page.locator(s).boundingBox())!
      )
    )
    expect(overview.y).toBeLessThan(builds.y)
    expect(builds.y).toBeLessThan(feed.y)
    // Taller than the homepage's chart: 14 levels of blocks, not 10.
    const chart = (await card.locator('[data-chart]').boundingBox())!
    expect(chart.height).toBeGreaterThan(90)
  })

  test('from 1024px the chart sits beside the readout, and nothing is wider than the screen', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'A desktop layout.')
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/builds')
      const card = await showCard(page, '[data-log-overview]')
      const [readout, chart] = [
        await card.locator('[data-readout]').boundingBox(),
        await card.locator('[data-chart]').boundingBox(),
      ]
      // By the page's own width: a browser with classic scrollbars (WebKit on Linux) has a
      // 1024px window but a page under 1024px, which is the stacked layout.
      const wide = await page.evaluate(() => matchMedia('(width >= 64rem)').matches)
      if (wide) expect(chart!.x, `${width}`).toBeGreaterThan(readout!.x + readout!.width)
      else expect(chart!.y, `${width}`).toBeGreaterThan(readout!.y + readout!.height)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
      ).toBe(true)
    }
  })

  test('a clicked day brings its entries into view in the feed and lights them; Enter does too', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Phones tap, and a tap only looks (see above).')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/builds')
    const card = await showCard(page, '[data-log-overview]')
    const entries = page.locator('#activity li[data-day="2026-10-23"]')
    await dayButton(card, 'Friday, October 23').click()
    await expect(entries.first()).toBeInViewport()
    await expect(entries.first()).toBeFocused()
    expect(await entries.count()).toBeGreaterThan(0)
    for (const entry of await entries.all()) await expect(entry).toHaveAttribute('data-picked', '')
    // Only that day's.
    await expect(
      page.locator('#activity li[data-picked]:not([data-day="2026-10-23"])')
    ).toHaveCount(0)

    // A day a month back, past the first page of the feed: it loads as far as that day.
    await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await card.getByRole('button', { name: 'Older month' }).click()
    await card.getByRole('button', { name: 'Older month' }).click()
    await expect(card.locator('[data-month]')).toHaveText('June 2026')
    const june = dayButton(card, 'Saturday, June 20')
    await june.focus()
    await page.keyboard.press('Enter')
    const juneEntry = page.locator('#activity li[data-day="2026-06-20"]').first()
    await expect(juneEntry).toBeInViewport()
    await expect(juneEntry).toHaveAttribute('data-picked', '')
    await expect(page.locator('#activity li[data-day="2026-10-23"][data-picked]')).toHaveCount(0)
  })

  test('a day the filter hides clears the filter, so its entries show', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Phones tap, and a tap only looks (see above).')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/builds')
    // A build with entries, but none on October 22.
    const builds = await page.locator('#activity li[data-kind]').evaluateAll((els) =>
      els.map((el) => ({
        build: el.getAttribute('data-build')!,
        day: el.getAttribute('data-day')!,
      }))
    )
    const on22 = new Set(builds.filter((b) => b.day === '2026-10-22').map((b) => b.build))
    const other = builds.find((b) => !on22.has(b.build))!.build
    await page.goto(`/builds?build=${other}`)
    await expect(page.locator('#activity li[data-kind]').first()).toHaveAttribute(
      'data-build',
      other
    )
    const card = await showCard(page, '[data-log-overview]')
    await dayButton(card, 'Thursday, October 22').click()
    await expect(page).toHaveURL(/\/builds$/)
    await expect(page.locator('#activity li[data-day="2026-10-22"]').first()).toBeInViewport()
  })

  test('the months move on by themselves, and hold when hovered or after an arrow', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Hover is a desktop pointer; the timing is the same on phones.')
    test.setTimeout(120_000)
    await page.clock.install()
    // Sentry loads itself when the page is idle, and its replay's timers can clear the card's
    // interval under a fake clock (the portfolio's 2026-11-24 flake); visitors are not affected.
    await page.addInitScript(() => {
      window.requestIdleCallback = () => 0
    })
    await page.goto('/builds')
    const card = cardIn(page, '[data-log-overview]')
    const month = card.locator('[data-month]')
    await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await expect(card).toHaveAttribute('data-in-view', '', { timeout: 20_000 })
    await page.mouse.move(2, 2)
    await expect(card).toHaveAttribute('data-cycling', '')
    const movesOnTo = (text: string) =>
      expect(async () => {
        await page.clock.runFor(1000)
        await expect(month).toHaveText(text, { timeout: 500 })
      }).toPass({ timeout: 40_000 })
    await movesOnTo('July 2026')
    await movesOnTo('June 2026')
    await movesOnTo('May 2026')
    await movesOnTo('October 2026')
    // Hovered, it holds.
    await card.hover()
    await expect(card).not.toHaveAttribute('data-cycling', '')
    await page.clock.runFor(6_000)
    await expect(month).toHaveText('October 2026')
    // After an arrow, it holds about 15 s, then moves on again.
    await card.getByRole('button', { name: 'Older month' }).click()
    await page.mouse.move(2, 2)
    await expect(month).toHaveText('July 2026')
    await expect(card).toHaveAttribute('data-cycling', '')
    await page.clock.runFor(10_000)
    await expect(month).toHaveText('July 2026')
    await movesOnTo('June 2026')
  })
})
