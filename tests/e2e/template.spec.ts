import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * The Lab's template part (components/sections/UseAsTemplate.tsx): right after
 * the featured builds, a prompt ("Don't have a site? Need help building your
 * own? Use mine as a template.") over two template cards, n8builds.dev and the
 * developer portfolio.
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

test('asks two questions, answers "Use mine as a template.", and checks off what you get', async ({ page }) => {
  const template = await open(page)
  // One heading at the Lab's part level, its two lines read as one.
  const heading = template.getByRole('heading', { level: 3 })
  await expect(heading).toHaveText("Don't have a site? Need help building your own?Use mine as a template.")
  const answer = heading.getByText('Use mine as a template.')
  await expect(answer).toHaveCSS('text-decoration-line', 'underline')
  for (const point of ['Open source', 'MIT-licensed', 'Tested on every pull request']) {
    await expect(template.getByText(point, { exact: true })).toBeVisible()
  }
  // The licence sentence and the old photo caveat are gone.
  await expect(template).not.toContainText('photos and write-ups')
})

test('two cards: each links its site, says what it is built with, and opens its repo', async ({ page }) => {
  const template = await open(page)
  const cards = template.locator('ul.grid > li')
  await expect(cards).toHaveCount(2)
  const [site, portfolio] = await cards.all()

  await expect(site.getByRole('heading', { level: 4 })).toHaveText('This site')
  await expect(site.getByRole('link', { name: 'n8builds.dev', exact: true })).toHaveAttribute('href', '/')
  await expect(site.getByRole('list', { name: 'This site is built with' }).getByRole('listitem')).toHaveText([
    'Next.js 16',
    'Sanity',
    'Tailwind CSS 4',
    'Turnstile',
    'Upstash',
    'Vercel',
  ])
  // The N8 mark belongs to n8builds.dev.
  const icon = site.locator('img[src*="n8-icon"]')
  await expect(icon).toBeVisible()
  await expect.poll(() => icon.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)

  await expect(portfolio.getByRole('heading', { level: 4 })).toHaveText('My developer portfolio')
  const live = portfolio.getByRole('link', { name: /^portfolio\.n8builds\.dev/ })
  await expect(live).toHaveAttribute('href', 'https://portfolio.n8builds.dev')
  await expect(live).toHaveAttribute('target', '_blank')
  await expect(portfolio.getByRole('list', { name: 'My developer portfolio is built with' }).getByRole('listitem')).toHaveText([
    'Next.js 16',
    'Tailwind CSS',
    'Framer Motion',
    'Vercel',
  ])
  await expect(portfolio.locator('img[src*="n8-icon"]')).toHaveCount(0)

  // Testing tools aren't pills: the checks under the heading say it once.
  await expect(template.getByRole('listitem').filter({ hasText: /^(Playwright|Lighthouse|OpenPing status)$/ })).toHaveCount(0)

  for (const [card, name, repo] of [
    [site, 'n8builds-web', N8_REPO],
    [portfolio, 'dev-portfolio', PORTFOLIO_REPO],
  ] as const) {
    await expect(card.getByRole('link', { name: `Star ${name} on GitHub (opens in a new tab)` })).toHaveAttribute('href', repo)
    await expect(card.getByRole('link', { name: `${name} on GitHub (opens in a new tab)`, exact: true })).toHaveAttribute('href', repo)
  }
})

test('only this site has "How it is built and tested", and it goes to its build page', async ({ page }) => {
  const template = await open(page)
  const links = template.getByRole('link', { name: 'How it is built and tested' })
  await expect(links).toHaveCount(1)
  await expect(links).toHaveAttribute('href', '/builds/n8builds')
  // The portfolio's repo is the GitHub half of its split button, not a second button.
  await expect(template.locator(`a[href^="${PORTFOLIO_REPO}#"], a[href^="${PORTFOLIO_REPO}/"]`)).toHaveCount(0)
})

test('the keyboard reaches every link in order, card by card', async ({ page }) => {
  const template = await open(page)
  const first = template.getByRole('link', { name: 'n8builds.dev', exact: true })
  await first.focus()
  const names: string[] = []
  for (let i = 0; i < 7; i++) {
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
    'How it is built and tested',
    expect.stringContaining('Star'),
    expect.stringContaining('GitHub'),
    'portfolio.n8builds.dev (opens in a new tab)',
    expect.stringContaining('Star'),
    expect.stringContaining('GitHub'),
  ])
})

test('has no serious accessibility violations', async ({ page }) => {
  await open(page)
  const results = await new AxeBuilder({ page }).include('#template').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
})

test.describe('layout', () => {
  test('on a laptop the cards sit side by side, lined up with the other Lab parts', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const template = await open(page)
    const left = async (selector: string) => page.locator(selector).first().evaluate((el) => Math.round(el.getBoundingClientRect().left))
    expect(await left('#template h3')).toBe(await left('#featured h3'))
    const [a, b] = await template.locator('ul.grid > li').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))
    expect(Math.round(a.top)).toBe(Math.round(b.top))
    expect(Math.round(a.height)).toBe(Math.round(b.height))
    expect(b.left).toBeGreaterThan(a.right)
  })

  for (const width of [375, 320]) {
    test(`at ${width}px the cards stack and nothing overflows`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      const template = await open(page)
      const [a, b] = await template.locator('ul.grid > li').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))
      expect(b.top).toBeGreaterThan(a.bottom)
      const overflow = await template.evaluate((el) =>
        [...el.querySelectorAll('*')].filter((child) => child.getBoundingClientRect().right > window.innerWidth + 0.5).length
      )
      expect(overflow).toBe(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    })
  }
})
