import { createHash } from 'node:crypto'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { logger } from '@/lib/logger'
import { isContactTestMode } from '@/lib/security/testMode'

/**
 * Rate limiting: the contact form, the waitlist, and the counters
 *
 * The contact form has three limits (the waitlist's mirror them, see
 * RateLimitScope):
 * - Per IP: 5 submissions per hour (50 in `next dev`); IPv6 per /64, since
 *   one subscriber usually holds a whole /64
 * - Site-wide: CONTACT_DAILY_LIMIT verified submissions per day (default 50),
 *   a backstop for the inbox and Gmail's sending quota
 * - Per recipient: 1 auto-reply per address per day, keyed by a hash of the
 *   address (no plain email stored)
 *
 * On Cloudflare each limit and key is a sliding window kept in its own Durable
 * Object (RATE_LIMIT_COUNTERS, worker/rate-limit-counter.js), so every Worker
 * instance shares the same counters. Without the binding, production fails
 * closed (rejects) rather than silently running unlimited. CONTACT_TEST_MODE
 * always uses an in-memory store, and `next dev` does too.
 *
 * Counter names outside production get their own namespace (contact:preview:*,
 * contact:local:*), so other deployments never touch production's counters.
 * The namespace is APP_ENV (set in wrangler.jsonc on deployed Workers), or
 * "local".
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

// Counted things, not forms: an over-limit request still gets its answer,
// it just isn't counted (docs/DATABASE.md, "Stuffing the counters").
const MINUTE_MS = 60 * 1000
// A game round takes 30 s, so a dozen starts a minute is far more than anyone plays.
const GAME_PLAYER_LIMIT = 12
// Five players at their own cap: a household or an office sharing one address.
const GAME_IP_LIMIT = 60
// Short-link clicks counted per IP an hour.
const REF_IP_LIMIT = 20

/**
 * - 'ip', 'global', 'recipient': the contact form (above)
 * - 'waitlist-ip': waitlist requests per IP (5/hour, IPv6 per /64)
 * - 'waitlist-global': waitlist emails per day site-wide (WAITLIST_DAILY_LIMIT,
 *   default 100), so the waitlist can't use up Gmail's sending quota
 * - 'waitlist-recipient': waitlist emails per address per day (3)
 * - 'game-player', 'game-ip': dino game events per player hash and per IP a minute (12, 60)
 * - 'ref-ip': short-link clicks counted per IP an hour (20)
 */
export type RateLimitScope =
  | 'ip'
  | 'global'
  | 'recipient'
  | 'waitlist-ip'
  | 'waitlist-global'
  | 'waitlist-recipient'
  | 'game-player'
  | 'game-ip'
  | 'ref-ip'

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

/** The part of the RATE_LIMIT_COUNTERS Durable Object namespace this file uses. */
export interface CounterNamespace {
  idFromName(name: string): unknown
  get(id: unknown): { limit(max: number, windowMs: number): Promise<boolean> }
}

const COUNTER_TIMEOUT_MS = 3000

/**
 * A sliding window in one Durable Object per key (worker/rate-limit-counter.js).
 * Any error or a reply slower than 3 seconds counts as unavailable: reject.
 */
export class DurableObjectLimiter implements Limiter {
  constructor(
    private readonly counters: CounterNamespace,
    private readonly max: number,
    private readonly windowMs: number,
    private readonly prefix: string
  ) {}

  async limit(key: string): Promise<RateLimitResult> {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const counter = this.counters.get(this.counters.idFromName(`${this.prefix}:${key}`))
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('rate-limit counter timed out')), COUNTER_TIMEOUT_MS)
      })
      const allowed = await Promise.race([counter.limit(this.max, this.windowMs), timeout])
      return allowed ? { allowed: true } : { allowed: false, reason: 'limited' }
    } catch (error) {
      logger.error('Rate limiter error:', error)
      return { allowed: false, reason: 'unavailable' }
    } finally {
      clearTimeout(timer)
    }
  }
}

const unavailable: Limiter = {
  async limit() {
    return { allowed: false, reason: 'unavailable' }
  },
}

/** The counters' binding on Cloudflare, or undefined elsewhere (next dev, next start, tests). */
function counterNamespace(): CounterNamespace | undefined {
  try {
    return getCloudflareContext().env.RATE_LIMIT_COUNTERS as CounterNamespace | undefined
  } catch {
    return undefined
  }
}

/** Counter name prefix: production keeps the bare names, everything else is namespaced. */
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
    'game-player': new MemoryLimiter(GAME_PLAYER_LIMIT, MINUTE_MS),
    'game-ip': new MemoryLimiter(GAME_IP_LIMIT, MINUTE_MS),
    'ref-ip': new MemoryLimiter(REF_IP_LIMIT, IP_WINDOW_MS),
  }
}

function createLimiters(): Record<RateLimitScope, Limiter> {
  // Test runs must never count against (or be blocked by) real counters.
  if (isContactTestMode()) return memoryLimiters()

  const counters = counterNamespace()
  if (counters) {
    const prefix = keyPrefix()
    return {
      ip: new DurableObjectLimiter(counters, IP_LIMIT, IP_WINDOW_MS, `${prefix}:ip`),
      global: new DurableObjectLimiter(counters, globalLimit(), GLOBAL_WINDOW_MS, `${prefix}:global`),
      recipient: new DurableObjectLimiter(counters, RECIPIENT_LIMIT, RECIPIENT_WINDOW_MS, `${prefix}:recipient`),
      'waitlist-ip': new DurableObjectLimiter(counters, WAITLIST_IP_LIMIT, IP_WINDOW_MS, `${prefix}:waitlist-ip`),
      'waitlist-global': new DurableObjectLimiter(counters, waitlistDailyLimit(), GLOBAL_WINDOW_MS, `${prefix}:waitlist-global`),
      'waitlist-recipient': new DurableObjectLimiter(counters, WAITLIST_RECIPIENT_LIMIT, RECIPIENT_WINDOW_MS, `${prefix}:waitlist-recipient`),
      'game-player': new DurableObjectLimiter(counters, GAME_PLAYER_LIMIT, MINUTE_MS, `${prefix}:game-player`),
      'game-ip': new DurableObjectLimiter(counters, GAME_IP_LIMIT, MINUTE_MS, `${prefix}:game-ip`),
      'ref-ip': new DurableObjectLimiter(counters, REF_IP_LIMIT, IP_WINDOW_MS, `${prefix}:ref-ip`),
    }
  }

  if (process.env.NODE_ENV === 'development') return memoryLimiters()

  logger.error('The rate-limit counters (RATE_LIMIT_COUNTERS) are missing - contact form and waitlist are disabled')
  return {
    ip: unavailable,
    global: unavailable,
    recipient: unavailable,
    'waitlist-ip': unavailable,
    'waitlist-global': unavailable,
    'waitlist-recipient': unavailable,
    'game-player': unavailable,
    'game-ip': unavailable,
    'ref-ip': unavailable,
  }
}

let limiters: Record<RateLimitScope, Limiter> | null = null

/**
 * Count one request against a limit. Call only after Turnstile passes, so
 * requests without a solved challenge never reach the counters.
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
