import { test, expect } from '@playwright/test'

/**
 * The homepage Lab and its ends: the featured rows lead with the owner's daily
 * drivers, the hero gives a hiring visitor a direct route to the portfolio,
 * and the page closes with "Use this as a template".
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

test('the Lab leads with my daily tools, then the featured builds, each with its icon and a way to its build page', async ({ page }) => {
  await page.goto('/')
  const tools = page.locator('#my-tools')
  await tools.scrollIntoViewIfNeeded()
  // The part's own heading, then one per row.
  await expect(tools.getByRole('heading', { level: 3 })).toHaveText(['Tools I use every day', 'Scribe', 'OpenPing'])
  await expect(page.locator('#featured').getByRole('heading', { level: 3 })).toHaveText(['Featured builds', 'Solara', 'Portfolio Rank'])
  // No redundant "Featured" eyebrow over "Featured builds", and no "The bench" over the Lab.
  await expect(page.locator('#featured')).not.toContainText(/^Featured\s*Featured builds/)
  await expect(page.locator('#lab')).not.toContainText('The bench')
  const lab = page.locator('#lab')
  for (const slug of ['scribe', 'openping', 'solara', 'portfolio-rank']) {
    await expect(lab.locator(`a[href="/builds/${slug}"]`).first(), slug).toBeAttached()
    await expect(lab.locator(`img[src*="${slug}"]`).first(), `${slug} icon`).toBeAttached()
  }
  // Their screenshots are real files.
  for (const src of ['/builds/scribe/landing.webp', '/builds/openping/landing.webp']) {
    expect((await page.request.get(src)).status(), src).toBe(200)
  }
})

test('the Lab has no Tools part any more, in its own links or the navbar menu', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Lab sections' }).getByRole('link')).toHaveText(['My tools', 'Featured', 'Chrome extensions'])
  await expect(page.locator('a[href="/#tools"], a[href="#tools"]')).toHaveCount(0)
  await expect(page.locator('#tools')).toHaveCount(0)
})

test('Scribe and OpenPing build pages lead back to My tools; Solara back to Featured', async ({ page }) => {
  for (const slug of ['scribe', 'openping']) {
    await page.goto(`/builds/${slug}`)
    await expect(page.getByRole('link', { name: /Back to My tools/ })).toHaveAttribute('href', '/#my-tools')
  }
  await page.goto('/builds/solara')
  await expect(page.getByRole('link', { name: /Back to Featured/ })).toHaveAttribute('href', '/#featured')
})

test('Details opens the stack and the build log in a dialog, and closes with Escape', async ({ page }) => {
  await page.goto('/')
  const row = page.locator('#my-tools')
  await row.getByRole('button', { name: 'Details' }).first().scrollIntoViewIfNeeded()
  await row.getByRole('button', { name: 'Details' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Scribe' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText("How it's built")).toBeVisible()
  await expect(dialog.getByRole('link', { name: /Full story and build log/ })).toHaveAttribute('href', '/builds/scribe')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  // The tech stack lives only in the dialog now, not in the row.
  await expect(row.getByRole('button', { name: 'Frontend' }).filter({ visible: true })).toHaveCount(0)
})

test('every row can be starred on GitHub, and Scribe takes Mac and Linux requests', async ({ page }) => {
  await page.goto('/')
  for (const [name, repo] of [
    ['Scribe', 'scribe'],
    ['OpenPing', 'open-ping'],
    ['Solara', 'solara'],
    ['Portfolio Rank', 'portfolio-rank'],
  ]) {
    await expect(page.getByRole('link', { name: `Star ${name} on GitHub (opens in a new tab)` })).toHaveAttribute(
      'href',
      `https://github.com/n8watkins/${repo}`,
    )
  }
  const request = page.getByRole('group', { name: 'Try Scribe' }).getByRole('link', { name: /Mac or Linux/ })
  await expect(request).toHaveAttribute('href', /^https:\/\/github\.com\/n8watkins\/scribe\/issues\/new\?title=Request/)
})

test('the Lab says its builds are public and mostly open source', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#lab')).toContainText('public on GitHub, and most of it is MIT-licensed open source')
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

test('Portfolio Rank credits the list it is built on and invites visitors to add their portfolio', async ({ page }) => {
  // The featured row: a linked credit, and the invitation out to the live site.
  await page.goto('/')
  const featured = page.locator('#lab')
  const credit = featured.getByRole('link', { name: "Emma Bostian's developer-portfolios list" })
  await credit.scrollIntoViewIfNeeded()
  await expect(credit).toHaveAttribute('href', 'https://github.com/emmabostian/developer-portfolios')
  await expect(featured.getByRole('link', { name: /Add your portfolio/ })).toHaveAttribute('href', 'https://portfoliorank.vercel.app/')
  await expect(featured.getByRole('link', { name: /Vote in a face-off/ })).toHaveAttribute('href', 'https://portfoliorank.vercel.app/rank')

  // The build page: the invitation, and credits for the list and the tweet that started it.
  await page.goto('/builds/portfolio-rank')
  await expect(page.getByRole('heading', { name: 'Vote, or add your portfolio' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Add yours on Portfolio Rank/ })).toHaveAttribute('href', 'https://portfoliorank.vercel.app/')
  const credits = page.getByRole('region', { name: 'Credits' })
  await expect(credits.getByRole('link', { name: 'Emma Bostian, developer-portfolios' })).toHaveAttribute(
    'href',
    'https://github.com/emmabostian/developer-portfolios',
  )
  await expect(credits.getByRole('link', { name: 'Ali Spittel' })).toHaveAttribute('href', /twitter\.com\/ASpittel\/status\/1171604728951779328/)

  // Builds without credits show none.
  await page.goto('/builds/scribe')
  await expect(page.getByRole('region', { name: 'Credits' })).toHaveCount(0)
})

test('every featured row and its build page invite the visitor to try it', async ({ page }) => {
  const tries: [string, string, RegExp, string][] = [
    ['Scribe', 'scribe', /Download for Windows/, '/download/scribe'],
    ['OpenPing', 'openping', /Try the free tools/, 'https://openping.n8builds.dev/tools'],
    ['Solara', 'solara', /Find your sun window/, 'https://solara-uv.web.app'],
    ['Portfolio Rank', 'portfolio-rank', /Vote in a face-off/, 'https://portfoliorank.vercel.app/rank'],
  ]
  await page.goto('/')
  const featured = page.locator('#lab')
  for (const [name, , label, href] of tries) {
    await expect(featured.getByRole('group', { name: `Try ${name}` }).getByRole('link', { name: label })).toHaveAttribute('href', href)
  }
  // The two daily drivers say so.
  await expect(featured).toContainText('I dictate with Scribe every day')
  await expect(featured).toContainText('I check OpenPing every day')
  for (const [, slug] of tries) {
    await page.goto(`/builds/${slug}`)
    await expect(page.locator('#cta-heading'), slug).toBeVisible()
  }
  // A build without one shows none.
  await page.goto('/builds/tubevault')
  await expect(page.locator('#cta-heading')).toHaveCount(0)
})

test('the Scribe ad downloads the newest installer through a stable link', async ({ page, request }) => {
  await page.goto('/')
  const ad = page.getByRole('group', { name: 'Try Scribe' })
  await ad.scrollIntoViewIfNeeded()
  const download = ad.getByRole('link', { name: 'Download for Windows' })
  await expect(download).toHaveAttribute('href', '/download/scribe')
  await expect(download).not.toHaveAttribute('target', '_blank')

  // The link resolves to the latest release's installer (a fixed release in tests).
  const response = await request.get('/download/scribe', { maxRedirects: 0 })
  expect(response.status()).toBe(307)
  expect(response.headers().location).toMatch(/^https:\/\/github\.com\/n8watkins\/scribe\/releases\/download\/v[\d.]+\/Scribe_[\d.]+_x64-setup\.exe$/)
  expect((await request.get('/download/nothing', { maxRedirects: 0 })).status()).toBe(404)

  // The build page offers the same download.
  await page.goto('/builds/scribe')
  await expect(page.getByRole('link', { name: 'Download for Windows' })).toHaveAttribute('href', '/download/scribe')
})

test('every featured row carries an ad for its build', async ({ page }) => {
  await page.goto('/')
  for (const name of ['Scribe', 'OpenPing', 'Solara', 'Portfolio Rank']) {
    const ad = page.getByRole('group', { name: `Try ${name}` })
    await expect(ad, name).toBeAttached()
    await expect(ad.getByRole('link').first(), name).toBeAttached()
  }
})

test('the homepage advertises the developer portfolio right after the Lab', async ({ page }) => {
  await page.goto('/')
  const ad = page.getByRole('region', { name: 'Meet the developer behind the builds' })
  await ad.scrollIntoViewIfNeeded()
  await expect(ad.getByRole('link', { name: /See my portfolio/ })).toHaveAttribute('href', 'https://portfolio.n8builds.dev')
  await expect(ad.getByRole('link', { name: /Jump to the projects/ })).toHaveAttribute('href', 'https://portfolio.n8builds.dev/#projects')
  const order = await page.evaluate(() => {
    const lab = document.getElementById('lab')!
    const adEl = document.getElementById('portfolio-ad-heading')!
    return Boolean(lab.compareDocumentPosition(adEl) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  expect(order).toBe(true)
})

test('Details waits for hydration instead of swallowing an early click', async ({ page }) => {
  // Hold the JS: the server-rendered button must not look ready while it can't respond.
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/_next/static/chunks/**', async (route) => {
    await held
    await route.continue()
  })
  await page.goto('/', { waitUntil: 'commit' })
  const details = page.locator('#my-tools').getByRole('button', { name: 'Details' }).first()
  await expect(details).toBeDisabled()
  release()
  await expect(details).toBeEnabled()
  await details.click()
  await expect(page.getByRole('dialog', { name: 'Scribe' })).toBeVisible()
})
