import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'
import { getClientIp, rateLimitIpKey } from '@/lib/security/rateLimiter'
import { ORIGINS, endRound, parseEvent, placeFrom, playerHash, startRound, type GameStore, type Site } from '@/lib/game/stats'

/**
 * The dino catch game's events, from n8builds.dev and portfolio.n8builds.dev
 * (lib/game/stats.ts has what is kept, and why it is private). The body is
 * JSON sent as text/plain, so the portfolio's cross-site send needs no
 * preflight; only the listed origins are answered.
 *
 * Off until the analytics database is set (ANALYTICS_REDIS_REST_URL and
 * ANALYTICS_REDIS_REST_TOKEN, the same database the admin dashboard reads):
 * until then every event is accepted and dropped (204).
 */

let redis: Redis | null = null
function analytics(): Redis | null {
  const url = process.env.ANALYTICS_REDIS_REST_URL
  const token = process.env.ANALYTICS_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis ??= new Redis({ url, token })
  return redis
}

// Per player (the day's hash): a round takes 30 s, so a dozen starts a
// minute is already far more than anyone plays.
let limiter: Ratelimit | null = null
function rateLimit(store: Redis) {
  limiter ??= new Ratelimit({ redis: store, limiter: Ratelimit.slidingWindow(12, '1 m'), prefix: 'game:rl' })
  return limiter
}

// Per IP as well (its /64 for IPv6): a player is IP plus user agent, so a
// script changing its user agent on every request would otherwise pass the
// per-player limit and pile up fake players. 60 events a minute is five
// players at their own cap: a household or an office sharing one address.
let ipLimiter: Ratelimit | null = null
function ipRateLimit(store: Redis) {
  ipLimiter ??= new Ratelimit({ redis: store, limiter: Ratelimit.slidingWindow(60, '1 m'), prefix: 'game:rl:ip' })
  return ipLimiter
}

/** The site an origin belongs to; local and preview builds count as n8builds.dev outside production. */
function siteFor(origin: string | null): Site | null {
  if (!origin) return null
  if (ORIGINS[origin]) return ORIGINS[origin]
  if (process.env.VERCEL_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) return 'n8builds'
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

  const store = analytics()
  if (!store) return new NextResponse(null, { status: 204, headers })

  try {
    const now = new Date()
    // IPv6 by its /64, as for every other limit on the site; hashed, never stored.
    const ip = rateLimitIpKey(getClientIp(request.headers))
    // Checked before anything is counted, under a hash so no IP is stored.
    const byIp = await ipRateLimit(store).limit(createHash('sha256').update(`game-ip\n${ip}`).digest('hex').slice(0, 24))
    if (!byIp.success) return NextResponse.json({ error: 'limited' }, { status: 429, headers })
    const player = await playerHash(store as unknown as GameStore, now, ip, request.headers.get('user-agent') ?? '')
    const { success } = await rateLimit(store).limit(player)
    if (!success) return NextResponse.json({ error: 'limited' }, { status: 429, headers })

    if (event.type === 'start') {
      const started = await startRound(store as unknown as GameStore, now, site, player, placeFrom(request.headers))
      return NextResponse.json(started, { headers })
    }
    const result = await endRound(store as unknown as GameStore, now, site, player, event.round, event.score)
    return NextResponse.json({ result }, { status: result === 'counted' ? 200 : 409, headers })
  } catch (error) {
    // Stats must never break the page: log it and move on.
    logger.error('game stats failed', { error: error instanceof Error ? error.message : String(error) })
    return new NextResponse(null, { status: 204, headers })
  }
}
