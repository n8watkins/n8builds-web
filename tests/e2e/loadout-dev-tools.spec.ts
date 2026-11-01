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

  test('the header pills jump to every part of the page', async ({ page }) => {
    await page.goto('/loadout')
    const pills = page.getByRole('navigation', { name: 'Loadout sections' }).getByRole('link')
    await expect(pills).toHaveText(['How I work', 'Tools I use', 'People I follow', 'Tools I built', 'Inside my apps', 'The setup'])
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
