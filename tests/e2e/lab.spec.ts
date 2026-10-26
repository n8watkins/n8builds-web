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
  await expect(tools.getByRole('heading', { level: 3 })).toHaveText(['My daily drivers', 'Scribe', 'OpenPing'])
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
  await expect(page.getByRole('navigation', { name: 'Lab sections' }).getByRole('link')).toHaveText(['My tools', 'Featured', 'Chrome Extensions'])
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
  // Its heading carries the Lab's flask mark, beside it in a chip.
  const heading = page.locator('#lab').getByRole('heading', { level: 2, name: 'The Lab' })
  const mark = heading.locator('xpath=preceding-sibling::span[1]/*[local-name()="svg"]')
  await expect(mark).toBeVisible()
  await expect(mark).toHaveAttribute('aria-hidden', 'true')
  const [h, m] = await Promise.all([heading.boundingBox(), mark.boundingBox()])
  expect(Math.abs(h!.y + h!.height / 2 - (m!.y + m!.height / 2))).toBeLessThan(4)
  await expect(page.locator('#lab')).toContainText('public on GitHub, and most of it is MIT-licensed open source')
})

test('the hero gives someone hiring a direct link to the developer portfolio', async ({ page }) => {
  await page.goto('/')
  const link = page.getByRole('link', { name: 'See my developer portfolio' })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', 'https://portfolio.n8builds.dev')
})

test('the page ends with "Use this as a template": both sites with their icons, repos, licenses, and how this site is tested', async ({ page }) => {
  await page.goto('/')
  const template = page.locator('#template')
  await template.scrollIntoViewIfNeeded()
  await expect(template.getByRole('heading', { level: 2 })).toHaveText('Use this as a template')
  // Each template goes by its site name, with the N8 icon; the repo names stay on the GitHub links.
  await expect(template.getByRole('heading', { level: 3 })).toHaveText(['n8builds.dev', 'portfolio.n8builds.dev'])
  const cards = template.getByRole('listitem')
  await expect(cards).toHaveCount(2)
  for (const card of await cards.all()) {
    const icon = card.locator('img[src*="n8-icon"]')
    await expect(icon).toBeVisible()
    await expect.poll(() => icon.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
  }
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
  // The leaderboard's Browse section, where its own "Submit yours" button is: not the same door as Live Site.
  await expect(featured.getByRole('link', { name: /Add your portfolio/ })).toHaveAttribute('href', 'https://portfoliorank.vercel.app/#browse')
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
    ['Solara', 'solara', /Find your sun window/, 'https://solara-uv.web.app/app/'],
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
  // It says what you get, from the release itself (the fixture's v0.8.0 installer is 12,519,464 bytes).
  await expect(download).toHaveAccessibleDescription('Windows 10 and 11, 64-bit · v0.8.0 · 12 MB')
  // A download mark and the Windows logo, and the details sit under the button, not beside it.
  await expect(download.locator('svg')).toHaveCount(2)
  const facts = ad.getByText('Windows 10 and 11, 64-bit · v0.8.0 · 12 MB')
  const [button, caption] = await Promise.all([download.boundingBox(), facts.boundingBox()])
  expect(caption!.y).toBeGreaterThanOrEqual(button!.y + button!.height)
  // The Mac and Linux request carries the Apple and Tux marks.
  await expect(ad.getByRole('link', { name: /Mac or Linux/ }).locator('svg')).toHaveCount(2)

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

test('each row names its own Details, Live Site and GitHub controls for screen readers', async ({ page }) => {
  // Four rows with controls all named "Details" (or "Live Site", "GitHub")
  // are indistinguishable in a screen reader's list of buttons or links.
  await page.goto('/')
  for (const title of ['Scribe', 'OpenPing', 'Solara', 'Portfolio Rank']) {
    await expect(page.getByRole('button', { name: `Details about ${title}`, exact: true })).toHaveCount(1)
    await expect(page.getByRole('link', { name: `Live Site of ${title} (opens in a new tab)`, exact: true })).toHaveCount(1)
    await expect(page.getByRole('link', { name: `GitHub repository of ${title} (opens in a new tab)`, exact: true })).toHaveCount(1)
  }
  for (const title of ['Scribe', 'OpenPing']) {
    await expect(page.getByRole('button', { name: `Next ${title} screenshot`, exact: true })).toHaveCount(1)
    await expect(page.getByRole('button', { name: `Previous ${title} screenshot`, exact: true })).toHaveCount(1)
  }
})

test('each row puts Live Site and Star on top, GitHub and Details below, and no two buttons go to the same place', async ({ page }) => {
  await page.goto('/')
  for (const title of ['Scribe', 'OpenPing', 'Solara', 'Portfolio Rank']) {
    const live = page.getByRole('link', { name: `Live Site of ${title} (opens in a new tab)` })
    const star = page.getByRole('link', { name: `Star ${title} on GitHub (opens in a new tab)` })
    const github = page.getByRole('link', { name: `GitHub repository of ${title} (opens in a new tab)` })
    const details = page.getByRole('button', { name: `Details about ${title}` })
    await live.scrollIntoViewIfNeeded()
    const [l, s, g, d] = await Promise.all([live, star, github, details].map((el) => el.boundingBox()))
    expect(Math.round(l!.y), `${title}: Live Site and Star share the top row`).toBe(Math.round(s!.y))
    expect(Math.round(g!.y), `${title}: GitHub and Details share the bottom row`).toBe(Math.round(d!.y))
    expect(g!.y, `${title}: the bottom row is below the top row`).toBeGreaterThan(l!.y + l!.height - 1)
    expect(l!.x, `${title}: Live Site and GitHub lead their rows`).toBeLessThan(s!.x)

    // The ad never repeats the row's own Live Site or GitHub link.
    const taken = [await live.getAttribute('href'), await github.getAttribute('href')]
    const adLinks = page.getByRole('group', { name: `Try ${title}` }).getByRole('link')
    const hrefs = await adLinks.evaluateAll((links) => links.map((a) => a.getAttribute('href')))
    for (const href of hrefs) expect(taken, `${title}: ${href}`).not.toContain(href)
    expect(new Set(hrefs).size, `${title}: the ad's own links differ`).toBe(hrefs.length)
  }
  // Scribe's "How it works" went to its live site, so it is gone.
  await expect(page.getByRole('group', { name: 'Try Scribe' }).getByRole('link', { name: /How it works/ })).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Try OpenPing' }).getByRole('link', { name: /Deploy your own/ })).toHaveAttribute(
    'href',
    'https://github.com/n8watkins/open-ping/blob/main/docs/INSTALL.md',
  )
})

test('each row\'s ad wears its own product\'s colours', async ({ page }) => {
  await page.goto('/')
  const accents = await page.locator('#lab [role="group"][aria-label^="Try "]').evaluateAll((ads) =>
    ads.map((ad) => [ad.getAttribute('data-accent'), getComputedStyle(ad).borderColor]),
  )
  expect(accents.map(([a]) => a)).toEqual(['scribe', 'openping', 'solara', 'rank'])
  expect(new Set(accents.map(([, border]) => border)).size).toBe(4)
})

test('the Lab and the extensions share one Star on GitHub button', async ({ page }) => {
  await page.goto('/')
  const scribe = page.getByRole('link', { name: 'Star Scribe on GitHub (opens in a new tab)' })
  const piper = page.locator('#extensions').getByRole('link', { name: /^Star .* on GitHub \(opens in a new tab\)$/ }).filter({ visible: true }).first()
  await piper.scrollIntoViewIfNeeded()
  // Both read "Star on GitHub" on screen; the repo's name is for screen readers.
  for (const star of [scribe, piper]) await expect(star.getByText('on GitHub', { exact: true })).toBeVisible()
  expect(await scribe.getAttribute('class')).toBe(await piper.getAttribute('class'))
})

test.describe('the Lab gallery', () => {
  const dots = (gallery: import('@playwright/test').Locator) => gallery.locator('[data-dot]')
  const activeDot = async (gallery: import('@playwright/test').Locator) =>
    dots(gallery).evaluateAll((els) => els.findIndex((el) => el.hasAttribute('data-active')))

  test('steps through the screenshots by clicking the sides of the image, with no thumbnails under it', async ({ page }) => {
    await page.goto('/')
    const gallery = page.getByRole('group', { name: 'OpenPing screenshots' })
    await gallery.scrollIntoViewIfNeeded()
    await expect(dots(gallery)).toHaveCount(3)
    await expect.poll(() => activeDot(gallery)).toBe(0)
    await expect(gallery.getByRole('img')).toHaveAccessibleName(/runs entirely in your own cloud/)
    // The dots sit under the image, clear of the screenshot itself.
    const image = (await gallery.getByRole('img').boundingBox())!
    for (const dot of await dots(gallery).all()) expect((await dot.boundingBox())!.y).toBeGreaterThanOrEqual(image.y + image.height)
    // The thumbnail strip is gone.
    await expect(page.getByRole('button', { name: /OpenPing image \d/ })).toHaveCount(0)

    const box = (await gallery.boundingBox())!
    // The right half steps forward; its arrow shows on hover.
    await page.mouse.move(box.x + box.width - 30, box.y + box.height / 2)
    const next = gallery.getByRole('button', { name: 'Next OpenPing screenshot' })
    await expect(next.locator('span')).toHaveCSS('opacity', '1')
    await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2)
    await expect.poll(() => activeDot(gallery)).toBe(1)
    await expect(gallery.getByRole('img', { name: /status page/ })).toBeVisible()
    await expect(gallery.getByText('Screenshot 2 of 3')).toBeAttached()
    // The left half steps back, and wraps around from the first to the last.
    await page.mouse.click(box.x + box.width * 0.25, box.y + box.height / 2)
    await expect.poll(() => activeDot(gallery)).toBe(0)
    await page.mouse.click(box.x + box.width * 0.25, box.y + box.height / 2)
    await expect.poll(() => activeDot(gallery)).toBe(2)
    await expect(gallery.getByRole('img', { name: /free tools/ })).toBeVisible()
  })

  test('works from the keyboard: Tab to a side, Enter or the arrow keys step, and the arrow shows on focus', async ({ page }) => {
    await page.goto('/')
    const gallery = page.getByRole('group', { name: 'Scribe screenshots' })
    await gallery.scrollIntoViewIfNeeded()
    const prev = gallery.getByRole('button', { name: 'Previous Scribe screenshot' })
    const next = gallery.getByRole('button', { name: 'Next Scribe screenshot' })
    await expect(next).toBeEnabled()
    await prev.focus()
    await page.keyboard.press('Tab')
    await expect(next).toBeFocused()
    await expect(next.locator('span')).toHaveCSS('opacity', '1')
    await page.keyboard.press('Enter')
    await expect.poll(() => activeDot(gallery)).toBe(1)
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => activeDot(gallery)).toBe(0)
    await page.keyboard.press('ArrowLeft')
    await expect.poll(() => activeDot(gallery)).toBe(1)
    await expect(gallery.getByRole('img')).toHaveAccessibleName(/Scribe's features/)
  })

  test('rows with one screenshot have no gallery controls', async ({ page }) => {
    await page.goto('/')
    for (const title of ['Solara', 'Portfolio Rank']) {
      await expect(page.getByRole('group', { name: `${title} screenshots` })).toHaveCount(0)
      await expect(page.getByRole('button', { name: new RegExp(`(Next|Previous) ${title} screenshot`) })).toHaveCount(0)
    }
  })
})

test.describe('the Lab gallery on touch', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 800 } })

  test('a swipe steps through the screenshots, and a tap on a side does too', async ({ page }) => {
    await page.goto('/')
    const gallery = page.getByRole('group', { name: 'OpenPing screenshots' })
    await gallery.scrollIntoViewIfNeeded()
    await expect(gallery.getByRole('button', { name: 'Next OpenPing screenshot' })).toBeEnabled()
    const active = () => gallery.locator('[data-dot]').evaluateAll((els) => els.findIndex((el) => el.hasAttribute('data-active')))
    const swipe = (from: number, to: number) =>
      gallery.evaluate(
        (el, [x0, x1]) => {
          const rect = el.getBoundingClientRect()
          const y = rect.top + rect.height / 2
          const touch = (x: number) => new Touch({ identifier: 1, target: el, clientX: rect.left + x, clientY: y })
          el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [touch(x0)], changedTouches: [touch(x0)] }))
          el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [touch(x1)] }))
        },
        [from, to],
      )
    await swipe(250, 100) // right to left: forward
    await expect.poll(() => active()).toBe(1)
    await swipe(100, 250) // left to right: back
    await expect.poll(() => active()).toBe(0)
    // A tiny drag is not a swipe.
    await swipe(150, 140)
    await expect.poll(() => active()).toBe(0)
    const box = (await gallery.boundingBox())!
    await page.touchscreen.tap(box.x + box.width * 0.8, box.y + box.height / 2)
    await expect.poll(() => active()).toBe(1)
  })
})

test('each row lists its features as checks, and shows its tech as pills instead of in the description', async ({ page }) => {
  await page.goto('/')
  const features: [string, string[]][] = [
    ['Scribe', ['Works in any app', 'Push-to-talk hotkey', 'Local Whisper models', 'Searchable history']],
    ['OpenPing', ['Schedule-aware checks', 'Public status pages', 'Incident alerts', 'Five monitor types']],
    ['Solara', ['Personalised sun windows', 'Google Calendar scheduling', 'Push reminders', 'Today and the days ahead']],
    ['Portfolio Rank', ['Head-to-head voting', 'ELO leaderboard', 'Lighthouse and AI reviews', 'Add your portfolio and see how you compare']],
  ]
  for (const [name, list] of features) {
    await expect(page.getByRole('list', { name: `What ${name} does` }).getByRole('listitem')).toHaveText(list)
  }
  const stacks: [string, string[], RegExp][] = [
    ['Scribe', ['Tauri', 'Rust', 'whisper.cpp'], /whisper|Tauri|Rust/],
    ['OpenPing', ['Cloudflare Workers', 'D1', 'Hono', 'React'], /Worker|D1/],
    ['Solara', ['Next.js', 'Firebase', 'Open-Meteo'], /Next\.js|Firebase/],
    ['Portfolio Rank', ['Next.js', 'Gemini', 'Turso', 'Vercel'], /Gemini|Next\.js/],
  ]
  for (const [name, tags, prose] of stacks) {
    const pills = page.getByRole('list', { name: `${name} is built with` })
    await expect(pills.getByRole('listitem')).toHaveText(tags)
    // The description above the pills is about features, not the stack.
    const description = pills.locator('xpath=../preceding-sibling::p[1]')
    await expect(description).not.toHaveText(prose)
  }
})

test("Portfolio Rank's title writes Rank in its own gold", async ({ page }) => {
  await page.goto('/')
  const heading = page.locator('#featured').getByRole('heading', { level: 3, name: 'Portfolio Rank' })
  await expect(heading).toHaveText('Portfolio Rank')
  await expect(heading.getByText('Rank', { exact: true })).toHaveCSS('color', 'rgb(251, 191, 36)')
})

test('the Details dialog shows the project picture on the left on wide screens', async ({ page }) => {
  await page.goto('/')
  for (const name of ['Scribe', 'Solara']) {
    await page.getByRole('button', { name: `Details about ${name}` }).click()
    const dialog = page.getByRole('dialog', { name })
    const picture = dialog.locator('img').filter({ visible: true }).nth(0)
    const title = dialog.getByRole('heading', { level: 4 })
    const [p, t] = await Promise.all([picture.boundingBox(), title.boundingBox()])
    expect(p!.x + p!.width, `${name}: the picture is left of the details`).toBeLessThanOrEqual(t!.x)
    // Each tech's icon is centred over its name.
    const tech = dialog.getByRole('listitem').filter({ has: page.locator('img') }).first()
    const [icon, label] = await Promise.all([tech.locator('img').boundingBox(), tech.locator('span').last().boundingBox()])
    expect(Math.abs(icon!.x + icon!.width / 2 - (label!.x + label!.width / 2))).toBeLessThan(2)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  }
})

test.describe('the Details dialog on a phone', () => {
  test.use({ viewport: { width: 375, height: 800 } })
  test('leaves the picture out to stay short', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Details about OpenPing' }).click()
    const dialog = page.getByRole('dialog', { name: 'OpenPing' })
    await expect(dialog.getByRole('heading', { level: 4 })).toBeVisible()
    // Only the app icon and the tech icons show; the screenshots column is hidden.
    await expect(dialog.locator('img[src*="landing"]').filter({ visible: true })).toHaveCount(0)
  })
})
