import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight, FiGithub } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import LabSubheader from '@/components/sections/LabSubheader'
import { ScrollIcon } from '@/components/ui/PartIcons'
import BuildLogMonths, { LogMonthProvider, type LogMonth } from '@/components/sections/BuildLogMonths'
import { ReleaseBadge } from '@/components/log/LogEntryItem'
import { allBuilds, dayKey, getBuildLog, monthLabel, type LogEntry } from '@/lib/build-log'
import { BUILD_ICONS } from '@/lib/build-meta'
import { dailyCounts, shippedStats } from '@/lib/log-stats'

// The homepage's compact build log: the newest month of /builds at a glance.
// Its updates two at a time, moving on one by one through the month
// (LatestUpdates, round 4 of 2026-11-08), a card that cycles through the month's figures (ShippedStats),
// with arrows back to the months before (BuildLogMonths, round 5 of 2026-11-02;
// /builds shows the same card). Rendered on the server from the same hourly-cached GitHub log
// as /builds (lib/build-log.ts), so the page stays static; only the pages' and
// the figures' timers run in the browser. If the log can't be read at all, the
// strip is left out; it never breaks the page.
//
// It sits right under "What I'm working on" (2026-11-08), in its own green wash.
// It reads as a log (mono dates, build icons), not an ad.

/** A quiet month's card covers this many days back instead. */
const QUIET_DAYS = 30

const names = Object.fromEntries(allBuilds.map((b) => [b.slug, b.name]))

/** A month this busy gets a "This month" strip; a quieter one shows the latest from every build. */
const MONTH_MIN = 3

/** The rows, newest first: with `latestOnly`, each build's newest entry (the latest from every build). */
function pickRows(entries: LogEntry[], latestOnly = false): LogEntry[] {
  const seen = new Set<string>()
  const rows: LogEntry[] = []
  for (const e of [...entries].sort((a, b) => b.date.localeCompare(a.date))) {
    if (latestOnly && seen.has(e.build)) continue
    seen.add(e.build)
    rows.push(e)
  }
  return rows
}

/** `YYYY-MM-DD`, `days` days before `day`. */
function daysBefore(day: string, days: number): string {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

/** The last day of a `YYYY-MM` month, as `YYYY-MM-DD`. */
function lastDayOf(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

function Row({ entry }: { entry: LogEntry }) {
  const name = names[entry.build] ?? entry.build
  const icon = BUILD_ICONS[entry.build]
  const version = entry.kind === 'release' ? /^Shipped (v\S+)$/.exec(entry.title)?.[1] : undefined
  const more =
    entry.detail ??
    (entry.notes?.length ? entry.notes.map((n) => n.text).join('. ') : undefined) ??
    (entry.more > 0 ? `And ${entry.more} more ${entry.more === 1 ? 'change' : 'changes'} that day.` : undefined)
  // The row's link is named by the build and the entry ("Solara: Setup: centered steps..."), not the build alone.
  const id = `strip-${entry.id.replace(/[^\w-]/g, '-')}`
  return (
    <div className="group relative flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04] sm:gap-3.5">
      {icon ? (
        <Image
          src={icon}
          alt=""
          width={32}
          height={32}
          unoptimized={icon.endsWith('.svg')}
          // The same frame for every row, release or not (round 4 of 2026-11-08).
          className="mt-0.5 h-8 w-8 shrink-0 rounded-lg ring-1 ring-white/10 sm:mt-0"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/6 font-mono text-xs text-slate-300"
        >
          {name.charAt(0)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
          {/* Stretched over the row: it opens this build's part of the full log. */}
          <Link
            href={`/builds?build=${entry.build}`}
            aria-labelledby={`${id}-build ${id}-title`}
            className="after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-cyan-400/60"
          >
            <span id={`${id}-build`}>{name}</span>
          </Link>
          {entry.kind === 'release' && (
            <>
              {' '}
              <ReleaseBadge />
            </>
          )}
          {/* Phones: the date rides on this line, so the title gets the width. */}
          <span className="font-normal text-slate-475 sm:hidden">
            {' '}
            / <span className="text-slate-450">{entry.dayLabel}</span>
          </span>
        </p>
        {/* Always exactly two lines under the name (owner, 2026-11-09), so the three entries
            are the same height and the column never jumps as they move on: the title and a
            line of what's in it (a release's note or the day's other changes), or a title
            alone over both lines, with a short one keeping the second line empty. */}
        <div className="h-11 overflow-hidden">
          <p
            id={`${id}-title`}
            className={`${more ? 'line-clamp-1' : 'line-clamp-2'} text-base font-semibold leading-snug text-slate-100 transition-colors group-hover:text-cyan-100`}
          >
            {version ? (
              <>
                Shipped <span className="font-mono text-[0.92em] text-cyan-300">{version}</span>
              </>
            ) : (
              entry.title
            )}
          </p>
          {more && <p className="mt-0.5 line-clamp-1 text-sm leading-snug text-[#9cadc5]">{more}</p>}
        </div>
      </div>
      <time
        dateTime={entry.date}
        className="hidden shrink-0 self-start pt-0.5 font-mono sm:block text-[0.7rem] uppercase tracking-wider text-slate-450"
      >
        {entry.dayLabel}
      </time>
    </div>
  )
}

const RELEASE_KIT = 'https://github.com/n8watkins/release-kit'

/**
 * Beside the log, a compact pitch for what writes it (round 5 of 2026-11-02; a
 * column of the card since round 4 of 2026-11-08, saying more since round 5):
 * every project here runs release-kit, so its commits and releases become
 * this log on their own. "Get release-kit" carries GitHub's mark.
 */
function ReleaseKitNote() {
  return (
    <aside
      aria-labelledby="release-kit-ad"
      className="flex h-full flex-col justify-center gap-3 bg-linear-to-b from-cyan-400/[0.05] to-transparent p-4 lg:px-5"
    >
      <p id="release-kit-ad" className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <Image src="/log/release-kit.svg" alt="" width={24} height={24} unoptimized className="h-6 w-6 shrink-0 rounded-md" />
        <span>
          This log writes itself with <span className="font-mono whitespace-nowrap text-cyan-300">release-kit</span>
        </span>
      </p>
      <ul className="space-y-1 text-[13px] leading-snug text-[#9cadc5]">
        <li>
          <span className="text-slate-200">In:</span> Conventional Commits.
        </li>
        <li>
          <span className="text-slate-200">Out:</span> versions, release notes and this log.
        </li>
        <li>One command adds it to any repo.</li>
      </ul>
      <a
        href={RELEASE_KIT}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/4 px-3.5 py-1.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-cyan-400/40 hover:bg-white/8 hover:text-cyan-200"
      >
        <FiGithub className="h-4 w-4" aria-hidden="true" />
        Get release-kit
        <FiArrowUpRight
          className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
        <span className="sr-only"> on GitHub (opens in a new tab)</span>
      </a>
    </aside>
  )
}

/**
 * The build log's months for the card (and the homepage's latest rows): this
 * month (or a quiet month's last 30 days), then each month before it with
 * something shipped, back to the feed's 12-month window. Null when the log
 * can't be read or is empty. Shared with /builds, which shows the same card.
 */
export async function getLogMonths(): Promise<LogMonth[] | null> {
  let entries: LogEntry[]
  let asOf: string
  let recentFrom: string | null
  try {
    ;({ entries, asOf, recentFrom } = await getBuildLog())
  } catch {
    // GitHub unreachable with nothing cached: leave the strip out.
    return null
  }
  if (entries.length === 0) return null

  const current = dayKey(asOf).slice(0, 7)
  const thisMonth = entries.filter((e) => e.month === current)
  const isThisMonth = thisMonth.length >= MONTH_MIN
  const today = dayKey(asOf)
  const view = (rows: LogEntry[]) => ({
    rows: rows.map((entry) => <Row key={entry.id} entry={entry} />),
  })

  // The first view: this month, or in a quiet one the last 30 days (the latest from every build).
  const cutoff = daysBefore(today, QUIET_DAYS - 1)
  const firstPeriod = isThisMonth ? thisMonth : entries.filter((e) => e.day >= cutoff)
  const first: LogMonth = {
    id: isThisMonth ? current : 'recent',
    // With its year, so the arrows' wrap from the oldest month to the newest is plain (round 4 of 2026-11-08).
    period: isThisMonth ? monthLabel(current) : `Last ${QUIET_DAYS} days`,
    name: isThisMonth ? monthLabel(current) : `the last ${QUIET_DAYS} days`,
    stats: shippedStats(firstPeriod, entries, asOf, names),
    // Every day of the month (the days still to come as empty slots), or a quiet month's last 30 days.
    days: isThisMonth
      ? dailyCounts(firstPeriod, `${current}-01`, lastDayOf(current), today)
      : dailyCounts(firstPeriod, cutoff, today, today),
    ...view(isThisMonth ? pickRows(thisMonth) : pickRows(entries, true)),
    listLabel: isThisMonth ? 'Latest this month' : 'Latest updates',
  }
  // Then each month before it with something shipped, back to the /builds feed's 12-month window
  // (round 5 of 2026-11-02): the same card and rows, for that whole month.
  const earlier = [...new Set(entries.map((e) => e.month))]
    .filter((m) => m < current && (!recentFrom || m >= recentFrom))
    .sort((x, y) => y.localeCompare(x))
    .map((m): LogMonth => {
      const period = entries.filter((e) => e.month === m)
      return {
        id: m,
        period: monthLabel(m),
        name: monthLabel(m),
        stats: shippedStats(period, entries, asOf, names, { streak: false }),
        days: dailyCounts(period, `${m}-01`, lastDayOf(m), today),
        ...view(pickRows(period)),
        listLabel: `Latest in ${monthLabel(m)}`,
      }
    })

  return [first, ...earlier]
}

export default async function BuildLogStrip() {
  const months = await getLogMonths()
  if (!months) return null

  return (
    // A full-bleed band under "What I'm working on" (owner, 2026-11-08) in its own green
    // wash (`.lab-accent-buildlog` in app/globals.css), close under it with no hairline
    // (round 3: the gap read as a big break); owned here so that a missing log leaves no
    // empty band behind.
    <LogMonthProvider>
      <section
        id="build-log"
        aria-labelledby="build-log-heading"
        className="lab-accent-buildlog lab-part-wash relative z-10 pt-2 pb-12 md:pt-4"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-x-6">
              {/* "Build log" is the heading; the month is named once, on the card (round 4 of 2026-11-08). */}
              <LabSubheader id="build-log-heading" title="Build log" icon={<ScrollIcon />} />
              <Link
                href="/builds"
                className="group mb-8 -mt-3 flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-cyan-400/40 hover:bg-white/8 hover:text-cyan-200 sm:mt-0"
              >
                See the full build log
                <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Month card | its updates | release-kit, side by side from 1024px. */}
            <BuildLogMonths months={months} aside={<ReleaseKitNote />} />
          </Reveal>
        </div>
      </section>
    </LogMonthProvider>
  )
}
