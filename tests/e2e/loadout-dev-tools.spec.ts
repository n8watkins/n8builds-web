import { test, expect } from '@playwright/test'

/**
 * /loadout's dev-tool parts (2026-11-01): the tools I use (each credited to
 * its maker), the people I follow, and the tools I built (with the fork's
 * credit and the Star | GitHub button), plus the header pills.
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
    // "by Kun Chen" jumps to his card further down.
    await used.getByRole('link', { name: 'Kun Chen' }).first().click()
    await expect(page).toHaveURL(/#kun-chen$/)
    await expect(page.locator('#kun-chen')).toBeInViewport()
  })

  test('follows Kun Chen, Phaedrus and Nate Herk, in that order, with their own links', async ({ page }) => {
    await page.goto('/loadout')
    const creators = page.getByRole('region', { name: 'People I follow' })
    await expect(creators.getByRole('article').getByRole('heading')).toHaveText(['Kun Chen', 'Phaedrus Raznikov', 'Nate Herk'])
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
    const note = creators.locator('[data-pr-post]')
    await expect(note).toHaveText(
      'These cards will update themselves from pr-post, my open-source tool for following what builders ship (see the live demo).',
    )
    await expect(note.getByRole('link', { name: 'pr-post' })).toHaveAttribute('href', 'https://github.com/n8watkins/pr-post')
    await expect(note.getByRole('link', { name: 'live demo' })).toHaveAttribute('href', 'https://n8watkins.github.io/pr-post/')
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
    await page.goto('/loadout')
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
    await page.goto('/loadout')
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
    for (const id of ['firstmate', 'treehouse']) {
      await expect(mentions.locator(`#${id} h3`)).toContainText(', by Kun Chen')
      await expect(mentions.locator(`#${id}`).getByRole('link', { name: 'Kun Chen' })).toHaveAttribute('href', '#kun-chen')
    }
    await expect(mentions.locator('#ccusage h3')).toContainText(', by ryoppippi')
    await expect(mentions.getByText('gnhf')).toHaveCount(0)
  })

  test('Kun Chen\'s card says how he works and links the video', async ({ page }) => {
    await page.goto('/loadout')
    const card = page.locator('#kun-chen')
    await expect(card.getByText(/Runs macOS with nix-darwin, WezTerm, Neovim/)).toBeVisible()
    await expect(card.getByRole('link', { name: 'How he works (a video, opens in a new tab)' })).toHaveAttribute('href', 'https://youtu.be/iQyg-KypKAA')
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
    await expect(pills).toHaveText(['Dev setup', 'How I work', 'Tools I use', 'Honorable mentions', 'People I follow', 'Tools I built', 'Inside my apps', 'The setup'])
    for (const href of await pills.evaluateAll((els) => els.map((el) => el.getAttribute('href')))) {
      await expect(page.locator(href!)).toHaveCount(1)
    }
  })

  test('fits a 320px phone without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/loadout')
    await page.locator('#people').scrollIntoViewIfNeeded()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
