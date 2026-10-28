import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isOutbound, refDestination, refHref, refSource } from '@/lib/referrals'

vi.mock('server-only', () => ({}))
const afterCallbacks: (() => unknown)[] = []
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (fn: () => unknown) => afterCallbacks.push(fn),
}))
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

const { countContactSent, countReferral } = await import('@/lib/analyticsStore')
const analytics = await import('@/lib/analyticsStore')
const { GET: appturnity } = await import('@/app/appturnity/route')
const { GET: portfolio } = await import('@/app/portfolio/route')

/** A fake Upstash client that records its calls. */
function fakeStore({ fail = false, hang = false } = {}) {
  const calls: string[] = []
  const op = (name: string) => (...args: unknown[]) => {
    calls.push(`${name} ${args.join(' ')}`)
    if (hang) return new Promise(() => {})
    return fail ? Promise.reject(new Error('down')) : Promise.resolve(1)
  }
  return { calls, store: { hincrby: op('hincrby'), incr: op('incr'), expire: op('expire') } }
}

const get = (handler: (r: NextRequest) => Response, path: string, ua = 'Mozilla/5.0') =>
  handler(new NextRequest(`https://n8builds.dev${path}`, { headers: { 'user-agent': ua } }))

describe('counted short links', () => {
  beforeEach(() => {
    afterCallbacks.length = 0
    vi.restoreAllMocks()
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
    const { calls, store } = fakeStore()
    vi.spyOn(analytics, 'analyticsStore').mockReturnValue(store as never)
    const response = get(appturnity, '/appturnity?from=navbar&to=pricing')
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://appturnity.com/pricing?utm_source=n8builds.dev&utm_medium=referral&utm_content=navbar')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(calls).toEqual([])
    await Promise.all(afterCallbacks.map((fn) => fn()))
    const today = new Date().toISOString().slice(0, 10)
    expect(calls).toEqual([`hincrby ref:appturnity:${today} navbar 1`, `expire ref:appturnity:${today} ${400 * 86400}`])
  })

  it('counts the portfolio link under its own key', async () => {
    const { calls, store } = fakeStore()
    vi.spyOn(analytics, 'analyticsStore').mockReturnValue(store as never)
    expect(get(portfolio, '/portfolio?from=email').headers.get('location')).toMatch(/^https:\/\/portfolio\.n8builds\.dev\/\?utm_source=n8builds\.dev/)
    await Promise.all(afterCallbacks.map((fn) => fn()))
    expect(calls[0]).toMatch(/^hincrby ref:portfolio:\d{4}-\d{2}-\d{2} email 1$/)
  })

  it('still redirects when the database is missing, and skips bots', () => {
    vi.spyOn(analytics, 'analyticsStore').mockReturnValue(null)
    expect(get(appturnity, '/appturnity').status).toBe(302)
    vi.spyOn(analytics, 'analyticsStore').mockReturnValue(fakeStore().store as never)
    expect(get(appturnity, '/appturnity', 'Slackbot-LinkExpanding 1.0').status).toBe(302)
    expect(afterCallbacks).toHaveLength(0)
  })

  it('never throws when the database fails or hangs', async () => {
    vi.useFakeTimers()
    try {
      await expect(countReferral(fakeStore({ fail: true }).store as never, 'appturnity', 'email')).resolves.toBeUndefined()
      const hung = countContactSent(fakeStore({ hang: true }).store as never)
      await vi.advanceTimersByTimeAsync(2500)
      await expect(hung).resolves.toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })

  it('counts delivered contact messages by day', async () => {
    const { calls, store } = fakeStore()
    await countContactSent(store as never, new Date('2026-10-28T23:00:00Z'))
    expect(calls).toEqual(['incr contact:sent:2026-10-28', `expire contact:sent:2026-10-28 ${400 * 86400}`])
  })
})
