import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { N8GAMES_GAMES, notLiveYet } from '@/data/n8games/games'
import { BASE, THEMES, textPairs } from '@/data/n8games/themes'
import { PIECES } from '@/data/n8games/page'

/** WCAG 2 contrast ratio of two #rrggbb colours. */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const publicFile = (path: string) => join(process.cwd(), 'public', path)

describe('n8games: colours', () => {
  for (const [name, palette] of [['n8games', BASE] as const, ...Object.entries(THEMES)]) {
    it(`${name}: every text pair is at least 4.5:1`, () => {
      const low = textPairs(palette)
        .map(([what, fg, bg]) => [what, contrast(fg, bg)] as const)
        .filter(([, ratio]) => ratio < 4.5)
        .map(([what, ratio]) => `${what} ${ratio.toFixed(2)}`)
      expect(low).toEqual([])
    })
  }
})

describe('n8games: the games', () => {
  it('has five games, each with a unique slug and a theme', () => {
    expect(N8GAMES_GAMES.map((g) => g.slug)).toEqual(['cork-and-bell', 'hot-potato', 'who-am-i', 'tin-derby', 'paper-masks'])
    for (const g of N8GAMES_GAMES) expect(THEMES[g.theme], g.slug).toBeDefined()
  })

  for (const g of N8GAMES_GAMES) {
    it(`${g.slug}: three to five steps, a short "How it's made", two to four pictures, and its files`, () => {
      expect(g.steps.length).toBeGreaterThanOrEqual(3)
      expect(g.steps.length).toBeLessThanOrEqual(5)
      expect(g.made.length).toBeGreaterThanOrEqual(3)
      // Short items, not paragraphs (owner: "there's a little bit too much text").
      for (const m of g.made) expect(m.body.length, m.title).toBeLessThanOrEqual(140)
      expect(g.pictures.length).toBeGreaterThanOrEqual(2)
      expect(g.pictures.length).toBeLessThanOrEqual(4)
      expect(g.credits.length).toBeGreaterThan(0)
      for (const path of [g.clip.webm, g.clip.mp4, g.clip.poster, g.card.tile, g.share, ...g.pictures.map((p) => p.src)]) {
        expect(existsSync(publicFile(path)), path).toBe(true)
      }
      // A clip a phone can afford: each file under 2.5 MB.
      for (const path of [g.clip.webm, g.clip.mp4]) expect(statSync(publicFile(path)).size, path).toBeLessThan(2.5 * 1024 * 1024)
      expect(g.play.href).toMatch(/^https:\/\/(partygames|whoami)\.n8builds\.dev/)
    })
  }

  it('lists the pages whose Go play points at a game that is not live yet', () => {
    // The main session holds the merge while this list is not empty: Tin Derby and
    // Paper Masks are not on the live site yet, so their Go play is the games
    // site's front door for now. Update this when one goes live.
    const waiting = notLiveYet()
    console.log(`n8games pages pointing at a game that is not live yet: ${waiting.join(', ') || 'none'}`)
    expect(waiting).toEqual(['tin-derby', 'paper-masks'])
    for (const slug of waiting) expect(N8GAMES_GAMES.find((g) => g.slug === slug)!.play.href).toBe('https://partygames.n8builds.dev')
  })
})

describe('n8games: the pieces', () => {
  it('has the four pieces, each with a real clip', () => {
    expect(PIECES.map((p) => p.id)).toEqual(['pawn', 'ghost', 'robot', 'slime'])
    for (const p of PIECES) for (const path of [p.clip.webm, p.clip.mp4, p.clip.poster, p.face]) expect(existsSync(publicFile(path)), path).toBe(true)
  })
})
