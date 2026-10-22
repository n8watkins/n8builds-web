import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'
import { isContactTestMode } from '@/lib/security/testMode'

/**
 * Contact-form rate limiting
 *
 * Two limits:
 * - Per IP: 5 submissions per hour (50 in `next dev`)
 * - Site-wide: CONTACT_DAILY_LIMIT verified submissions per day (default 50),
 *   a backstop for the inbox and Gmail's sending quota
 *
 * Production uses Upstash Redis so every serverless instance shares the same
 * counters. Without Upstash configured, production fails closed (rejects) rather
 * than silently running unlimited. `next dev` and CONTACT_TEST_MODE fall back to
 * an in-memory store.
 */

const IP_WINDOW_MS = 60 * 60 * 1000
const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000
const IP_LIMIT = process.env.NODE_ENV === 'development' ? 50 : 5
const DEFAULT_GLOBAL_LIMIT = 50

export type RateLimitScope = 'ip' | 'global'

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: 'limited' | 'unavailable' }

interface Limiter {
  limit(key: string): Promise<RateLimitResult>
}

function globalLimit(): number {
  const parsed = Number(process.env.CONTACT_DAILY_LIMIT)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_GLOBAL_LIMIT
}

/**
 * Fixed-window counter kept in this process's memory. Only correct for a single
 * long-lived process, which is why production never uses it.
 */
export class MemoryLimiter implements Limiter {
  private entries = new Map<string, { count: number; resetAt: number }>()

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now
  ) {}

  async limit(key: string): Promise<RateLimitResult> {
    const now = this.now()
    const entry = this.entries.get(key)

    if (!entry || now >= entry.resetAt) {
      this.entries.set(key, { count: 1, resetAt: now + this.windowMs })
      this.prune(now)
      return { allowed: true }
    }

    if (entry.count >= this.max) return { allowed: false, reason: 'limited' }

    entry.count++
    return { allowed: true }
  }

  private prune(now: number) {
    if (this.entries.size < 10_000) return
    this.entries.forEach((entry, key) => {
      if (now >= entry.resetAt) this.entries.delete(key)
    })
  }
}

class UpstashLimiter implements Limiter {
  private readonly ratelimit: Ratelimit

  constructor(redis: Redis, max: number, window: `${number} ${'h' | 'd'}`, prefix: string) {
    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, window),
      prefix,
      timeout: 3000,
    })
  }

  async limit(key: string): Promise<RateLimitResult> {
    try {
      const { success, reason } = await this.ratelimit.limit(key)
      // Upstash lets requests through on timeout; we'd rather reject.
      if (reason === 'timeout') {
        logger.error('Rate limiter timed out reaching Upstash')
        return { allowed: false, reason: 'unavailable' }
      }
      return success ? { allowed: true } : { allowed: false, reason: 'limited' }
    } catch (error) {
      logger.error('Rate limiter error:', error)
      return { allowed: false, reason: 'unavailable' }
    }
  }
}

const unavailable: Limiter = {
  async limit() {
    return { allowed: false, reason: 'unavailable' }
  },
}

function hasUpstashConfig(): boolean {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  )
}

function createLimiters(): Record<RateLimitScope, Limiter> {
  if (hasUpstashConfig()) {
    const redis = Redis.fromEnv()
    return {
      ip: new UpstashLimiter(redis, IP_LIMIT, '1 h', 'contact:ip'),
      global: new UpstashLimiter(redis, globalLimit(), '1 d', 'contact:global'),
    }
  }

  if (process.env.NODE_ENV === 'development' || isContactTestMode()) {
    return {
      ip: new MemoryLimiter(IP_LIMIT, IP_WINDOW_MS),
      global: new MemoryLimiter(globalLimit(), GLOBAL_WINDOW_MS),
    }
  }

  logger.error('Upstash Redis is not configured - contact form is disabled')
  return { ip: unavailable, global: unavailable }
}

let limiters: Record<RateLimitScope, Limiter> | null = null

/**
 * Count one request against a limit.
 * - 'ip': call first, keyed by client IP, before any expensive work
 * - 'global': call only after Turnstile passes, so junk requests can't use up
 *   the site-wide daily allowance
 */
export function checkRateLimit(scope: RateLimitScope, key: string): Promise<RateLimitResult> {
  limiters ??= createLimiters()
  return limiters[scope].limit(key)
}

/**
 * Client IP for rate limiting. On Vercel both headers are set by the edge and
 * overwrite anything the client sent, so they can't be spoofed there.
 */
export function getClientIp(headers: Headers): string {
  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || 'unknown'
}
