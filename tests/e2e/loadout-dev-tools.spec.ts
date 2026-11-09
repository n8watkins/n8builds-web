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
    await expect(built.getByRole('heading', { name: /^pass-env\b/ })).toBeVisible()
    // Scribe's row (h3), then the cards (h4, under their groups' h3 subheadings).
    await expect(built.getByRole('article').getByRole('heading', { level: 3 })).toHaveText(['Scribe'])
    // No pr-post (round 5 of 2026-11-02): The Pull Request Post's card on the homepage is its one place.
    await expect(built.getByRole('article').getByRole('heading', { level: 4 })).toHaveText([/^pass-env/, /^release-kit/, /^devguard/])
    await expect(built.getByRole('heading', { name: 'Other things I built' })).toHaveCount(0)
    await expect(built.getByText('Your AI coding agents use your API keys without ever seeing them.')).toBeVisible()
    await expect(built.locator('[data-credit]')).toHaveText(
      // Each name links out, and says so to screen readers.
      'Created by Phaedrus Raznikov (opens in a new tab) at Misty Step (opens in a new tab); my fork adds import, generate, doctor and more.',
    )
    await expect(built.getByRole('link', { name: 'Phaedrus Raznikov' })).toHaveAttribute('href', 'https://github.com/moomooskycow')
    await expect(built.getByRole('link', { name: 'Misty Step' })).toHaveAttribute('href', 'https://github.com/misty-step')
    for (const repo of ['pass-env', 'release-kit', 'devguard']) {
      const link = built.getByRole('link', { name: `${repo} on GitHub (opens in a new tab)`, exact: true })
      await expect(link).toHaveAttribute('href', `https://github.com/n8watkins/${repo}`)
      await expect(link).toHaveAttribute('target', '_blank')
    }
    await expect(built.getByRole('link', { name: /^Live demo/ })).toHaveCount(0)
    await expect(built).not.toContainText('pr-post')
  })

  test('every item in My dev setup carries its own mark, the same size and lined up, and Cursor is gone', { tag: '@cross-browser' }, async ({ page }) => {
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
    // The app icons are real files. They load lazily, and a phone's WebKit
    // fetches one only near the screen, so bring each into view first.
    for (const img of await chips.locator('img').all()) await img.scrollIntoViewIfNeeded()
    await expect.poll(() => chips.locator('img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).naturalWidth > 0))).toBe(true)
    for (const src of ['/brands/windows-terminal.svg', '/brands/herdr.png', '/builds/scribe/app-icon.png']) {
      await expect(chips.locator(`img[src*="${src.split('/').pop()}"]`), src).toHaveCount(1)
    }
    // Editors: Neovim and VS Code, no Cursor (the owner's call, 2026-11-01).
    await expect(setup.locator('#setup-editors-title + ul [data-setup-name]')).toHaveText(['Neovim', 'VS Code'])
    await expect(setup.getByText('Cursor', { exact: true })).toHaveCount(0)
  })

  for (const { width, perRow } of [
    { width: 1440, perRow: 3 },
    { width: 1024, perRow: 2 },
    { width: 820, perRow: 2 },
  ]) {
    test(`at ${width}px My dev setup's bento fills every row, its tiles filled (${perRow} to a row)`, { tag: width === 1440 || width === 820 ? '@cross-browser' : [] }, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/loadout')
      const grid = page.locator('#setup-tiles')
      const tiles = await grid.locator(':scope > li').evaluateAll((els) =>
        els.map((el) => {
          const box = el.getBoundingClientRect()
          const chips = [...el.querySelectorAll('.setup-chip, pre')].map((c) => c.getBoundingClientRect().bottom)
          // How much of the tile its content fills, down to the padding (20px) under the last chip.
          return { top: Math.round(box.top), left: Math.round(box.left), right: Math.round(box.right), height: box.height, fill: (Math.max(...chips) + 20 - box.top) / box.height }
        }),
      )
      const gridBox = (await grid.boundingBox())!
      // Machine and WSL2 share the first tile, across the full width.
      expect(tiles[0].right - tiles[0].left).toBeCloseTo(gridBox.width, 0)
      const rows = new Map<number, typeof tiles>()
      for (const tile of tiles.slice(1)) rows.set(tile.top, [...(rows.get(tile.top) ?? []), tile])
      for (const row of rows.values()) {
        expect(row.length, 'tiles in the row').toBe(perRow)
        // The row reaches the grid's right edge, and its tiles are the same height.
        expect(Math.max(...row.map((t) => t.right))).toBeCloseTo(gridBox.x + gridBox.width, 0)
        expect(new Set(row.map((t) => Math.round(t.height))).size).toBe(1)
      }
      for (const [i, tile] of tiles.entries()) expect(tile.fill, `tile ${i} is mostly filled`).toBeGreaterThan(0.6)
    })
  }

  test('lists the tools I use, each credited inline to its maker, each with its GitHub repo', { tag: '@cross-browser' }, async ({ page }) => {
    await page.goto('/loadout')
    const used = page.getByRole('region', { name: 'Tools I use' })
    // The honorable mentions joined Tools I use (2026-11-02), herdr first.
    const repos: Record<string, string> = {
      herdr: 'herdrdev/herdr',
      'no-mistakes': 'kunchenguid/no-mistakes',
      'chrome-devtools-axi': 'kunchenguid/chrome-devtools-axi',
      'gh-axi': 'kunchenguid/gh-axi',
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
      // Its visible label (the rest of its name is for screen readers).
      expect(await link.evaluate((a) => [...a.querySelectorAll('span')].filter((el) => !el.closest('.sr-only')).map((el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('')).join(''))).toBe('GitHub')
      await expect(link).toHaveAttribute('href', `https://github.com/${repo}`)
      await expect(link).toHaveAttribute('target', '_blank')
    }
    // The buttons sit at each card's foot, level across a row.
    // Measured on the buttons' row (Star | GitHub, and herdr's herdr.dev,
    // which wraps under them on a phone), within a pixel: a phone's fractional
    // layout rounds a card's edge either way.
    const feet = await used.locator(':scope > ul > li').evaluateAll((cards) =>
      cards.map((card) => card.querySelector('[role="group"]')!.parentElement!.getBoundingClientRect().bottom - card.getBoundingClientRect().bottom),
    )
    expect(Math.max(...feet) - Math.min(...feet), 'every button the same distance from its card foot').toBeLessThanOrEqual(1)
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

  for (const width of [1440, 1024, 390, 320]) {
    test(`at ${width}px each person's links sit in two columns, two rows at most, inside the card`, { tag: width === 1440 || width === 320 ? '@cross-browser' : [] }, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      for (const name of ['Kun Chen', 'Phaedrus Raznikov', 'Nate Herk']) {
        const list = page.getByRole('list', { name: `${name} online` })
        await list.scrollIntoViewIfNeeded()
        const boxes = await list.getByRole('link').evaluateAll((links) =>
          links.map((a) => {
            const r = a.getBoundingClientRect()
            return { x: Math.round(r.x), top: Math.round(r.top), height: r.height, fits: a.scrollWidth <= a.clientWidth }
          })
        )
        expect(new Set(boxes.map((b) => b.top)).size, name).toBeLessThanOrEqual(2)
        expect(new Set(boxes.map((b) => b.x)).size, name).toBeLessThanOrEqual(2)
        // The buttons in a row are as tall as each other, and nothing spills out of one.
        for (const top of new Set(boxes.map((b) => b.top))) {
          const row = boxes.filter((b) => b.top === top)
          expect(Math.max(...row.map((b) => b.height)) - Math.min(...row.map((b) => b.height)), name).toBeLessThan(1)
        }
        expect(boxes.every((b) => b.fits), name).toBe(true)
        const card = (await page.locator('article', { has: list }).boundingBox())!
        const ul = (await list.boundingBox())!
        expect(ul.x + ul.width).toBeLessThanOrEqual(card.x + card.width)
      }
    })
  }

  test('shows each person\'s self-hosted avatar, with the initials behind it as a fallback', { tag: '@cross-browser' }, async ({ page }) => {
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

  test('falls back to the initials when an avatar fails to load', { tag: '@cross-browser' }, async ({ page }) => {
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
      'Workspace',
      'My own tools, in daily use',
      'Editors',
      'Agents',
      'Agent tooling',
      'Runtimes',
      'Shipping',
    ])
    await expect(setup.locator('pre')).toHaveText(
      '[wsl2]\nnetworkingMode=mirrored\nmemory=20GB\nprocessors=8\nswap=16GB\n\n[experimental]\nautoMemoryReclaim=dropcache\nsparseVhd=true',
    )
    // Agent tooling points at the Tools I use cards instead of repeating them.
    for (const [name, id] of [['no-mistakes', 'no-mistakes'], ['gh-axi', 'gh-axi'], ['chrome-devtools-axi', 'chrome-devtools-axi']]) {
      await expect(setup.getByRole('link', { name, exact: true })).toHaveAttribute('href', `#${id}`)
      await expect(page.locator(`#tools-i-use #${id}`)).toHaveCount(1)
    }
    // The Sentry CLI is a setup chip (round 5 of 2026-11-02), linking its repo, not a Tools I use card.
    const sentry = setup.getByRole('link', { name: /^Sentry CLI/ })
    await expect(sentry).toHaveAttribute('href', 'https://github.com/getsentry/cli')
    await expect(sentry).toHaveAttribute('target', '_blank')
    await expect(page.locator('#tools-i-use')).not.toContainText('Sentry')
    await expect(page.locator('#dev-setup')).not.toContainText('gnhf')
    await expect(setup.getByRole('link', { name: /^Scribe/ })).toHaveAttribute('href', '/builds/scribe')
    await expect(setup.getByRole('link', { name: /^herdr/ })).toHaveAttribute('href', '#herdr')
    // N8 Tray is private: not a link. T-Hub is gone (owner, round 8 of 2026-11-09: no longer used).
    await expect(setup.getByText('N8 Tray', { exact: true })).toBeVisible()
    await expect(setup.getByRole('link', { name: /^N8 Tray/ })).toHaveCount(0)
    await expect(page.locator('main')).not.toContainText('T-Hub')
  })

  test('the old honorable mentions credit their makers in Tools I use, and gnhf stays out', { tag: '@cross-browser' }, async ({ page }) => {
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

  test('old #honorable-mentions links land on Tools I use', { tag: '@cross-browser' }, async ({ page }) => {
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

  for (const width of [1280, 390]) {
    test(`every People I follow card has the same shape: a short note and a second line, 4 or 5 lines in all (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/#people')
      const lines = await page.locator('#people li > article').evaluateAll((cards) =>
        cards.map((card) => {
          const count = (el: Element | null) => (el ? Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)) : 0)
          return {
            id: card.id,
            note: count(card.querySelector('[data-person-note]')),
            more: count(card.querySelector('[data-person-more]')),
          }
        }),
      )
      expect(lines).toHaveLength(3)
      for (const card of lines) {
        expect(card.note, card.id).toBeLessThanOrEqual(3)
        expect(card.more, card.id).toBeGreaterThanOrEqual(1)
        expect(card.note + card.more, card.id).toBeLessThanOrEqual(width < 640 ? 5 : 4)
      }
      const totals = lines.map((c) => c.note + c.more)
      expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(1)
    })
  }

  test('Phaedrus\'s card describes the software factory he is building', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('#phaedrus')
    await expect(card).toContainText('software factory')
    await expect(card).toContainText('mistystack')
    await expect(card).toContainText('he created pass-env')
  })

  test('the homepage shows my setup at a glance, with marks, and links to it and to Kun Chen\'s setup video', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/')
    const setup = page.getByRole('group', { name: 'My dev setup' })
    await expect(setup.getByRole('list', { name: 'My dev setup at a glance' }).getByRole('listitem')).toHaveText([
      'Windows 11',
      'WSL2 Ubuntu',
      'Windows Terminal',
      'zsh',
      'tmux',
      'herdr',
      'Neovim',
      'VS Code',
      'Claude Code',
      'Codex',
    ])
    // Every piece carries its mark.
    await expect(setup.locator('li :is(svg, img)')).toHaveCount(10)
    await expect(setup.getByRole('link', { name: /^Watch Kun Chen build his from scratch/ })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=5N-okeDdIuI',
    )
    await setup.getByRole('link', { name: 'See my dev setup' }).click()
    await expect(page).toHaveURL(/\/loadout#dev-setup$/)
    await expect(page.getByRole('heading', { name: 'My dev setup' })).toBeVisible()
  })

  test('/loadout recommends Kun Chen\'s dev environment video under the setup', async ({ page }) => {
    await page.goto('/loadout')
    const video = page.locator('#dev-setup [data-setup-video]')
    await expect(video).toHaveAttribute('href', 'https://www.youtube.com/watch?v=5N-okeDdIuI')
    await expect(video).toHaveAttribute('target', '_blank')
    await expect(video).toContainText('Watch Kun Chen build his agentic dev environment from scratch')
    await video.locator('img').scrollIntoViewIfNeeded()
    await expect.poll(() => video.locator('img').evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  })

  test('the header pills jump to every part of the page', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/loadout')
    const pills = page.getByRole('navigation', { name: 'Loadout sections' }).getByRole('link')
    await expect(pills).toHaveText(['Dev setup', 'How I work', 'Inside my apps', 'Stacks I build with', 'Tools I built and use', 'Tools I use', 'The gear'])
    const hrefs = await pills.evaluateAll((els) => els.map((el) => el.getAttribute('href')!))
    for (const href of hrefs) await expect(page.locator(href)).toHaveCount(1)
    // In page order: Inside the apps I build right after How I work with AI (2026-11-02).
    const tops = await Promise.all(hrefs.map((href) => page.locator(href).evaluate((el) => el.getBoundingClientRect().top)))
    expect([...tops].sort((a, b) => a - b)).toEqual(tops)
  })

  test('each part is its own band, headed by the icon its pill and the rail show', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/loadout')
    const parts = page.locator('[data-loadout-part]')
    const ids = await parts.evaluateAll((els) => els.map((el) => el.id))
    const pills = page.getByRole('navigation', { name: 'Loadout sections' }).getByRole('link')
    expect(ids.map((id) => `#${id}`)).toEqual(await pills.evaluateAll((els) => els.map((el) => el.getAttribute('href'))))
    // The same glyph in the pill, the part's heading and the rail (in the page, though the rail waits to show).
    for (const id of ids) {
      const marks = await page.evaluate((id) => {
        const glyph = (selector: string) => document.querySelector(selector)?.querySelector('svg :is(path, rect, circle)')?.outerHTML ?? null
        return {
          pill: glyph(`nav[aria-label="Loadout sections"] a[href="#${id}"]`),
          head: glyph(`#${id} [data-part-icon]`),
          rail: glyph(`nav[aria-label="Loadout contents"] a[href="#${id}"]`),
        }
      }, id)
      expect(marks.head, id).not.toBeNull()
      expect(marks.pill, id).toBe(marks.head)
      expect(marks.rail, id).toBe(marks.head)
    }
    // Round 3 of 2026-11-02: a rule in the part's colour that fades at both ends opens every part
    // (no hairline across the page), a wash in its colour, every other part on the raised tone
    // (easing in and out), and a chapter number behind its heading.
    const looks = await parts.evaluateAll((els) =>
      els.map((el, i) => {
        const cs = getComputedStyle(el)
        const rule = el.querySelector('[data-part-rule]')!
        const rs = getComputedStyle(rule)
        return {
          line: cs.borderTopWidth,
          wash: cs.backgroundImage.includes('gradient'),
          tone: getComputedStyle(el, '::before').backgroundImage,
          accent: cs.getPropertyValue('--lo'),
          rule: { height: rule.getBoundingClientRect().height, fades: /transparent|rgba\(0, 0, 0, 0\)/.test(rs.backgroundImage), top: Math.round(rule.getBoundingClientRect().top - el.getBoundingClientRect().top) },
          number: el.querySelector('[data-part-number]')?.textContent,
          i,
        }
      }),
    )
    for (const look of looks) {
      expect(look.line).toBe('0px')
      expect(look.wash).toBe(true)
      expect(look.rule).toEqual({ height: 1, fades: true, top: 0 })
      expect(look.number).toBe(String(look.i + 1).padStart(2, '0'))
    }
    for (let i = 1; i < looks.length; i++) {
      expect(looks[i].tone, `part ${i} vs ${i - 1}`).not.toBe(looks[i - 1].tone)
      expect(looks[i].accent, `part ${i} vs ${i - 1}`).not.toBe(looks[i - 1].accent)
    }
  })

  test('under the stacks: where my projects run, and the layers every stack shares', async ({ page }) => {
    await page.goto('/loadout')
    const stacks = page.getByRole('region', { name: 'Stacks I build with' })
    // Every host in real use, each with what lives there; nothing deploys to Railway.
    const hosts = stacks.getByRole('region', { name: 'Where it runs' }).locator('[data-host]')
    // Nothing runs on Vercel any more (round 8 of 2026-11-09): it is only the Quick stack's host.
    await expect(hosts).toHaveCount(4)
    for (const host of ['Cloudflare Workers', 'Firebase', 'Turso', 'GitHub Pages']) {
      await expect(hosts.filter({ hasText: new RegExp(`^${host} - `) })).toHaveCount(1)
    }
    await expect(stacks).not.toContainText('Railway')
    const across = stacks.getByRole('region', { name: 'Across every stack' })
    await expect(across.locator('dt')).toHaveText(['UI', 'Validation', 'Sign-in', 'Payments', 'Email', 'Testing', 'Monitoring', 'CI and releases'])
    for (const tool of ['shadcn/ui', 'Tailwind CSS', 'Playwright', 'axe', 'Sentry', 'Stripe', 'Better Auth', 'Auth.js', 'GitHub Actions']) {
      await expect(across.locator('[data-stack-tool]').filter({ hasText: new RegExp(`^${tool.replace('.', '\\.')}$`) })).toHaveCount(1)
    }
    // Every chip has its mark, and none wraps.
    await expect(across.locator('[data-stack-icon]')).toHaveCount(await across.locator('[data-stack-tool]').count())
    for (const height of await across.locator('[data-stack-tool]').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height)))
      expect(height).toBeLessThan(24)
  })

  test('Stacks I build with names each stack and shows its tools as chips, with no paragraph', async ({ page }) => {
    await page.goto('/loadout')
    const stacks = page.getByRole('region', { name: 'Stacks I build with' })
    // How I build, right after Inside the apps I build (2026-11-02).
    const order = await page.locator('main h2').allTextContents()
    expect(order.indexOf('Stacks I build with')).toBe(order.indexOf('Inside the apps I build') + 1)
    // Round 8 of 2026-11-09: the Quick and Production stacks replace the Turso, Cloudflare and Firebase ones.
    await expect(stacks.getByRole('heading', { level: 3 })).toHaveText([
      'Quick stack',
      'Production stack',
      'Local-first stack',
      'Extension stack',
      // Under the stacks (round 5 of 2026-11-02).
      'Where it runs',
      'Across every stack',
    ])
    await expect(stacks).not.toContainText('Turso Stack')
    // No roles, no per-tool notes (round 3 of 2026-11-02), and no paragraph under each stack (round 8).
    await expect(stacks.locator('[data-stack-role], [data-stack-about]')).toHaveCount(0)
    for (const role of ['Framework', 'Database', 'Hosting']) await expect(stacks).not.toContainText(role)
    const toolsOf = (name: string) => stacks.getByRole('list', { name: `${name} tools` }).locator('[data-stack-tool]')
    const runsOn = (name: string) => stacks.getByRole('list', { name: `${name} hosting` }).locator('[data-stack-tool]')
    await expect(toolsOf('Quick stack')).toHaveText(['Next.js', 'TypeScript', 'Tailwind CSS', 'Firebase Auth'])
    await expect(runsOn('Quick stack')).toHaveText(['Vercel', 'Firestore'])
    await expect(toolsOf('Production stack')).toHaveText(['Next.js', 'TypeScript', 'OpenNext', 'Hono'])
    await expect(runsOn('Production stack')).toHaveText(['Workers', 'D1', 'R2', 'Durable Objects', 'Images', 'Email Service'])
    await expect(runsOn('Local-first stack')).toHaveText(['Your PC', 'GitHub Releases'])
    await expect(runsOn('Extension stack')).toHaveText(['Your browser'])
    await expect(stacks).not.toContainText('+TypeScript')
    // The extensions really built with: no WXT.
    await expect(toolsOf('Extension stack')).toHaveText(['Chrome MV3', 'React', 'TypeScript', 'Vite + CRXJS', 'esbuild'])
    await expect(stacks).not.toContainText('WXT')
    // Every tool carries its mark, 16px.
    const icons = stacks.getByRole('article').locator('[data-stack-icon] svg')
    await expect(icons).toHaveCount(30)
    for (const height of await icons.evaluateAll((svgs) => svgs.map((svg) => Math.round(svg.getBoundingClientRect().height)))) expect(height).toBe(16)
    // Every tool name stays on one line, and the cards in a row are the same height.
    for (const height of await stacks.locator('[data-stack-tool]').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height)))
      expect(height).toBeLessThan(24)
    const cards = await stacks.getByRole('article').evaluateAll((els) =>
      els.map((el) => ({ top: Math.round(el.getBoundingClientRect().top), height: Math.round(el.getBoundingClientRect().height) }))
    )
    const rows = new Map<number, number[]>()
    for (const { top, height } of cards) rows.set(top, [...(rows.get(top) ?? []), height])
    for (const heights of rows.values()) expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1)
  })

  test('the gear section (once "The setup") keeps its old #setup anchor working', async ({ page }) => {
    await page.goto('/loadout#setup')
    const gear = page.getByRole('region', { name: 'The gear' })
    await expect(gear.getByRole('heading', { name: 'The gear', level: 2 })).toBeInViewport()
    await expect(page.getByRole('heading', { name: 'The setup' })).toHaveCount(0)
  })

  test('the gear is the rig and the desk, with larger marks; #stream still lands on it', async ({ page }) => {
    await page.goto('/loadout#stream')
    const gear = page.getByRole('region', { name: 'The gear' })
    await expect(gear.getByRole('heading', { name: 'The gear', level: 2 })).toBeInViewport()
    // Round 3 of 2026-11-02: no Stream kit (Scribe is in Tools I built and use).
    await expect(gear.getByRole('heading', { level: 3 })).toHaveText(['Rig', 'Desk'])
    await expect(gear).not.toContainText('OBS Studio')
    for (const size of await gear.locator('[data-gear-icon] svg').evaluateAll((icons) => icons.map((svg) => svg.getBoundingClientRect().height)))
      expect(size).toBeGreaterThanOrEqual(20)
  })

  test('fits a 320px phone without sideways scrolling', { tag: '@cross-browser' }, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    for (const [path, part] of [['/loadout', '#tools-i-built'], ['/', '#pr-post-edition']]) {
      await page.goto(path)
      await page.locator(part).scrollIntoViewIfNeeded()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, path).toBeLessThanOrEqual(0)
    }
  })

  test('under People I follow, the homepage has The Pull Request Post, with its live demo and repo', { tag: '@cross-browser' }, async ({ page }) => {
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
    // Beside it, a recording of the live page in a browser window (round 5 of 2026-11-02): a
    // silent video that shows its poster under reduced motion and loads nothing.
    const video = card.locator('[data-pr-post-window] video')
    await expect(card.locator('[data-pr-post-window] img[data-tour-poster]')).toHaveAttribute('src', /pr-post-tour-poster\.webp/)
    await expect(video).toHaveAttribute('aria-label', /The Pull Request Post's live front page/)
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.muted && v.loop && v.hasAttribute('playsinline'))).toBe(true)
    await expect(video.locator('source')).toHaveCount(0)
    await expect(card.locator('[data-pr-post-window] a')).toHaveCount(0)
  })

  test.describe('with motion', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } })
    test("The Pull Request Post's recording plays on screen, muted, and pauses from its button", { tag: '@cross-browser' }, async ({ page }) => {
      await page.goto('/')
      const card = page.getByRole('article', { name: 'The Pull Request Post' })
      const video = card.locator('video')
      await video.scrollIntoViewIfNeeded()
      await expect(video.locator('source')).toHaveCount(2)
      await expect(video.locator('source').first()).toHaveAttribute('src', '/projects/pr-post-tour.webm')
      await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.muted), { timeout: 15_000 }).toBe(true)
      await card.getByRole('button', { name: 'Pause the Pull Request Post tour' }).click()
      await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)
    })
  })

  test("the homepage's Scribe row is short, and offers the download for the visitor's OS, Full story on a phone", async ({ browser }) => {
    // Windows, and macOS and Linux in beta (owner, 2026-11-09).
    for (const [userAgent, platform, name, href, note] of [
      ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36', 'windows', 'Download for Windows', '/download/scribe', /^Windows 10 and 11, 64-bit · v0\.8\.0 · 12 MB$/],
      ['Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', 'mac', 'Download for macOS Beta', '/download/scribe-mac', /^macOS, Apple silicon and Intel · v0\.8\.0 · \d+ MBNot notarized by Apple: open it once, then allow it in System Settings > Privacy & Security > Open Anyway\.$/],
      ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36', 'linux', 'Download for Linux Beta', '/download/scribe-linux', /^Linux, 64-bit AppImage · v0\.8\.0 · \d+ MB · Also as a \.deb$/],
      ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'other', 'Download for Windows', '/download/scribe', 'Desktop app for Windows, with macOS and Linux in beta.'],
    ] as const) {
      const context = await browser.newContext({ userAgent, viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
      const page = await context.newPage()
      await page.goto('/')
      const row = page.locator('#tools-i-built').getByRole('article', { name: 'Scribe' })
      await row.scrollIntoViewIfNeeded()
      // No stack pills or feature checks here: the build page has them.
      await expect(row.getByRole('list')).toHaveCount(0)
      const actions = row.locator('[data-scribe-platform]')
      await expect(actions).toHaveAttribute('data-scribe-platform', platform)
      const download = row.getByRole('link', { name, exact: true })
      const story = row.getByRole('link', { name: 'Full story of Scribe' })
      await expect(download).toHaveAttribute('href', href)
      await expect(story).toHaveAttribute('href', '/builds/scribe')
      // The leading button comes first; both are the same size, so nothing shifts.
      const [first] = await actions.getByRole('link').all()
      await expect(first).toHaveAccessibleName(platform === 'other' ? 'Full story of Scribe' : name)
      const [d, f] = [(await download.boundingBox())!, (await story.boundingBox())!]
      expect(Math.abs(d.width - f.width)).toBeLessThan(1)
      expect(Math.abs(d.height - f.height)).toBeLessThan(1)
      await expect(row.locator('#scribe-download-note')).toHaveText(note)
      if (platform === 'linux') await expect(row.getByRole('link', { name: 'Also as a .deb' })).toHaveAttribute('href', '/download/scribe-deb')
      await context.close()
    }
  })

  test('the homepage has Tools I built and use inside its Loadout, every tool with Scribe first', async ({ page }) => {
    await page.goto('/')
    const built = page.getByRole('region', { name: 'Tools I built and use' })
    // As /loadout, a level down: Scribe's compact row (2026-11-08) and the cards (h5) under the h4 subheading.
    // No pr-post (round 5 of 2026-11-02): The Pull Request Post's card a section above is its one place.
    await expect(built.getByRole('heading', { level: 4 })).toHaveText(['Dev tools I built'])
    await expect(built.getByRole('article').getByRole('heading', { level: 5 })).toHaveText(['Scribe', /^pass-env/, /^release-kit/, /^devguard/])
    await expect(built.locator('[data-credit]')).toContainText('Created by Phaedrus Raznikov (opens in a new tab) at Misty Step')
    // A part of the Loadout (#loadout): after the default stack. The setup teaser leads the band (round 3 of 2026-11-02).
    const loadout = page.locator('#loadout')
    await expect(loadout.locator('#tools-i-built')).toHaveCount(1)
    const [stack, tools, teaser, kit] = await Promise.all(
      [loadout.getByRole('heading', { name: 'Production stack' }), built, loadout.locator('[data-setup-teaser]'), loadout.locator('#ai-kit')].map((el) =>
        el.boundingBox(),
      ),
    )
    expect(tools!.y).toBeGreaterThan(stack!.y)
    expect(teaser!.y + teaser!.height).toBeLessThanOrEqual(kit!.y)
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
