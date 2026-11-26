import type { LogMonth as CardMonth } from '@/lib/monthFacts'
import type { ShippedStat, DayCount } from '@/lib/log-stats'

/**
 * The build log card's months (components/build-log/BuildLogCard.tsx, shared
 * with the portfolio) from this site's own months (BuildLogStrip's
 * getLogMonths): each month's title, its total changes and a count per day.
 * The same shape as the public feed, `/builds/months.json`, which uses this
 * too, so the card here and the portfolio's read the same figures.
 */
export function toCardMonths(
  months: { id: string; period: string; stats: ShippedStat[]; days: DayCount[] }[]
): CardMonth[] {
  return months.map((m) => ({
    id: m.id,
    // "November 2026", or "Last 30 days" in a quiet month.
    title: m.period,
    changes: Number(m.stats.find((s) => s.id === 'changes')?.value ?? 0),
    days: m.days,
  }))
}
