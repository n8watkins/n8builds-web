'use client'
import { useState } from 'react'
import BuildLogCard, { type CardLink } from '@/components/build-log/BuildLogCard'
import { useLogDayFocus } from '@/components/log/LogDayFocus'
import type { LogMonth } from '@/lib/monthFacts'

const shortDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

/**
 * The top of /builds (owner, 2026-11-25): the build log card, the same as the
 * homepage's and the portfolio's, at its wide size, as the overview of the
 * feed below. Its months move on by themselves as on the portfolio.
 *
 * Picking a day shows it in the feed: a click or Enter on a day scrolls to
 * that day's entries and lights them; a tap only looks (a phone taps to read
 * the day), so the foot of the card then offers "See <day>". With no day
 * picked, or a day with nothing listed below (only quiet days, or an unlisted
 * project's work, which counts but is never named), the foot links to the feed.
 */
export default function BuildLogOverview({ months }: { months: LogMonth[] }) {
  const { show, entriesOn } = useLogDayFocus()
  const [day, setDay] = useState<string | null>(null)
  const listed = (d: string | null): d is string => !!d && (entriesOn[d] ?? 0) > 0

  const right: CardLink = listed(day)
    ? {
        label: `See ${shortDay(day)} in the log`,
        onClick: () => show(day),
        arrow: 'down',
        srExtra: `: ${entriesOn[day]} ${entriesOn[day] === 1 ? 'update' : 'updates'}`,
      }
    : { label: 'Every update', href: '#activity', arrow: 'down' }

  return (
    <BuildLogCard
      months={months}
      size="wide"
      heading="h2"
      links={{ right }}
      onDayChange={setDay}
      onDayClick={(d) => {
        if (listed(d)) show(d)
      }}
    />
  )
}
