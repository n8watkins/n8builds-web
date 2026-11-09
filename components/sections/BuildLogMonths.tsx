'use client'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import ShippedStats from '@/components/sections/ShippedStats'
import LatestUpdates from '@/components/sections/LatestUpdates'
import type { DayCount, ShippedStat } from '@/lib/log-stats'

/** One month of the homepage's build log, worked out and its rows rendered on the server (BuildLogStrip.tsx). */
export type LogMonth = {
  /** `YYYY-MM`, or `recent` for a quiet month's last 30 days. */
  id: string
  /** On the card: "November", or "December 2025" for another year, or "Last 30 days". */
  period: string
  /** In full, for the arrows' names and the announcement: "October 2026". */
  name: string
  stats: ShippedStat[]
  days: DayCount[]
  /** The month's updates, newest first, rendered on the server (shown two at a time). */
  rows: React.ReactNode[]
  /** The rows' name: "Latest this month", "Latest in October 2026". */
  listLabel: string
}

/** Which month the build log shows. */
const MonthContext = createContext<{ index: number; setIndex: (i: number) => void }>({
  index: 0,
  setIndex: () => {},
})

/**
 * Holds the month the build log shows for the card inside it. The month is
 * named once, on the card (round 4 of 2026-11-08: no "Shipped in October"
 * line under the heading as well).
 */
export function LogMonthProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0)
  return <MonthContext.Provider value={{ index, setIndex }}>{children}</MonthContext.Provider>
}

const arrowClass =
  'flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg border border-white/10 bg-white/4 text-slate-400 transition-colors enabled:hover:border-cyan-400/30 enabled:hover:bg-white/8 enabled:hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-default disabled:opacity-35'

/**
 * The homepage build log's month switcher (round 5 of 2026-11-02: "let
 * visitors switch months"): the card's month has arrows beside it, back to
 * the months before (as far as the /builds feed's 12-month window) and
 * forward again, going round at either end (round 4 of 2026-11-08), each
 * named with its year. Each month is the same card and rows as the current one:
 * its figures and day bars, and its updates three at a time, moving on one
 * by one (rounds 4 and 5 of 2026-11-08). `rows={false}` is
 * the card alone (/builds, where the feed below has every update).
 *
 * Every month's rows are rendered on the server and arrive with the page's
 * component payload (small: the whole year is about a hundred rows, and no
 * request waits on a click), but only the month on screen is in the markup
 * and mounted, and its icons are the only ones loaded, so the homepage costs
 * about what it did with one month. A new month fades in (not under
 * reduced motion), and its name is announced.
 */
export default function BuildLogMonths({
  months,
  rows = true,
  aside,
}: {
  months: LogMonth[]
  rows?: boolean
  /** A third column on the right from 1024px (the release-kit note); under the rest below that. */
  aside?: React.ReactNode
}) {
  const { index, setIndex } = useContext(MonthContext)
  const [announce, setAnnounce] = useState('')
  // Whether the visitor has switched months: from then on a month's bars fill in as it shows.
  const [switched, setSwitched] = useState(false)
  // The arrow to give focus back to: a month's card remounts with its arrows, so the
  // one just used would otherwise drop focus to the page.
  const refocus = useRef<'older' | 'newer' | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const month = months[index]
  // The arrows go round (owner, round 4 of 2026-11-08): back from the oldest month is the
  // newest, and on from the newest is the oldest. Each month shows its year, so a wrap is plain.
  const n = months.length
  const olderIndex = (index + 1) % n
  const newerIndex = (index - 1 + n) % n
  const older = months[olderIndex]
  const newer = months[newerIndex]

  const go = (to: number, arrow: 'older' | 'newer') => {
    refocus.current = document.activeElement?.closest('[data-month-arrow]') ? arrow : null
    setIndex(to)
    setSwitched(true)
    setAnnounce(`Showing ${months[to].name}`)
  }

  useEffect(() => {
    const arrow = refocus.current
    refocus.current = null
    if (arrow) root.current?.querySelector<HTMLButtonElement>(`[data-month-arrow="${arrow}"]`)?.focus({ preventScroll: true })
  }, [index])

  const header = (
    <div className="flex items-center justify-between gap-3">
      {/* The month, then its year a size down (round 4 of 2026-11-08: the arrows go round, so the year shows where). */}
      <p className="min-w-0 truncate text-xl font-bold tracking-tight text-cyan-300" data-month={month.id}>
        {/^\w+ \d{4}$/.test(month.period) ? (
          <>
            {month.period.split(' ')[0]} <span className="text-sm font-semibold text-cyan-300/60">{month.period.split(' ')[1]}</span>
          </>
        ) : (
          month.period
        )}
      </p>
      {months.length > 1 && (
        <div className="flex items-center gap-1.5" role="group" aria-label="Months">
          <button
            type="button"
            onClick={() => go(olderIndex, 'older')}
            data-month-arrow="older"
            aria-label={`Previous month: ${older.name}`}
            title={older?.name}
            className={arrowClass}
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go(newerIndex, 'newer')}
            data-month-arrow="newer"
            aria-label={`Next month: ${newer.name}`}
            title={newer?.name}
            className={arrowClass}
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )

  return (
    // No tap highlight on its controls (round 7 of 2026-11-09: a white box flashed on a tap);
    // each keeps a ring for the keyboard. The release-kit column is as wide as the month's,
    // so the card is symmetric (round 7).
    <div
      ref={root}
      className={`grid grid-cols-1 overflow-hidden rounded-2xl border border-white/8 bg-[#0a1526]/70 [-webkit-tap-highlight-color:transparent] ${
        rows ? `md:grid-cols-[17rem_minmax(0,1fr)] ${aside ? 'lg:grid-cols-[17rem_minmax(0,1fr)_17rem]' : ''}` : ''
      }`}
      data-log-months={months.length}
    >
      {/* A month's card and rows remount together, so each starts on its first figure and page. */}
      <div
        key={`stats-${month.id}`}
        className={`flex flex-col px-5 py-4 md:px-6 md:py-5 ${rows ? 'border-b border-white/8 md:border-r md:border-b-0' : ''} ${index ? 'log-month-in' : ''}`}
      >
        {/* The month is named once, here; each row carries its own day. */}
        <ShippedStats stats={month.stats} days={month.days} period={month.name} header={header} fill={switched} />
      </div>
      {rows && (
        // The month's updates, three at a time, moving on one by one (LatestUpdates).
        <div key={`rows-${month.id}`} className={`p-3 sm:p-4 ${index ? 'log-month-in' : ''}`}>
          <LatestUpdates rows={month.rows} label={month.listLabel} />
        </div>
      )}
      {aside && (
        <div className="border-t border-white/8 md:col-span-2 lg:col-span-1 lg:border-t-0 lg:border-l">{aside}</div>
      )}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
