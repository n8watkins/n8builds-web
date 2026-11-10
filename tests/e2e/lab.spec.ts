import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * The homepage Lab and its ends: the featured rows (OpenPing first), the hero
 * gives a hiring visitor a direct route to the portfolio, and the page closes
 * with "Use this as a template". Scribe's row is the same component, on
 * /loadout's "Tools I've built" (2026-11-01), so the row tests cover it there.
 *
 * Since 2026-11-08 a row only says what the build is and invites you to try it:
 * one primary button to the live thing, "Full story" (its build page) and the
 * Star | GitHub split button. The stack, the features and every other way in
 * are on the build page; there is no Details dialog.
 */

test.use({ contextOptions: { reducedMotion: 'reduce' } })

/** Where each row lives: Scribe on /loadout, the featured builds in the homepage Lab. */
const ROW_PAGE: Record<string, string> = { Scribe: '/loadout', OpenPing: '/', Solara: '/' }
const ROWS = Object.keys(ROW_PAGE)
/** Each row's slug and repository under github.com/n8watkins. */
const SLUG: Record<string, string> = { Scribe: 'scribe', OpenPing: 'openping', Solara: 'solara' }
const REPO: Record<string, string> = { Scribe: 'scribe', OpenPing: 'open-ping', Solara: 'solara' }
/** Each row's one primary action, to the live thing. */
const PRIMARY: Record<string, [RegExp, string]> = {
  Scribe: [/^Download for Windows/, '/download/scribe'],
  // The landing page is OpenPing's product.
  OpenPing: [/^Check it out/, 'https://openping.n8builds.dev'],
  // The planner itself, not its landing page.
  Solara: [/^Find your sun window/, 'https://solara-uv.web.app/app/'],
}

/** The row's article, opening its page first unless it is already open. */
async function rowOf(page: Page, title: string) {
  const path = ROW_PAGE[title]
  if (new URL(page.url()).pathname !== path) await page.goto(path)
  return page.getByRole('article', { name: title })
}

/**
 * Makes the page's browser report Windows, or a Mac, through Chromium's client
 * hint (the rows read it first). Playwright's desktop browsers already claim
 * Windows in their user agent; its phones don't.
 */
const asWindows = () => Object.defineProperty(navigator, 'userAgentData', { get: () => ({ platform: 'Windows' }) })
const asMac = () => Object.defineProperty(navigator, 'userAgentData', { get: () => ({ platform: 'macOS' }) })
const asLinux = () => Object.defineProperty(navigator, 'userAgentData', { get: () => ({ platform: 'Linux' }) })
const asPhone = () => Object.defineProperty(navigator, 'userAgentData', { get: () => ({ platform: 'Android', mobile: true }) })

/** A row's three controls: the primary action, Full story and the Star | GitHub group. */
const controls = (row: Locator, title: string) => [
  row.getByRole('link', { name: PRIMARY[title][0] }),
  row.getByRole('link', { name: `Full story of ${title}`, exact: true }),
  row.getByRole('group', { name: `${title} on GitHub` }),
]

test('the Lab leads with the featured builds, OpenPing first, each with its icon and a way to its build page', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/')
  const featured = page.locator('#featured')
  await featured.scrollIntoViewIfNeeded()
  // The part's own heading, then one per row.
  await expect(featured.getByRole('heading', { level: 3 })).toHaveText(['Featured', 'OpenPing', 'Solara'])
  // Just "Featured" since 2026-11-09, with no blurb and no checks of its own (they sit under "The Lab").
  await expect(featured).not.toContainText('Free to use and open source')
  await expect(featured.getByRole('list', { name: 'Open source' })).toHaveCount(0)
  // The Featured part comes first, right under the Lab's intro: no "My daily drivers" (Scribe moved to the Loadout).
  await expect(page.locator('#my-tools')).toHaveCount(0)
  await expect(page.locator('#lab').getByRole('article', { name: 'Scribe' })).toHaveCount(0)
  await expect(page.locator('#lab')).not.toContainText('My daily drivers')
  // No redundant "Featured" eyebrow over the heading, and no "The bench" over the Lab.
  await expect(page.locator('#featured')).not.toContainText(/^Featured\s*Featured/)
  await expect(page.locator('#lab')).not.toContainText('The bench')
  const lab = page.locator('#lab')
  for (const slug of ['openping', 'solara']) {
    await expect(lab.locator(`a[href="/builds/${slug}"]`).first(), slug).toBeAttached()
    await expect(lab.locator(`img[src*="${slug}"]`).first(), `${slug} icon`).toBeAttached()
  }
  // Their screenshots are real files.
  for (const src of ['/builds/scribe/tour-poster.webp', '/builds/openping/landing.webp']) {
    expect((await page.request.get(src)).status(), src).toBe(200)
  }
})

for (const width of [1280, 390]) {
  test(`Featured is a card per build: the clip across it, the words and buttons under it, OpenPing first, side by side on desktop (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const cards = page.locator('#featured article')
    await expect(cards).toHaveCount(2)
    const boxes: { top: number; bottom: number }[] = []
    for (const title of ['OpenPing', 'Solara']) {
      const card = page.getByRole('article', { name: title })
      await card.scrollIntoViewIfNeeded()
      const [article, clip, heading, primary] = await Promise.all([
        card.locator('.reveal').first().boundingBox(),
        card.locator('[data-tour]').boundingBox(),
        card.getByRole('heading', { level: 3 }).boundingBox(),
        card.getByRole('link', { name: PRIMARY[title][0] }).boundingBox(),
      ])
      // Round 8 of 2026-11-09: no left and right rows. The clip spans the card...
      expect(clip!.width, title).toBeGreaterThan(article!.width - 40)
      // ... and the name and buttons sit under it.
      expect(heading!.y, title).toBeGreaterThan(clip!.y + clip!.height)
      expect(primary!.y, title).toBeGreaterThan(clip!.y + clip!.height)
      boxes.push(await card.evaluate((el) => {
        const r = el.getBoundingClientRect()
        return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY }
      }))
    }
    if (width >= 1024) {
      // Round 9 of 2026-11-09 (owner: the big cards were too big): side by side, the same height.
      const [a, b] = await Promise.all(['OpenPing', 'Solara'].map((t) => page.getByRole('article', { name: t }).boundingBox()))
      expect(Math.round(a!.y)).toBe(Math.round(b!.y))
      expect(b!.x).toBeGreaterThan(a!.x + a!.width)
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(1)
    } else {
      expect(boxes[1].top).toBeGreaterThanOrEqual(boxes[0].bottom)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

test('the Lab has no tools part any more, in its own links, the navbar menu or the footer', async ({ page }) => {
  await page.goto('/')
  // The Lab's rail lists its parts (in the page at every width, shown on desktop once the Lab is on screen).
  const parts = page.locator('nav[aria-label="Lab contents"] a')
  await expect(parts).toHaveCount(3)
  expect(await parts.evaluateAll((links) => links.map((a) => a.getAttribute('href')))).toEqual(['#featured', '#extensions', '#upcoming'])
  // Neither the old Tools grid nor My tools: nothing links to them.
  await expect(page.locator('a[href="/#tools"], a[href="#tools"], a[href="/#my-tools"], a[href="#my-tools"]')).toHaveCount(0)
  await expect(page.locator('#tools, #my-tools')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /^My tools/ })).toHaveCount(0)
})

test("Scribe's build page leads back to Tools I've built on /loadout; OpenPing and Solara back to Featured", async ({ page }) => {
  await page.goto('/builds/scribe')
  await expect(page.getByRole('link', { name: "Back to Tools I've built" })).toHaveAttribute('href', '/loadout#tools-i-built')
  for (const slug of ['openping', 'solara']) {
    await page.goto(`/builds/${slug}`)
    await expect(page.getByRole('link', { name: 'Back to Featured' })).toHaveAttribute('href', '/#featured')
  }
  // Portfolio Rank isn't on the homepage: its page leads back to the /builds index.
  await page.goto('/builds/portfolio-rank')
  await expect(page.getByRole('link', { name: 'Back to all builds' })).toHaveAttribute('href', '/builds')
})

test('Full story opens the build page: no Details dialog, and the row shows no stack or features', { tag: ['@cross-browser', '@smoke'] }, async ({ page }) => {
  await page.goto('/')
  const row = page.getByRole('article', { name: 'OpenPing' })
  const story = row.getByRole('link', { name: 'Full story of OpenPing', exact: true })
  await story.scrollIntoViewIfNeeded()
  await expect(story).toHaveAttribute('href', '/builds/openping')
  // No Details dialog (What's cookin's waitlist modal is the Lab's only dialog, round 7).
  await expect(page.locator('#lab dialog:not(#waitlist)')).toHaveCount(0)
  await expect(page.locator('#lab').getByRole('button', { name: /^Details/ })).toHaveCount(0)
  for (const title of ['OpenPing', 'Solara']) {
    const article = page.getByRole('article', { name: title })
    await expect(article.getByRole('list', { name: `What ${title} does` })).toHaveCount(0)
    await expect(article.getByRole('list', { name: `${title} is built with` })).toHaveCount(0)
    await expect(article.getByRole('button', { name: 'Frontend' })).toHaveCount(0)
  }
  await story.click()
  await expect(page).toHaveURL(/\/builds\/openping$/)
  await expect(page.getByRole('heading', { level: 1, name: 'OpenPing' })).toBeVisible()
})

test('the Lab is headed by its flask, and says its builds are open source once, under its heading', async ({ page }) => {
  await page.goto('/')
  // Its heading carries the Lab's flask mark (percolating), beside it in a chip.
  const heading = page.locator('#lab').getByRole('heading', { level: 2, name: 'The Lab' })
  const mark = heading.locator('xpath=preceding-sibling::span[1]/*[name()="svg"]')
  await expect(mark).toBeVisible()
  await expect(mark).toHaveAttribute('aria-hidden', 'true')
  // Liquid that sways, bubbles rising through it, and one escaping up the neck.
  await expect(mark.locator('.flask-liquid')).toHaveCount(1)
  await expect(mark.locator('.flask-rise')).toHaveCount(5)
  await expect(mark.locator('.flask-escape')).toHaveCount(1)
  const [h, m] = await Promise.all([heading.boundingBox(), mark.boundingBox()])
  expect(Math.abs(h!.y + h!.height / 2 - (m!.y + m!.height / 2))).toBeLessThan(4)
  // The claims every build shares sit once, under "The Lab" (owner, 2026-11-09), on one line from 1024px.
  const checks = page.locator('#lab').getByRole('list', { name: 'Open source' })
  await expect(checks).toHaveCount(1)
  await expect(checks.getByRole('listitem')).toHaveText(['Public on GitHub', 'MIT-licensed', 'Star, fork or open an issue'])
  const [headingBox, checksBox] = await Promise.all([heading.boundingBox(), checks.boundingBox()])
  expect(checksBox!.y).toBeGreaterThan(headingBox!.y + headingBox!.height)
  expect(checksBox!.y).toBeLessThan((await page.locator('#featured').boundingBox())!.y)
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    const tops = await checks.getByRole('listitem').evaluateAll((items) => new Set(items.map((li) => Math.round(li.getBoundingClientRect().top))).size)
    expect(tops).toBe(1)
  }
  await expect(page.locator('#template').getByText('MIT-licensed')).toHaveCount(0)
  for (const generic of ['No telemetry', 'No account to start', 'A vote takes five seconds', 'Free tools, no sign-up']) {
    await expect(page.locator('#lab').getByText(generic, { exact: true })).toHaveCount(0)
  }
})

test('Portfolio Rank left the Lab, and keeps its page, its credits and its place in the /builds index', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#lab').getByRole('article', { name: 'Portfolio Rank' })).toHaveCount(0)
  await expect(page.locator('#lab a[href="/builds/portfolio-rank"]')).toHaveCount(0)

  // The build page: its main action, the invitation to add a portfolio, and
  // credits for the list and the tweet that started it.
  await page.goto('/builds/portfolio-rank')
  await expect(page.locator('main header').getByRole('link', { name: /^Vote in a face-off/ })).toHaveAttribute('href', 'https://portfoliorank.n8builds.dev/rank')
  await expect(page.getByRole('heading', { name: 'Vote, or add your portfolio' })).toBeVisible()
  // The leaderboard's Browse section, where its own "Submit yours" button is: not the same door as the live site.
  await expect(page.getByRole('link', { name: /Add yours on Portfolio Rank/ })).toHaveAttribute('href', 'https://portfoliorank.n8builds.dev/#browse')
  const credits = page.getByRole('region', { name: 'Credits' })
  await expect(credits.getByRole('link', { name: 'Emma Bostian, developer-portfolios' })).toHaveAttribute(
    'href',
    'https://github.com/emmabostian/developer-portfolios',
  )
  await expect(credits.getByRole('link', { name: 'Ali Spittel' })).toHaveAttribute('href', /twitter\.com\/ASpittel\/status\/1171604728951779328/)

  // Still in the /builds index.
  await page.goto('/builds')
  await expect(page.getByRole('list', { name: 'Builds by latest activity' }).locator('[data-build="portfolio-rank"]')).toBeAttached()

  // Builds without credits show none.
  await page.goto('/builds/scribe')
  await expect(page.getByRole('region', { name: 'Credits' })).toHaveCount(0)
})

test('every row and its build page lead with the same one action, to the live thing', async ({ page, isMobile }) => {
  // Scribe offers the visitor's OS: Windows here (Desktop Safari's user agent says Mac).
  if (!isMobile) await page.addInitScript(asWindows)
  for (const title of ROWS) {
    const row = await rowOf(page, title)
    const [label, href] = PRIMARY[title]
    await expect(row.getByRole('link', { name: label }), title).toHaveAttribute('href', href)
  }
  // The two the owner uses every day say so.
  await expect(page.locator('#lab')).toContainText('from your own Cloudflare account. I check it every day.')
  await expect(await rowOf(page, 'Scribe')).toContainText('I dictate with Scribe every day')
  for (const title of ROWS) {
    await page.goto(`/builds/${SLUG[title]}`)
    const [label, href] = PRIMARY[title]
    const first = page.locator('main header').getByRole('link').first()
    await expect(first, title).toHaveAccessibleName(label)
    await expect(first, title).toHaveAttribute('href', href)
  }
  // Every door the row leaves out is on the build page: OpenPing's free tools and install guide.
  await page.goto('/builds/openping')
  const header = page.locator('main header')
  await expect(header.getByRole('link', { name: /^Try the free tools/ })).toHaveAttribute('href', 'https://openping.n8builds.dev/tools')
  await expect(header.getByRole('link', { name: /^Deploy your own/ })).toHaveAttribute('href', 'https://openping.n8builds.dev/install')
  // Its landing page is the main action, so it isn't offered twice.
  await expect(header.getByRole('link', { name: /Visit the landing page/ })).toHaveCount(0)
  // Solara's landing page sits beside the planner.
  await page.goto('/builds/solara')
  await expect(page.locator('main header').getByRole('link', { name: /Visit the landing page/ })).toHaveAttribute('href', 'https://solara-uv.web.app')
  // A build without an invitation box shows none.
  await page.goto('/builds/tubevault')
  await expect(page.locator('#cta-heading')).toHaveCount(0)
})

test('Scribe downloads the newest installer through a stable link, and its page takes Mac and Linux requests', { tag: '@smoke' }, async ({ page, request }) => {
  // On Windows, where the download leads.
  await page.addInitScript(asWindows)
  const row = await rowOf(page, 'Scribe')
  const download = row.getByRole('link', { name: 'Download for Windows' })
  await download.scrollIntoViewIfNeeded()
  await expect(download).toHaveAttribute('href', '/download/scribe')
  await expect(download).not.toHaveAttribute('target', '_blank')
  // It says what you get, from the release itself (the fixture's v0.8.0 installer is 12,519,464 bytes).
  await expect(download).toHaveAccessibleDescription('Windows 10 and 11, 64-bit · v0.8.0 · 12 MB')
  // A download mark at the start, and the Windows logo right before the word "Windows".
  await expect(download.locator('svg')).toHaveCount(2)
  const logo = download.locator('svg').nth(1)
  expect(await logo.evaluate((svg) => svg.nextSibling?.textContent?.trim())).toBe('Windows')
  // It holds still on hover: no scale.
  await download.hover()
  await expect(download).toHaveCSS('scale', 'none')
  // The details sit close under the buttons, not beside them.
  const caption = row.getByText('Windows 10 and 11, 64-bit · v0.8.0 · 12 MB')
  const [button, facts] = await Promise.all([download.boundingBox(), caption.boundingBox()])
  expect(facts!.y).toBeGreaterThanOrEqual(button!.y + button!.height)
  expect(facts!.y - (button!.y + button!.height)).toBeLessThan(8)

  // The link resolves to the latest release's installer (a fixed release in tests).
  const response = await request.get('/download/scribe', { maxRedirects: 0 })
  expect(response.status()).toBe(307)
  expect(response.headers().location).toMatch(/^https:\/\/github\.com\/n8watkins\/scribe\/releases\/download\/v[\d.]+\/Scribe_[\d.]+_x64-setup\.exe$/)
  expect((await request.get('/download/nothing', { maxRedirects: 0 })).status()).toBe(404)

  // The build page offers the same download, says what it fetches, and links the Mac and Linux betas.
  await page.goto('/builds/scribe')
  const header = page.locator('main header')
  await expect(header.locator('[data-build-platform="windows"]')).toHaveCount(1)
  await expect(header.getByRole('link', { name: 'Download for Windows' })).toHaveAttribute('href', '/download/scribe')
  await expect(header.getByRole('link', { name: 'Download for Windows' })).toHaveAccessibleDescription('Windows 10 and 11, 64-bit · v0.8.0 · 12 MB')
  await expect(row.getByRole('link', { name: /Mac or Linux/ })).toHaveCount(0)
  // Mac and Linux ship as betas (2026-11-09): direct downloads, no request link.
  await expect(header.getByRole('link', { name: /Mac or Linux/ })).toHaveCount(0)
  await expect(header.getByRole('link', { name: 'Mac (beta, not notarized)' })).toHaveAttribute('href', '/download/scribe-mac')
  await expect(header.getByRole('link', { name: 'Linux (beta)' })).toHaveAttribute('href', '/download/scribe-linux')
})

/**
 * Round 7 of 2026-11-09 (owner): Scribe's build page leads with the download
 * for the visitor's OS, like its homepage row, the other two quiet under it.
 */
test("Scribe's build page leads with the download for the visitor's OS, the others quiet under it", async ({ browser }) => {
  for (const [as, platform, name, href, quiet, describe] of [
    [asWindows, 'windows', 'Download for Windows', '/download/scribe', ['Mac (beta, not notarized)', 'Linux (beta)'], /^Windows 10 and 11, 64-bit · v0\.8\.0 · 12 MB$/],
    [asMac, 'mac', 'Download for macOS Beta', '/download/scribe-mac', ['Windows', 'Linux (beta)'], /^macOS, Apple silicon and Intel · v0\.8\.0 · \d+ MB ?Not notarized by Apple: open it once, then allow it in System Settings > Privacy & Security > Open Anyway\.$/],
    [asLinux, 'linux', 'Download for Linux Beta', '/download/scribe-linux', ['Windows', 'Mac (beta, not notarized)'], /^Linux, 64-bit AppImage · v0\.8\.0 · \d+ MB · Also as a \.deb$/],
    [asPhone, 'other', 'Download for Windows', '/download/scribe', ['Mac (beta, not notarized)', 'Linux (beta)'], /^Windows 10 and 11/],
  ] as const) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.addInitScript(as)
    await page.goto('/builds/scribe')
    const header = page.locator('main header')
    await expect(header.locator(`[data-build-platform="${platform}"]`)).toHaveCount(1)
    const main = header.getByRole('link', { name, exact: true })
    await expect(main).toHaveAttribute('href', href)
    await expect(main).toHaveAccessibleDescription(describe)
    await expect(header.locator('[data-other-platforms] a')).toHaveText([...quiet])
    await context.close()
  }

})

test("Scribe's row offers the download for the visitor's OS, and leads with its full story on a phone, without moving", { tag: '@cross-browser' }, async ({ browser }) => {
  // Windows, and macOS and Linux in beta (owner, 2026-11-09).
  const look = async (as: () => unknown, name: string) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.addInitScript(as)
    const row = await rowOf(page, 'Scribe')
    const download = row.getByRole('link', { name, exact: true })
    const story = row.getByRole('link', { name: 'Full story of Scribe', exact: true })
    await download.scrollIntoViewIfNeeded()
    const solid = async (el: Locator) => el.evaluate((e) => getComputedStyle(e).backgroundImage !== 'none')
    const result = {
      platform: await row.locator('[data-scribe-platform]').getAttribute('data-scribe-platform'),
      href: await download.getAttribute('href'),
      download: await solid(download),
      story: await solid(story),
      note: (await row.locator('#scribe-download-note').innerText()).replace(/\s+/g, ' '),
      boxes: await Promise.all([download, story].map(async (el) => {
        const { width, height } = (await el.boundingBox())!
        return { width: Math.round(width), height: Math.round(height) }
      })),
    }
    await context.close()
    return result
  }
  const win = await look(asWindows, 'Download for Windows')
  expect(win).toMatchObject({ platform: 'windows', href: '/download/scribe', download: true, story: false, note: 'Windows 10 and 11, 64-bit · v0.8.0 · 12 MB' })
  const mac = await look(asMac, 'Download for macOS Beta')
  expect(mac).toMatchObject({ platform: 'mac', href: '/download/scribe-mac', download: true, story: false })
  expect(mac.note).toMatch(/^macOS, Apple silicon and Intel · v0\.8\.0 · \d+ MB ?Not notarized by Apple: open it once, then allow it in System Settings > Privacy & Security > Open Anyway\.$/)
  const linux = await look(asLinux, 'Download for Linux Beta')
  expect(linux).toMatchObject({ platform: 'linux', href: '/download/scribe-linux', download: true, story: false })
  expect(linux.note).toMatch(/^Linux, 64-bit AppImage · v0\.8\.0 · \d+ MB · Also as a \.deb$/)
  const phone = await look(asPhone, 'Download for Windows')
  expect(phone).toMatchObject({ platform: 'other', download: false, story: true, note: 'Desktop app for Windows, with macOS and Linux in beta.' })
  // Only colours and words change: the buttons keep their size.
  for (const other of [mac, linux, phone]) expect(other.boxes).toEqual(win.boxes)
})

test("each row's primary action is in its product's colour", async ({ page }) => {
  // Scribe's download leads (in its colour) on Windows.
  await page.addInitScript(asWindows)
  const colours: string[] = []
  for (const title of ROWS) {
    const row = await rowOf(page, title)
    const primary = row.getByRole('link', { name: PRIMARY[title][0] })
    colours.push(await primary.evaluate((el) => getComputedStyle(el).backgroundImage + getComputedStyle(el).backgroundColor))
  }
  expect(new Set(colours).size).toBe(ROWS.length)
})

test('the homepage advertises the developer portfolio right after the Lab', async ({ page }) => {
  await page.goto('/')
  const ad = page.getByRole('region', { name: 'The developer behind the build' })
  await ad.scrollIntoViewIfNeeded()
  await expect(ad.getByRole('link', { name: /See my portfolio/ })).toHaveAttribute('href', 'https://portfolio.n8builds.dev')
  await expect(ad.getByRole('link', { name: /Jump to the projects/ })).toHaveAttribute('href', 'https://portfolio.n8builds.dev/#projects')
  // Echo, Scout and GeminiGPT were retired on 2026-11-08: the ad names no project and links none.
  await expect(ad.locator('a[href*="/projects/"]')).toHaveCount(0)
  await expect(ad).not.toContainText(/voice agent|research agent|GeminiGPT/)
  // The portfolio in use, a muted loop with a pause button, not a still (2026-11-09).
  const clip = ad.locator('[data-tour] video')
  await expect(clip).toHaveAttribute('aria-label', /developer portfolio's homepage/)
  await expect(ad.locator('[data-tour] img[data-tour-poster]')).toHaveCount(1)
  // No link around it: its pause button can't sit inside one.
  await expect(ad.locator('a:has([data-tour])')).toHaveCount(0)
  const order = await page.evaluate(() => {
    const lab = document.getElementById('lab')!
    const adEl = document.getElementById('portfolio-ad-heading')!
    return Boolean(lab.compareDocumentPosition(adEl) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  expect(order).toBe(true)
})

test('each row names its own Full story, Star and GitHub controls for screen readers', async ({ page }) => {
  // Rows with controls all named "Full story" (or "GitHub") are
  // indistinguishable in a screen reader's list of links.
  for (const title of ROWS) {
    await rowOf(page, title)
    await expect(page.getByRole('link', { name: `Full story of ${title}`, exact: true })).toHaveCount(1)
    const star = page.getByRole('link', { name: `Star ${title} on GitHub (opens in a new tab)`, exact: true })
    await expect(star).toHaveCount(1)
    // Starring happens on the repo's page.
    await expect(star).toHaveAttribute('href', `https://github.com/n8watkins/${REPO[title]}`)
    await expect(page.getByRole('link', { name: `${title} on GitHub (opens in a new tab)`, exact: true })).toHaveCount(1)
  }
})

test('each row has one primary action, then Full story, then Star | GitHub, and no two go to the same place', { tag: '@cross-browser' }, async ({ page, isMobile }) => {
  // Scribe offers the visitor's OS: Windows here (Desktop Safari's user agent says Mac).
  if (!isMobile) await page.addInitScript(asWindows)
  for (const title of ROWS) {
    const row = await rowOf(page, title)
    const [primary, story, repo] = controls(row, title)
    await primary.scrollIntoViewIfNeeded()
    // Exactly these links: the primary, Full story, and the repo twice (Star and GitHub).
    // On a phone Scribe's Full story leads, its Windows download second (ScribeActions, 2026-11-09).
    const lead = title === 'Scribe' && isMobile ? [`/builds/${SLUG[title]}`, PRIMARY[title][1]] : [PRIMARY[title][1], `/builds/${SLUG[title]}`]
    const hrefs = await row.locator('a').evaluateAll((links) => links.map((a) => a.getAttribute('href')))
    expect(hrefs, title).toEqual([...lead, `https://github.com/n8watkins/${REPO[title]}`, `https://github.com/n8watkins/${REPO[title]}`])
    // In that order on screen: one line, or the primary on its own line and the other two under it.
    const [p, f, r] = await Promise.all([primary, story, repo].map((el) => el.boundingBox()))
    if (title === 'Scribe' && isMobile) {
      // Full story first, then the download (side by side or stacked), Star | GitHub under them.
      expect(f!.x < p!.x || f!.y < p!.y, 'Scribe on a phone: Full story, then the download').toBe(true)
      expect(r!.y, 'Scribe: Star | GitHub under them').toBeGreaterThan(Math.max(p!.y + p!.height, f!.y + f!.height) - 1)
    } else if (title === 'Scribe') {
      // Scribe's download and Full story side by side (ScribeActions, 2026-11-09), Star | GitHub under them.
      expect(p!.x < f!.x && Math.round(p!.y) === Math.round(f!.y), 'Scribe: download, then Full story').toBe(true)
      expect(r!.y, 'Scribe: Star | GitHub under them').toBeGreaterThan(f!.y + f!.height - 1)
    } else if (Math.round(p!.y) === Math.round(f!.y)) {
      expect(p!.x < f!.x && f!.x < r!.x, `${title}: primary, Full story, Star | GitHub`).toBe(true)
      expect(Math.round(f!.y), title).toBe(Math.round(r!.y))
    } else {
      expect(f!.y, `${title}: Full story under the primary`).toBeGreaterThan(p!.y + p!.height - 1)
      expect(Math.round(f!.y), `${title}: Full story and Star | GitHub share a line`).toBe(Math.round(r!.y))
      expect(f!.x < r!.x, title).toBe(true)
      // The primary spans the two under it.
      expect(Math.abs(p!.x - f!.x), title).toBeLessThan(2)
      expect(Math.abs(p!.x + p!.width - (r!.x + r!.width)), title).toBeLessThan(2)
    }
  }
})

test("each row's buttons fit their column, with one-line labels, at every width", { tag: '@cross-browser' }, async ({ page, isMobile }) => {
  test.skip(isMobile, 'phones set their own width; the desktop projects walk the widths')
  // Rows times widths, each a relayout: WebKit under a full parallel run needs more than 30s.
  test.setTimeout(90_000)
  // Scribe offers the visitor's OS: Windows here (Desktop Safari's user agent says Mac).
  await page.addInitScript(asWindows)
  // Row by row (each page opens once), every width on each.
  for (const title of ROWS) {
    const row = await rowOf(page, title)
    for (const width of [1920, 1440, 1366, 1280, 1100, 1040, 1024, 820, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      const [primary, story, repo] = controls(row, title)
      await primary.scrollIntoViewIfNeeded()
      const text = row.getByRole('heading', { level: 3 }).locator('xpath=ancestor::div[contains(@class,"md:w-1/2") or @data-featured-text][1]')
      const [p, f, r, t] = await Promise.all([primary, story, repo, text].map((el) => el.boundingBox()))
      const at = `${title} at ${width}px`
      for (const [name, box] of [['primary', p], ['Full story', f], ['Star | GitHub', r]] as const) {
        expect(box!.height, `${at}: the ${name} label is on one line`).toBeLessThan(42)
        expect(box!.x, `${at}: the ${name} starts inside the column`).toBeGreaterThanOrEqual(t!.x - 0.5)
        expect(box!.x + box!.width, `${at}: the ${name} ends inside the column`).toBeLessThanOrEqual(t!.x + t!.width + 0.5)
      }
      // They keep an 8px gap and never touch.
      if (Math.round(p!.y) === Math.round(f!.y)) expect(f!.x - (p!.x + p!.width), at).toBeCloseTo(8, 0)
      // Scribe's Star | GitHub has a line of its own under its two buttons (ScribeActions).
      if (title !== 'Scribe') expect(r!.x - (f!.x + f!.width), at).toBeCloseTo(8, 0)
      // No label is cut off inside its button.
      const clipped = await Promise.all(
        [primary, story, repo.getByRole('link').first(), repo.getByRole('link').last()].map((el) => el.evaluate((e) => e.scrollWidth > e.clientWidth + 1)),
      )
      expect(clipped, `${at}: nothing clipped`).toEqual([false, false, false, false])
    }
  }
})

test('the rows and the extensions share one Star | GitHub control, its star showing the live count', async ({ page }) => {
  const expectControl = async (control: import('@playwright/test').Locator) => {
    const [star, github] = await control.getByRole('link').all()
    // The star half: the star and a count, no "Star" on screen; its name says it all.
    await expect(star).toHaveAccessibleName(/^Star .+ on GitHub \(opens in a new tab\)$/)
    await expect(star.getByText('Star', { exact: true })).toHaveCount(0)
    await expect(star.locator('svg')).toBeVisible()
    await expect(github).toHaveAccessibleName(/^.+ on GitHub \(opens in a new tab\)$/)
    await expect(github).toContainText('GitHub')
    expect(await star.getAttribute('href')).toBe(await github.getAttribute('href'))
    // The Lab rows add their own tightening where their columns are narrow (lab-tight:*).
    const looks = async (el: import('@playwright/test').Locator) =>
      (await el.getAttribute('class'))!
        .split(/\s+/)
        .filter((c) => c && !c.startsWith('lab-tight:'))
        .join(' ')
    return Promise.all([looks(star), looks(github)])
  }
  // Scribe's row, on /loadout: the count comes from GitHub (the test fixture gives Scribe 1,234 stars and Piper none).
  const scribe = (await rowOf(page, 'Scribe')).getByRole('group', { name: 'Scribe on GitHub' })
  const rowClasses = await expectControl(scribe)
  await expect(scribe.getByRole('link').first()).toHaveText(/1\.2k/)
  // A Chrome extension, in the homepage Lab.
  await page.goto('/')
  const piper = page.locator('#extensions').getByRole('group', { name: /on GitHub$/ }).filter({ visible: true }).first()
  await piper.scrollIntoViewIfNeeded()
  // The same control in both places.
  expect(await expectControl(piper)).toEqual(rowClasses)
  await expect(piper.getByRole('link').first()).not.toHaveText(/\d/)
})

/**
 * Round 7 of 2026-11-09 (owner): every featured row shows its product in use, a
 * short muted clip (Scribe's tour; OpenPing's and Solara's usage clips from
 * scripts/product-clips/), not screenshots.
 */
test.describe('featured clips, with motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('each featured row plays a clip of its product in use, not screenshots', async ({ page }) => {
  await page.goto('/')
  for (const [title, src] of [
    ['Scribe', '/builds/scribe/tour'],
    ['OpenPing', '/builds/openping/clip'],
    ['Solara', '/builds/solara/clip'],
  ] as const) {
    const row = await rowOf(page, title)
    const video = row.locator('[data-tour] video')
    await video.scrollIntoViewIfNeeded()
    // Featured's clips take turns (round 9): Solara's plays once it has the turn, here by hovering it.
    if (title === 'Solara') await row.hover()
    await expect(row.getByRole('group', { name: `${title} screenshots` })).toHaveCount(0)
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentSrc), { message: title }).toContain(src)
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0), { message: title }).toBe(true)
  }
  })

  /**
   * Round 9 of 2026-11-09 (owner): two clips moving at once is too much, so only
   * one of Featured's plays. Round 12: they alternate by themselves, forever: one
   * plays through, then the other, a bar under the playing one filling as it
   * plays. Pointing at (or focusing, or tapping the play button of) a card makes
   * its clip the playing one, and the round goes on from there.
   */
  test("Featured's clips alternate by themselves, a bar under the playing one; pointing at one makes it play", { tag: '@cross-browser' }, async ({ page, isMobile }) => {
    test.setTimeout(60_000)
    await page.setViewportSize(isMobile ? page.viewportSize()! : { width: 1280, height: 900 })
    await page.goto('/')
    const featured = page.locator('#featured')
    await featured.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    const openping = page.getByRole('article', { name: 'OpenPing' })
    const solara = page.getByRole('article', { name: 'Solara' })
    const playing = (card: typeof openping) => card.locator('[data-tour] video').evaluate((v: HTMLVideoElement) => !v.paused)
    const resting = async (card: typeof openping) => {
      // Paused, its video hidden so the poster frame shows, and a play button over it.
      await expect.poll(() => playing(card)).toBe(false)
      await expect(card.locator('[data-tour] video')).toHaveCSS('opacity', '0')
      await expect(card.locator('[data-clip-play]')).toBeVisible()
    }
    const filled = (card: typeof openping) =>
      card.locator('[data-clip-progress] span').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)
    // Skip to the clip's last moment, so it ends now rather than in many seconds.
    const nearEnd = (card: typeof openping) =>
      card.locator('[data-tour] video').evaluate((v: HTMLVideoElement) => {
        v.currentTime = Math.max(0, v.duration - 0.3)
      })
    const name = (title: string) => `Play the ${title} clip`
    // The first plays; the second rests (on a phone, each checked once it is on screen).
    if (!isMobile) await page.mouse.move(0, 0)
    else await openping.locator('[data-tour]').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await expect.poll(() => playing(openping)).toBe(true)
    // Its bar fills as it plays; the other's stays empty.
    await expect.poll(() => filled(openping)).toBeGreaterThan(0)
    expect(await filled(solara)).toBe(0)
    if (isMobile) await solara.locator('[data-tour]').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await resting(solara)
    await expect(solara.getByRole('button', { name: name('Solara') })).toBeVisible()
    if (!isMobile) {
      // When OpenPing's clip ends, Solara's plays; when that ends, OpenPing's again.
      await nearEnd(openping)
      await expect.poll(() => playing(solara), { timeout: 10_000 }).toBe(true)
      await resting(openping)
      await nearEnd(solara)
      await expect.poll(() => playing(openping), { timeout: 10_000 }).toBe(true)
      await resting(solara)
      // Pointing at Solara makes it the playing one, and it stays so when the pointer leaves.
      await solara.hover()
      await expect.poll(() => playing(solara)).toBe(true)
      await resting(openping)
      await page.mouse.move(0, 0)
      await page.waitForTimeout(500)
      expect(await playing(solara)).toBe(true)
      // Keyboard focus too: reaching its play button gives it the turn, and focus moves on
      // to its pause button, which takes the play button's place.
      await openping.getByRole('button', { name: name('OpenPing') }).focus()
      await expect(openping.getByRole('button', { name: 'Pause the OpenPing clip' })).toBeFocused()
      await expect.poll(() => playing(openping)).toBe(true)
      await resting(solara)
    } else {
      // A tap on the play button gives it the turn, and it keeps it.
      await solara.getByRole('button', { name: name('Solara') }).tap()
      await expect.poll(() => playing(solara)).toBe(true)
      await openping.locator('[data-tour]').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await resting(openping)
    }
  })
})

test("the row's stack and features moved to the build page", async ({ page }) => {
  for (const [title, tech, feature] of [
    ['Scribe', 'whisper.cpp', 'Works in any app: hold Ctrl + Win, talk, let go'],
    ['OpenPing', 'Hono', 'Schedule-aware: off-hours never count as downtime'],
    ['Solara', 'Firebase', 'Live UV forecasts on a dashboard and a week calendar'],
  ]) {
    await page.goto(`/builds/${SLUG[title]}`)
    const how = page.getByRole('region', { name: "How it's built" })
    for (const tab of await how.getByRole('tab').all()) {
      await tab.click()
      if (await how.getByRole('tabpanel').getByText(tech).count()) break
    }
    await expect(how.getByRole('tabpanel').getByText(tech).first()).toBeVisible()
    await expect(page.getByRole('region', { name: `What ${title} does` }).getByText(feature).filter({ visible: true })).toBeVisible()
  }
})

test.describe('the Lab rows on a 320px phone', () => {
  test.use({ viewport: { width: 320, height: 700 } })
  test('nothing spills sideways: the primary takes its own line, Full story and Star | GitHub the next', { tag: '@cross-browser' }, async ({ page }) => {
    // OpenPing's row: the primary on its own line, Full story and Star | GitHub sharing the next.
    const open = await rowOf(page, 'OpenPing')
    await open.scrollIntoViewIfNeeded()
    const [p, f, r] = await Promise.all(controls(open, 'OpenPing').map((el) => el.boundingBox()))
    expect(f!.y).toBeGreaterThan(p!.y + p!.height - 1)
    expect(Math.round(f!.y)).toBe(Math.round(r!.y))
    // Scribe's row (on /loadout), the one with the longest download caption: its two buttons
    // stack (ScribeActions), Star | GitHub under them.
    await page.addInitScript(asWindows)
    const row = await rowOf(page, 'Scribe')
    await row.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const [d, s, g] = await Promise.all(controls(row, 'Scribe').map((el) => el.boundingBox()))
    expect(s!.y).toBeGreaterThan(d!.y + d!.height - 1)
    expect(g!.y).toBeGreaterThan(s!.y + s!.height - 1)
    // The download caption stays inside the column.
    const caption = row.locator('#scribe-download-note')
    const box = (await caption.boundingBox())!
    expect(box.x + box.width).toBeLessThanOrEqual(320)
  })
})

/**
 * The Lab's intro (2026-11-08): just the flask chip and "The Lab". No "Check
 * out" eyebrow, subtitle, checked points or pill nav; the desktop rail lists
 * the parts.
 */
test('the Lab opens with just its flask and title', { tag: '@cross-browser' }, async ({ page }) => {
  await page.goto('/')
  const lab = page.locator('#lab')
  await expect(lab.getByRole('heading', { level: 2 })).toHaveText('The Lab')
  await expect(lab.getByRole('heading', { level: 2 }).locator('xpath=..').locator('.flask')).toBeVisible()
  await expect(lab.getByText('Check out', { exact: true })).toHaveCount(0)
  await expect(lab).not.toContainText("What I've built and still use")
  await expect(page.getByRole('navigation', { name: 'Lab sections' })).toHaveCount(0)
})
