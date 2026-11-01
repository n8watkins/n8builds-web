import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { people, toolsIBuilt, toolsIUse, type Person } from '@/data/loadout'
import { PersonCard } from '@/components/sections/LoadoutDevTools'

/**
 * The dev-tool lists on /loadout (data/loadout.tsx): tools I built, agent
 * tools I use, and people I follow. Each is a one-entry change, so these
 * checks keep a new entry well formed.
 */

const allCopy = [
  ...toolsIBuilt.flatMap((t) => [t.name, t.pitch, t.detail, t.credit?.note ?? '']),
  ...toolsIUse.flatMap((t) => [t.name, t.whatFor]),
  ...people.flatMap((c) => [c.name, c.role, c.note]),
]

describe('the loadout dev-tool lists', () => {
  it('builds only public n8watkins repos, and credits the fork', () => {
    for (const tool of toolsIBuilt) {
      expect(tool.github).toMatch(/^https:\/\/github\.com\/n8watkins\/[\w.-]+$/)
    }
    const passEnv = toolsIBuilt.find((t) => t.id === 'pass-env')
    expect(passEnv?.pitch).toBe('Your AI coding agents use your API keys without ever seeing them.')
    expect(passEnv?.credit?.author.name).toBe('Phaedrus Raznikov')
    expect(passEnv?.credit?.org?.name).toBe('Misty Step')
    expect(passEnv?.credit?.note).toBe('my fork adds import, generate, doctor and more.')
  })

  it('gives every built tool and creator a unique anchor id', () => {
    const ids = [...toolsIBuilt.map((t) => t.id), ...people.map((c) => c.id)]
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  it('credits each used tool to a listed maker, if any', () => {
    for (const tool of toolsIUse) {
      if (tool.by) expect(people.map((c) => c.id)).toContain(tool.by)
      expect(tool.href).toMatch(/^https:\/\//)
    }
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
