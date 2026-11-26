'use client'
import React, { createContext, useContext, useMemo, useState } from 'react'
import BuildLogCard from '@/components/build-log/BuildLogCard'
import BuildLogPages from '@/components/sections/BuildLogPages'
import { toCardMonths } from '@/lib/log-card-months'
import type { DayCount, ShippedStat } from '@/lib/log-stats'

/** One month of the homepage's build log, worked out and its rows rendered on the server (BuildLogStrip.tsx). */
export type LogMonth = {
  /** `YYYY-MM`, or `recent` for a quiet month's last 30 days. */
  id: string
  /** On the card: "November 2026", or "Last 30 days". */
  period: string
  /** In full, for the arrows' names and the announcement: "October 2026". */
  name: string
  stats: ShippedStat[]
  days: DayCount[]
  /** The month's updates, newest first, rendered on the server (shown two at a time). */
  rows: React.ReactNode[]
  /** Each row's build and title, read out when the visitor pages to it. */
  labels: string[]
  /** The rows' name: "Latest this month", "Latest in October 2026". */
  listLabel: string
}

/** Which month the build log shows. */
const MonthContext = createContext<{ index: number; setIndex: (i: number) => void }>({
  index: 0,
  setIndex: () => {},
})

/** Holds the month the build log shows, for the card and the updates beside it. */
export function LogMonthProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0)
  return <MonthContext.Provider value={{ index, setIndex }}>{children}</MonthContext.Provider>
}

/**
 * The homepage build log: the build log card (the same card as the
 * portfolio's, components/build-log/; owner, 2026-11-25), the month's updates
 * a page of three at a time beside it (BuildLogPages), and the release-kit ad.
 *
 * The card's month arrows pick the month for both: back through the months
 * with something shipped, as far as the /builds feed's 12-month window, and
 * round at either end. The card's months don't move on by themselves here:
 * the updates beside it already do (every 4 seconds), and two things moving
 * side by side was too much (round 9 of 2026-11-09, "only one clip plays at a
 * time"). The card announces a month picked with its arrows.
 *
 * Every month's rows are rendered on the server and arrive with the page's
 * component payload (small: the whole year is about a hundred rows, and no
 * request waits on a click), but only the month on screen is in the markup
 * and mounted, and its icons are the only ones loaded. A new month's updates
 * fade in (not under reduced motion).
 */
export default function BuildLogMonths({
  months,
  aside,
}: {
  months: LogMonth[]
  /** A third column on the right from 1024px (the release-kit note); under the rest below that. */
  aside?: React.ReactNode
}) {
  const { index, setIndex } = useContext(MonthContext)
  const month = months[index]
  const cardMonths = useMemo(() => toCardMonths(months), [months])

  return (
    // No tap highlight on its controls (round 7 of 2026-11-09: a white box flashed on a tap);
    // each keeps a ring for the keyboard. The release-kit column is as wide as the month's,
    // so the card is symmetric (round 7).
    <div
      className={`grid grid-cols-1 overflow-hidden rounded-2xl border border-white/8 bg-[#0a1526]/70 [-webkit-tap-highlight-color:transparent] md:grid-cols-[17rem_minmax(0,1fr)] ${
        aside ? 'lg:grid-cols-[17rem_minmax(0,1fr)_17rem]' : ''
      }`}
      data-log-months={months.length}
    >
      <div
        className="flex flex-col border-b border-white/8 md:border-r md:border-b-0"
        data-log-card
      >
        <BuildLogCard
          months={cardMonths}
          index={index}
          onIndexChange={setIndex}
          cycle={false}
          links={{ right: { label: 'Full build log', href: '/builds' } }}
        />
      </div>
      {/* The month's updates, a page of three at a time, with the staggered fade (BuildLogPages). */}
      <div key={`rows-${month.id}`} className={`p-3 sm:p-4 ${index ? 'log-month-in' : ''}`}>
        <BuildLogPages rows={month.rows} labels={month.labels} label={month.listLabel} />
      </div>
      {aside && (
        <div className="border-t border-white/8 md:col-span-2 lg:col-span-1 lg:border-t-0 lg:border-l">
          {aside}
        </div>
      )}
    </div>
  )
}
