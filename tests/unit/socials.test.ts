import { describe, expect, it } from 'vitest'
import { ALL_SOCIALS, SOCIALS, isExternal } from '@/data/socials'

describe('the socials list (data/socials.ts)', () => {
  it('keeps the owner\'s order: GitHub, LinkedIn, Email, X, Twitch, YouTube, Ko-fi', () => {
    expect(ALL_SOCIALS.map((s) => s.label)).toEqual([
      'GitHub',
      'LinkedIn',
      'Email',
      'X (Twitter)',
      'Twitch',
      'YouTube',
      'Ko-fi',
    ])
  })

  it('shows only the enabled links, in the same order', () => {
    expect(SOCIALS).toEqual(ALL_SOCIALS.filter((s) => s.enabled))
  })

  it('hides the streaming links until the owner starts streaming', () => {
    const shown = SOCIALS.map((s) => s.label)
    expect(shown).not.toContain('Twitch')
    expect(shown).not.toContain('YouTube')
    expect(shown).toEqual(['GitHub', 'LinkedIn', 'Email', 'X (Twitter)', 'Ko-fi'])
  })

  it('has unique labels and only https or the public mailto links', () => {
    expect(new Set(ALL_SOCIALS.map((s) => s.label)).size).toBe(ALL_SOCIALS.length)
    for (const s of ALL_SOCIALS) {
      expect(s.href === 'mailto:contact@n8builds.dev' || s.href.startsWith('https://'), s.label).toBe(true)
      expect(isExternal(s.href)).toBe(s.href.startsWith('http'))
    }
  })
})
