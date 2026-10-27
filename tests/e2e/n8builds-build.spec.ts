import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { getBuild } from '../../data/builds'
import { E2E_PROJECTS, FEATURES, SPEED, SPEED_MORE, WORKFLOW } from '../../components/builds/n8builds/content'

/**
 * The case study for this site (/builds/n8builds), its CSS animations, and the
 * Lab's template part ("Use mine as a template") that links to it.
 */

const PATH = '/builds/n8builds'
const REPO = 'https://github.com/n8watkins/n8builds-web'
const build = getBuild('n8builds')!

/** Wait until an image has actually decoded (not just been requested). */
async function expectImagesLoaded(page: Page, selector: string) {
  const images = page.locator(selector)
  const count = await images.count()
  expect(count, `${selector} images`).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    const image = images.nth(i)
    await image.scrollIntoViewIfNeeded()
    await expect
      .poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth), {
        message: `${await image.getAttribute('alt')} loads`,
      })
      .toBeGreaterThan(0)
  }
  return count
}

/**
 * The play states of the animations on the page's CSS-module elements whose
 * class contains `name`. A finished animation stays listed (they all fill
 * both ways), so a fast run can't slip between two polls.
 */
const animationStates = (page: Page, name: string) =>
  page.evaluate(
    (name) =>
      [...document.querySelectorAll(`main [class*="${name}"]`)].flatMap((el) =>
        el.getAnimations({ subtree: true }).map((a) => a.playState)
      ),
    name
  )

const runningAnimations = async (page: Page, name: string) =>
  (await animationStates(page, name)).filter((state) => state === 'running').length

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('the case study renders every section, screenshot and number', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    const response = await page.goto(PATH)
    expect(response?.status()).toBe(200)
    const main = page.locator('main')
    await expect(page.locator('h1')).toHaveText('n8builds.dev')
    await expect(main.getByRole('link', { name: 'Star n8builds-web on GitHub (opens in a new tab)' }).first()).toHaveAttribute('href', REPO)
    await expect(main.getByRole('link', { name: 'n8builds-web on GitHub (opens in a new tab)', exact: true }).first()).toHaveAttribute('href', REPO)

    // Every screenshot in the data is on the page, and loads.
    expect(await expectImagesLoaded(page, 'main figure img')).toBe(build.images.length)
    for (const image of build.images) await expect(page.getByRole('img', { name: image.alt })).toBeVisible()

    for (const heading of ['If you fork it, you start with', "Nothing merges until it's green", 'Measured, then made faster', 'Claude Code as the pair programmer', 'Fork it, make it yours']) {
      await expect(main.getByRole('heading', { level: 2, name: heading })).toBeVisible()
    }
    for (const f of FEATURES) await expect(main.getByRole('heading', { level: 3, name: f.title, exact: true })).toBeVisible()
    for (const s of WORKFLOW) await expect(main.getByRole('heading', { level: 3, name: s.title, exact: true })).toBeVisible()

    const pipeline = main.getByRole('figure', { name: 'The CI pipeline every pull request runs' })
    await expect(pipeline.getByRole('list', { name: 'Playwright projects' }).getByRole('listitem')).toHaveText(E2E_PROJECTS)

    // The animated numbers are read out as their final values.
    for (const r of SPEED) {
      await expect(main.getByText(r.after, { exact: true })).toBeAttached()
      await expect(main.getByText(r.before, { exact: true }).first()).toBeVisible()
    }
    for (const m of SPEED_MORE) await expect(main.getByText(m.after, { exact: true })).toBeVisible()

    await expect(main.getByText('git clone https://github.com/n8watkins/n8builds-web.git')).toBeVisible()
    await expect(main.getByText('The problem')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('nothing animates: the pipeline and the counters show their final state', async ({ page }) => {
    await page.goto(PATH)
    for (const id of ['tested', 'speed']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded()
    }
    await page.locator('main [class*="count"]').last().scrollIntoViewIfNeeded()
    expect(await runningAnimations(page, 'stage')).toBe(0)
    expect(await runningAnimations(page, 'count')).toBe(0)
    // The resting state is the lit one.
    const border = await page.locator('main [class*="stage"]').first().evaluate((el) => getComputedStyle(el).borderTopColor)
    expect(border).toBe('rgba(34, 211, 238, 0.4)')
  })

  test('the case study has no serious accessibility violations', async ({ page }) => {
    await page.goto(PATH)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })

  test('every link on the case study is reachable with the keyboard, with a visible focus ring', async ({ page }) => {
    await page.goto(PATH)
    // Number the links, so the two identical Star | GitHub pairs count apart.
    const linkCount = await page.locator('main a[href]').evaluateAll((links) => {
      links.forEach((el, i) => el.setAttribute('data-k', String(i)))
      return links.length
    })
    const reached = new Set<string>()
    for (let i = 0; i < 120 && reached.size < linkCount; i++) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el || !el.closest('main') || el.tagName !== 'A') return null
        const style = getComputedStyle(el)
        return { key: el.dataset.k ?? '', name: (el.textContent ?? '').replace(/\s+/g, ' ').trim(), visible: style.outlineStyle !== 'none' || style.boxShadow !== 'none' }
      })
      if (!focused) continue
      expect(focused.visible, `focus ring on ${focused.name}`).toBe(true)
      reached.add(focused.key)
    }
    expect(reached.size).toBe(linkCount)
  })

  test('the homepage points to the case study from the Lab template part, not a featured row', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#featured').locator(`a[href="${PATH}"]`)).toHaveCount(0)
    const link = page.locator('#template').getByRole('link', { name: 'How it is built and tested' })
    await link.scrollIntoViewIfNeeded()
    await link.click()
    await expect(page).toHaveURL(new RegExp(`${PATH}$`))
    await expect(page.locator('h1')).toHaveText('n8builds.dev')
  })
})

test.describe('with motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('the pipeline lights up and the counters count once they scroll into view', async ({ page }) => {
    await page.goto(PATH)
    // Nothing animates before its section is revealed.
    expect(await animationStates(page, 'count')).toEqual([])

    await page.locator('main figure[aria-label="The CI pipeline every pull request runs"]').scrollIntoViewIfNeeded()
    await expect.poll(() => runningAnimations(page, 'stage')).toBeGreaterThan(0)

    await page.locator('#speed').scrollIntoViewIfNeeded()
    await page.locator('main [class*="count"]').first().scrollIntoViewIfNeeded()
    await expect.poll(async () => (await animationStates(page, 'count')).length).toBeGreaterThan(0)
    // And they settle on the final values.
    await expect
      .poll(async () => (await animationStates(page, 'count')).every((state) => state === 'finished'), { timeout: 5000 })
      .toBe(true)
  })
})
