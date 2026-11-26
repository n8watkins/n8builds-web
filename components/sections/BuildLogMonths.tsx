'use client'
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import BuildLogCard from '@/components/build-log/BuildLogCard'
import BuildLogPages from '@/components/sections/BuildLogPages'
import { dayListNote } from '@/lib/day-list'
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
  /** Each row's day (`YYYY-MM-DD`), so a day picked on the card shows its own rows. */
  rowDays: string[]
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
 * How long a day has to stay picked before the list follows it, and how long
 * the list waits before it goes back to the latest changes. A sweep across the
 * chart lights each day and rolls the readout at once, while the list moves
 * only where the pointer rests.
 */
const FOLLOW_MS = 160
const RETURN_MS = 320
/** A day's rows shown at most, the same as a page of the latest changes. */
const DAY_ROWS = 3

const longDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
const changes = (n: number) => `${n} ${n === 1 ? 'change' : 'changes'}`

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
 * A day picked on the card (hovered, tapped or reached with the arrow keys)
 * shows that day's entries in the list's place (owner, 2026-11-25: "if I
 * hover over the changes in the month, the stuff that's being displayed on
 * the build log ... adjusts"): headed by the day and its changes, at most
 * three with a count of the rest, or a line saying the day's changes have no
 * entry of their own. The list's pages hold still meanwhile and come back when
 * no day is picked. It waits for the pointer to rest (FOLLOW_MS), so a sweep
 * does not churn it, keeps the list's height (the pages stay in place,
 * hidden), and tells screen readers what it shows.
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

  // The day the list shows: the card's picked day, once it has rested there a moment.
  const [shownDay, setShownDay] = useState<string | null>(null)
  const follow = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  /** The card's picked day right now, and whether the pointer is on the day's list (to open a row). */
  const picked = useRef<string | null>(null)
  const onList = useRef(false)
  const schedule = (day: string | null) => {
    clearTimeout(follow.current)
    follow.current = setTimeout(
      () => {
        // A pointer that has left the chart for the day's list keeps the day showing.
        if (!day && onList.current) return
        setShownDay(day)
      },
      day ? FOLLOW_MS : RETURN_MS
    )
  }
  const onDay = (day: string | null) => {
    picked.current = day
    schedule(day)
  }
  useEffect(() => () => clearTimeout(follow.current), [])
  const dayCount = shownDay ? month.days.find((d) => d.day === shownDay) : undefined
  const showing = !!shownDay && !!dayCount
  const dayRows = showing ? month.rows.filter((_, i) => month.rowDays[i] === shownDay) : []

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
          onDayChange={onDay}
          cycle={false}
          // Under the section's own "Build log" (an h3).
          heading="h4"
          links={{ right: { label: 'Full build log', href: '/builds' } }}
        />
      </div>
      {/* The month's updates, a page of three at a time, with the staggered fade (BuildLogPages);
          a picked day's own in their place, over them, so the list keeps its height. */}
      <div
        key={`rows-${month.id}`}
        className={`relative p-3 sm:p-4 ${index ? 'log-month-in' : ''}`}
      >
        <div className={showing ? 'invisible' : ''} data-latest>
          <BuildLogPages
            rows={month.rows}
            labels={month.labels}
            label={month.listLabel}
            held={showing}
          />
        </div>
        {showing && (
          <div
            key={shownDay}
            role="group"
            aria-label={`Entries on ${longDay(shownDay)}`}
            className="log-month-in absolute inset-3 flex flex-col sm:inset-4"
            data-day-rows={shownDay}
            onMouseEnter={() => {
              onList.current = true
              clearTimeout(follow.current)
            }}
            onMouseLeave={() => {
              onList.current = false
              if (!picked.current) schedule(null)
            }}
          >
            <p className="mb-1.5 px-2 text-sm font-semibold text-emerald-300/90">
              {longDay(shownDay)}
              <span className="font-normal text-slate-400"> · {changes(dayCount.count)}</span>
            </p>
            {dayRows.length ? (
              <ul className="grid flex-1 grid-cols-1 content-start gap-y-0.5">
                {dayRows.slice(0, DAY_ROWS).map((row, i) => (
                  <li key={i} data-day-row>
                    {row}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex-1 px-2 pt-1 text-sm text-[#9cadc5]" data-day-empty>
                {dayListNote(dayCount.count, 0)}
              </p>
            )}
            <p className="mt-2 flex h-8 items-center px-2 font-mono text-xs text-slate-450">
              {dayRows.length > DAY_ROWS ? `and ${dayRows.length - DAY_ROWS} more that day` : ''}
            </p>
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {showing
            ? `Showing ${longDay(shownDay)}: ${
                dayRows.length
                  ? `${dayRows.length} ${dayRows.length === 1 ? 'entry' : 'entries'}`
                  : dayCount.count
                    ? `${changes(dayCount.count)}, none with a write-up`
                    : 'nothing shipped'
              }`
            : ''}
        </p>
      </div>
      {aside && (
        <div className="border-t border-white/8 md:col-span-2 lg:col-span-1 lg:border-t-0 lg:border-l">
          {aside}
        </div>
      )}
    </div>
  )
}
