import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { MAX_SCORE, endRound, parseEvent, placeFrom, playerHash, record, startRound } from '@/lib/game/stats'
import type { RequestGeo } from '@/lib/cloudflare/request'
import { testDatabases, type TestDatabases } from './d1'

const geo = vi.hoisted(() => vi.fn<() => RequestGeo | undefined>())
vi.mock('@/lib/cloudflare/request', () => ({ requestGeo: geo }))

let dbs: TestDatabases
beforeAll(async () => {
  dbs = await testDatabases()
})
afterAll(() => dbs.dispose())
beforeEach(() => dbs.reset())

/** Every row in n8builds-analytics, as text: what a leak would look like. */
async function everything(): Promise<string> {
  const rows = []
  for (const table of ['analytics_daily', 'game_players', 'game_rounds', 'game_top', 'game_salts']) {
    rows.push(...(await dbs.analytics.prepare(`SELECT * FROM ${table}`).all()).results)
  }
  return JSON.stringify(rows)
}

const count = async (metric: string, field: string, day = '2026-10-27') =>
  (await dbs.analytics.prepare('SELECT count FROM analytics_daily WHERE metric = ? AND day = ? AND field = ?').bind(metric, day, field).first<{ count: number }>())
    ?.count ?? 0

const NOW = new Date('2026-10-27T12:00:00Z')
const later = (seconds: number) => new Date(NOW.getTime() + seconds * 1000)
const place = { country: 'US', region: 'CA' }

describe('parseEvent', () => {
  it('takes a start, and an end with a round id and a whole score in range', () => {
    expect(parseEvent({ type: 'start' })).toEqual({ type: 'start' })
    expect(parseEvent({ type: 'end', round: 'a'.repeat(24), score: 12 })).toEqual({ type: 'end', round: 'a'.repeat(24), score: 12 })
  })
  it('refuses anything else, and any score a 30-second round cannot produce', () => {
    for (const bad of [
      null,
      'start',
      { type: 'win' },
      { type: 'end', round: 'a'.repeat(24) },
      { type: 'end', round: 'nope', score: 3 },
      { type: 'end', round: 'a'.repeat(24), score: -1 },
      { type: 'end', round: 'a'.repeat(24), score: 2.5 },
      { type: 'end', round: 'a'.repeat(24), score: MAX_SCORE + 1 },
      { type: 'end', round: 'a'.repeat(24), score: '9' },
    ])
      expect(parseEvent(bad)).toBeNull()
  })
})

describe('placeFrom', () => {
  it("reads Cloudflare's country and region codes, and nothing else", () => {
    geo.mockReturnValue({ country: 'gb', regionCode: 'ENG', city: 'London' } as RequestGeo)
    expect(placeFrom(new Headers())).toEqual({ country: 'GB', region: 'ENG' })
    geo.mockReturnValue({ country: '<script>' })
    expect(placeFrom(new Headers())).toEqual({ country: 'XX', region: '' })
  })

  it('falls back to the CF-IPCountry header off Workers', () => {
    geo.mockReturnValue(undefined)
    expect(placeFrom(new Headers({ 'cf-ipcountry': 'us' }))).toEqual({ country: 'US', region: '' })
    expect(placeFrom(new Headers())).toEqual({ country: 'XX', region: '' })
  })
})

describe('rounds', () => {
  it('counts a start, the player once a day per site, the attempt and the country', async () => {
    const db = dbs.analytics
    const player = await playerHash(db, NOW, '203.0.113.7', 'TestAgent/1.0')
    await startRound(db, NOW, 'portfolio', player, place)
    await startRound(db, NOW, 'portfolio', player, place)
    expect(await count('game:rounds', 'start:portfolio')).toBe(2)
    expect(await count('game:countries', 'US')).toBe(2)
    expect(await count('game:regions', 'US-CA')).toBe(2)
    const players = await db.prepare('SELECT site, player, rounds FROM game_players').all()
    expect(players.results).toEqual([{ site: 'portfolio', player, rounds: 2 }])
  })

  it('counts an end only for a round this player started on this site, once its 30 seconds can have passed', async () => {
    const db = dbs.analytics
    const player = await playerHash(db, NOW, '203.0.113.7', 'TestAgent/1.0')
    const other = await playerHash(db, NOW, '198.51.100.9', 'TestAgent/1.0')
    const { round } = await startRound(db, NOW, 'n8builds', player, place)
    expect(await endRound(db, later(10), 'n8builds', player, round, 5)).toBe('too-soon')
    expect(await endRound(db, later(31), 'n8builds', other, round, 5)).toBe('unknown-round')
    expect(await endRound(db, later(31), 'portfolio', player, round, 5)).toBe('unknown-round')
    // An hour on, the round is gone.
    expect(await endRound(db, later(3601), 'n8builds', player, round, 5)).toBe('unknown-round')
    expect(await endRound(db, later(31), 'n8builds', player, round, 17)).toBe('counted')
    // Once only, even when two ends race.
    expect(await endRound(db, later(32), 'n8builds', player, round, 17)).toBe('unknown-round')
    expect(await count('game:scores', '17')).toBe(1)
    expect(await count('game:rounds', 'end:n8builds')).toBe(1)
    expect(await record(db)).toBe(17)
    expect(await db.prepare('SELECT score, site, country, day FROM game_top').all().then((r) => r.results)).toEqual([
      { score: 17, site: 'n8builds', country: 'US', day: '2026-10-27' },
    ])
  })

  // 110 sequential writes to the local D1: about 5s on a busy machine, past
  // the default timeout, and a timed-out run kept writing into the next test.
  it('keeps only the best 50 scores', { timeout: 30_000 }, async () => {
    const db = dbs.analytics
    const player = await playerHash(db, NOW, '203.0.113.7', 'TestAgent/1.0')
    for (let score = 1; score <= 55; score++) {
      const { round } = await startRound(db, NOW, 'n8builds', player, place)
      await endRound(db, later(31), 'n8builds', player, round, score)
    }
    const top = await db.prepare('SELECT COUNT(*) AS n, MIN(score) AS low FROM game_top').first<{ n: number; low: number }>()
    expect(top).toEqual({ n: 50, low: 6 })
    expect(await record(db)).toBe(55)
  })

  it('never stores an IP address or a user agent, and a player is a different hash each day', async () => {
    const db = dbs.analytics
    const ip = '203.0.113.7'
    const agent = 'Mozilla/5.0 TestAgent/1.0'
    const today = await playerHash(db, NOW, ip, agent)
    const { round } = await startRound(db, NOW, 'n8builds', today, place)
    await endRound(db, later(31), 'n8builds', today, round, 9)
    const stored = await everything()
    expect(stored).not.toContain(ip)
    expect(stored).not.toContain('203.0.113')
    expect(stored).not.toContain('TestAgent')
    // Same visitor, same day: the same hash. Tomorrow: a new salt, a new hash.
    expect(await playerHash(db, NOW, ip, agent)).toBe(today)
    expect(await playerHash(db, new Date('2026-10-28T12:00:00Z'), ip, agent)).not.toBe(today)
  })
})

// The route: origins, size, validation, the switch-off and the rate limits.
const limit = vi.fn()
vi.mock('@/lib/security/rateLimiter', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/security/rateLimiter')>()),
  checkRateLimit: (...args: unknown[]) => limit(...args),
}))
let routeDb: TestDatabases['analytics'] | null = null
vi.mock('@/lib/db', () => ({ analyticsDb: async () => routeDb }))
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
const { POST, OPTIONS } = await import('@/app/api/game/route')

async function send(body: string, origin: string | null = 'https://portfolio.n8builds.dev') {
  const headers: Record<string, string> = { 'content-type': 'text/plain', 'x-real-ip': '203.0.113.7', 'user-agent': 'TestAgent/1.0' }
  if (origin) headers.origin = origin
  return POST(new NextRequest('http://localhost/api/game', { method: 'POST', body, headers }))
}

describe('POST /api/game', () => {
  beforeEach(() => {
    limit.mockReset().mockResolvedValue({ allowed: true })
    vi.stubEnv('APP_ENV', 'production')
    routeDb = dbs.analytics
  })

  it('answers only the listed sites', async () => {
    expect((await send('{"type":"start"}', 'https://evil.example')).status).toBe(403)
    expect((await send('{"type":"start"}', null)).status).toBe(403)
    expect((await send('{"type":"start"}', 'http://localhost:3000')).status).toBe(403)
    const ok = await send('{"type":"start"}')
    expect(ok.status).toBe(200)
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://portfolio.n8builds.dev')
    expect((await OPTIONS(new NextRequest('http://localhost/api/game', { method: 'OPTIONS', headers: { origin: 'https://n8builds.dev' } }))).status).toBe(204)
  })

  it('refuses bad or oversized bodies', async () => {
    expect((await send('not json')).status).toBe(400)
    expect((await send('{"type":"end","round":"' + 'a'.repeat(24) + '","score":999}')).status).toBe(400)
    expect((await send('{"type":"start","pad":"' + 'x'.repeat(600) + '"}')).status).toBe(413)
  })

  it('limits each address too, whatever user agent it sends, without storing the address', async () => {
    const calls: [string, string][] = []
    limit.mockImplementation(async (scope: string, key: string) => {
      calls.push([scope, key])
      return { allowed: true }
    })
    for (const agent of ['A/1', 'B/2']) {
      await POST(
        new NextRequest('http://localhost/api/game', {
          method: 'POST',
          body: '{"type":"start"}',
          headers: { origin: 'https://n8builds.dev', 'x-real-ip': '203.0.113.7', 'user-agent': agent },
        })
      )
    }
    // Each request checks the address first, then the player.
    const [[scopeA, ipA], [playerScope, playerA], [, ipB], [, playerB]] = calls
    expect([scopeA, playerScope]).toEqual(['game-ip', 'game-player'])
    expect(ipA).toBe(ipB)
    expect(playerA).not.toBe(playerB)
    expect(calls.join(' ')).not.toContain('203.0.113.7')
    // Over the address limit: refused before anything is counted.
    await dbs.reset()
    limit.mockReset().mockResolvedValueOnce({ allowed: false, reason: 'limited' })
    expect((await send('{"type":"start"}')).status).toBe(429)
    expect(limit).toHaveBeenCalledTimes(1)
    expect(await everything()).toBe('[]')
  })

  it('limits each player', async () => {
    limit.mockResolvedValueOnce({ allowed: true }).mockResolvedValueOnce({ allowed: false, reason: 'limited' })
    expect((await send('{"type":"start"}')).status).toBe(429)
    expect(await count('game:rounds', 'start:portfolio', new Date().toISOString().slice(0, 10))).toBe(0)
  })

  it('starts a round with an id and the all-time best, and counts a finished one', async () => {
    const response = await send('{"type":"start"}')
    const body = await response.json()
    expect(body.round).toMatch(/^[a-f0-9]{24}$/)
    expect(body.record).toBe(0)
    // Too soon: the round is a second old.
    expect((await send(`{"type":"end","round":"${body.round}","score":4}`)).status).toBe(409)
  })

  it('accepts and drops everything while there is no analytics database', async () => {
    routeDb = null
    expect((await send('{"type":"start"}')).status).toBe(204)
  })
})
