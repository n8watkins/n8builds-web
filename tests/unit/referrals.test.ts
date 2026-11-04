import { NextRequest } from 'next/server'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { isOutbound, refDestination, refHref, refSource } from '@/lib/referrals'
import { testDatabases, type TestDatabases } from './d1'

vi.mock('server-only', () => ({}))
const afterCallbacks: (() => unknown)[] = []
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (fn: () => unknown) => afterCallbacks.push(fn),
}))
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
let db: TestDatabases['analytics'] | null = null
vi.mock('@/lib/db', () => ({ analyticsDb: async () => db }))
const limit = vi.fn()
vi.mock('@/lib/security/rateLimiter', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/security/rateLimiter')>()),
  checkRateLimit: (...args: unknown[]) => limit(...args),
}))

const { countContactSent, countReferral } = await import('@/lib/analyticsStore')
const { GET: appturnity } = await import('@/app/appturnity/route')
const { GET: portfolio } = await import('@/app/portfolio/route')
const { GET: techforpros } = await import('@/app/techforpros/route')

/** A database that fails or never answers. */
function brokenDb({ hang = false } = {}) {
  const statement = {
    bind: () => statement,
    run: () => (hang ? new Promise(() => {}) : Promise.reject(new Error('down'))),
  }
  return { prepare: () => statement } as never
}

let dbs: TestDatabases
beforeAll(async () => {
  dbs = await testDatabases()
})
afterAll(() => dbs.dispose())

/** The counts in analytics_daily, as "metric day field count". */
async function counts(): Promise<string[]> {
  const { results } = await dbs.analytics.prepare('SELECT metric, day, field, count FROM analytics_daily ORDER BY metric, day, field').all()
  return results.map((r) => Object.values(r).join(' '))
}

const get = (handler: (r: NextRequest) => Response, path: string, ua = 'Mozilla/5.0') =>
  handler(new NextRequest(`https://n8builds.dev${path}`, { headers: { 'user-agent': ua } }))

describe('counted short links', () => {
  beforeEach(async () => {
    afterCallbacks.length = 0
    await dbs.reset()
    db = dbs.analytics
    limit.mockReset().mockResolvedValue({ allowed: true })
  })

  it('only knows a fixed set of placements; anything else is "other"', () => {
    expect(refSource('email')).toBe('email')
    expect(refSource('navbar')).toBe('navbar')
    for (const v of [null, '', 'EMAIL', 'twitter', '__proto__', 'toString']) expect(refSource(v), String(v)).toBe('other')
  })

  it('builds the links the site uses', () => {
    expect(refHref('appturnity', 'navbar')).toBe('/appturnity?from=navbar')
    expect(refHref('appturnity', 'card', 'free-website')).toBe('/appturnity?from=card&to=free-website')
    expect(isOutbound('/appturnity?from=navbar')).toBe(true)
    expect(isOutbound('/portfolio')).toBe(true)
    expect(refHref('techforpros', 'navbar')).toBe('/techforpros?from=navbar')
    expect(isOutbound('/techforpros?from=card')).toBe(true)
    expect(isOutbound('https://x.com')).toBe(true)
    expect(isOutbound('/builds/scribe')).toBe(false)
    expect(isOutbound('/portfolio-rank')).toBe(false)
  })

  it('lands only on known pages, with UTM tags, and never anywhere a visitor names', () => {
    expect(refDestination('appturnity', 'card', 'free-website')).toBe(
      'https://appturnity.com/?utm_source=n8builds.dev&utm_medium=referral&utm_content=card#free-website'
    )
    expect(refDestination('appturnity', 'lab', 'pricing')).toBe('https://appturnity.com/pricing?utm_source=n8builds.dev&utm_medium=referral&utm_content=lab')
    for (const to of ['https://evil.example', '//evil.example', 'toString', null]) {
      expect(refDestination('appturnity', 'email', to), String(to)).toMatch(/^https:\/\/appturnity\.com\/\?utm_source/)
    }
    expect(refDestination('portfolio', 'email', 'pricing')).toMatch(/^https:\/\/portfolio\.n8builds\.dev\/\?/)
  })

  it('redirects at once and counts the click after, by day and placement', async () => {
    const response = get(appturnity, '/appturnity?from=navbar&to=pricing')
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://appturnity.com/pricing?utm_source=n8builds.dev&utm_medium=referral&utm_content=navbar')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await counts()).toEqual([])
    get(appturnity, '/appturnity?from=navbar')
    // Two clicks at once: both counted (one upsert each).
    await Promise.all(afterCallbacks.map((fn) => fn()))
    const today = new Date().toISOString().slice(0, 10)
    expect(await counts()).toEqual([`ref:appturnity ${today} navbar 2`])
  })

  it('counts the portfolio and Tech for Pros links under their own metrics', async () => {
    expect(get(portfolio, '/portfolio?from=email').headers.get('location')).toMatch(/^https:\/\/portfolio\.n8builds\.dev\/\?utm_source=n8builds\.dev/)
    expect(get(techforpros, '/techforpros?from=navbar&to=https://evil.example').headers.get('location')).toBe(
      'https://techforpros.com/?utm_source=n8builds.dev&utm_medium=referral&utm_content=navbar'
    )
    await Promise.all(afterCallbacks.map((fn) => fn()))
    const today = new Date().toISOString().slice(0, 10)
    expect(await counts()).toEqual([`ref:portfolio ${today} email 1`, `ref:techforpros ${today} navbar 1`])
  })

  it("stops counting an address's clicks past its hourly limit, but still redirects", async () => {
    limit.mockResolvedValue({ allowed: false, reason: 'limited' })
    expect(get(appturnity, '/appturnity?from=navbar').status).toBe(302)
    await Promise.all(afterCallbacks.map((fn) => fn()))
    expect(limit).toHaveBeenCalledWith('ref-ip', expect.any(String))
    expect(await counts()).toEqual([])
  })

  it('still redirects when the database is missing, and skips bots', async () => {
    db = null
    expect(get(appturnity, '/appturnity').status).toBe(302)
    await Promise.all(afterCallbacks.map((fn) => fn()))
    afterCallbacks.length = 0
    db = dbs.analytics
    expect(get(appturnity, '/appturnity', 'Slackbot-LinkExpanding 1.0').status).toBe(302)
    expect(afterCallbacks).toHaveLength(0)
    expect(await counts()).toEqual([])
  })

  it('never throws when the database fails or hangs', async () => {
    vi.useFakeTimers()
    try {
      await expect(countReferral(brokenDb(), 'appturnity', 'email')).resolves.toBeUndefined()
      const hung = countContactSent(brokenDb({ hang: true }))
      await vi.advanceTimersByTimeAsync(2500)
      await expect(hung).resolves.toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })

  it('counts delivered contact messages by day', async () => {
    await countContactSent(dbs.analytics, new Date('2026-10-28T23:00:00Z'))
    await countContactSent(dbs.analytics, new Date('2026-10-28T23:30:00Z'))
    expect(await counts()).toEqual(['contact:sent 2026-10-28  2'])
  })
})
