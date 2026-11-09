import Link from 'next/link'
import { FiArrowUpRight, FiChevronDown } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import LogRow from '@/components/log/LogRow'
import { monthLabel, type LogEntry } from '@/lib/build-log'

/** How many of the newest months show open; the rest fold under "Earlier". */
const OPEN_MONTHS = 2

/** The entries by month (`YYYY-MM`), newest month and entry first. */
function byMonth(entries: LogEntry[]): [string, LogEntry[]][] {
  const months = new Map<string, LogEntry[]>()
  for (const entry of [...entries].sort((a, b) => b.date.localeCompare(a.date))) {
    months.set(entry.month, [...(months.get(entry.month) ?? []), entry])
  }
  return [...months]
}

const count = (n: number) => `${n} ${n === 1 ? 'update' : 'updates'}`

function Month({ month, entries, name }: { month: string; entries: LogEntry[]; name: string }) {
  return (
    <section aria-label={`${name} in ${monthLabel(month)}`}>
      <h3 className="flex items-baseline justify-between gap-4 px-2 font-mono text-[0.7rem] font-semibold tracking-wider text-emerald-300/90 uppercase">
        {monthLabel(month)}
        <span className="font-normal text-slate-450">{count(entries.length)}</span>
      </h3>
      <ul className="mt-1.5 divide-y divide-white/[0.05]">
        {entries.map((entry) => (
          <li key={entry.id} className="py-0.5">
            <LogRow entry={entry} showBuild={false} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * A build page's build log (owner, 2026-11-08): the build's whole log, from
 * the same hourly-cached GitHub data as the homepage strip and /builds
 * (lib/build-log.ts, with its jargon filters), by month, newest first, in the
 * strip's rows and green log colours. The two newest months show open; the
 * rest fold under "Earlier" (a native <details>, so it works before any
 * JavaScript). Left out when the build has none.
 */
export default function BuildPageLog({
  name,
  entries,
  className = 'mt-12',
}: {
  name: string
  entries: LogEntry[]
  /** The section's spacing on its page. */
  className?: string
}) {
  if (entries.length === 0) return null
  const months = byMonth(entries)
  const open = months.slice(0, OPEN_MONTHS)
  const earlier = months.slice(OPEN_MONTHS)
  const releases = entries.filter((e) => e.kind === 'release').length
  return (
    <Reveal>
      <section className={className} aria-labelledby="build-log-heading">
        <div className="text-center">
          <h2 id="build-log-heading" className="text-3xl font-bold tracking-tight">
            Build <span className="bg-linear-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">log</span>
          </h2>
          <p className="mt-1.5 text-sm text-[#9cadc5]">
            Everything shipped to {name}, month by month: {count(entries.length)}
            {releases > 0 ? ` and ${releases} ${releases === 1 ? 'release' : 'releases'}` : ''}, pulled from GitHub.
          </p>
        </div>

        {/* The strip's look: its green-to-teal tint, the rows on a quiet card. */}
        <div className="mt-6 space-y-5 rounded-2xl border border-emerald-300/12 bg-linear-to-br from-emerald-400/[0.06] via-white/[0.02] to-teal-400/[0.04] p-3 sm:p-4">
          {open.map(([month, rows]) => (
            <Month key={month} month={month} entries={rows} name={name} />
          ))}
          {earlier.length > 0 && (
            <details className="group/earlier border-t border-white/[0.06] pt-3">
              <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-emerald-200 focus-visible:outline-2 focus-visible:outline-cyan-300 [&::-webkit-details-marker]:hidden">
                Earlier: {earlier.length} more {earlier.length === 1 ? 'month' : 'months'},{' '}
                {count(earlier.reduce((n, [, rows]) => n + rows.length, 0))}
                <FiChevronDown aria-hidden className="h-4 w-4 transition-transform group-open/earlier:rotate-180 motion-reduce:transition-none" />
              </summary>
              <div className="mt-4 space-y-5">
                {earlier.map(([month, rows]) => (
                  <Month key={month} month={month} entries={rows} name={name} />
                ))}
              </div>
            </details>
          )}
        </div>
        {/* This page has the whole of this build's log; /builds has every build's. */}
        <div className="mt-5 flex justify-center">
          <Link
            href="/builds#activity"
            className="group flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-emerald-400/40 hover:bg-white/8 hover:text-emerald-200"
          >
            See the log for every build
            <FiArrowUpRight aria-hidden className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </Reveal>
  )
}
