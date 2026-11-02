import { test, expect } from '@playwright/test'

/**
 * /loadout's dev-tool parts (2026-11-01): the tools I built (with the fork's
 * credit and the Star | GitHub button), then the tools I use (each credited
 * to its maker), plus the header pills; and the homepage's People I follow
 * (moved from /loadout), The Pull Request Post under it, and Tools I built.
 */

test.describe('Loadout tools and people', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('lists the tools I built, credits the pass-env fork and links each repo', async ({ page }) => {
    await page.goto('/loadout')
    const built = page.getByRole('region', { name: 'Tools I built' })
    await expect(built.getByRole('heading', { name: 'pass-env', exact: true })).toBeVisible()
    await expect(built.getByRole('article').getByRole('heading', { level: 3 })).toHaveText(['pass-env', 'release-kit', 'devguard', 'pr-post'])
    await expect(built.getByText('Your AI coding agents use your API keys without ever seeing them.')).toBeVisible()
    await expect(built.locator('[data-credit]')).toHaveText(
      'Created by Phaedrus Raznikov at Misty Step; my fork adds import, generate, doctor and more.',
    )
    await expect(built.getByRole('link', { name: 'Phaedrus Raznikov' })).toHaveAttribute('href', 'https://github.com/moomooskycow')
    await expect(built.getByRole('link', { name: 'Misty Step' })).toHaveAttribute('href', 'https://github.com/misty-step')
    for (const repo of ['pass-env', 'release-kit', 'devguard', 'pr-post']) {
      const link = built.getByRole('link', { name: `${repo} on GitHub (opens in a new tab)`, exact: true })
      await expect(link).toHaveAttribute('href', `https://github.com/n8watkins/${repo}`)
      await expect(link).toHaveAttribute('target', '_blank')
    }
    // pr-post links its live demo too; the others have none.
    await expect(built.getByRole('link', { name: /^Live demo/ })).toHaveCount(1)
    await expect(built.getByRole('link', { name: 'Live demo of pr-post (opens in a new tab)' })).toHaveAttribute(
      'href',
      'https://n8watkins.github.io/pr-post/',
    )
  })

  test('lists the tools I use, each credited inline to its maker', async ({ page }) => {
    await page.goto('/loadout')
    const used = page.getByRole('region', { name: 'Tools I use' })
    for (const tool of ['no-mistakes', 'chrome-devtools-axi', 'gh-axi', 'Lavish']) {
      await expect(used.getByRole('heading', { name: new RegExp(`^${tool}`) })).toBeVisible()
    }
    await expect(used.locator('h3').first()).toContainText(', by Kun Chen')
    await expect(used.getByRole('link', { name: 'no-mistakes on GitHub (opens in a new tab)' })).toHaveAttribute(
      'href',
      'https://github.com/kunchenguid/no-mistakes',
    )
    // "by Kun Chen" goes to his card in People I follow, on the homepage.
    await used.getByRole('link', { name: 'Kun Chen' }).first().click()
    await expect(page).toHaveURL(/\/#kun-chen$/)
    await expect(page.locator('#kun-chen')).toBeInViewport()
  })

  test('the homepage follows Kun Chen, Phaedrus and Nate Herk, in that order, with their own links', async ({ page }) => {
    await page.goto('/')
    const creators = page.getByRole('region', { name: 'People I follow' })
    // The person cards (The Pull Request Post's card follows them).
    await expect(creators.getByRole('listitem').getByRole('article').getByRole('heading', { level: 3 })).toHaveText([
      'Kun Chen',
      'Phaedrus Raznikov',
      'Nate Herk',
    ])
    await expect(creators.getByText('Former L8 principal engineer at Meta, Microsoft and Atlassian.')).toBeVisible()
    const links: Record<string, Record<string, string>> = {
      'Kun Chen': {
        YouTube: 'https://www.youtube.com/channel/UCb69t9ZkE5z1KvCmfJoaifA',
        X: 'https://x.com/kunchenguid',
        Substack: 'https://kunchenguid.substack.com',
        GitHub: 'https://github.com/kunchenguid',
      },
      'Nate Herk': {
        YouTube: 'https://www.youtube.com/@nateherk',
        X: 'https://x.com/nateherk',
        'nateherk.com': 'https://nateherk.com',
        'AI Automation Society': 'https://www.skool.com/ai-automation-society/about',
      },
      'Phaedrus Raznikov': {
        X: 'https://x.com/moomooskycow',
        GitHub: 'https://github.com/moomooskycow',
        'Misty Step': 'https://www.mistystep.io/',
      },
    }
    // Static cards for now: no activity until the pr-post feed is wired in.
    await expect(creators.getByText('Recently shipped')).toHaveCount(0)
    for (const [name, byLabel] of Object.entries(links)) {
      const list = creators.getByRole('list', { name: `${name} online` })
      // Exactly these links (Nate Herk has no public GitHub, so none is shown).
      await expect(list.getByRole('link')).toHaveCount(Object.keys(byLabel).length)
      for (const [label, href] of Object.entries(byLabel)) {
        const link = list.getByRole('link', { name: `${label} (${name}, opens in a new tab)`, exact: true })
        await expect(link).toHaveAttribute('href', href)
      }
    }
  })

  test('shows each person\'s self-hosted avatar, with the initials behind it as a fallback', async ({ page }) => {
    await page.goto('/')
    const people = page.getByRole('region', { name: 'People I follow' })
    for (const name of ['Kun Chen', 'Phaedrus Raznikov', 'Nate Herk']) {
      const img = people.getByRole('img', { name, exact: true })
      await img.scrollIntoViewIfNeeded()
      await expect(img).toBeVisible()
      await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
      // Served from this site (next/image), never another host.
      expect(new URL(await img.evaluate((el) => (el as HTMLImageElement).currentSrc)).origin).toBe(new URL(page.url()).origin)
    }
  })

  test('falls back to the initials when an avatar fails to load', async ({ page }) => {
    await page.route(/people%2Fkun-chen\.webp|people\/kun-chen\.webp/, (route) => route.fulfill({ status: 404, body: '' }))
    await page.goto('/')
    const card = page.locator('#kun-chen')
    await card.scrollIntoViewIfNeeded()
    const img = card.getByRole('img', { name: 'Kun Chen' })
    await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth === 0)).toBe(true)
    await expect(card.getByText('KC', { exact: true })).toBeVisible()
    // The broken image's alt text doesn't paint over the initials.
    expect(await img.evaluate((el) => getComputedStyle(el).color)).toBe('rgba(0, 0, 0, 0)')
  })

  test('My dev setup groups the machine, WSL, terminal and the rest, linking what has a card here', async ({ page }) => {
    await page.goto('/loadout')
    const setup = page.getByRole('region', { name: 'My dev setup' })
    await expect(setup.getByRole('heading', { level: 3 })).toHaveText([
      'Machine',
      'WSL2',
      'Terminal',
      'Editors',
      'Agents',
      'Agent tooling',
      'Runtimes',
      'My own tools, in daily use',
      'Shipping',
    ])
    await expect(setup.locator('pre')).toHaveText(
      '[wsl2]\nnetworkingMode=mirrored\nmemory=20GB\nprocessors=8\nswap=16GB\n\n[experimental]\nautoMemoryReclaim=dropcache\nsparseVhd=true',
    )
    // Agent tooling points at the Tools I use cards instead of repeating them.
    for (const [name, id] of [['no-mistakes', 'no-mistakes'], ['gh-axi', 'gh-axi'], ['chrome-devtools-axi', 'chrome-devtools-axi'], ['Lavish', 'lavish']]) {
      await expect(setup.getByRole('link', { name, exact: true })).toHaveAttribute('href', `#${id}`)
      await expect(page.locator(`#tools-i-use #${id}`)).toHaveCount(1)
    }
    await expect(setup.getByRole('link', { name: /^Scribe/ })).toHaveAttribute('href', '/builds/scribe')
    await expect(setup.getByRole('link', { name: /^herdr/ })).toHaveAttribute('href', '#herdr')
    // T-Hub has no public page and N8 Tray is private: neither is a link.
    for (const name of ['T-Hub', 'N8 Tray']) {
      await expect(setup.getByText(name, { exact: true })).toBeVisible()
      await expect(setup.getByRole('link', { name: new RegExp(`^${name}`) })).toHaveCount(0)
    }
  })

  test('Honorable mentions credits each maker, and leaves gnhf out', async ({ page }) => {
    await page.goto('/loadout')
    const mentions = page.getByRole('region', { name: 'Honorable mentions' })
    await expect(mentions.locator('h3')).toHaveCount(4)
    await expect(mentions.locator('#herdr h3')).toContainText(', by Can Celik')
    await expect(mentions.getByRole('link', { name: 'herdr (opens in a new tab)', exact: true })).toHaveAttribute('href', 'https://herdr.dev')
    await expect(mentions.getByRole('link', { name: 'Can Celik' })).toHaveAttribute('href', 'https://github.com/ogulcancelik')
    // herdr shows its own app icon (2026-11-01), self-hosted, not a generic glyph.
    const icon = mentions.locator('#herdr img[src*="herdr.png"]')
    await expect(icon).toBeVisible()
    // It's lazy: Firefox and WebKit only fetch it once it's near the screen, as a visitor scrolling would.
    await icon.scrollIntoViewIfNeeded()
    await expect.poll(() => icon.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    await expect(mentions.locator('#herdr svg')).toHaveCount(0)
    for (const id of ['firstmate', 'treehouse']) {
      await expect(mentions.locator(`#${id} h3`)).toContainText(', by Kun Chen')
      await expect(mentions.locator(`#${id}`).getByRole('link', { name: 'Kun Chen' })).toHaveAttribute('href', '/#kun-chen')
    }
    await expect(mentions.locator('#ccusage h3')).toContainText(', by ryoppippi')
    await expect(mentions.getByText('gnhf')).toHaveCount(0)
  })

  test('Kun Chen\'s card links his how-he-works video for his setup', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('#kun-chen')
    await expect(card).not.toContainText('nix-darwin')
    await expect(card).toContainText('for more on his setup.')
    await expect(card.getByRole('link', { name: 'Check out how he works (a video, opens in a new tab)' })).toHaveAttribute('href', 'https://youtu.be/iQyg-KypKAA')
  })

  test('Phaedrus\'s card describes the software factory he is building', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('#phaedrus')
    await expect(card).toContainText('software factory')
    await expect(card).toContainText('mistystack')
    await expect(card).toContainText('he created pass-env')
  })

  test('the homepage teases my setup and links to it', async ({ page }) => {
    await page.goto('/')
    const teaser = page.locator('[data-setup-teaser]')
    await expect(teaser).toContainText('Windows 11 + WSL2 · Claude Code + Codex · herdr + T-Hub')
    await teaser.getByRole('link', { name: 'See my dev setup' }).click()
    await expect(page).toHaveURL(/\/loadout#dev-setup$/)
    await expect(page.getByRole('heading', { name: 'My dev setup' })).toBeVisible()
  })

  test('the header pills jump to every part of the page', async ({ page }) => {
    await page.goto('/loadout')
    const pills = page.getByRole('navigation', { name: 'Loadout sections' }).getByRole('link')
    await expect(pills).toHaveText(['Dev setup', 'How I work', 'Tools I built', 'Tools I use', 'Honorable mentions', 'Inside my apps', 'The gear'])
    for (const href of await pills.evaluateAll((els) => els.map((el) => el.getAttribute('href')))) {
      await expect(page.locator(href!)).toHaveCount(1)
    }
  })

  test('the gear section (once "The setup") keeps its old #setup anchor working', async ({ page }) => {
    await page.goto('/loadout#setup')
    const gear = page.getByRole('region', { name: 'The gear' })
    await expect(gear.getByRole('heading', { name: 'The gear', level: 2 })).toBeInViewport()
    await expect(page.getByRole('heading', { name: 'The setup' })).toHaveCount(0)
  })

  test('fits a 320px phone without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    for (const [path, part] of [['/loadout', '#tools-i-built'], ['/', '#pr-post-edition']]) {
      await page.goto(path)
      await page.locator(part).scrollIntoViewIfNeeded()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, path).toBeLessThanOrEqual(0)
    }
  })

  test('/loadout puts Tools I built before Tools I use, and People I follow is no longer there', async ({ page }) => {
    await page.goto('/loadout')
    const order = await page.locator('main h2').allTextContents()
    expect(order.indexOf('Tools I built')).toBeGreaterThan(-1)
    expect(order.indexOf('Tools I built')).toBeLessThan(order.indexOf('Tools I use'))
    await expect(page.getByRole('region', { name: 'People I follow' })).toHaveCount(0)
    await expect(page.locator('#people, #kun-chen')).toHaveCount(0)
  })

  test('under People I follow, the homepage has The Pull Request Post, with its live demo and repo', async ({ page }) => {
    await page.goto('/')
    const people = page.getByRole('region', { name: 'People I follow' })
    const card = people.getByRole('article', { name: 'The Pull Request Post' })
    await card.scrollIntoViewIfNeeded()
    // Right under the person cards.
    const lastPerson = (await people.locator('#nate-herk').boundingBox())!
    const box = (await card.boundingBox())!
    expect(box.y).toBeGreaterThan(lastPerson.y + lastPerson.height)
    await expect(card).toContainText('The public GitHub activity of the developers I follow, printed as a newspaper.')
    await expect(card.getByRole('link', { name: 'Live demo of The Pull Request Post (opens in a new tab)' })).toHaveAttribute(
      'href',
      'https://n8watkins.github.io/pr-post/',
    )
    await expect(card.getByRole('link', { name: 'pr-post on GitHub (opens in a new tab)', exact: true })).toHaveAttribute(
      'href',
      'https://github.com/n8watkins/pr-post',
    )
    // The front page beside it links the demo too, out of the tab order.
    const shot = card.locator('a[aria-hidden="true"][tabindex="-1"]')
    await expect(shot).toHaveAttribute('href', 'https://n8watkins.github.io/pr-post/')
    await expect.poll(() => shot.locator('img').evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  })

  test('the homepage shows Tools I built too, leaving pr-post to The Pull Request Post above it', async ({ page }) => {
    await page.goto('/')
    const built = page.getByRole('region', { name: 'Tools I built' })
    await expect(built.getByRole('article').getByRole('heading', { level: 3 })).toHaveText(['pass-env', 'release-kit', 'devguard'])
    await expect(built.locator('[data-credit]')).toContainText('Created by Phaedrus Raznikov at Misty Step')
    // After People I follow, and linked from the footer's sitemap with it.
    const people = (await page.locator('#people').boundingBox())!
    expect((await built.boundingBox())!.y).toBeGreaterThan(people.y)
    const sitemap = page.getByRole('navigation', { name: 'Sitemap' })
    await expect(sitemap.getByRole('link', { name: 'Tools I built' })).toHaveAttribute('href', '/#tools-i-built')
    await expect(sitemap.getByRole('link', { name: 'People I follow' })).toHaveAttribute('href', '/#people')
  })
})
