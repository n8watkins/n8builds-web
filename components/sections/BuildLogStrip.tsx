import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import { builds } from '@/data/builds'
import { dayKey, getBuildLog, monthLabel, type LogEntry } from '@/lib/build-log'

// The homepage's compact build log: the newest month of /builds at a glance.
// One row per build (its newest entry that month), and a small calendar of the
// month's activity across every build. Rendered on the server from the same
// hourly-cached GitHub log as /builds (lib/build-log.ts), so it adds no
// client code and the page stays static. If the log can't be read at all, the
// strip is left out; it never breaks the page.
//
// It sits right under "What I'm working on" (the Appturnity ad, whose "What's
// new" dialog is Appturnity's own news): this is everything else, across
// builds, so it reads as a log (mono dates, the feed's timeline dots), not a
// second ad.

/** The builds' own app icons (the Lab rows and the extensions use the same files). */
const ICONS: Record<string, string> = {
  'piper-tts': '/builds/piper-tts/icon.png',
  tldw: '/builds/tldw/icon.png',
  tubevault: '/builds/tubevault/icon.png',
  scribe: '/builds/scribe/icon.png',
  openping: '/builds/openping/icon.svg',
  solara: '/builds/solara/icon.png',
  'portfolio-rank': '/builds/portfolio-rank/icon.png',
  n8builds: '/tab/n8-icon-192.png',
}

const MAX_ROWS = 5
/** Phones show one row fewer, so the strip stays short. */
const PHONE_ROWS = 4
/** Months in the activity chart, ending with the current one. */
const CHART_MONTHS = 6

const names = Object.fromEntries(builds.map((b) => [b.slug, b.name]))

/** How much an entry counts for in the chart: a day's changes, or one highlight. */
const weight = (e: LogEntry) => (e.kind === 'highlight' ? 1 : 1 + e.more)

/** A month this busy gets a "This month" strip; a quieter one shows the latest from every build. */
const MONTH_MIN = 3
/** In "This month", no build takes more than this many rows, so one busy repo can't fill the strip. */
const PER_BUILD = 3

/**
 * The rows, newest first. With `perBuild` 1, each build's newest entry (the
 * latest from every build); otherwise up to `perBuild` entries per build.
 */
function pickRows(entries: LogEntry[], perBuild: number): LogEntry[] {
  const taken = new Map<string, number>()
  const rows: LogEntry[] = []
  for (const e of [...entries].sort((a, b) => b.date.localeCompare(a.date))) {
    if (rows.length === MAX_ROWS) break
    const n = taken.get(e.build) ?? 0
    if (n >= perBuild) continue
    taken.set(e.build, n + 1)
    rows.push(e)
  }
  return rows
}

/** `count` months ending with `last` (`YYYY-MM`), oldest first. */
function monthsEnding(last: string, count: number): string[] {
  const [year, month] = last.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => new Date(Date.UTC(year, month - count + i, 1)).toISOString().slice(0, 7))
}

/**
 * Changes per month across every build, as small bars. Each month with
 * activity links to its part of the full log.
 */
function MonthBars({ entries, current }: { entries: LogEntry[]; current: string }) {
  const months = monthsEnding(current, CHART_MONTHS)
  const counts = months.map((m) => entries.filter((e) => e.month === m).reduce((n, e) => n + weight(e), 0))
  const max = Math.max(...counts, 1)
  return (
    <ol className="flex h-24 items-end gap-2" aria-label="Changes by month">
      {months.map((m, i) => {
        const n = counts[i]
        const label = monthLabel(m)
        const short = label.slice(0, 3)
        const isCurrent = m === current
        const bar = (
          <>
            <span aria-hidden className={`font-mono text-[0.62rem] ${n ? 'text-slate-300' : 'text-slate-475'}`}>
              {n}
            </span>
            <span aria-hidden className="flex h-14 w-full items-end">
              <span
                className={`w-full rounded-[3px] transition-colors ${
                  n === 0
                    ? 'bg-white/[0.06]'
                    : isCurrent
                      ? 'bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.45)]'
                      : 'bg-cyan-400/45 group-hover:bg-cyan-300/80'
                }`}
                style={{ height: n ? `${Math.max((n / max) * 100, 8)}%` : '3px' }}
              />
            </span>
            <span aria-hidden className={`font-mono text-[0.62rem] uppercase tracking-wider ${isCurrent ? 'text-cyan-300' : 'text-slate-450'}`}>
              {short}
            </span>
            <span className="sr-only">
              {label}: {n} {n === 1 ? 'change' : 'changes'}
            </span>
          </>
        )
        return (
          <li key={m} className="flex-1">
            {n ? (
              <Link
                href={`/builds#month-${m}`}
                className="group flex flex-col items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
              >
                {bar}
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-1">{bar}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Row({ entry, phoneHidden }: { entry: LogEntry; phoneHidden: boolean }) {
  const name = names[entry.build] ?? entry.build
  const icon = ICONS[entry.build]
  const version = entry.kind === 'release' ? /^Shipped (v\S+)$/.exec(entry.title)?.[1] : undefined
  return (
    <li
      className={`group relative items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04] sm:items-center sm:gap-3.5 ${
        phoneHidden ? 'hidden sm:flex' : 'flex'
      }`}
    >
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
        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/6 font-mono text-xs text-slate-300">
          {name.charAt(0)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
          {/* Stretched over the row: it opens this build's part of the full log. */}
          <Link
            href={`/builds?build=${entry.build}`}
            className="after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-cyan-400/60"
          >
            {name}
            <span className="sr-only">: </span>
          </Link>
          {/* Phones: the date rides on this line, so the title gets the width. */}
          <span className="font-normal text-slate-475 sm:hidden">
            {' '}
            / <span className="text-slate-450">{entry.dayLabel}</span>
          </span>
        </p>
        <p className="line-clamp-2 text-[0.95rem] sm:line-clamp-none sm:truncate font-semibold leading-snug text-slate-100 transition-colors group-hover:text-cyan-100">
          {version ? (
            <>
              Shipped <span className="font-mono text-[0.92em] text-cyan-300">{version}</span>
              {entry.detail && <span className="font-normal text-[#9cadc5]"> - {entry.detail}</span>}
            </>
          ) : (
            entry.title
          )}
        </p>
      </div>
      <time dateTime={entry.date} className="hidden shrink-0 self-start pt-0.5 font-mono sm:block text-[0.7rem] uppercase tracking-wider text-slate-450">
        {entry.dayLabel}
      </time>
    </li>
  )
}

export default async function BuildLogStrip() {
  let entries: LogEntry[]
  try {
    entries = (await getBuildLog()).entries
  } catch {
    // GitHub unreachable with nothing cached: leave the strip out.
    return null
  }
  if (entries.length === 0) return null

  const current = dayKey(new Date().toISOString()).slice(0, 7)
  const thisMonth = entries.filter((e) => e.month === current)
  const isThisMonth = thisMonth.length >= MONTH_MIN
  const rows = isThisMonth ? pickRows(thisMonth, PER_BUILD) : pickRows(entries, 1)
  // Rows arrive newest first, so each month is one run, as in the full feed.
  const groups: { month: string; rows: LogEntry[] }[] = []
  for (const row of rows) {
    const last = groups.at(-1)
    if (last?.month === row.month) last.rows.push(row)
    else groups.push({ month: row.month, rows: [row] })
  }
  const shownMonths = new Set(monthsEnding(current, CHART_MONTHS))
  const recent = entries.filter((e) => shownMonths.has(e.month))
  const total = recent.reduce((n, e) => n + weight(e), 0)
  const buildCount = new Set(recent.map((e) => e.build)).size

  return (
    // The homepage's raised band (HomePage's Band tone="raised"), owned here so
    // that a missing log leaves no empty band behind.
    <div className="relative z-10 border-t border-white/[0.06] bg-white/[0.022]">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        <Reveal>
          <section id="build-log" aria-labelledby="build-log-heading" className="py-3">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <p className="mb-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">
                  Build log · every project
                </p>
                <h2 id="build-log-heading" className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                  {isThisMonth ? 'Shipped this month' : 'Recently shipped'}
                </h2>
              </div>
              <Link
                href="/builds"
                className="group flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-cyan-400/40 hover:bg-white/8 hover:text-cyan-200"
              >
                See the full build log
                <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/8 bg-[#0a1526]/70 md:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="space-y-3 p-3 sm:p-4">
                {groups.map((group) => (
                  <section
                    key={group.month}
                    aria-labelledby={`strip-${group.month}`}
                    className={`md:flex md:gap-4 ${group.rows.every((r) => rows.indexOf(r) >= PHONE_ROWS) ? 'max-sm:hidden' : ''}`}
                  >
                    <h3
                      id={`strip-${group.month}`}
                      className="mb-1 px-2 font-mono text-[0.62rem] font-bold uppercase tracking-[0.18em] text-cyan-400 md:mb-0 md:w-20 md:shrink-0 md:px-0 md:pt-3.5 md:text-right"
                    >
                      {monthLabel(group.month).replace(` ${current.slice(0, 4)}`, '')}
                    </h3>
                    <ul className="min-w-0 flex-1">
                      {group.rows.map((entry) => (
                        <Row key={entry.id} entry={entry} phoneHidden={rows.indexOf(entry) >= PHONE_ROWS} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              <div className="flex flex-col justify-center gap-4 border-t border-white/8 px-5 py-4 md:border-l md:border-t-0 md:px-6">
                <p className="text-sm text-[#9cadc5]">
                  <span className="text-lg font-bold text-slate-50">{total}</span> {total === 1 ? 'change' : 'changes'} across{' '}
                  {buildCount} {buildCount === 1 ? 'build' : 'builds'}
                  <span className="block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-slate-450">
                    last {CHART_MONTHS} months
                  </span>
                </p>
                <MonthBars entries={recent} current={current} />
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  )
}
