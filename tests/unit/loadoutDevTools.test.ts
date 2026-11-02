import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { devSetup, people, toolsIBuilt, toolsIUse, type Person } from '@/data/loadout'
import { PersonCard } from '@/components/sections/LoadoutDevTools'

/**
 * The dev-tool lists on /loadout (data/loadout.tsx): tools I built, agent
 * tools I use, and people I follow. Each is a one-entry change, so these
 * checks keep a new entry well formed.
 */

const allCopy = [
  ...toolsIBuilt.flatMap((t) => [t.name, t.pitch, t.detail, t.credit?.note ?? '']),
  ...toolsIUse.flatMap((t) => [t.name, t.whatFor]),
  ...devSetup.flatMap((t) => t.groups).flatMap((g) => [g.title, ...g.items.flatMap((i) => [i.name, i.note ?? ''])]),
  ...people.flatMap((c) => [c.name, c.role, c.note]),
]

describe('the loadout dev-tool lists', () => {
  it('builds only public n8watkins repos, and credits the fork', () => {
    for (const tool of toolsIBuilt) {
      expect(tool.github).toMatch(/^https:\/\/github\.com\/n8watkins\/[\w.-]+$/)
    }
    expect(toolsIBuilt.map((t) => t.id)).toEqual(['pass-env', 'release-kit', 'devguard', 'pr-post'])
    for (const tool of toolsIBuilt) if (tool.demo) expect(tool.demo).toMatch(/^https:\/\//)
    const passEnv = toolsIBuilt.find((t) => t.id === 'pass-env')
    expect(passEnv?.pitch).toBe('Your AI coding agents use your API keys without ever seeing them.')
    expect(passEnv?.credit?.author.name).toBe('Phaedrus Raznikov')
    expect(passEnv?.credit?.org?.name).toBe('Misty Step')
    expect(passEnv?.credit?.note).toBe('my fork adds import, generate, doctor and more.')
  })

  it('gives every built tool and creator a unique anchor id', () => {
    const ids = [...toolsIBuilt.map((t) => t.id), ...people.map((c) => c.id), ...toolsIUse.map((t) => t.id)]
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  it('credits each used tool to a listed maker, if any, and links its public repo', () => {
    for (const tool of toolsIUse) {
      if (tool.by) expect(people.map((c) => c.id)).toContain(tool.by)
      // Every tool has a GitHub repo (the owner's ask, 2026-11-02), a site only over https.
      expect(tool.github).toMatch(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/)
      if (tool.site) expect(tool.site).toMatch(/^https:\/\//)
    }
    expect(toolsIUse.find((t) => t.id === 'herdr')).toMatchObject({ github: 'https://github.com/herdrdev/herdr', site: 'https://herdr.dev' })
  })

  it('links each creator only over https, no link twice', () => {
    for (const creator of people) {
      expect(creator.links.length).toBeGreaterThan(0)
      expect(new Set(creator.links.map((l) => l.href)).size).toBe(creator.links.length)
      for (const link of creator.links) expect(link.href).toMatch(/^https:\/\//)
    }
  })

  it('follows exactly the owner\'s three people, in order', () => {
    expect(people.map((c) => c.name)).toEqual(['Kun Chen', 'Phaedrus Raznikov', 'Nate Herk'])
    // Nate Herk has no public GitHub; never add a guessed one.
    expect(people.find((c) => c.id === 'nate-herk')?.links.some((l) => l.kind === 'github')).toBe(false)
  })

  it('self-hosts every avatar in public/people/', () => {
    for (const person of people) {
      expect(person.avatar).toMatch(/^\/people\/[a-z0-9-]+\.webp$/)
      expect(existsSync(join(process.cwd(), 'public', person.avatar!))).toBe(true)
    }
  })

  it('links My dev setup only to anchors that exist on the page, or to site pages', () => {
    const anchors = new Set([
      'workflow',
      ...toolsIBuilt.map((t) => t.id),
      ...toolsIUse.map((t) => t.id),
      ...people.map((p) => p.id),
    ])
    for (const entry of devSetup.flatMap((t) => t.groups).flatMap((g) => g.items)) {
      if (!entry.href) continue
      if (entry.href.startsWith('#')) expect(anchors, entry.name).toContain(entry.href.slice(1))
      else expect(entry.href).toMatch(/^\/[a-z]/)
    }
  })

  it('folds the honorable mentions into Tools I use, herdr first, and leaves gnhf off the list', () => {
    expect(toolsIUse.map((t) => t.id)).toEqual(['herdr', 'no-mistakes', 'chrome-devtools-axi', 'gh-axi', 'lavish', 'firstmate', 'treehouse', 'ccusage'])
    expect(toolsIUse.map((t) => t.id)).not.toContain('gnhf')
  })

  it('keeps every dev setup group, each in one tile, the machine\'s tile first', () => {
    expect(devSetup.flatMap((t) => t.groups.map((g) => g.id))).toEqual([
      'machine',
      'wsl',
      'terminal',
      'own-tools',
      'editors',
      'agents',
      'agent-tooling',
      'runtimes',
      'shipping',
    ])
    expect(devSetup.filter((t) => t.full).map((t) => t.id)).toEqual(['machine'])
    // Two to a row on a tablet and three on a laptop, after the full-width tile: every row fills.
    const rest = devSetup.filter((t) => !t.full).length
    expect(rest % 2).toBe(0)
    expect(rest % 3).toBe(0)
  })

  it('never uses an em dash in its copy', () => {
    for (const text of allCopy) expect(text).not.toContain('—')
  })

  it('shows no activity block while a person has none (today\'s static cards)', () => {
    for (const person of people) {
      expect(renderToStaticMarkup(createElement(PersonCard, { person }))).not.toContain('Recently shipped')
    }
  })

  it('lists a person\'s newest three public events once the feed fills them', () => {
    const person: Person = {
      ...people[0],
      activity: [
        { kind: 'release', title: 'v2.0.0', repo: 'kunchenguid/no-mistakes', href: 'https://github.com/kunchenguid/no-mistakes/releases/tag/v2.0.0', date: '2026-10-30T18:00:00Z' },
        { kind: 'pull-request', title: 'Faster gates', repo: 'kunchenguid/no-mistakes', href: 'https://github.com/kunchenguid/no-mistakes/pull/1', date: '2026-10-29T18:00:00Z' },
        { kind: 'new-repo', title: 'A new tool', repo: 'kunchenguid/new-tool', href: 'https://github.com/kunchenguid/new-tool', date: '2026-10-28T18:00:00Z' },
        { kind: 'release', title: 'v1.9.0', repo: 'kunchenguid/no-mistakes', href: 'https://github.com/kunchenguid/no-mistakes/releases/tag/v1.9.0', date: '2026-10-20T18:00:00Z' },
      ],
    }
    const html = renderToStaticMarkup(createElement(PersonCard, { person }))
    expect(html).toContain('Recently shipped')
    expect(html).toContain('Release: </span>v2.0.0')
    expect(html).toContain('Pull request: </span>Faster gates')
    expect(html).toContain('New repo: </span>A new tool')
    expect(html).toContain('Oct 30')
    expect(html).not.toContain('v1.9.0')
  })
})
