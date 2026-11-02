import { test, expect } from '@playwright/test'

/**
 * /loadout's dev-tool parts (2026-11-01): the tools I built and use (Scribe's
 * row, then the CLIs, with the fork's credit and the Star | GitHub button),
 * then the tools I use (each credited to its maker), plus the header pills;
 * and the homepage's People I follow (moved from /loadout), The Pull Request
 * Post under it, and Tools I built and use in its Loadout.
 */

test.describe('Loadout tools and people', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('lists the tools I built and use, Scribe first, credits the pass-env fork and links each repo', async ({ page }) => {
    await page.goto('/loadout')
    const built = page.getByRole('region', { name: 'Tools I built and use' })
    await expect(built.getByRole('heading', { name: 'pass-env', exact: true })).toBeVisible()
    await expect(built.getByRole('article').getByRole('heading', { level: 3 })).toHaveText(['Scribe', 'pass-env', 'release-kit', 'devguard', 'pr-post'])
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

  test('every item in My dev setup carries its own mark, the same size and lined up, and Cursor is gone', async ({ page }) => {
    await page.goto('/loadout')
    const setup = page.getByRole('region', { name: 'My dev setup' })
    const chips = setup.locator('[data-setup-icon]')
    expect(await chips.count()).toBeGreaterThan(30)
    const marks = await chips.evaluateAll((icons) =>
      icons.map((icon) => {
        const name = icon.parentElement!.querySelector('[data-setup-name]')!
        const art = icon.querySelector('svg, img')
        const box = art?.getBoundingClientRect()
        const nameBox = name.getBoundingClientRect()
        return {
          name: name.textContent,
          art: art?.tagName.toLowerCase() ?? null,
          height: box ? Math.round(box.height) : 0,
          // Centred on the name's first line.
          offset: box ? Math.round(box.top + box.height / 2 - (nameBox.top + 10)) : 99,
          loaded: art instanceof HTMLImageElement ? art.complete && art.naturalWidth > 0 : true,
        }
      }),
    )
    for (const mark of marks) {
      expect(mark.art, `${mark.name}: a mark`).not.toBeNull()
      // AMD's wordmark is drawn wider (and so taller), the rest 16px.
      if (mark.name !== 'AMD Ryzen 7 9700X') expect(mark.height, `${mark.name}: 16px`).toBe(16)
      expect(Math.abs(mark.offset), `${mark.name}: centred on its line`).toBeLessThanOrEqual(1)
    }
    // The app icons are real files.
    await expect.poll(() => chips.locator('img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).naturalWidth > 0))).toBe(true)
    for (const src of ['/brands/windows-terminal.svg', '/brands/herdr.png', '/builds/scribe/app-icon.png']) {
      await expect(chips.locator(`img[src*="${src.split('/').pop()}"]`), src).toHaveCount(1)
    }
    // Editors: Neovim and VS Code, no Cursor (the owner's call, 2026-11-01).
    const editors = setup.locator('li').filter({ has: page.getByRole('heading', { name: 'Editors' }) })
    await expect(editors.locator('[data-setup-name]')).toHaveText(['Neovim', 'VS Code'])
    await expect(setup.getByText('Cursor', { exact: true })).toHaveCount(0)
  })

  test('lists the tools I use, each credited inline to its maker, each with its GitHub repo', async ({ page }) => {
    await page.goto('/loadout')
    const used = page.getByRole('region', { name: 'Tools I use' })
    // The honorable mentions joined Tools I use (2026-11-02), herdr first.
    const repos: Record<string, string> = {
      herdr: 'herdrdev/herdr',
      'no-mistakes': 'kunchenguid/no-mistakes',
      'chrome-devtools-axi': 'kunchenguid/chrome-devtools-axi',
      'gh-axi': 'kunchenguid/gh-axi',
      Lavish: 'kunchenguid/lavish-axi',
      firstmate: 'kunchenguid/firstmate',
      treehouse: 'kunchenguid/treehouse',
      ccusage: 'ccusage/ccusage',
    }
    await expect(used.locator('h3 > a:first-child')).toHaveText(Object.keys(repos).map((name) => `${name} (opens in a new tab)`))
    await expect(used.locator('#no-mistakes h3')).toContainText(', by Kun Chen')
    // Every card shows its repo as a visible GitHub button, opening in a new tab.
    for (const [name, repo] of Object.entries(repos)) {
      const link = used.getByRole('link', { name: `${name} on GitHub (opens in a new tab)`, exact: true })
      await expect(link).toBeVisible()
      await expect(link).toHaveText('GitHub')
      await expect(link).toHaveAttribute('href', `https://github.com/${repo}`)
      await expect(link).toHaveAttribute('target', '_blank')
    }
    // The buttons sit at each card's foot, level across a row.
    const feet = await used.locator(':scope > ul > li').evaluateAll((cards) =>
      cards.map((card) => Math.round(card.querySelector('[role="group"]')!.getBoundingClientRect().bottom - card.getBoundingClientRect().bottom)),
    )
    expect(new Set(feet).size, 'every button the same distance from its card foot').toBe(1)
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

  test('the old honorable mentions credit their makers in Tools I use, and gnhf stays out', async ({ page }) => {
    await page.goto('/loadout')
    await expect(page.getByRole('heading', { name: 'Honorable mentions' })).toHaveCount(0)
    const used = page.getByRole('region', { name: 'Tools I use' })
    await expect(used.locator('#herdr h3')).toContainText(', by Can Celik')
    // herdr's name goes to its site, which also has its own button; its repo is the GitHub one.
    await expect(used.getByRole('link', { name: 'herdr (opens in a new tab)', exact: true })).toHaveAttribute('href', 'https://herdr.dev')
    await expect(used.getByRole('link', { name: "herdr.dev (herdr's site, opens in a new tab)", exact: true })).toHaveAttribute('href', 'https://herdr.dev')
    await expect(used.getByRole('link', { name: 'Can Celik' })).toHaveAttribute('href', 'https://github.com/ogulcancelik')
    // herdr shows its own app icon (2026-11-01), self-hosted, not a generic glyph.
    const icon = used.locator('#herdr img[src*="herdr.png"]')
    await expect(icon).toBeVisible()
    // It's lazy: Firefox and WebKit only fetch it once it's near the screen, as a visitor scrolling would.
    await icon.scrollIntoViewIfNeeded()
    await expect.poll(() => icon.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    await expect(used.locator('#herdr > span svg')).toHaveCount(0)
    for (const id of ['firstmate', 'treehouse']) {
      await expect(used.locator(`#${id} h3`)).toContainText(', by Kun Chen')
      await expect(used.locator(`#${id}`).getByRole('link', { name: 'Kun Chen' })).toHaveAttribute('href', '/#kun-chen')
    }
    await expect(used.locator('#ccusage h3')).toContainText(', by ryoppippi')
    await expect(used.getByText('gnhf')).toHaveCount(0)
  })

  test('old #honorable-mentions links land on Tools I use', async ({ page }) => {
    await page.goto('/loadout#honorable-mentions')
    await expect(page.getByRole('heading', { name: 'Tools I use', level: 2 })).toBeInViewport()
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
    await expect(pills).toHaveText(['Dev setup', 'How I work', 'Tools I built and use', 'Tools I use', 'Inside my apps', 'The gear'])
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

  test('/loadout puts Tools I built and use before Tools I use, and People I follow is no longer there', async ({ page }) => {
    await page.goto('/loadout')
    const order = await page.locator('main h2').allTextContents()
    expect(order.indexOf('Tools I built and use')).toBeGreaterThan(-1)
    expect(order.indexOf('Tools I built and use')).toBeLessThan(order.indexOf('Tools I use'))
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

  test('the homepage has Tools I built and use inside its Loadout, every tool with Scribe first', async ({ page }) => {
    await page.goto('/')
    const built = page.getByRole('region', { name: 'Tools I built and use' })
    // Every tool, pr-post too: The Pull Request Post's card is a section above now.
    await expect(built.getByRole('article').getByRole('heading', { level: 3 })).toHaveText(['Scribe', 'pass-env', 'release-kit', 'devguard', 'pr-post'])
    await expect(built.locator('[data-credit]')).toContainText('Created by Phaedrus Raznikov at Misty Step')
    // A part of the Loadout (#loadout): after the default stack, before the setup teaser that closes it.
    const loadout = page.locator('#loadout')
    await expect(loadout.locator('#tools-i-built')).toHaveCount(1)
    const [stack, tools, teaser] = await Promise.all(
      [loadout.getByRole('heading', { name: 'The Turso Stack' }), built, loadout.locator('[data-setup-teaser]')].map((el) => el.boundingBox()),
    )
    expect(tools!.y).toBeGreaterThan(stack!.y)
    expect(teaser!.y).toBeGreaterThan(tools!.y + tools!.height - 1)
    // Scribe's row sits in the Loadout's column, without the Lab's full-bleed wash.
    await expect(built.locator('.lab-row-wash')).toHaveCount(0)
    // After People I follow, and linked from the footer's sitemap with it.
    const people = (await page.locator('#people').boundingBox())!
    expect((await built.boundingBox())!.y).toBeGreaterThan(people.y)
    const sitemap = page.getByRole('navigation', { name: 'Sitemap' })
    await expect(sitemap.getByRole('link', { name: 'Tools I built and use' })).toHaveAttribute('href', '/#tools-i-built')
    await expect(sitemap.getByRole('link', { name: 'People I follow' })).toHaveAttribute('href', '/#people')
  })
})
