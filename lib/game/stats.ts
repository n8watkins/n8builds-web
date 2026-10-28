import { createHash, randomBytes } from 'node:crypto'

/**
 * The dino catch game's stats (components/features/dino/DinoGame.tsx), from
 * n8builds.dev and portfolio.n8builds.dev, kept in the analytics database the
 * admin dashboard reads (n8builds-admin, lib/store.ts).
 *
 * Privacy first, Plausible-style: no cookies, nothing stored in the browser,
 * and no IP address or user agent stored anywhere. A player is a hash of
 * (today's salt + IP + user agent); the salt is random, kept for two days and
 * then gone, so a hash can't be traced back or linked across days. Stored:
 * daily counters, the day's player hashes (to count unique players and
 * attempts per player) and the top scores with site, country and date.
 *
 * Keys (dates are UTC YYYY-MM-DD; everything expires after KEEP_DAYS):
 * - game:salt:<date>            the day's random salt (2 days)
 * - game:rounds:<date>          hash: start:<site> / end:<site> -> count
 * - game:players:<date>         HyperLogLog of player hashes (all sites)
 * - game:players:<date>:<site>  the same, per site
 * - game:attempts:<date>        hash: player hash -> rounds started
 * - game:scores:<date>          hash: score -> finished rounds
 * - game:countries:<date>       hash: country -> rounds started
 * - game:regions:<date>         hash: country-region -> rounds started
 * - game:round:<id>             a round in play: who, where, when (1 hour)
 * - game:top                    sorted set: the best scores, "site|country|date|id" -> score
 */

export const SITES = ['n8builds', 'portfolio'] as const
export type Site = (typeof SITES)[number]

/** The pages allowed to send events, and the site each one is. */
export const ORIGINS: Record<string, Site> = {
  'https://n8builds.dev': 'n8builds',
  'https://www.n8builds.dev': 'n8builds',
  'https://portfolio.n8builds.dev': 'portfolio',
}

/** A round is 30 s of the dino on screen; it can last longer (paused off screen), never shorter. */
export const ROUND_SECONDS = 30
/** The most catches a 30-second round can honestly produce (two clicks a second on a moving target). */
export const MAX_SCORE = 60
export const KEEP_DAYS = 400
const KEEP = KEEP_DAYS * 24 * 60 * 60
const SALT_TTL = 2 * 24 * 60 * 60
const ROUND_TTL = 60 * 60
const TOP_KEEP = 50

/** The commands used, so tests can run against an in-memory fake. */
export interface GameStore {
  get<T = string>(key: string): Promise<T | null>
  set(key: string, value: string, opts: { ex: number; nx?: boolean }): Promise<unknown>
  del(key: string): Promise<unknown>
  hincrby(key: string, field: string, by: number): Promise<number>
  pfadd(key: string, ...members: string[]): Promise<number>
  expire(key: string, seconds: number): Promise<unknown>
  zadd(key: string, entry: { score: number; member: string }): Promise<unknown>
  zremrangebyrank(key: string, start: number, stop: number): Promise<unknown>
  zrange<T = string[]>(key: string, start: number, stop: number, opts: { rev: true; withScores: true }): Promise<T>
}

export function utcDate(now: Date): string {
  return now.toISOString().slice(0, 10)
}

/** Today's salt, made once per UTC day by whichever request comes first. */
async function dailySalt(store: GameStore, date: string): Promise<string> {
  const key = `game:salt:${date}`
  const existing = await store.get<string>(key)
  if (existing) return existing
  await store.set(key, randomBytes(32).toString('hex'), { ex: SALT_TTL, nx: true })
  // Another request may have won the race: use whichever salt was kept.
  return (await store.get<string>(key))!
}

/** A player's id for today: never the IP or user agent themselves. */
export async function playerHash(store: GameStore, now: Date, ip: string, userAgent: string): Promise<string> {
  const salt = await dailySalt(store, utcDate(now))
  return createHash('sha256').update(`${salt}\n${ip}\n${userAgent}`).digest('hex').slice(0, 24)
}

export type Place = { country: string; region: string }

/** Country and region from Vercel's geo headers, cleaned to codes. */
export function placeFrom(headers: Headers): Place {
  const clean = (v: string | null, max: number) => (v && /^[A-Za-z0-9]{1,8}$/.test(v) ? v.toUpperCase().slice(0, max) : '')
  return { country: clean(headers.get('x-vercel-ip-country'), 2) || 'XX', region: clean(headers.get('x-vercel-ip-country-region'), 3) }
}

export type GameEvent = { type: 'start' } | { type: 'end'; round: string; score: number }

/** Parses and checks an event body (sent as text, so a cross-site send needs no preflight). */
export function parseEvent(body: unknown): GameEvent | null {
  if (!body || typeof body !== 'object') return null
  const e = body as Record<string, unknown>
  if (e.type === 'start') return { type: 'start' }
  if (e.type === 'end' && typeof e.round === 'string' && /^[a-f0-9]{24}$/.test(e.round)) {
    const score = e.score
    if (typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= MAX_SCORE)
      return { type: 'end', round: e.round, score }
  }
  return null
}

async function bump(store: GameStore, key: string, field: string) {
  await store.hincrby(key, field, 1)
  await store.expire(key, KEEP)
}

/** A round started: counted, its player counted once a day, and a round id handed back. */
export async function startRound(store: GameStore, now: Date, site: Site, player: string, place: Place) {
  const date = utcDate(now)
  await bump(store, `game:rounds:${date}`, `start:${site}`)
  await store.pfadd(`game:players:${date}`, player)
  await store.expire(`game:players:${date}`, KEEP)
  await store.pfadd(`game:players:${date}:${site}`, player)
  await store.expire(`game:players:${date}:${site}`, KEEP)
  await bump(store, `game:attempts:${date}`, player)
  await bump(store, `game:countries:${date}`, place.country)
  if (place.region) await bump(store, `game:regions:${date}`, `${place.country}-${place.region}`)
  const round = randomBytes(12).toString('hex')
  await store.set(
    `game:round:${round}`,
    JSON.stringify({ player, site, country: place.country, at: now.getTime() }),
    { ex: ROUND_TTL }
  )
  return { round, record: await record(store) }
}

export type EndResult = 'counted' | 'unknown-round' | 'too-soon'

/**
 * A round finished. Only a round this player started on this site counts, and
 * only once its 30 seconds can have passed; the score is already capped.
 */
export async function endRound(store: GameStore, now: Date, site: Site, player: string, round: string, score: number): Promise<EndResult> {
  const raw = await store.get<string | { player: string; site: Site; country: string; at: number }>(`game:round:${round}`)
  const started = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!started || started.player !== player || started.site !== site) return 'unknown-round'
  if (now.getTime() - started.at < (ROUND_SECONDS - 1) * 1000) return 'too-soon'
  await store.del(`game:round:${round}`)
  const date = utcDate(now)
  await bump(store, `game:rounds:${date}`, `end:${site}`)
  await bump(store, `game:scores:${date}`, String(score))
  if (score > 0) {
    await store.zadd('game:top', { score, member: `${site}|${started.country}|${date}|${round}` })
    await store.zremrangebyrank('game:top', 0, -(TOP_KEEP + 1))
  }
  return 'counted'
}

/** The best score ever, for "All-time best" next to the player's own. */
export async function record(store: GameStore): Promise<number> {
  const top = await store.zrange<(string | number)[]>('game:top', 0, 0, { rev: true, withScores: true })
  return Number(top[1] ?? 0)
}
