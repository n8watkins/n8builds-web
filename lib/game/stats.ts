import { createHash, randomBytes } from 'node:crypto'
import { requestGeo } from '@/lib/cloudflare/request'
import { increment } from '@/lib/counters'
import type { D1Database } from '@/lib/db'

/**
 * The dino catch game's stats (components/features/dino/DinoGame.tsx), from
 * n8builds.dev and portfolio.n8builds.dev, kept in n8builds-analytics
 * (docs/DATABASE.md), which the admin dashboard reads (n8builds-admin, lib/game.ts).
 *
 * Privacy first, Plausible-style: no cookies, nothing stored in the browser,
 * and no IP address or user agent stored anywhere. A player is a hash of
 * (today's salt + IP + user agent); the salt is random, kept for two days and
 * then gone, so a hash can't be traced back or linked across days. Stored:
 * daily counters, the day's player hashes (to count unique players and
 * attempts per player) and the top scores with site, country and date.
 *
 * Tables (dates are UTC YYYY-MM-DD; the daily cleanup deletes rows after KEEP_DAYS):
 * - analytics_daily  game:rounds (start:<site> / end:<site>), game:scores
 *                    (score), game:countries (country), game:regions (country-region)
 * - game_salts       the day's random salt (2 days)
 * - game_players     (day, site, player hash) -> rounds started
 * - game_rounds      a round in play: who, where, when (1 hour)
 * - game_top         the best TOP_KEEP scores: site, country, date
 */

// The sites and their origins live in ./origins, which the Worker's entry also
// reads (worker/game-gate.js) without loading the rest of this module.
import type { Site } from './origins'

export { ORIGINS, SITES, type Site } from './origins'

/** A round is 30 s of the dino on screen; it can last longer (paused off screen), never shorter. */
export const ROUND_SECONDS = 30
/**
 * The most a 30-second round can honestly score: two clicks a second on a moving target,
 * and a catch while the dino is rainbow counts three (round 11 of 2026-11-09).
 */
export const MAX_SCORE = 100
export const KEEP_DAYS = 400
const SALT_DAYS = 2
const ROUND_MS = 60 * 60 * 1000
const TOP_KEEP = 50

export function utcDate(now: Date): string {
  return now.toISOString().slice(0, 10)
}

const daysBefore = (date: string, days: number) => utcDate(new Date(Date.parse(`${date}T00:00:00Z`) - days * 86_400_000))

/** Today's salt, made once per UTC day by whichever request comes first. */
async function dailySalt(db: D1Database, date: string): Promise<string> {
  const [, row] = await db.batch<{ salt: string }>([
    // Another request may win the race: whichever salt was kept is used.
    db.prepare('INSERT INTO game_salts (day, salt) VALUES (?, ?) ON CONFLICT (day) DO NOTHING').bind(date, randomBytes(32).toString('hex')),
    db.prepare('SELECT salt FROM game_salts WHERE day = ?').bind(date),
  ])
  return row.results[0].salt
}

/** A player's id for today: never the IP or user agent themselves. */
export async function playerHash(db: D1Database, now: Date, ip: string, userAgent: string): Promise<string> {
  const salt = await dailySalt(db, utcDate(now))
  return createHash('sha256').update(`${salt}\n${ip}\n${userAgent}`).digest('hex').slice(0, 24)
}

export type Place = { country: string; region: string }

/**
 * Country and region from Cloudflare's request geolocation (request.cf),
 * cleaned to codes. Off Workers, the CF-IPCountry header if present.
 */
export function placeFrom(headers: Headers): Place {
  const clean = (v: string | null | undefined, max: number) => (v && /^[A-Za-z0-9]{1,8}$/.test(v) ? v.toUpperCase().slice(0, max) : '')
  const geo = requestGeo()
  return { country: clean(geo?.country ?? headers.get('cf-ipcountry'), 2) || 'XX', region: clean(geo?.regionCode, 3) }
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

/** A round started: counted, its player counted once a day, and a round id handed back. */
export async function startRound(db: D1Database, now: Date, site: Site, player: string, place: Place) {
  const date = utcDate(now)
  const round = randomBytes(12).toString('hex')
  await db.batch([
    increment(db, 'game:rounds', date, `start:${site}`),
    db
      .prepare('INSERT INTO game_players (day, site, player, rounds) VALUES (?, ?, ?, 1) ON CONFLICT (day, site, player) DO UPDATE SET rounds = rounds + 1')
      .bind(date, site, player),
    increment(db, 'game:countries', date, place.country),
    ...(place.region ? [increment(db, 'game:regions', date, `${place.country}-${place.region}`)] : []),
    db
      .prepare('INSERT INTO game_rounds (id, player, site, country, started_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(round, player, site, place.country, now.getTime(), now.getTime() + ROUND_MS),
  ])
  return { round, record: await record(db) }
}

export type EndResult = 'counted' | 'unknown-round' | 'too-soon'

/**
 * A round finished. Only a round this player started on this site counts, and
 * only once its 30 seconds can have passed; the score is already capped. The
 * round is consumed by a single DELETE, so it counts at most once.
 */
export async function endRound(db: D1Database, now: Date, site: Site, player: string, round: string, score: number): Promise<EndResult> {
  const at = now.getTime()
  const started = await db
    .prepare('SELECT started_at FROM game_rounds WHERE id = ? AND player = ? AND site = ? AND expires_at > ?')
    .bind(round, player, site, at)
    .first<{ started_at: number }>()
  if (!started) return 'unknown-round'
  if (at - started.started_at < (ROUND_SECONDS - 1) * 1000) return 'too-soon'
  const taken = await db
    .prepare('DELETE FROM game_rounds WHERE id = ? AND player = ? AND site = ? AND expires_at > ? RETURNING country')
    .bind(round, player, site, at)
    .first<{ country: string }>()
  // Another request ended it first.
  if (!taken) return 'unknown-round'
  const date = utcDate(now)
  await db.batch([
    increment(db, 'game:rounds', date, `end:${site}`),
    increment(db, 'game:scores', date, String(score)),
    ...(score > 0
      ? [
          db.prepare('INSERT INTO game_top (round_id, score, site, country, day) VALUES (?, ?, ?, ?, ?)').bind(round, score, site, taken.country, date),
          db
            .prepare('DELETE FROM game_top WHERE round_id NOT IN (SELECT round_id FROM game_top ORDER BY score DESC, round_id DESC LIMIT ?)')
            .bind(TOP_KEEP),
        ]
      : []),
  ])
  return 'counted'
}

/** The best score ever, for "All-time best" next to the player's own. */
export async function record(db: D1Database): Promise<number> {
  const top = await db.prepare('SELECT MAX(score) AS best FROM game_top').first<{ best: number | null }>()
  return Number(top?.best ?? 0)
}

/** The oldest day whose salt is still kept (today and yesterday). */
export const saltCutoff = (today: string) => daysBefore(today, SALT_DAYS - 1)
/** The oldest day whose counts are still kept. */
export const keepCutoff = (today: string) => daysBefore(today, KEEP_DAYS)
