import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GAMES } from '@/data/games'
import { N8GAMES_AD, N8GAMES_URL } from '@/data/n8games'
import { N8GAMES_GAMES, notLiveYet } from '@/data/n8games/games'
import { BASE, THEMES, textPairs } from '@/data/n8games/themes'
import { FLOATERS, HERO, NEXT, PIECES, floaterSrc } from '@/data/n8games/page'
import { media, mediaPaths } from '@/lib/media'

/** WCAG 2 contrast ratio of two #rrggbb colours. */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** A picture or clip: a file in media/ that lib/media.ts can serve. */
const mediaFile = (path: string) => {
  expect(() => media(path), path).not.toThrow()
  return join(process.cwd(), 'media', path)
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
      for (const path of [g.clip.webm, g.clip.mp4, g.clip.poster, g.card.tile, ...g.pictures.map((p) => p.src)]) {
        expect(existsSync(mediaFile(path)), path).toBe(true)
      }
      // The share picture is read from public/ by the og.png route.
      expect(existsSync(publicFile(g.share)), g.share).toBe(true)
      // A clip a phone can afford: each file under 2.5 MB.
      for (const path of [g.clip.webm, g.clip.mp4]) expect(statSync(mediaFile(path)).size, path).toBeLessThan(2.5 * 1024 * 1024)
      // A phone encode, where there is one, is the smaller file.
      if (g.clip.phone) {
        expect(statSync(mediaFile(g.clip.phone.webm)).size).toBeLessThan(statSync(mediaFile(g.clip.webm)).size)
        expect(statSync(mediaFile(g.clip.phone.mp4)).size).toBeLessThan(statSync(mediaFile(g.clip.mp4)).size)
      }
      expect(g.play.href).toMatch(/^https:\/\/(partygames|whoami)\.n8builds\.dev/)
    })
  }

  it('knows which games are not live yet, and points them at the games site', () => {
    // A game that is not live shows "Coming soon" and "See the games site", never
    // "Playable" or "Go play" (GamePage, N8gamesPage). Every game is live now
    // (Tin Derby in the party room since 2026-11-22).
    expect(notLiveYet()).toEqual([])
    for (const slug of notLiveYet()) expect(N8GAMES_GAMES.find((g) => g.slug === slug)!.play.href).toBe(N8GAMES_URL)
  })

  it('sends Go play for a live game to the game itself, never to the front door', () => {
    for (const g of N8GAMES_GAMES.filter((x) => x.play.live)) expect(g.play.href, g.slug).not.toBe(N8GAMES_URL)
    expect(N8GAMES_GAMES.find((g) => g.slug === 'paper-masks')!.play).toEqual({ href: 'https://partygames.n8builds.dev/table/', live: true })
  })
})

describe('n8games: the pieces', () => {
  it('has the four pieces, each with a real clip', () => {
    expect(PIECES.map((p) => p.id)).toEqual(['pawn', 'ghost', 'robot', 'slime'])
    for (const p of PIECES) for (const path of [p.clip.webm, p.clip.mp4, p.clip.poster, p.face]) expect(existsSync(mediaFile(path)), path).toBe(true)
  })
})

describe('n8games: the pictures and clips are served content-hashed', () => {
  it('finds every picture and clip the pages name in media/', () => {
    const named = [
      ...[HERO.clip.wide, HERO.clip.tall].flatMap((c) => [c.webm, c.mp4, c.poster]),
      ...FLOATERS.map((f) => floaterSrc(f.img)),
      NEXT.coming.image.src,
      ...NEXT.rooms.images.map((r) => r.src),
      N8GAMES_AD.image.wide.src,
      N8GAMES_AD.image.close.src,
      ...GAMES.map((g) => g.shot),
    ]
    for (const path of named) expect(existsSync(mediaFile(path)), path).toBe(true)
  })

  it('keeps no picture or clip of these pages in public/, where its URL could go stale', () => {
    // public/ keeps only what is not sent to a browser from these pages: the share
    // pictures (read by the og.png routes) and the icon (the build log's tiles).
    const left = readdirSync(join(process.cwd(), 'public/games'), { recursive: true, encoding: 'utf8' }).filter((f) => /\.(webp|mp4|webm)$/.test(f))
    expect(left).toEqual([])
  })

  it('knows every file in media/, and refuses one that is not there', () => {
    expect(mediaPaths()).toContain('/games/n8games/tin-derby/clip.webm')
    expect(() => media('/games/n8games/tin-derby/nope.webm')).toThrow(/no such file/)
  })
})
