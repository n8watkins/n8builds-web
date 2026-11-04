import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { analyticsDb } from '@/lib/db'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, rateLimitIpKey } from '@/lib/security/rateLimiter'
import { ORIGINS, endRound, parseEvent, placeFrom, playerHash, startRound, type Site } from '@/lib/game/stats'

/**
 * The dino catch game's events, from n8builds.dev and portfolio.n8builds.dev
 * (lib/game/stats.ts has what is kept, and why it is private). The body is
 * JSON sent as text/plain, so the portfolio's cross-site send needs no
 * preflight; only the listed origins are answered.
 *
 * Kept in n8builds-analytics (docs/DATABASE.md). Without the database every
 * event is accepted and dropped (204). Limits: 60 events a minute per IP (its
 * /64 for IPv6), so a script changing its user agent on every request can't
 * pile up fake players, then 12 a minute per player (a round takes 30 s).
 */

/** The site an origin belongs to; local and preview builds count as n8builds.dev outside production. */
function siteFor(origin: string | null): Site | null {
  if (!origin) return null
  if (ORIGINS[origin]) return ORIGINS[origin]
  if (process.env.APP_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) return 'n8builds'
  return null
}

function cors(origin: string) {
  return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Cache-Control': 'no-store' }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!siteFor(origin)) return new NextResponse(null, { status: 403 })
  return new NextResponse(null, {
    status: 204,
    headers: { ...cors(origin!), 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
  })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const site = siteFor(origin)
  if (!site) return NextResponse.json({ error: 'origin' }, { status: 403 })
  const headers = cors(origin!)

  const text = await request.text()
  if (text.length > 512) return NextResponse.json({ error: 'size' }, { status: 413, headers })
  let event
  try {
    event = parseEvent(JSON.parse(text))
  } catch {
    event = null
  }
  if (!event) return NextResponse.json({ error: 'invalid' }, { status: 400, headers })

  const db = await analyticsDb()
  if (!db) return new NextResponse(null, { status: 204, headers })

  try {
    const now = new Date()
    // IPv6 by its /64, as for every other limit on the site; the limit is
    // keyed by a hash, so no IP is stored even there.
    const ip = rateLimitIpKey(getClientIp(request.headers))
    // Checked before anything is counted. Over the limit, or the limiter
    // unavailable: a 429, and nothing counted.
    const ipKey = createHash('sha256').update(`game-ip\n${ip}`).digest('hex').slice(0, 24)
    if (!(await checkRateLimit('game-ip', ipKey)).allowed) return NextResponse.json({ error: 'limited' }, { status: 429, headers })
    const player = await playerHash(db, now, ip, request.headers.get('user-agent') ?? '')
    if (!(await checkRateLimit('game-player', player)).allowed) return NextResponse.json({ error: 'limited' }, { status: 429, headers })

    if (event.type === 'start') {
      const started = await startRound(db, now, site, player, placeFrom(request.headers))
      return NextResponse.json(started, { headers })
    }
    const result = await endRound(db, now, site, player, event.round, event.score)
    return NextResponse.json({ result }, { status: result === 'counted' ? 200 : 409, headers })
  } catch (error) {
    // Stats must never break the page: log it and move on.
    logger.error('game stats failed', { error: error instanceof Error ? error.message : String(error) })
    return new NextResponse(null, { status: 204, headers })
  }
}
