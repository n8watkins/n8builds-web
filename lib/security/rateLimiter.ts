import { createHash } from 'node:crypto'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'
import { isContactTestMode } from '@/lib/security/testMode'

/**
 * Contact-form and waitlist rate limiting
 *
 * The contact form has three limits (the waitlist's mirror them, see
 * RateLimitScope):
 * - Per IP: 5 submissions per hour (50 in `next dev`); IPv6 per /64, since
 *   one subscriber usually holds a whole /64
 * - Site-wide: CONTACT_DAILY_LIMIT verified submissions per day (default 50),
 *   a backstop for the inbox and Gmail's sending quota
 * - Per recipient: 1 auto-reply per address per day, keyed by a hash of the
 *   address (no plain email in Redis)
 *
 * Production uses Upstash Redis so every serverless instance shares the same
 * counters. Without Upstash configured, production fails closed (rejects) rather
 * than silently running unlimited. CONTACT_TEST_MODE always uses an in-memory
 * store, and `next dev` does too when Upstash isn't configured.
 *
 * One Redis database can serve every environment: keys outside production
 * get their own namespace (contact:preview:*, contact:local:*), so previews
 * and local runs never touch production's counters. The namespace is APP_ENV
 * (set in wrangler.jsonc on deployed Workers), or "local".
 */

const IP_WINDOW_MS = 60 * 60 * 1000
const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000
const RECIPIENT_WINDOW_MS = 24 * 60 * 60 * 1000
const RECIPIENT_LIMIT = 1
const IP_LIMIT = process.env.NODE_ENV === 'development' ? 50 : 5
const DEFAULT_GLOBAL_LIMIT = 50

const WAITLIST_IP_LIMIT = process.env.NODE_ENV === 'development' ? 50 : 5
// Confirmation and removal-link emails to one address per day.
const WAITLIST_RECIPIENT_LIMIT = 3
const DEFAULT_WAITLIST_DAILY_LIMIT = 100

/**
 * - 'ip', 'global', 'recipient': the contact form (above)
 * - 'waitlist-ip': waitlist requests per IP (5/hour, IPv6 per /64)
 * - 'waitlist-global': waitlist emails per day site-wide (WAITLIST_DAILY_LIMIT,
 *   default 100), so the waitlist can't use up Gmail's sending quota
 * - 'waitlist-recipient': waitlist emails per address per day (3)
 */
export type RateLimitScope = 'ip' | 'global' | 'recipient' | 'waitlist-ip' | 'waitlist-global' | 'waitlist-recipient'

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: 'limited' | 'unavailable' }

interface Limiter {
  limit(key: string): Promise<RateLimitResult>
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function globalLimit(): number {
  return positiveInt(process.env.CONTACT_DAILY_LIMIT, DEFAULT_GLOBAL_LIMIT)
}

function waitlistDailyLimit(): number {
  return positiveInt(process.env.WAITLIST_DAILY_LIMIT, DEFAULT_WAITLIST_DAILY_LIMIT)
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

/** Redis key prefix: production keeps the bare names, everything else is namespaced. */
function keyPrefix(): string {
  const env = process.env.APP_ENV || 'local'
  return env === 'production' ? 'contact' : `contact:${env}`
}

function memoryLimiters(): Record<RateLimitScope, Limiter> {
  return {
    ip: new MemoryLimiter(IP_LIMIT, IP_WINDOW_MS),
    global: new MemoryLimiter(globalLimit(), GLOBAL_WINDOW_MS),
    recipient: new MemoryLimiter(RECIPIENT_LIMIT, RECIPIENT_WINDOW_MS),
    'waitlist-ip': new MemoryLimiter(WAITLIST_IP_LIMIT, IP_WINDOW_MS),
    'waitlist-global': new MemoryLimiter(waitlistDailyLimit(), GLOBAL_WINDOW_MS),
    'waitlist-recipient': new MemoryLimiter(WAITLIST_RECIPIENT_LIMIT, RECIPIENT_WINDOW_MS),
  }
}

function createLimiters(): Record<RateLimitScope, Limiter> {
  // Test runs must never count against (or be blocked by) real counters.
  if (isContactTestMode()) return memoryLimiters()

  if (hasUpstashConfig()) {
    const redis = Redis.fromEnv()
    const prefix = keyPrefix()
    return {
      ip: new UpstashLimiter(redis, IP_LIMIT, '1 h', `${prefix}:ip`),
      global: new UpstashLimiter(redis, globalLimit(), '1 d', `${prefix}:global`),
      recipient: new UpstashLimiter(redis, RECIPIENT_LIMIT, '1 d', `${prefix}:recipient`),
      'waitlist-ip': new UpstashLimiter(redis, WAITLIST_IP_LIMIT, '1 h', `${prefix}:waitlist-ip`),
      'waitlist-global': new UpstashLimiter(redis, waitlistDailyLimit(), '1 d', `${prefix}:waitlist-global`),
      'waitlist-recipient': new UpstashLimiter(redis, WAITLIST_RECIPIENT_LIMIT, '1 d', `${prefix}:waitlist-recipient`),
    }
  }

  if (process.env.NODE_ENV === 'development') return memoryLimiters()

  logger.error('Upstash Redis is not configured - contact form and waitlist are disabled')
  return {
    ip: unavailable,
    global: unavailable,
    recipient: unavailable,
    'waitlist-ip': unavailable,
    'waitlist-global': unavailable,
    'waitlist-recipient': unavailable,
  }
}

let limiters: Record<RateLimitScope, Limiter> | null = null

/**
 * Count one request against a limit. Call only after Turnstile passes, so
 * requests without a solved challenge never reach Redis.
 * - 'ip': keyed by rateLimitIpKey()
 * - 'global': keyed by 'all'
 * - 'recipient': keyed by recipientKey(), before sending the auto-reply
 * - 'waitlist-ip', 'waitlist-global', 'waitlist-recipient': the same keys, for the waitlist
 */
export function checkRateLimit(scope: RateLimitScope, key: string): Promise<RateLimitResult> {
  limiters ??= createLimiters()
  return limiters[scope].limit(key)
}

/**
 * Client IP for rate limiting. On Cloudflare, CF-Connecting-IP is set by the
 * edge and overwrites anything the client sent, so it can't be spoofed there
 * (X-Forwarded-For can: Cloudflare appends to what the client sent). The other
 * two headers only matter off Cloudflare (next start behind a local proxy).
 */
export function getClientIp(headers: Headers): string {
  const cloudflareIp = headers.get('cf-connecting-ip')?.trim()
  if (cloudflareIp) return cloudflareIp

  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || 'unknown'
}

/**
 * Rate-limit key for a client IP: IPv4 as is, IPv6 reduced to its /64 prefix.
 * ISPs hand each subscriber a /64 (or larger), so per-address IPv6 limits are
 * trivially bypassed by rotating the low 64 bits.
 */
export function rateLimitIpKey(ip: string): string {
  if (!ip.includes(':')) return ip
  // Drop a zone index, and an IPv4-mapped tail (::ffff:1.2.3.4 is just IPv4).
  const address = ip.split('%')[0].toLowerCase()
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return mapped[1]

  const [head, tail] = address.split('::')
  const headParts = head ? head.split(':') : []
  const tailParts = tail ? tail.split(':') : []
  const groups =
    tail === undefined ? headParts : [...headParts, ...Array(8 - headParts.length - tailParts.length).fill('0'), ...tailParts]
  return `${groups
    .slice(0, 4)
    .map((g) => (parseInt(g, 16) || 0).toString(16))
    .join(':')}::/64`
}

/** Rate-limit key for an auto-reply recipient: a hash of the normalized address. */
export function recipientKey(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 32)
}
