import { beforeEach, describe, expect, it, vi } from 'vitest'
import { slide } from '../../worker/sliding-window.js'

// The Durable Object counters (RATE_LIMIT_COUNTERS) as the Worker sees them:
// `limit` answers for the counter named `names[i]`.
const counterLimit = vi.fn<(max: number, windowMs: number) => Promise<boolean>>()
const counterNames: string[] = []
let counters: object | undefined
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => {
    if (!counters) throw new Error('not on Workers')
    return { env: { RATE_LIMIT_COUNTERS: counters } }
  },
}))
const fakeCounters = {
  idFromName: (name: string) => {
    counterNames.push(name)
    return name
  },
  get: () => ({ limit: counterLimit }),
}

/** Fresh module per test: the limiter picks its backend once, on first use. */
const { rateLimitIpKey, recipientKey } = await import('@/lib/security/rateLimiter')

async function loadLimiter() {
  vi.resetModules()
  return import('@/lib/security/rateLimiter')
}

function clearBackendEnv() {
  for (const key of [
    'CONTACT_TEST_MODE',
    'CONTACT_DAILY_LIMIT',
    'WAITLIST_DAILY_LIMIT',
    'APP_ENV',
  ]) {
    vi.stubEnv(key, '')
  }
}

beforeEach(() => {
  clearBackendEnv()
  counterLimit.mockReset()
  counterNames.length = 0
  counters = undefined
})

describe('MemoryLimiter', () => {
  it('allows up to the limit within a window, then blocks', async () => {
    const { MemoryLimiter } = await loadLimiter()
    const limiter = new MemoryLimiter(3, 1000, () => 0)

    for (let i = 0; i < 3; i++) expect(await limiter.limit('a')).toEqual({ allowed: true })
    expect(await limiter.limit('a')).toEqual({ allowed: false, reason: 'limited' })
  })

  it('tracks keys independently', async () => {
    const { MemoryLimiter } = await loadLimiter()
    const limiter = new MemoryLimiter(1, 1000, () => 0)

    await limiter.limit('a')
    expect(await limiter.limit('a')).toMatchObject({ allowed: false })
    expect(await limiter.limit('b')).toEqual({ allowed: true })
  })

  it('resets once the window has passed', async () => {
    const { MemoryLimiter } = await loadLimiter()
    let now = 0
    const limiter = new MemoryLimiter(1, 1000, () => now)

    await limiter.limit('a')
    expect(await limiter.limit('a')).toMatchObject({ allowed: false })
    now = 1000
    expect(await limiter.limit('a')).toEqual({ allowed: true })
  })
})

describe('checkRateLimit backend selection', () => {
  it('fails closed in production without the counters binding', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { checkRateLimit } = await loadLimiter()

    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: false, reason: 'unavailable' })
    expect(await checkRateLimit('global', 'all')).toEqual({ allowed: false, reason: 'unavailable' })
  })

  it('ignores CONTACT_TEST_MODE on a deployed site and still fails closed', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CONTACT_TEST_MODE', '1')
    vi.stubEnv('APP_ENV', 'production')
    const { checkRateLimit } = await loadLimiter()

    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: false, reason: 'unavailable' })
  })

  it('uses the in-memory store in test mode: 5 per IP', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CONTACT_TEST_MODE', '1')
    const { checkRateLimit } = await loadLimiter()

    for (let i = 0; i < 5; i++) expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: true })
    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: false, reason: 'limited' })
  })

  it('applies CONTACT_DAILY_LIMIT to the site-wide counter', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CONTACT_TEST_MODE', '1')
    vi.stubEnv('CONTACT_DAILY_LIMIT', '2')
    const { checkRateLimit } = await loadLimiter()

    expect(await checkRateLimit('global', 'all')).toEqual({ allowed: true })
    expect(await checkRateLimit('global', 'all')).toEqual({ allowed: true })
    expect(await checkRateLimit('global', 'all')).toEqual({ allowed: false, reason: 'limited' })
  })

  it('falls back to the default daily limit for invalid values', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CONTACT_TEST_MODE', '1')
    vi.stubEnv('CONTACT_DAILY_LIMIT', 'lots')
    const { checkRateLimit } = await loadLimiter()

    for (let i = 0; i < 50; i++) expect(await checkRateLimit('global', 'all')).toEqual({ allowed: true })
    expect(await checkRateLimit('global', 'all')).toMatchObject({ allowed: false })
  })

  it('counts the waitlist apart from the contact form', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CONTACT_TEST_MODE', '1')
    vi.stubEnv('WAITLIST_DAILY_LIMIT', '1')
    const { checkRateLimit } = await loadLimiter()

    for (let i = 0; i < 5; i++) expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: true })
    expect(await checkRateLimit('waitlist-ip', '1.2.3.4')).toEqual({ allowed: true })
    expect(await checkRateLimit('waitlist-global', 'all')).toEqual({ allowed: true })
    expect(await checkRateLimit('waitlist-global', 'all')).toEqual({ allowed: false, reason: 'limited' })
    for (let i = 0; i < 3; i++) expect(await checkRateLimit('waitlist-recipient', 'a')).toEqual({ allowed: true })
    expect(await checkRateLimit('waitlist-recipient', 'a')).toEqual({ allowed: false, reason: 'limited' })
    expect(await checkRateLimit('recipient', 'a')).toEqual({ allowed: true })
  })
})

describe('Durable Object counters', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
    counters = fakeCounters
  })

  it('allows when the counter allows, with the limit and window of the scope', async () => {
    counterLimit.mockResolvedValue(true)
    const { checkRateLimit } = await loadLimiter()
    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: true })
    expect(counterLimit).toHaveBeenCalledWith(5, 60 * 60 * 1000)
    expect(await checkRateLimit('global', 'all')).toEqual({ allowed: true })
    expect(counterLimit).toHaveBeenLastCalledWith(50, 24 * 60 * 60 * 1000)
    expect(await checkRateLimit('waitlist-recipient', 'hash')).toEqual({ allowed: true })
    expect(counterLimit).toHaveBeenLastCalledWith(3, 24 * 60 * 60 * 1000)
  })

  it('limits when the counter limits', async () => {
    counterLimit.mockResolvedValue(false)
    const { checkRateLimit } = await loadLimiter()
    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: false, reason: 'limited' })
  })

  it('fails closed when the counter throws', async () => {
    counterLimit.mockRejectedValue(new Error('Durable Object reset'))
    const { checkRateLimit } = await loadLimiter()
    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: false, reason: 'unavailable' })
  })

  it('fails closed when the counter takes longer than 3 seconds', async () => {
    vi.useFakeTimers()
    try {
      counterLimit.mockReturnValue(new Promise(() => {}))
      const { checkRateLimit } = await loadLimiter()
      const result = checkRateLimit('ip', '1.2.3.4')
      await vi.advanceTimersByTimeAsync(3000)
      expect(await result).toEqual({ allowed: false, reason: 'unavailable' })
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps the bare counter names in production', async () => {
    vi.stubEnv('APP_ENV', 'production')
    counterLimit.mockResolvedValue(true)
    const { checkRateLimit } = await loadLimiter()
    await checkRateLimit('ip', '1.2.3.4')
    await checkRateLimit('recipient', 'hash')
    expect(counterNames).toEqual(['contact:ip:1.2.3.4', 'contact:recipient:hash'])
  })

  it('namespaces other deployments away from production counters', async () => {
    vi.stubEnv('APP_ENV', 'preview')
    counterLimit.mockResolvedValue(true)
    const { checkRateLimit } = await loadLimiter()
    await checkRateLimit('waitlist-global', 'all')
    expect(counterNames).toEqual(['contact:preview:waitlist-global:all'])
  })

  it('namespaces local runs away from production counters', async () => {
    counterLimit.mockResolvedValue(true)
    const { checkRateLimit } = await loadLimiter()
    await checkRateLimit('ip', '1.2.3.4')
    expect(counterNames).toEqual(['contact:local:ip:1.2.3.4'])
  })

  it('never touches the counters in test mode, even when they are bound', async () => {
    vi.stubEnv('CONTACT_TEST_MODE', '1')
    const { checkRateLimit } = await loadLimiter()
    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: true })
    expect(counterLimit).not.toHaveBeenCalled()
  })
})

describe("slide (the counter's sliding window, worker/sliding-window.js)", () => {
  const HOUR = 60 * 60 * 1000

  it('allows up to the limit in any window, then refuses without counting', () => {
    let hits: number[] = []
    for (let i = 0; i < 5; i++) {
      const step = slide(hits, 1000 + i, 5, HOUR)
      expect(step.allowed).toBe(true)
      hits = step.hits
    }
    const refused = slide(hits, 2000, 5, HOUR)
    expect(refused).toEqual({ allowed: false, hits })
  })

  it('lets a request through once the oldest hit leaves the window', () => {
    const hits = [0, 10, 20, 30, 40]
    expect(slide(hits, HOUR - 1, 5, HOUR).allowed).toBe(false)
    expect(slide(hits, HOUR, 5, HOUR)).toEqual({ allowed: true, hits: [10, 20, 30, 40, HOUR] })
  })

  it('forgets every hit older than the window', () => {
    expect(slide([0, 1, 2], 10 * HOUR, 1, HOUR)).toEqual({ allowed: true, hits: [10 * HOUR] })
  })
})

describe('getClientIp', () => {
  it("prefers Cloudflare's cf-connecting-ip, which the client can't set", async () => {
    const { getClientIp } = await loadLimiter()
    expect(getClientIp(new Headers({ 'cf-connecting-ip': '9.9.9.9', 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' }))).toBe('9.9.9.9')
  })

  it('then x-real-ip', async () => {
    const { getClientIp } = await loadLimiter()
    expect(getClientIp(new Headers({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' }))).toBe('1.1.1.1')
  })

  it('falls back to the first x-forwarded-for entry', async () => {
    const { getClientIp } = await loadLimiter()
    expect(getClientIp(new Headers({ 'x-forwarded-for': ' 2.2.2.2 , 3.3.3.3' }))).toBe('2.2.2.2')
  })

  it('returns "unknown" when no header is present', async () => {
    const { getClientIp } = await loadLimiter()
    expect(getClientIp(new Headers())).toBe('unknown')
  })
})

describe('rateLimitIpKey', () => {
  it('keeps IPv4 addresses as they are', () => {
    expect(rateLimitIpKey('203.0.113.7')).toBe('203.0.113.7')
  })

  it('reduces IPv6 to its /64, so rotating the interface ID does not help', () => {
    const a = rateLimitIpKey('2001:db8:abcd:12:1111:2222:3333:4444')
    expect(a).toBe('2001:db8:abcd:12::/64')
    expect(rateLimitIpKey('2001:db8:abcd:12::9')).toBe(a)
    expect(rateLimitIpKey('2001:DB8:ABCD:0012:ffff::1')).toBe(a)
    expect(rateLimitIpKey('2001:db8:abcd:13::1')).not.toBe(a)
  })

  it('expands :: in the prefix and ignores zone indexes', () => {
    expect(rateLimitIpKey('2001:db8::1')).toBe('2001:db8:0:0::/64')
    expect(rateLimitIpKey('fe80::1%eth0')).toBe('fe80:0:0:0::/64')
  })

  it('treats IPv4-mapped IPv6 as IPv4', () => {
    expect(rateLimitIpKey('::ffff:203.0.113.7')).toBe('203.0.113.7')
  })
})

describe('recipientKey', () => {
  it('is the same for any casing or padding of one address, and hides it', () => {
    const key = recipientKey('Someone@Example.com')
    expect(recipientKey(' someone@example.com ')).toBe(key)
    expect(recipientKey('other@example.com')).not.toBe(key)
    expect(key).not.toContain('example')
  })
})

describe('recipient limit', () => {
  it('allows one auto-reply per address per day', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CONTACT_TEST_MODE', '1')
    const { checkRateLimit } = await loadLimiter()

    expect(await checkRateLimit('recipient', 'a')).toEqual({ allowed: true })
    expect(await checkRateLimit('recipient', 'a')).toEqual({ allowed: false, reason: 'limited' })
    expect(await checkRateLimit('recipient', 'b')).toEqual({ allowed: true })
  })
})
