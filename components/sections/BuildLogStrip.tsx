import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import { builds } from '@/data/builds'
import ShippedStats from '@/components/sections/ShippedStats'
import { dayKey, getBuildLog, monthLabel, type LogEntry } from '@/lib/build-log'
import { BUILD_ICONS } from '@/lib/build-meta'
import { shippedStats } from '@/lib/log-stats'

// The homepage's compact build log: the newest month of /builds at a glance.
// One row per build (its newest entry that month), and a card that cycles
// through the month's figures (ShippedStats). Rendered on the server from the same
// hourly-cached GitHub log as /builds (lib/build-log.ts), so it adds no
// client code and the page stays static. If the log can't be read at all, the
// strip is left out; it never breaks the page.
//
// It sits right under "What I'm working on" (the Appturnity ad, whose "What's
// new" dialog is Appturnity's own news): this is everything else, across
// builds, so it reads as a log (mono dates, the feed's timeline dots), not a
// second ad.

const MAX_ROWS = 5
/** Phones show one row fewer, so the strip stays short. */
const PHONE_ROWS = 4
/** A quiet month's card covers this many days back instead. */
const QUIET_DAYS = 30

const names = Object.fromEntries(builds.map((b) => [b.slug, b.name]))

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

/** `YYYY-MM-DD`, `days` days before `day`. */
function daysBefore(day: string, days: number): string {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function Row({ entry, phoneHidden }: { entry: LogEntry; phoneHidden: boolean }) {
  const name = names[entry.build] ?? entry.build
  const icon = BUILD_ICONS[entry.build]
  const version = entry.kind === 'release' ? /^Shipped (v\S+)$/.exec(entry.title)?.[1] : undefined
  // The row's link is named by the build and the entry ("Solara: Setup: centered steps..."), not the build alone.
  const id = `strip-${entry.id.replace(/[^\w-]/g, '-')}`
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
        <p id={`${id}-title`} className="line-clamp-2 text-[0.95rem] sm:line-clamp-none sm:truncate font-semibold leading-snug text-slate-100 transition-colors group-hover:text-cyan-100">
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
  let asOf: string
  try {
    ;({ entries, asOf } = await getBuildLog())
  } catch {
    // GitHub unreachable with nothing cached: leave the strip out.
    return null
  }
  if (entries.length === 0) return null

  const current = dayKey(asOf).slice(0, 7)
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
  // The card's figures: this month, or a quiet month's last 30 days.
  const today = dayKey(asOf)
  const cutoff = daysBefore(today, QUIET_DAYS - 1)
  const period = isThisMonth ? thisMonth : entries.filter((e) => e.day >= cutoff)
  const stats = shippedStats(period, entries, asOf, names)

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

            <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/8 bg-[#0a1526]/70 md:grid-cols-[17rem_minmax(0,1fr)]">
              <div className="flex flex-col border-b border-white/8 px-5 py-4 md:border-r md:border-b-0 md:px-6 md:py-5">
                {/* The month is named once, here; the rows below only get month headings when they span several. */}
                <ShippedStats stats={stats} period={isThisMonth ? monthLabel(current).replace(` ${current.slice(0, 4)}`, '') : `Last ${QUIET_DAYS} days`} />
              </div>

              <div className="space-y-3 p-3 sm:p-4">
                {groups.map((group) => (
                  <section
                    key={group.month}
                    aria-labelledby={`strip-${group.month}`}
                    className={`${group.rows.every((r) => rows.indexOf(r) >= PHONE_ROWS) ? 'max-sm:hidden' : ''}`}
                  >
                    <h3
                      id={`strip-${group.month}`}
                      className={
                        groups.length > 1
                          ? 'mb-1 px-2 pt-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.18em] text-cyan-400'
                          : 'sr-only'
                      }
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
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  )
}
