import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import LabSubheader from '@/components/sections/LabSubheader'
import { ScrollIcon } from '@/components/ui/PartIcons'
import BuildLogMonths, {
  LogMonthLine,
  LogMonthProvider,
  type LogMonth,
} from '@/components/sections/BuildLogMonths'
import { allBuilds, dayKey, getBuildLog, monthLabel, type LogEntry } from '@/lib/build-log'
import { BUILD_ICONS } from '@/lib/build-meta'
import { dailyCounts, shippedStats } from '@/lib/log-stats'

// The homepage's compact build log: the newest month of /builds at a glance.
// The month's updates as rows, a page of them at a time, moving on every few
// seconds (BuildLogPages), and a card that cycles through the month's figures
// (ShippedStats), with arrows back to the months before (BuildLogMonths, round 5
// of 2026-11-02). Rendered on the server from the same hourly-cached GitHub log
// as /builds (lib/build-log.ts), so the page stays static; only the pages' and
// the figures' timers run in the browser. If the log can't be read at all, the
// strip is left out; it never breaks the page.
//
// It is the Lab's first part (the owner's ask, 2026-11-02: "Build log should be
// at the top of the lab"), in its own green wash, right under the Lab's intro.
// It reads as a log (mono dates, the feed's timeline dots), not an ad.

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

/** The words a row is announced by when someone pages to it: build, then title. */
function rowLabel(entry: LogEntry): string {
  return `${names[entry.build] ?? entry.build}, ${entry.title}`
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
  // The row's link is named by the build and the entry ("Solara: Setup: centered steps..."), not the build alone.
  const id = `strip-${entry.id.replace(/[^\w-]/g, '-')}`
  return (
    <div className="group relative flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04] sm:items-center sm:gap-3.5">
      {icon ? (
        <Image
          src={icon}
          alt=""
          width={32}
          height={32}
          unoptimized={icon.endsWith('.svg')}
          className="mt-0.5 h-8 w-8 shrink-0 rounded-lg sm:mt-0"
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
          {/* Phones: the date rides on this line, so the title gets the width. */}
          <span className="font-normal text-slate-475 sm:hidden">
            {' '}
            / <span className="text-slate-450">{entry.dayLabel}</span>
          </span>
        </p>
        <p
          id={`${id}-title`}
          className="line-clamp-2 text-[0.95rem] sm:line-clamp-none sm:truncate font-semibold leading-snug text-slate-100 transition-colors group-hover:text-cyan-100"
        >
          {version ? (
            <>
              Shipped <span className="font-mono text-[0.92em] text-cyan-300">{version}</span>
              {entry.detail && (
                <span className="font-normal text-[#9cadc5]"> - {entry.detail}</span>
              )}
            </>
          ) : (
            entry.title
          )}
        </p>
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
 * Under the log, a small ad for what writes it (round 5 of 2026-11-02): every
 * project here runs release-kit, so its Conventional Commits and releases
 * become this log on their own. One line of pitch and a link to the repo.
 */
function ReleaseKitAd() {
  return (
    <aside
      aria-labelledby="release-kit-ad"
      className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/8 bg-linear-to-r from-cyan-400/[0.06] via-white/[0.02] to-transparent px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <Image
          src="/log/release-kit.svg"
          alt=""
          width={36}
          height={36}
          unoptimized
          className="h-9 w-9 shrink-0 rounded-lg"
        />
        <p className="min-w-0 text-sm leading-snug text-[#9cadc5]">
          <span id="release-kit-ad" className="font-semibold text-slate-100">
            This log writes itself, with{' '}
            <span className="font-mono whitespace-nowrap text-cyan-300">release-kit</span>.
          </span>{' '}
          Write Conventional Commits and it cuts the versions, release notes and every update above.
          No changelog to keep by hand: one command adds it to any repo.
        </p>
      </div>
      <a
        href={RELEASE_KIT}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex shrink-0 items-center justify-center gap-2 self-stretch rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-cyan-400/40 hover:bg-white/8 hover:text-cyan-200 sm:self-auto"
      >
        Get release-kit
        <FiArrowUpRight
          className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
        <span className="sr-only"> on GitHub (opens in a new tab)</span>
      </a>
    </aside>
  )
}

export default async function BuildLogStrip() {
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
  const year = current.slice(0, 4)
  // "October", or "December 2025" for another year.
  const shortName = (month: string) => monthLabel(month).replace(` ${year}`, '')
  const view = (rows: LogEntry[]) => ({
    rows: rows.map((entry) => <Row key={entry.id} entry={entry} />),
    labels: rows.map(rowLabel),
  })

  // The first view: this month, or in a quiet one the last 30 days (the latest from every build).
  const cutoff = daysBefore(today, QUIET_DAYS - 1)
  const firstPeriod = isThisMonth ? thisMonth : entries.filter((e) => e.day >= cutoff)
  const first: LogMonth = {
    id: isThisMonth ? current : 'recent',
    period: isThisMonth ? shortName(current) : `Last ${QUIET_DAYS} days`,
    name: isThisMonth ? monthLabel(current) : `the last ${QUIET_DAYS} days`,
    stats: shippedStats(firstPeriod, entries, asOf, names),
    // Every day of the month (the days still to come as empty slots), or a quiet month's last 30 days.
    days: isThisMonth
      ? dailyCounts(firstPeriod, `${current}-01`, lastDayOf(current), today)
      : dailyCounts(firstPeriod, cutoff, today, today),
    ...view(isThisMonth ? pickRows(thisMonth) : pickRows(entries, true)),
    listLabel: isThisMonth ? 'Updates this month' : 'Recent updates',
    line: isThisMonth ? 'Shipped this month' : `Shipped in the last ${QUIET_DAYS} days`,
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
        period: shortName(m),
        name: monthLabel(m),
        stats: shippedStats(period, entries, asOf, names, { streak: false }),
        days: dailyCounts(period, `${m}-01`, lastDayOf(m), today),
        ...view(pickRows(period)),
        listLabel: `Updates in ${monthLabel(m)}`,
        line: `Shipped in ${shortName(m)}`,
      }
    })

  const months = [first, ...earlier]

  return (
    // A full-bleed band under "What I'm working on" (owner, 2026-11-08) in its own green
    // wash (`.lab-accent-buildlog` in app/globals.css), with the hairline a homepage band
    // opens on; owned here so that a missing log leaves no empty band behind.
    // The provider shares the month the card shows with the line under the heading.
    <LogMonthProvider lines={months.map((m) => m.line)}>
      <section
        id="build-log"
        aria-labelledby="build-log-heading"
        className="lab-accent-buildlog lab-part-wash relative z-10 border-t border-white/[0.06] py-12"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-x-6">
              {/* "Build log" is the heading (round 5 of 2026-11-02, no eyebrow); the
                 line under it names the month the card shows and follows its arrows. */}
              <LabSubheader
                id="build-log-heading"
                title="Build log"
                icon={<ScrollIcon />}
                kicker={<LogMonthLine className="text-emerald-300" />}
              />
              <Link
                href="/builds"
                className="group mb-8 -mt-3 flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-cyan-400/40 hover:bg-white/8 hover:text-cyan-200 sm:mt-0"
              >
                See the full build log
                <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <BuildLogMonths months={months} />
            <ReleaseKitAd />
          </Reveal>
        </div>
      </section>
    </LogMonthProvider>
  )
}
