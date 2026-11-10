import { test, expect, type Page } from '@playwright/test'

/**
 * The Lab's template part (components/sections/UseAsTemplate.tsx): right after
 * the featured builds, a prompt ("Don't have a site? Use mine!", on one line;
 * "Use mine as a template!" until 2026-11-09) over one panel comparing the two
 * templates side by side (round 10 of 2026-11-09; two cards before),
 * n8builds.dev and the developer portfolio.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

const N8_REPO = 'https://github.com/n8watkins/n8builds-web'
const PORTFOLIO_REPO = 'https://github.com/n8watkins/dev-portfolio'

const open = async (page: Page) => {
  await page.goto('/')
  const template = page.locator('#template')
  await template.scrollIntoViewIfNeeded()
  return template
}

test('sits in the Lab right after the featured builds, before the Chrome extensions', async ({ page }) => {
  await page.goto('/')
  const order = await page.evaluate(() =>
    [...document.querySelectorAll('#lab #featured, #lab #template, #lab #extensions')].map((el) => el.id)
  )
  expect(order).toEqual(['featured', 'template', 'extensions'])
})

test('asks "Don\'t have a site?" and answers "Use mine!" on the same line, with no checks of its own', async ({ page }) => {
  const template = await open(page)
  // One heading at the Lab's part level.
  const heading = template.getByRole('heading', { level: 3 })
  await expect(heading).toHaveText("Don't have a site? Use mine!")
  await expect(template).not.toContainText('Need help building your own')
  const answer = heading.getByText('Use mine!')
  await expect(answer).toHaveCSS('text-decoration-line', 'underline')
  // Both sentences share one line, on phones too now that it is short (2026-11-09).
  const lineHeight = parseFloat(await heading.evaluate((h) => getComputedStyle(h).lineHeight))
  expect((await heading.boundingBox())!.height).toBeLessThan(lineHeight * 1.6)
  // Its checks are said once for the whole Lab, under "The Lab" (2026-11-09).
  for (const point of ['Open source', 'MIT-licensed', 'Tested on every pull request']) {
    await expect(template.getByText(point, { exact: true })).toHaveCount(0)
  }
  // The licence sentence and the old photo caveat are gone.
  await expect(template).not.toContainText('photos and write-ups')
})

test('two cards side by side: each links its site, says who it is for and what you get, and opens its repo', { tag: '@smoke' }, async ({ page }) => {
  const template = await open(page)
  // Two tight cards in one list (round 11 of 2026-11-09), no divider between them.
  await expect(template.locator('[data-template-compare]')).toHaveCount(1)
  const cards = template.locator('[data-template-compare] > li')
  await expect(cards).toHaveCount(2)
  const [site, portfolio] = await cards.all()

  await expect(site.getByRole('heading', { level: 4 })).toHaveText('My personal site')
  await expect(site.getByRole('link', { name: 'n8builds.dev', exact: true })).toHaveAttribute('href', '/')
  // No stack pills (2026-11-08): the build page has the stack.
  await expect(template.getByRole('list', { name: /is built with/ })).toHaveCount(0)
  // Each says what it is for, and lists what you get.
  await expect(site.locator('[data-template-for]')).toContainText('building in public')
  await expect(portfolio.locator('[data-template-for]')).toContainText('getting hired')
  // What you get: four short items, each with its own icon (no checkmarks).
  for (const card of [site, portfolio]) {
    const gets = card.getByRole('list', { name: /^What you get with/ }).getByRole('listitem')
    await expect(gets).toHaveCount(4)
    await expect(gets.locator('svg')).toHaveCount(4)
  }
  await expect(site.getByRole('list', { name: /^What you get with/ })).toContainText('A blog you write in Sanity')
  // Side by side on a laptop, in the same panel.
  await page.setViewportSize({ width: 1280, height: 800 })
  // Both read in one frame: two separate reads straight after the resize could land on
  // either side of a scroll or layout shift (CI on PR #181: 357 against 316).
  await expect
    .poll(() =>
      cards.evaluateAll((els) => {
        const [a, b] = els.map((el) => Math.round(el.getBoundingClientRect().top))
        return a === b
      }),
    )
    .toBe(true)
  // The N8 mark belongs to n8builds.dev.
  const icon = site.locator('img[src*="n8-icon"]')
  await expect(icon).toBeVisible()
  await expect.poll(() => icon.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)

  await expect(portfolio.getByRole('heading', { level: 4 })).toHaveText('My developer portfolio')
  const live = portfolio.getByRole('link', { name: /^portfolio\.n8builds\.dev/ })
  await expect(live).toHaveAttribute('href', '/portfolio?from=lab')
  await expect(live).toHaveAttribute('target', '_blank')
  await expect(portfolio.locator('img[src*="n8-icon"]')).toHaveCount(0)

  for (const [card, name, repo] of [
    [site, 'n8builds-web', N8_REPO],
    [portfolio, 'dev-portfolio', PORTFOLIO_REPO],
  ] as const) {
    await expect(card.getByRole('link', { name: `Star ${name} on GitHub (opens in a new tab)` })).toHaveAttribute('href', repo)
    await expect(card.getByRole('link', { name: `${name} on GitHub (opens in a new tab)`, exact: true })).toHaveAttribute('href', repo)
  }
})

test('each template has its "Full story", its own build page', async ({ page }) => {
  const template = await open(page)
  // The portfolio got its own page in round 12 of 2026-11-09.
  await expect(template.getByRole('link', { name: 'Full story of My personal site' })).toHaveAttribute('href', '/builds/n8builds')
  await expect(template.getByRole('link', { name: 'Full story of My developer portfolio' })).toHaveAttribute('href', '/builds/portfolio')
  // The portfolio's repo is the GitHub half of its split button, not a second button.
  await expect(template.locator(`a[href^="${PORTFOLIO_REPO}#"], a[href^="${PORTFOLIO_REPO}/"]`)).toHaveCount(0)
})

test('the keyboard reaches every link in order, card by card', { tag: '@cross-browser' }, async ({ page }) => {
  const template = await open(page)
  const first = template.getByRole('link', { name: 'n8builds.dev', exact: true })
  await first.focus()
  const names: string[] = []
  for (let i = 0; i < 8; i++) {
    // Whitespace collapsed: browsers lay out the visually hidden "(opens in a new
    // tab)" differently in innerText (Chromium a line break, WebKit a space).
    names.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement
        return (el.innerText || el.getAttribute('href') || '').replace(/\s+/g, ' ').trim()
      })
    )
    await page.keyboard.press('Tab')
  }
  expect(names).toEqual([
    'n8builds.dev',
    'Full story of My personal site',
    expect.stringContaining('Star'),
    expect.stringContaining('GitHub'),
    'portfolio.n8builds.dev (opens in a new tab)',
    'Full story of My developer portfolio',
    expect.stringContaining('Star'),
    expect.stringContaining('GitHub'),
  ])
})

test.describe('layout', () => {
  test('on a laptop the two sit side by side in the panel, lined up with the other Lab parts', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const template = await open(page)
    const left = async (selector: string) => page.locator(selector).first().evaluate((el) => Math.round(el.getBoundingClientRect().left))
    // Each part's heading bar lines up (the heading text sits after an icon where a part has one).
    expect(await left('#template .lab-sub-bar')).toBe(await left('#featured .lab-sub-bar'))
    const [a, b] = await template.locator('[data-template-compare] > li').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))
    expect(Math.round(a.top)).toBe(Math.round(b.top))
    expect(Math.round(a.height)).toBe(Math.round(b.height))
    // Side by side in one panel, a divider between them.
    expect(b.left).toBeGreaterThanOrEqual(a.right - 0.5)
  })

  for (const width of [375, 320]) {
    test(`at ${width}px the two stack in the panel and nothing overflows`, { tag: width === 320 ? '@cross-browser' : [] }, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      const template = await open(page)
      const [a, b] = await template.locator('[data-template-compare] > li').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))
      // One under the other, a divider between them.
      expect(b.top).toBeGreaterThanOrEqual(a.bottom - 0.5)
      expect(Math.round(b.left)).toBe(Math.round(a.left))
      const overflow = await template.evaluate((el) =>
        [...el.querySelectorAll('*')].filter((child) => child.getBoundingClientRect().right > window.innerWidth + 0.5).length
      )
      expect(overflow).toBe(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    })
  }
})
