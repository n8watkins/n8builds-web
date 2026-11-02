import { test, expect, type Page } from '@playwright/test'

/**
 * The homepage's compact build log (#build-log), right under "What I'm working
 * on": this month's updates as rows, a page at a time (four, three on phones)
 * moving on by itself, a card cycling through the month's figures, and a link
 * to /builds. Against the recorded GitHub fixture (BUILD_LOG_FIXTURE=1), whose
 * capture time is the strip's "now", so these don't drift as the months pass.
 *
 * Reduced motion by default (nothing moves by itself); the paging's own
 * tests ask for motion.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const strip = (page: Page) => page.locator('#build-log')
/** The rows showing (the other pages' are aria-hidden, so out of the role tree). */
const rows = (page: Page) => strip(page).getByRole('listitem').filter({ has: page.locator('a[href^="/builds?build="]') })
/** Every row of the month, shown or not. */
const allRows = (page: Page) => strip(page).locator('li[data-row]')
const stats = (page: Page) => strip(page).getByRole('group', { name: /^Shipped / })
const slides = (page: Page) => stats(page).locator('[data-stat]')
const current = (page: Page) => stats(page).locator('[data-stat][aria-hidden="false"]')
const dots = (page: Page) => stats(page).getByRole('button', { name: /^Show / })
/** The paged rows and their controls. */
const list = (page: Page) => strip(page).getByRole('group', { name: 'Updates this month' })
const position = (page: Page) => list(page).locator('[data-position]')
const live = (page: Page) => list(page).locator('[aria-live="polite"]')
const shownRows = (page: Page) => list(page).locator('li[data-shown]').evaluateAll((els) => els.map((el) => el.getAttribute('data-row')))

/** October in the recorded fixture: every update, newest first. */
const OCTOBER_UPDATES = 7
/** How long a hold is checked for: past a whole turn (5s), with margin. */
const HOLD_MS = 8000

test('sits between "What I\'m working on" and the Lab, in the server-rendered HTML', async ({ page, request }) => {
  const html = await (await request.get('/')).text()
  const at = (id: string) => html.indexOf(`id="${id}"`)
  expect(at('build-log')).toBeGreaterThan(at('now'))
  expect(at('build-log')).toBeLessThan(at('lab'))

  await page.goto('/')
  await strip(page).scrollIntoViewIfNeeded()
  await expect(strip(page).getByRole('heading', { level: 2 })).toHaveText('Shipped this month')
  expect(await page.locator('main').innerText()).not.toContain('—')
})

test("holds the whole month, newest first, and shows the newest four", async ({ page, request }) => {
  // Every update of the month is in the server HTML, not only the first page.
  const html = await (await request.get('/')).text()
  expect(html.match(/data-row="/g)).toHaveLength(OCTOBER_UPDATES)

  await page.goto('/')
  await strip(page).scrollIntoViewIfNeeded()
  await expect(rows(page)).toHaveCount(4)
  const items = await allRows(page).evaluateAll((els) =>
    els.map((el) => ({
      date: el.querySelector('time')!.getAttribute('datetime')!,
      icon: !!el.querySelector('img'),
    })),
  )
  expect(items).toHaveLength(OCTOBER_UPDATES)
  expect(items.map((i) => i.date)).toEqual(items.map((i) => i.date).sort().reverse())
  expect(items.every((i) => i.date.startsWith('2026-10'))).toBe(true)
  expect(items.every((i) => i.icon)).toBe(true)
  // The first page is the newest four.
  expect(await rows(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-row')))).toEqual(['0', '1', '2', '3'])
  await expect(position(page)).toHaveText('1 / 2')

  // A release reads as a version, as on /builds.
  await expect(rows(page).filter({ hasText: /Shipped v\d+\.\d+\.\d+/ }).first()).toBeVisible()
})

test('a row opens its build in the full log, filtered', async ({ page }) => {
  await page.goto('/')
  const first = rows(page).first()
  await first.scrollIntoViewIfNeeded()
  const link = first.getByRole('link')
  // Screen readers hear the build and the entry, not the build alone.
  const title = (await first.locator('p').nth(1).innerText()).trim()
  await expect(link).toHaveAccessibleName(new RegExp(`^\\S.+ ${title.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
  const build = new URL((await link.getAttribute('href'))!, 'http://x').searchParams.get('build')!
  await link.click()
  await expect(page).toHaveURL(new RegExp(`/builds\\?build=${build}$`))
  await expect(page.locator('#activity li[data-kind]').first()).toHaveAttribute('data-build', build)
})

test("the card shows the month's figures, every one in the HTML, the first showing", async ({ page, request }) => {
  // Server-rendered: the card is complete before any JavaScript runs.
  const html = await (await request.get('/')).text()
  expect(html).toContain('changes shipped')
  expect(html).toContain('builds touched')
  expect(html).not.toContain('last 6 months')

  await page.goto('/')
  await stats(page).scrollIntoViewIfNeeded()
  await expect(stats(page)).toHaveAttribute('aria-roledescription', 'carousel')
  await expect(stats(page)).toContainText('October')
  const ids = await slides(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-stat')))
  expect(ids.slice(0, 2)).toEqual(['changes', 'builds'])
  expect(ids).toContain('busiest')
  expect(ids).toContain('days')
  await expect(dots(page)).toHaveCount(ids.length)
  await expect(current(page)).toHaveCount(1)
  await expect(current(page)).toHaveAttribute('data-stat', 'changes')
  await expect(current(page)).toContainText(/^\d+changes shipped$/)
  // The busiest build shows with its icon.
  await expect(slides(page).and(page.locator('[data-stat="busiest"]')).locator('img')).toHaveCount(1)
})

test('reduced motion holds the first figure; a dot picks one and announces it', async ({ page }) => {
  await page.goto('/')
  await stats(page).scrollIntoViewIfNeeded()
  await page.waitForTimeout(4600)
  await expect(current(page)).toHaveAttribute('data-stat', 'changes')

  const live = stats(page).locator('[aria-live="polite"]')
  await expect(live).toHaveText('')
  await expect(async () => {
    await dots(page).nth(1).click()
    await expect(current(page)).toHaveAttribute('data-stat', 'builds', { timeout: 2000 })
  }).toPass({ timeout: 15_000 })
  await expect(dots(page).nth(1)).toHaveAttribute('aria-current', 'true')
  await expect(live).toHaveText(/^\d+ builds? touched$/)
})

test.describe('with motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('moves on by itself while in view, and holds while hovered', async ({ page }) => {
    await page.goto('/')
    // An instant jump: with motion allowed the site scrolls smoothly.
    await stats(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    // The timer starts once the hydrated watcher sees the card, which a loaded
    // CI runner can delay by seconds (the mobile-chrome flake on #112); wait
    // for that, then give the 4s timer its margin.
    await expect(stats(page)).toHaveAttribute('data-in-view', '', { timeout: 20_000 })
    await expect(current(page)).toHaveAttribute('data-stat', 'builds', { timeout: 8000 })
    // The timer never speaks: only a picked figure is announced.
    await expect(stats(page).locator('[aria-live="polite"]')).toHaveText('')

    await stats(page).hover()
    const held = await current(page).getAttribute('data-stat')
    await page.waitForTimeout(5000)
    await expect(current(page)).toHaveAttribute('data-stat', held!)
  })
})

test('"See the full build log" goes to /builds', async ({ page }) => {
  await page.goto('/')
  await strip(page).getByRole('link', { name: 'See the full build log' }).click()
  await expect(page).toHaveURL(/\/builds$/)
  await expect(page.getByRole('heading', { level: 1, name: 'The build log' })).toBeVisible()
})

test('works from the keyboard: the button, the figures, each row, then the arrows', async ({ page }) => {
  await page.goto('/')
  const button = strip(page).getByRole('link', { name: 'See the full build log' })
  await button.scrollIntoViewIfNeeded()
  const rowCount = await rows(page).count()
  const dotCount = await dots(page).count()
  await button.focus()
  // The figures card sits left of the rows: the figure itself (it moves on to
  // the next one), then its dots, then the rows.
  await page.keyboard.press('Tab')
  await expect(stats(page).getByRole('button').first()).toBeFocused()
  await expect(stats(page).getByRole('button').first()).toHaveAccessibleName(/^\d+\s?changes shipped$/)
  await page.keyboard.press('Enter')
  await expect(current(page)).toHaveAttribute('data-stat', 'builds')
  for (let i = 0; i < dotCount; i++) await page.keyboard.press('Tab')
  await expect(dots(page).last()).toBeFocused()
  const order: string[] = []
  for (let i = 0; i < rowCount; i++) {
    await page.keyboard.press('Tab')
    order.push(await page.evaluate(() => document.activeElement?.getAttribute('href') ?? ''))
  }
  expect(order.every((href) => href.startsWith('/builds?build='))).toBe(true)
  // Then the arrows (no pause button: under reduced motion nothing moves by itself).
  await page.keyboard.press('Tab')
  await expect(list(page).getByRole('button', { name: 'Previous updates' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(list(page).getByRole('button', { name: 'Next updates' })).toBeFocused()
  await expect(list(page).getByRole('button', { name: /rotation/ })).toHaveCount(0)

  // The focused row shows a ring.
  await rows(page).first().locator('a').first().focus()
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement!, '::after').boxShadow)
  expect(ring).not.toBe('none')
})

test('phones show three rows a page, with the date on the name line', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await strip(page).scrollIntoViewIfNeeded()
  await expect(rows(page)).toHaveCount(3)
  await expect(position(page)).toHaveText(`1 / ${Math.ceil(OCTOBER_UPDATES / 3)}`)
  await expect(rows(page).first().locator('time')).toBeHidden()
  await expect(rows(page).first().locator('p').first()).toContainText(/Oct \d+/)
  // Nothing in the strip is wider than the screen.
  expect(await strip(page).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
})

/**
 * Puts the page on a clock the test drives. The contact form's Turnstile
 * widget is kept out: its own frame shares the clock, and its timers throw
 * when time jumps.
 */
async function installClock(page: Page) {
  await page.route('https://challenges.cloudflare.com/**', (route) => route.abort())
  await page.clock.install()
}

/**
 * Opens the homepage on a clock the test drives. The page loads in real time;
 * the clock stops while the list is still below the fold (so its timer hasn't
 * started), then the list is brought into view and waits there, its timer
 * running only when the test moves the clock on. The clock jumps
 * (fastForward) rather than runs: running it would also play every frame of
 * the homepage's other animations, which WebKit works through slowly.
 */
async function openList(page: Page) {
  await installClock(page)
  await page.goto('/')
  await expect(list(page)).toBeAttached()
  await expect(list(page)).not.toHaveAttribute('data-in-view')
  // The page's clock keeps running while this is sent: aim a little ahead,
  // and again if a loaded machine let it pass the mark first.
  await expect(async () => {
    const now = await page.evaluate(() => Date.now())
    await page.clock.pauseAt(now + 500)
  }).toPass({ timeout: 10_000 })
  // An instant jump: with motion allowed the site scrolls smoothly.
  await list(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await expect(list(page)).toHaveAttribute('data-in-view', '', { timeout: 20_000 })
  await page.mouse.move(0, 0)
  // The jump only fires a timer already set: wait for the list to set it.
  await expect(list(page)).toHaveAttribute('data-cycling', '')
}

/** Takes focus out of the list (to the strip's own link), as tabbing on would. */
const focusAway = (page: Page) => strip(page).getByRole('link', { name: 'See the full build log' }).focus()

test.describe('paging', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('moves on a page by itself, round the month, and never announces it', async ({ page }) => {
    await openList(page)
    expect(await shownRows(page)).toEqual(['0', '1', '2', '3'])
    await page.clock.fastForward(4900)
    await expect(position(page)).toHaveText('1 / 2')
    await page.clock.fastForward(200)
    await expect(position(page)).toHaveText('2 / 2')
    // The last page holds what is left; its empty slot keeps its height.
    expect(await shownRows(page)).toEqual(['4', '5', '6'])
    await expect(rows(page)).toHaveCount(3)
    // And round to the start.
    await expect(list(page)).toHaveAttribute('data-cycling', '')
    await page.clock.fastForward(5100)
    await expect(position(page)).toHaveText('1 / 2')
    await expect(live(page)).toHaveText('')
  })

  test('fades the old rows out to the right one after another, and the new ones in', async ({ page }) => {
    await openList(page)
    // Clicked and read in one go: the fade starts with the click (before
    // paint) and is over in under a second, which a slow browser can spend
    // between two separate steps.
    const flights = await list(page).evaluate(async (el) => {
      el.querySelector<HTMLButtonElement>('button[aria-label="Next updates"]')!.click()
      // React commits a click's update in a microtask; the fade starts in that commit.
      await Promise.resolve()
      return [...el.querySelectorAll('li[data-row]')].flatMap((li) =>
        li.getAnimations().filter((a) => !(a instanceof CSSTransition)).map((a) => {
          const timing = a.effect!.getComputedTiming()
          const frames = (a.effect as KeyframeEffect).getKeyframes()
          return { row: Number(li.getAttribute('data-row')), delay: Number(timing.delay), from: Number(frames[0].opacity), to: String(frames.at(-1)!.transform) }
        }),
      )
    })
    const out = flights.filter((f) => f.from === 1)
    const into = flights.filter((f) => f.from === 0)
    expect(out.map((f) => f.row)).toEqual([0, 1, 2, 3])
    expect(into.map((f) => f.row)).toEqual([4, 5, 6])
    // Out to the right, each a beat after the one above it.
    expect(out.every((f) => /translateX\(28px\)/.test(f.to))).toBe(true)
    for (let i = 1; i < out.length; i++) expect(out[i].delay).toBeGreaterThan(out[i - 1].delay)
    // In after the rows they replace, staggered the same way.
    for (let i = 0; i < into.length; i++) expect(into[i].delay).toBeGreaterThan(out[i].delay)
    for (let i = 1; i < into.length; i++) expect(into[i].delay).toBeGreaterThan(into[i - 1].delay)
  })

  test('holds while hovered, and picks up where it left off', async ({ page }) => {
    await openList(page)
    await page.clock.fastForward(3000)
    await list(page).hover()
    await expect(list(page)).not.toHaveAttribute('data-cycling')
    await page.clock.fastForward(HOLD_MS)
    await expect(position(page)).toHaveText('1 / 2')
    await page.mouse.move(0, 0)
    await expect(list(page)).toHaveAttribute('data-cycling', '')
    // Two seconds were left of its turn, not a fresh five.
    await page.clock.fastForward(2100)
    await expect(position(page)).toHaveText('2 / 2')
  })

  test('holds while focused', async ({ page }) => {
    await openList(page)
    await rows(page).first().getByRole('link').focus()
    await expect(list(page)).not.toHaveAttribute('data-cycling')
    await page.clock.fastForward(HOLD_MS)
    await expect(position(page)).toHaveText('1 / 2')
    await focusAway(page)
    await expect(list(page)).toHaveAttribute('data-cycling', '')
    await page.clock.fastForward(5100)
    await expect(position(page)).toHaveText('2 / 2')
  })

  test('holds while off screen or while the tab is hidden', async ({ page }) => {
    await openList(page)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect(list(page)).not.toHaveAttribute('data-in-view')
    await expect(list(page)).not.toHaveAttribute('data-cycling')
    await page.clock.fastForward(HOLD_MS)
    await expect(position(page)).toHaveText('1 / 2')

    await list(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await expect(list(page)).toHaveAttribute('data-in-view', '')
    const setHidden = (hidden: boolean) =>
      page.evaluate((hidden) => {
        Object.defineProperty(document, 'visibilityState', { value: hidden ? 'hidden' : 'visible', configurable: true })
        document.dispatchEvent(new Event('visibilitychange'))
      }, hidden)
    await setHidden(true)
    await expect(list(page)).not.toHaveAttribute('data-cycling')
    await page.clock.fastForward(HOLD_MS)
    await expect(position(page)).toHaveText('1 / 2')
    await setHidden(false)
    await expect(list(page)).toHaveAttribute('data-cycling', '')
    await page.clock.fastForward(5100)
    await expect(position(page)).toHaveText('2 / 2')
  })

  test('the arrows and arrow keys page either way, wrapping, and announce each move', async ({ page }) => {
    await openList(page)
    const next = list(page).getByRole('button', { name: 'Next updates' })
    const previous = list(page).getByRole('button', { name: 'Previous updates' })
    await next.click()
    await expect(position(page)).toHaveText('2 / 2')
    await expect(live(page)).toHaveText(/^Updates 5 to 7 of 7: Solara, Scheduled activities.*; n8builds\.dev, One Lab section/)
    await previous.click()
    await previous.click()
    // Back past the first page wraps round to the last.
    await expect(position(page)).toHaveText('2 / 2')
    await expect(live(page)).toHaveText(/^Updates 5 to 7 of 7: /)

    // From the keyboard: arrows page while focus is in the list, and focus
    // follows to the new page's first row rather than staying on a hidden one.
    await rows(page).first().getByRole('link').focus()
    await page.keyboard.press('ArrowRight')
    await expect(position(page)).toHaveText('1 / 2')
    await expect(allRows(page).first().getByRole('link')).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(position(page)).toHaveText('2 / 2')
    await expect(list(page).locator('li[data-row="4"] a')).toBeFocused()
  })

  test('the pause button stops it for good, and play starts it again', async ({ page }) => {
    await openList(page)
    // From the keyboard, so the pointer never rests on the list (hovering holds it too).
    await list(page).getByRole('button', { name: 'Pause rotation' }).focus()
    await page.keyboard.press('Enter')
    await expect(list(page).getByRole('button', { name: 'Resume rotation' })).toBeFocused()
    await focusAway(page)
    await expect(list(page)).not.toHaveAttribute('data-cycling')
    await page.clock.fastForward(HOLD_MS)
    await expect(position(page)).toHaveText('1 / 2')
    await list(page).getByRole('button', { name: 'Resume rotation' }).focus()
    await page.keyboard.press('Enter')
    await expect(list(page).getByRole('button', { name: 'Pause rotation' })).toBeFocused()
    await focusAway(page)
    await expect(list(page)).toHaveAttribute('data-cycling', '')
    await page.clock.fastForward(5100)
    await expect(position(page)).toHaveText('2 / 2')
  })

  test('every row on a later page still opens its build in the full log', async ({ page }) => {
    await openList(page)
    await list(page).getByRole('button', { name: 'Next updates' }).click()
    const row = rows(page).filter({ has: page.locator('a[href="/builds?build=n8builds"]') }).first()
    const link = row.getByRole('link')
    await expect(link).toHaveAccessibleName(/^n8builds\.dev One Lab section/)
    await page.clock.resume()
    await link.click()
    await expect(page).toHaveURL(/\/builds\?build=n8builds$/)
  })

  test('keeps its height as the pages change, and fits narrow phones', async ({ page }) => {
    test.slow()
    await installClock(page)
    for (const width of [1440, 810, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await list(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect(list(page)).toHaveAttribute('data-in-view', '')
      const pages = Number((await position(page).innerText()).split('/')[1])
      const first = (await list(page).boundingBox())!
      for (let i = 0; i < pages; i++) {
        await list(page).getByRole('button', { name: 'Next updates' }).click()
        // Land the fade at once (it runs on the page's own animation clock, not the test's).
        await list(page).evaluate((el) => el.querySelectorAll('li').forEach((li) => li.getAnimations().forEach((a) => a.finish())))
        const now = (await list(page).boundingBox())!
        expect(now.height, `${width}px, page ${i + 2}`).toBeCloseTo(first.height, 1)
      }
      // Nothing in the strip is wider than the screen.
      expect(await strip(page).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    }
  })
})

test('reduced motion: nothing moves by itself, and the arrows swap pages without a fade', async ({ page }) => {
  await installClock(page)
  await page.goto('/')
  await list(page).scrollIntoViewIfNeeded()
  await expect(list(page)).toHaveAttribute('data-in-view', '')
  await page.clock.fastForward(HOLD_MS * 2)
  await expect(position(page)).toHaveText('1 / 2')
  await expect(list(page)).not.toHaveAttribute('data-cycling')
  await expect(list(page).locator('[data-progress]')).toHaveCount(0)
  await list(page).getByRole('button', { name: 'Next updates' }).click()
  await expect(position(page)).toHaveText('2 / 2')
  // No fade of its own (the site's reduced-motion rule turns every CSS
  // transition into an instant one, which WebKit still lists, so those are skipped).
  expect(
    await list(page).evaluate((el) => [...el.querySelectorAll('li')].flatMap((li) => li.getAnimations().filter((a) => !(a instanceof CSSTransition))).length),
  ).toBe(0)
})
