import { describe, expect, it } from 'vitest'
import type { LogEntry } from '@/lib/build-log'
import { logKind } from '@/lib/build-meta'
import { shippedStats, streak } from '@/lib/log-stats'

const entry = (build: string, day: string, kind: LogEntry['kind'] = 'change', more = 0): LogEntry => ({
  id: `${build}-${day}-${kind}`,
  build,
  kind,
  date: `${day}T18:00:00Z`,
  day,
  month: day.slice(0, 7),
  dayLabel: day,
  title: 'A change',
  more,
})

// 18:00 UTC is 11:00 in Los Angeles, the log's time zone: the same calendar day.
const asOf = '2026-10-26T18:00:00Z'
const names = { scribe: 'Scribe', solara: 'Solara' }

describe('streak', () => {
  it('counts days in a row up to today', () => {
    const entries = [entry('scribe', '2026-10-26'), entry('solara', '2026-10-25'), entry('scribe', '2026-10-24'), entry('scribe', '2026-10-21')]
    expect(streak(entries, asOf)).toBe(3)
  })

  it("counts up to yesterday while today has nothing yet", () => {
    expect(streak([entry('scribe', '2026-10-25'), entry('scribe', '2026-10-24')], asOf)).toBe(2)
  })

  it('is 0 after a quiet yesterday and today', () => {
    expect(streak([entry('scribe', '2026-10-23')], asOf)).toBe(0)
  })

  it('runs across a month boundary', () => {
    const entries = ['2026-11-01', '2026-10-31', '2026-10-30'].map((d) => entry('scribe', d))
    expect(streak(entries, '2026-11-01T18:00:00Z')).toBe(3)
  })
})

describe('shippedStats', () => {
  it("adds up the period's changes, builds, releases, busiest build and active days", () => {
    const period = [
      entry('scribe', '2026-10-26', 'release', 4),
      entry('scribe', '2026-10-25', 'change', 2),
      entry('solara', '2026-10-25', 'change', 0),
    ]
    const stats = shippedStats(period, period, asOf, names)
    expect(stats.map((s) => [s.id, s.value, s.label])).toEqual([
      ['changes', '9', 'changes shipped'],
      ['builds', '2', 'builds touched'],
      ['releases', '1', 'release'],
      ['busiest', 'Scribe', 'busiest build, 8 changes'],
      ['days', '2', 'days with something shipped'],
      ['streak', '2', 'days in a row, and counting'],
    ])
    expect(stats.find((s) => s.id === 'busiest')?.build).toBe('scribe')
  })

  it('leaves out releases when there were none, and a streak under two days', () => {
    const period = [entry('solara', '2026-10-20')]
    const ids = shippedStats(period, period, asOf, names).map((s) => s.id)
    expect(ids).toEqual(['changes', 'builds', 'busiest', 'days'])
  })

  it('says one change, one build, one day', () => {
    const period = [entry('solara', '2026-10-26')]
    const labels = shippedStats(period, period, asOf, names).map((s) => s.label)
    expect(labels).toEqual(['change shipped', 'build touched', 'busiest build, 1 change', 'day with something shipped'])
  })
})

describe('logKind', () => {
  it('files the daily tools as Tools, whatever their category', () => {
    expect(logKind({ category: 'Web tool', mine: true })).toBe('tools')
    expect(logKind({ category: 'Desktop app' })).toBe('tools')
  })

  it('files extensions, the site and web apps', () => {
    expect(logKind({ category: 'Chrome extension' })).toBe('extensions')
    expect(logKind({ category: 'Website' })).toBe('site')
    expect(logKind({ category: 'Web app' })).toBe('apps')
  })
})
