import { beforeEach, describe, expect, it, vi } from 'vitest'

const upstashLimit = vi.fn()
vi.mock('@upstash/ratelimit', () => {
  class Ratelimit {
    static slidingWindow = vi.fn()
    limit = upstashLimit
  }
  return { Ratelimit }
})
vi.mock('@upstash/redis', () => ({ Redis: { fromEnv: vi.fn(() => ({})) } }))

/** Fresh module per test: the limiter picks its backend once, on first use. */
async function loadLimiter() {
  vi.resetModules()
  return import('@/lib/security/rateLimiter')
}

function clearBackendEnv() {
  for (const key of [
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'CONTACT_TEST_MODE',
    'CONTACT_DAILY_LIMIT',
    'VERCEL',
  ]) {
    vi.stubEnv(key, '')
  }
}

beforeEach(() => {
  clearBackendEnv()
  upstashLimit.mockReset()
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
  it('fails closed in production when Upstash is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { checkRateLimit } = await loadLimiter()

    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: false, reason: 'unavailable' })
    expect(await checkRateLimit('global', 'all')).toEqual({ allowed: false, reason: 'unavailable' })
  })

  it('ignores CONTACT_TEST_MODE on Vercel and still fails closed', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CONTACT_TEST_MODE', '1')
    vi.stubEnv('VERCEL', '1')
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
})

describe('Upstash-backed limiting', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('KV_REST_API_URL', 'https://example.upstash.io')
    vi.stubEnv('KV_REST_API_TOKEN', 'token')
  })

  it('allows when Upstash allows', async () => {
    upstashLimit.mockResolvedValue({ success: true })
    const { checkRateLimit } = await loadLimiter()
    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: true })
    expect(upstashLimit).toHaveBeenCalledWith('1.2.3.4')
  })

  it('limits when Upstash limits', async () => {
    upstashLimit.mockResolvedValue({ success: false })
    const { checkRateLimit } = await loadLimiter()
    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: false, reason: 'limited' })
  })

  it('fails closed when Upstash times out (Upstash itself would allow)', async () => {
    upstashLimit.mockResolvedValue({ success: true, reason: 'timeout' })
    const { checkRateLimit } = await loadLimiter()
    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: false, reason: 'unavailable' })
  })

  it('fails closed when Upstash throws', async () => {
    upstashLimit.mockRejectedValue(new Error('network down'))
    const { checkRateLimit } = await loadLimiter()
    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: false, reason: 'unavailable' })
  })

  it('accepts the UPSTASH_REDIS_REST_* variable names too', async () => {
    vi.stubEnv('KV_REST_API_URL', '')
    vi.stubEnv('KV_REST_API_TOKEN', '')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')
    upstashLimit.mockResolvedValue({ success: true })
    const { checkRateLimit } = await loadLimiter()
    expect(await checkRateLimit('ip', '1.2.3.4')).toEqual({ allowed: true })
  })
})

describe('getClientIp', () => {
  it('prefers x-real-ip', async () => {
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
