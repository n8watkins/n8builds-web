'use client'
import React, { createContext, useContext, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import BuildLogPages from '@/components/sections/BuildLogPages'
import ShippedStats from '@/components/sections/ShippedStats'
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
  rows: React.ReactNode[]
  labels: string[]
  /** The rows' carousel name: "Updates this month", "Updates in October 2026". */
  listLabel: string
  /** The line under the part's "Build log" heading: "Shipped this month", "Shipped in October". */
  line: string
}

/** Which month the build log shows, shared by its heading's line and the card. */
const MonthContext = createContext<{ index: number; setIndex: (i: number) => void; lines: string[] }>({
  index: 0,
  setIndex: () => {},
  lines: [],
})

/**
 * Holds the month the build log shows, for the line under its heading
 * (LogMonthLine) and the card (BuildLogMonths) inside it: the part's
 * server-rendered header and card are its children.
 */
export function LogMonthProvider({ lines, children }: { lines: string[]; children: React.ReactNode }) {
  const [index, setIndex] = useState(0)
  return <MonthContext.Provider value={{ index, setIndex, lines }}>{children}</MonthContext.Provider>
}

/** "Shipped this month", then "Shipped in October" and so on as the arrows go back (round 5 of 2026-11-02). */
export function LogMonthLine({ className }: { className?: string }) {
  const { index, lines } = useContext(MonthContext)
  return (
    <span className={className} data-month-line>
      {lines[index]}
    </span>
  )
}

const arrowClass =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-slate-400 transition-colors enabled:hover:border-cyan-400/30 enabled:hover:bg-white/8 enabled:hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-default disabled:opacity-35'

/**
 * The homepage build log's month switcher (round 5 of 2026-11-02: "let
 * visitors switch months"): the card's month has arrows beside it, back to
 * the months before (as far as the /builds feed's 12-month window) and
 * forward again. Each month is the same card and rows as the current one:
 * its figures and day bars, and its updates four to a page.
 *
 * Every month's rows are rendered on the server and arrive with the page's
 * component payload (small: the whole year is about a hundred rows, and no
 * request waits on a click), but only the month on screen is in the markup
 * and mounted, and its icons are the only ones loaded, so the homepage costs
 * about what it did with one month. A new month fades in (not under
 * reduced motion), and its name is announced.
 */
export default function BuildLogMonths({ months }: { months: LogMonth[] }) {
  const { index, setIndex } = useContext(MonthContext)
  const [announce, setAnnounce] = useState('')
  const month = months[index]
  const older = months[index + 1]
  const newer = months[index - 1]

  const go = (to: number) => {
    setIndex(to)
    setAnnounce(`Showing ${months[to].name}`)
  }

  const header = (
    <div className="flex items-center justify-between gap-3">
      <p className="truncate text-2xl font-bold tracking-tight text-cyan-300" data-month={month.id}>
        {month.period}
      </p>
      {months.length > 1 && (
        <div className="flex items-center gap-1.5" role="group" aria-label="Months">
          <button
            type="button"
            onClick={() => older && go(index + 1)}
            disabled={!older}
            aria-label={older ? `Previous month: ${older.name}` : 'Previous month'}
            title={older?.name}
            className={arrowClass}
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => newer && go(index - 1)}
            disabled={!newer}
            aria-label={newer ? `Next month: ${newer.name}` : 'Next month'}
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
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/8 bg-[#0a1526]/70 md:grid-cols-[17rem_minmax(0,1fr)]" data-log-months={months.length}>
      {/* A month's card and rows remount together, so each starts on its first figure and page. */}
      <div key={`stats-${month.id}`} className={`flex flex-col border-b border-white/8 px-5 py-4 md:border-r md:border-b-0 md:px-6 md:py-5 ${index ? 'log-month-in' : ''}`}>
        {/* The month is named once, here; each row carries its own day. */}
        <ShippedStats stats={month.stats} days={month.days} period={month.name} header={header} />
      </div>
      <div key={`rows-${month.id}`} className={`p-3 sm:p-4 ${index ? 'log-month-in' : ''}`}>
        <BuildLogPages rows={month.rows} labels={month.labels} label={month.listLabel} />
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
