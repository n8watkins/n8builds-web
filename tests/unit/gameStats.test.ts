import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  MAX_SCORE,
  endRound,
  parseEvent,
  placeFrom,
  playerHash,
  record,
  startRound,
  type GameStore,
} from '@/lib/game/stats'

/** An in-memory store with the commands lib/game/stats.ts uses, recording every write. */
class FakeStore implements GameStore {
  data = new Map<string, unknown>()
  writes: string[] = []
  private log(...parts: unknown[]) {
    this.writes.push(parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' '))
  }
  async get<T>(key: string) {
    return (this.data.get(key) ?? null) as T | null
  }
  async set(key: string, value: string, opts: { ex: number; nx?: boolean }) {
    this.log('set', key, value, opts)
    if (opts.nx && this.data.has(key)) return null
    this.data.set(key, value)
    return 'OK'
  }
  async del(key: string) {
    this.log('del', key)
    this.data.delete(key)
  }
  async hincrby(key: string, field: string, by: number) {
    this.log('hincrby', key, field, by)
    const hash = (this.data.get(key) as Map<string, number>) ?? new Map()
    hash.set(field, (hash.get(field) ?? 0) + by)
    this.data.set(key, hash)
    return hash.get(field)!
  }
  async pfadd(key: string, ...members: string[]) {
    this.log('pfadd', key, ...members)
    const set = (this.data.get(key) as Set<string>) ?? new Set()
    members.forEach((m) => set.add(m))
    this.data.set(key, set)
    return 1
  }
  async expire(key: string, seconds: number) {
    this.log('expire', key, seconds)
  }
  async zadd(key: string, entry: { score: number; member: string }) {
    this.log('zadd', key, entry)
    const z = (this.data.get(key) as Map<string, number>) ?? new Map()
    z.set(entry.member, entry.score)
    this.data.set(key, z)
  }
  async zremrangebyrank(key: string, start: number, stop: number) {
    this.log('zremrangebyrank', key, start, stop)
  }
  async zrange<T>(key: string) {
    const z = (this.data.get(key) as Map<string, number>) ?? new Map()
    const best = [...z.entries()].sort((a, b) => b[1] - a[1])[0]
    return (best ? [best[0], best[1]] : []) as T
  }
}

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
  it("reads Vercel's country and region codes, and nothing else", () => {
    const h = new Headers({ 'x-vercel-ip-country': 'gb', 'x-vercel-ip-country-region': 'ENG', 'x-vercel-ip-city': 'London' })
    expect(placeFrom(h)).toEqual({ country: 'GB', region: 'ENG' })
    expect(placeFrom(new Headers({ 'x-vercel-ip-country': '<script>' }))).toEqual({ country: 'XX', region: '' })
  })
})

describe('rounds', () => {
  let store: FakeStore
  beforeEach(() => {
    store = new FakeStore()
  })

  it('counts a start, the player once a day, the attempt and the country', async () => {
    const player = await playerHash(store, NOW, '203.0.113.7', 'TestAgent/1.0')
    await startRound(store, NOW, 'portfolio', player, place)
    await startRound(store, NOW, 'portfolio', player, place)
    const day = '2026-10-27'
    expect((store.data.get(`game:rounds:${day}`) as Map<string, number>).get('start:portfolio')).toBe(2)
    expect((store.data.get(`game:players:${day}`) as Set<string>).size).toBe(1)
    expect((store.data.get(`game:players:${day}:portfolio`) as Set<string>).size).toBe(1)
    expect((store.data.get(`game:attempts:${day}`) as Map<string, number>).get(player)).toBe(2)
    expect((store.data.get(`game:countries:${day}`) as Map<string, number>).get('US')).toBe(2)
    expect((store.data.get(`game:regions:${day}`) as Map<string, number>).get('US-CA')).toBe(2)
  })

  it('counts an end only for a round this player started on this site, once its 30 seconds can have passed', async () => {
    const player = await playerHash(store, NOW, '203.0.113.7', 'TestAgent/1.0')
    const other = await playerHash(store, NOW, '198.51.100.9', 'TestAgent/1.0')
    const { round } = await startRound(store, NOW, 'n8builds', player, place)
    expect(await endRound(store, later(10), 'n8builds', player, round, 5)).toBe('too-soon')
    expect(await endRound(store, later(31), 'n8builds', other, round, 5)).toBe('unknown-round')
    expect(await endRound(store, later(31), 'portfolio', player, round, 5)).toBe('unknown-round')
    expect(await endRound(store, later(31), 'n8builds', player, round, 17)).toBe('counted')
    // Once only.
    expect(await endRound(store, later(32), 'n8builds', player, round, 17)).toBe('unknown-round')
    expect((store.data.get('game:scores:2026-10-27') as Map<string, number>).get('17')).toBe(1)
    expect(await record(store)).toBe(17)
    const top = [...(store.data.get('game:top') as Map<string, number>).keys()][0]
    expect(top).toMatch(/^n8builds\|US\|2026-10-27\|[a-f0-9]{24}$/)
  })

  it('never stores an IP address or a user agent, and a player is a different hash each day', async () => {
    const ip = '203.0.113.7'
    const agent = 'Mozilla/5.0 TestAgent/1.0'
    const today = await playerHash(store, NOW, ip, agent)
    const { round } = await startRound(store, NOW, 'n8builds', today, place)
    await endRound(store, later(31), 'n8builds', today, round, 9)
    const everything = store.writes.join('\n')
    expect(everything).not.toContain(ip)
    expect(everything).not.toContain('203.0.113')
    expect(everything).not.toContain('TestAgent')
    // Same visitor, same day: the same hash. Tomorrow: a new salt, a new hash.
    expect(await playerHash(store, NOW, ip, agent)).toBe(today)
    expect(await playerHash(store, new Date('2026-10-28T12:00:00Z'), ip, agent)).not.toBe(today)
    // The salt itself is random and expires within two days.
    const salt = store.writes.find((w) => w.startsWith('set game:salt:2026-10-27'))!
    expect(salt).toMatch(/"ex":172800/)
  })
})

// The route: origins, size, validation, the switch-off and the rate limit.
const limit = vi.fn()
vi.mock('@upstash/ratelimit', () => {
  class Ratelimit {
    static slidingWindow() {
      return {}
    }
    limit = (...args: unknown[]) => limit(...args)
  }
  return { Ratelimit }
})
const fake = new FakeStore()
vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor() {
      return fake
    }
  },
}))
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
const { POST, OPTIONS } = await import('@/app/api/game/route')

async function send(body: string, origin: string | null = 'https://portfolio.n8builds.dev') {
  const headers: Record<string, string> = { 'content-type': 'text/plain', 'x-real-ip': '203.0.113.7', 'user-agent': 'TestAgent/1.0' }
  if (origin) headers.origin = origin
  return POST(new NextRequest('http://localhost/api/game', { method: 'POST', body, headers }))
}

describe('POST /api/game', () => {
  beforeEach(() => {
    limit.mockReset().mockResolvedValue({ success: true })
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('ANALYTICS_REDIS_REST_URL', 'https://example.upstash.io')
    vi.stubEnv('ANALYTICS_REDIS_REST_TOKEN', 'token')
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
    const keys: string[] = []
    limit.mockImplementation(async (key: string) => {
      keys.push(key)
      return { success: true }
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
    const [ipA, playerA, ipB, playerB] = keys
    expect(ipA).toBe(ipB)
    expect(playerA).not.toBe(playerB)
    expect(keys.join(' ')).not.toContain('203.0.113.7')
    // Over the address limit: refused before anything is counted.
    const writes = fake.writes.length
    limit.mockReset().mockResolvedValueOnce({ success: false })
    expect((await send('{"type":"start"}')).status).toBe(429)
    expect(limit).toHaveBeenCalledTimes(1)
    expect(fake.writes.slice(writes).filter((w) => !w.includes('game:salt:'))).toEqual([])
  })

  it('limits each player', async () => {
    limit.mockResolvedValue({ success: false })
    expect((await send('{"type":"start"}')).status).toBe(429)
  })

  it('starts a round with an id and the all-time best', async () => {
    const response = await send('{"type":"start"}')
    const body = await response.json()
    expect(body.round).toMatch(/^[a-f0-9]{24}$/)
    expect(typeof body.record).toBe('number')
  })

  it('accepts and drops everything while the analytics database is not set', async () => {
    vi.stubEnv('ANALYTICS_REDIS_REST_URL', '')
    expect((await send('{"type":"start"}')).status).toBe(204)
  })
})
