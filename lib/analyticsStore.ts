import 'server-only'
import { logger } from '@/lib/logger'
import { utcDate } from '@/lib/game/stats'
import { increment } from '@/lib/counters'
import type { D1Database } from '@/lib/db'
import type { RefSource, RefTarget } from '@/lib/referrals'

/**
 * The daily counters in n8builds-analytics (docs/DATABASE.md), which the
 * admin dashboard reads (n8builds-admin lib/store.ts):
 * - `ref:<target>`  field: link placement -> clicks to appturnity.com, techforpros.com, the portfolio
 * - `contact:sent`  contact messages delivered that day
 * Dates are UTC; rows are deleted after KEEP_DAYS by the daily cleanup
 * (lib/retention.ts). Only counts, never anything about the visitor.
 */

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

export function countReferral(db: D1Database, target: RefTarget, from: RefSource, now = new Date()): Promise<void> {
  const metric = `ref:${target}`
  return quietly(metric, () => increment(db, metric, utcDate(now), from).run())
}

export function countContactSent(db: D1Database, now = new Date()): Promise<void> {
  return quietly('contact:sent', () => increment(db, 'contact:sent', utcDate(now)).run())
}
