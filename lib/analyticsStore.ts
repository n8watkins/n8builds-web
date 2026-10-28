import 'server-only'
import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'
import { KEEP_DAYS, utcDate } from '@/lib/game/stats'
import type { RefSource, RefTarget } from '@/lib/referrals'

/**
 * The analytics database (ANALYTICS_REDIS_REST_URL and _TOKEN), shared with
 * the admin dashboard, which reads these counters (n8builds-admin lib/store.ts):
 * - `ref:appturnity:<date>`  hash: link placement -> clicks to appturnity.com
 * - `ref:portfolio:<date>`   hash: link placement -> clicks to the portfolio (not shown in the admin yet)
 * - `contact:sent:<date>`    integer: contact messages delivered that day
 * Dates are UTC; keys expire after KEEP_DAYS, like the game's. Only counts,
 * never anything about the visitor. Null when the database isn't set.
 */
let redis: Redis | null = null
export function analyticsStore(): Redis | null {
  const url = process.env.ANALYTICS_REDIS_REST_URL
  const token = process.env.ANALYTICS_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis ??= new Redis({ url, token })
  return redis
}

const KEEP = KEEP_DAYS * 24 * 60 * 60
// A count is never worth holding a request open: give up after this long.
const TIMEOUT_MS = 2000

/** Runs a counter, logging (never throwing) on failure or timeout. */
async function quietly(label: string, work: () => Promise<unknown>): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      work(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timed out')), TIMEOUT_MS)
      }),
    ])
  } catch (error) {
    logger.warn(`Counter ${label} failed:`, error instanceof Error ? error.message : error)
  } finally {
    clearTimeout(timer)
  }
}

type Counter = Pick<Redis, 'hincrby' | 'incr' | 'expire'>

export function countReferral(store: Counter, target: RefTarget, from: RefSource, now = new Date()): Promise<void> {
  const key = `ref:${target}:${utcDate(now)}`
  return quietly(key, async () => {
    await store.hincrby(key, from, 1)
    await store.expire(key, KEEP)
  })
}

export function countContactSent(store: Counter, now = new Date()): Promise<void> {
  const key = `contact:sent:${utcDate(now)}`
  return quietly(key, async () => {
    await store.incr(key)
    await store.expire(key, KEEP)
  })
}
