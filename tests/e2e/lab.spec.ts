import { test, expect } from '@playwright/test'

/**
 * The homepage Lab and its ends: the featured rows lead with the owner's daily
 * drivers, the hero gives a hiring visitor a direct route to the portfolio,
 * and the page closes with "Use this as a template".
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

test('the featured rows lead with the daily drivers, each linking to its build page', async ({ page }) => {
  await page.goto('/')
  const featured = page.locator('#featured')
  await featured.scrollIntoViewIfNeeded()
  const titles = featured.getByRole('heading', { level: 3 })
  // The section's own heading, then one per row.
  await expect(titles).toHaveText(['Featured builds', 'Scribe', 'OpenPing', 'Solara', 'Portfolio Rank'])
  for (const slug of ['scribe', 'openping', 'solara', 'portfolio-rank']) {
    await expect(featured.locator(`a[href="/builds/${slug}"]`).first(), slug).toBeAttached()
  }
  // Their screenshots are real files.
  for (const src of ['/builds/scribe/landing.webp', '/builds/openping/landing.webp']) {
    expect((await page.request.get(src)).status(), src).toBe(200)
  }
})

test('the Lab has no Tools part any more, in its own links or the navbar menu', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Lab sections' }).getByRole('link')).toHaveText(['Featured', 'Chrome extensions'])
  await expect(page.locator('a[href="/#tools"], a[href="#tools"]')).toHaveCount(0)
  await expect(page.locator('#tools')).toHaveCount(0)
})

test('Scribe and OpenPing build pages lead back to Featured', async ({ page }) => {
  for (const slug of ['scribe', 'openping']) {
    await page.goto(`/builds/${slug}`)
    await expect(page.getByRole('link', { name: /Back to Featured/ })).toBeVisible()
  }
})

test('the hero gives someone hiring a direct link to the developer portfolio', async ({ page }) => {
  await page.goto('/')
  const link = page.getByRole('link', { name: 'See my developer portfolio' })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', 'https://portfolio.n8builds.dev')
})

test('the page ends with "Use this as a template": both repos, their licenses, and how this site is tested', async ({ page }) => {
  await page.goto('/')
  const template = page.locator('#template')
  await template.scrollIntoViewIfNeeded()
  await expect(template.getByRole('heading', { level: 2 })).toHaveText('Use this as a template')
  await expect(template.getByRole('link', { name: /n8builds-web on GitHub/ })).toHaveAttribute('href', 'https://github.com/n8watkins/n8builds-web')
  await expect(template.getByRole('link', { name: /dev-portfolio on GitHub/ })).toHaveAttribute('href', 'https://github.com/n8watkins/dev-portfolio')
  await expect(template).toContainText('License: MIT')
  await expect(template).toContainText('Playwright suite on five browsers')
  // It sits right before the contact section.
  const order = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('#template, #contact')].map((el) => el.id)
    return ids
  })
  expect(order).toEqual(['template', 'contact'])
})
