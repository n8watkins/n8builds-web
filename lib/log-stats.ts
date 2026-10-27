import { dayKey, type LogEntry } from '@/lib/build-log'

// The figures the homepage's "Shipped this month" card cycles through, worked
// out from the same log entries as the strip. Only what the log really knows:
// it has releases and changes per build per day, so no pull request counts.

export type ShippedStat = {
  id: 'changes' | 'builds' | 'releases' | 'busiest' | 'days' | 'streak'
  /** The big figure: a number, or the busiest build's name. */
  value: string
  /** What the figure counts, after it ("changes shipped"). */
  label: string
  /** The busiest build's slug, for its icon. */
  build?: string
}

/** How much an entry counts for: a day's changes, or one highlight. */
export const weight = (e: LogEntry) => (e.kind === 'highlight' ? 1 : 1 + e.more)

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** `YYYY-MM-DD` one day earlier. */
function dayBefore(day: string): string {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Days in a row with something shipped, up to today, or up to yesterday while
 * today has nothing yet (so the streak doesn't read 0 every morning).
 */
export function streak(entries: LogEntry[], asOf: string): number {
  const days = new Set(entries.map((e) => e.day))
  let day = dayKey(asOf)
  if (!days.has(day)) day = dayBefore(day)
  let n = 0
  while (days.has(day)) {
    n++
    day = dayBefore(day)
  }
  return n
}

/**
 * The card's figures for `period` (the entries of the month it covers), in
 * order. The streak is left out under two days, where it says nothing.
 */
export function shippedStats(period: LogEntry[], all: LogEntry[], asOf: string, names: Record<string, string>): ShippedStat[] {
  const changes = period.reduce((n, e) => n + weight(e), 0)
  const perBuild = new Map<string, number>()
  for (const e of period) perBuild.set(e.build, (perBuild.get(e.build) ?? 0) + weight(e))
  const releases = period.filter((e) => e.kind === 'release').length
  const days = new Set(period.map((e) => e.day)).size
  const busiest = [...perBuild].sort((a, b) => b[1] - a[1])[0]
  const run = streak(all, asOf)

  const stats: ShippedStat[] = [
    { id: 'changes', value: String(changes), label: plural(changes, 'change shipped', 'changes shipped') },
    { id: 'builds', value: String(perBuild.size), label: plural(perBuild.size, 'build touched', 'builds touched') },
  ]
  if (releases) stats.push({ id: 'releases', value: String(releases), label: plural(releases, 'release', 'releases') })
  if (busiest) {
    stats.push({
      id: 'busiest',
      value: names[busiest[0]] ?? busiest[0],
      label: `busiest build, ${busiest[1]} ${plural(busiest[1], 'change', 'changes')}`,
      build: busiest[0],
    })
  }
  stats.push({ id: 'days', value: String(days), label: plural(days, 'day with something shipped', 'days with something shipped') })
  if (run >= 2) stats.push({ id: 'streak', value: String(run), label: 'days in a row, and counting' })
  return stats
}
