// The Actions minutes monitor's pace math and alerts (scripts/actions-usage.mjs).
import { describe, expect, it } from 'vitest'
import { alertsFor, issueBody, linuxMinutes, monthOf, pace, readState, summarize } from '@/scripts/actions-usage.mjs'

const at = (iso: string) => new Date(iso)
const line = (date: string, repositoryName: string, minutes: number, sku = 'actions_linux', rate = 0.006) => ({
  date,
  product: 'actions',
  sku,
  quantity: minutes,
  unitType: 'Minutes',
  pricePerUnit: rate,
  grossAmount: minutes * rate,
  discountAmount: minutes * rate,
  netAmount: 0,
  repositoryName,
})

describe('the pace', () => {
  it('spreads 2,000 minutes evenly over the month', () => {
    expect(monthOf(at('2026-11-01T00:00:00Z')).elapsed).toBe(0)
    expect(pace(at('2026-11-16T00:00:00Z')).expected).toBeCloseTo(1000) // 15 of 30 days
    expect(pace(at('2026-12-01T00:00:00Z')).expected).toBe(0) // a new month starts over
  })

  it('gives a 7-day budget of about 465 minutes', () => {
    expect(pace(at('2026-11-09T12:00:00Z')).weekly).toBeCloseTo(466.7, 1) // 30 days
    expect(pace(at('2026-12-09T12:00:00Z')).weekly).toBeCloseTo(451.6, 1) // 31 days
    expect(pace(at('2027-02-09T12:00:00Z')).weekly).toBe(500) // 28 days
  })

  it('names the month', () => {
    expect(monthOf(at('2026-11-09T12:00:00Z'))).toMatchObject({ key: '2026-11', name: 'November 2026', days: 30 })
  })
})

describe('the usage', () => {
  it('counts Windows and macOS at their cost in Linux minutes', () => {
    expect(linuxMinutes(line('2026-11-01', 'a', 10))).toBeCloseTo(10)
    expect(linuxMinutes(line('2026-11-01', 'a', 10, 'actions_windows', 0.01))).toBeCloseTo(16.67, 1)
    expect(linuxMinutes(line('2026-11-01', 'a', 10, 'actions_macos', 0.062))).toBeCloseTo(103.3, 1)
  })

  it('leaves out public repos and storage, and ranks the private repos', () => {
    const now = at('2026-11-20T12:00:00Z')
    const items = [
      line('2026-11-02', 'n8watkins/solara', 300),
      line('2026-11-18', 'n8watkins/solara', 100),
      line('2026-11-19', 'n8watkins/scribe', 50, 'actions_windows', 0.01),
      line('2026-11-19', 'n8watkins/n8builds-web', 900), // public: free
      { ...line('2026-11-19', 'n8watkins/solara', 999), unitType: 'GigabyteHours' }, // storage
      { ...line('2026-11-19', 'n8watkins/solara', 999), product: 'copilot' },
    ]
    const usage = summarize(items, ['n8builds-web'], now)
    expect(usage.used).toBeCloseTo(483.3, 1)
    expect(usage.last7).toBeCloseTo(183.3, 1) // the 2nd is outside the week
    expect(usage.repos.map((r: { repo: string }) => r.repo)).toEqual(['solara', 'scribe'])
  })

  it("keeps the last 7 days inside this month, since the allowance resets on the 1st", () => {
    const usage = summarize([line('2026-10-30', 'x', 400), line('2026-11-02', 'x', 10)], [], at('2026-11-03T08:00:00Z'))
    expect(usage.last7).toBeCloseTo(10)
  })
})

describe('the alerts', () => {
  const keys = (used: number, last7: number, now: string) => alertsFor({ used, last7 }, at(now)).map((a: { key: string }) => a.key)

  it('fires each threshold the total has crossed', () => {
    expect(keys(999, 0, '2026-11-28T00:00:00Z')).toEqual([])
    expect(keys(1000, 0, '2026-11-28T00:00:00Z')).toEqual(['50%'])
    expect(keys(1850, 0, '2026-11-30T00:00:00Z')).toEqual(['50%', '75%', '90%'])
    expect(keys(2000, 0, '2026-11-30T23:00:00Z')).toEqual(['50%', '75%', '90%', '100%'])
  })

  it('fires when more than 25% ahead of pace, but not over a few minutes early on', () => {
    // Day 10 of 30: 667 expected, so the line is 833.
    expect(keys(830, 0, '2026-11-11T00:00:00Z')).toEqual([])
    expect(keys(840, 0, '2026-11-11T00:00:00Z')).toEqual(['pace'])
    expect(keys(90, 0, '2026-11-01T06:00:00Z')).toEqual([]) // far ahead of 17, but under 100
  })

  it('fires when the last 7 days beat the weekly budget', () => {
    expect(keys(700, 466, '2026-11-25T00:00:00Z')).toEqual([])
    expect(keys(700, 470, '2026-11-25T00:00:00Z')).toEqual(['week'])
  })
})

describe('the issue state', () => {
  it('round-trips the month and the alerts that fired', () => {
    const now = at('2026-11-09T12:00:00Z')
    const body = issueBody({ used: 1200, last7: 300, repos: [{ repo: 'solara', minutes: 1200 }] }, now, ['50%', 'pace'])
    expect(readState(body)).toEqual({ month: '2026-11', fired: ['50%', 'pace'] })
    expect(body).toContain('Used 1,200 of 2,000 Actions minutes (60%) in November 2026.')
    expect(body).toContain('- solara: 1,200')
    expect(body).not.toContain(String.fromCharCode(0x2014)) // no em dashes
  })

  it('ignores bodies without the state', () => {
    expect(readState('A hand-written issue')).toBeNull()
    expect(readState('<!-- actions-usage: {broken -->')).toBeNull()
    expect(readState(undefined)).toBeNull()
  })
})
