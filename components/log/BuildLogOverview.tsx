'use client'
import { useEffect, useRef, useState } from 'react'
import BuildLogCard, { type CardLink } from '@/components/build-log/BuildLogCard'
import { useLogDayFocus } from '@/components/log/LogDayFocus'
import type { LogMonth } from '@/lib/monthFacts'

const shortDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
const entries = (n: number) => `${n} ${n === 1 ? 'entry' : 'entries'}`

/** How long the pointer rests on a day before the feed below previews it. */
const PREVIEW_MS = 160

/**
 * The top of /builds (owner, 2026-11-25): the build log card, the same as the
 * homepage's and the portfolio's, at its wide size, as the overview of the
 * feed below. Its months move on by themselves as on the portfolio.
 *
 * A day looked at (hovered, tapped, or reached with the arrow keys) is
 * previewed without moving the page: the card's foot says how many entries it
 * has in the feed ("3 entries on Oct 23"), and those entries light softly
 * where they are, once the pointer rests (PREVIEW_MS). A click or Enter on the
 * day (or the foot's link, after a tap: a phone taps to read the day) scrolls
 * to them and lights them. With no day picked, or a day with nothing listed
 * below (only quiet days, or an unlisted project's work, which counts but is
 * never named), the foot links to the feed.
 */
export default function BuildLogOverview({ months }: { months: LogMonth[] }) {
  const { show, setPreview, entriesOn } = useLogDayFocus()
  const [day, setDay] = useState<string | null>(null)
  const listed = (d: string | null): d is string => !!d && (entriesOn[d] ?? 0) > 0
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const right: CardLink = listed(day)
    ? {
        label: `${entries(entriesOn[day])} on ${shortDay(day)}`,
        onClick: () => show(day),
        arrow: 'down',
        srExtra: ': show them in the log below',
      }
    : { label: 'The whole log', href: '#activity', arrow: 'down' }

  return (
    <BuildLogCard
      months={months}
      size="wide"
      heading="h2"
      links={{ right }}
      onDayChange={(d) => {
        setDay(d)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setPreview(listed(d) ? d : null), PREVIEW_MS)
      }}
      onDayClick={(d) => {
        if (listed(d)) show(d)
      }}
    />
  )
}
