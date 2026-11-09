import Image from 'next/image'
import Link from 'next/link'
import { FiArrowRight, FiArrowUpRight, FiGithub, FiStar } from 'react-icons/fi'
import { formatStars, repoStars } from '@/lib/github-stars'
import Reveal from '@/components/ui/Reveal'
import LabSubheader from '@/components/sections/LabSubheader'
import { ScrollIcon } from '@/components/ui/PartIcons'
import BuildLogMonths, { LogMonthProvider, type LogMonth } from '@/components/sections/BuildLogMonths'
import LogRow from '@/components/log/LogRow'
import { allBuilds, dayKey, getBuildLog, monthLabel, type LogEntry } from '@/lib/build-log'
import { dailyCounts, shippedStats } from '@/lib/log-stats'

// The homepage's compact build log: the newest month of /builds at a glance.
// Its updates a page of three at a time, round the month
// (BuildLogPages, restored in round 9 of 2026-11-09), a card that cycles through the month's figures (ShippedStats),
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

const RELEASE_KIT = 'https://github.com/n8watkins/release-kit'

/** What release-kit does, in a few words each (its README): three at most (owner, round 9 of 2026-11-09). */
const RELEASE_KIT_POINTS = ['Checks every commit message', 'Picks each version for you', 'Writes the notes, and this log']

/** Its one-command install, as its README gives it (npm 12 needs --allow-git). */
const RELEASE_KIT_INSTALL = 'npx --allow-git=root github:n8watkins/release-kit .'

/**
 * Beside the log, an ad for what writes it (round 5 of 2026-11-02; a column of
 * the card since round 4 of 2026-11-08; a product ad, not a note, since round 6
 * of 2026-11-09): every project here runs release-kit, so its commits become
 * versions, release notes and this log on their own. Round 8 of 2026-11-09
 * (owner: "more information about what it does, so people want to try it"):
 * its mark and name, the headline, what it does as three bullets (round 9: no check boxes, and "How it works" to
 * /builds/release-kit), the
 * one-command install, and "Get release-kit" with its live star count beside
 * it (lib/github-stars.ts, the same hourly count as the Lab's Star buttons;
 * just the star while there is none). Stacked in the card's third column from
 * 1024px; across the card's foot below that, in two columns from 768px.
 */
async function ReleaseKitAd() {
  const stars = await repoStars('n8watkins/release-kit')
  return (
    <aside
      aria-labelledby="release-kit-name release-kit-ad"
      className="relative flex h-full flex-col justify-center gap-3 overflow-hidden bg-linear-to-b from-cyan-400/[0.07] via-cyan-400/[0.025] to-transparent px-5 py-4 sm:py-5 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:items-center md:gap-x-8 lg:flex lg:items-stretch lg:px-5"
    >
      {/* A soft glow behind the mark, so the column reads as its own little product. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,rgb(34_211_238/0.16),transparent)]"
      />
      <div className="relative flex flex-col gap-2 md:row-span-2 lg:row-span-1">
        <p className="flex items-center gap-2.5">
          <Image src="/log/release-kit.svg" alt="" width={32} height={32} unoptimized className="h-8 w-8 shrink-0 rounded-lg" />
          <span className="min-w-0">
            <span id="release-kit-name" className="block font-mono text-[0.95rem] leading-tight font-bold whitespace-nowrap text-cyan-300">
              release-kit
            </span>
            <span className="block text-[0.68rem] font-semibold tracking-[0.12em] text-slate-400 uppercase">Open source · MIT</span>
          </span>
        </p>
        {/* One line at desktop width (owner, round 9 of 2026-11-09). */}
        <h4 id="release-kit-ad" className="text-[0.95rem] leading-snug font-bold text-balance text-slate-50 lg:text-[0.9rem] lg:whitespace-nowrap">
          Releases that{' '}
          <span className="bg-linear-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">write themselves</span>
        </h4>
        {/* Plain bullets, not check boxes (owner, round 9 of 2026-11-09). */}
        <ul className="mt-0.5 flex flex-col gap-1" aria-label="What release-kit does">
          {RELEASE_KIT_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2 text-[13px] leading-snug text-slate-200">
              <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rounded-full bg-emerald-300" />
              {point}
            </li>
          ))}
        </ul>
        <Link
          href="/builds/release-kit"
          className="group inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 transition-colors hover:text-cyan-200"
        >
          How it works
          <FiArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="relative flex flex-col gap-2">
        <p className="text-[13px] leading-snug text-[#9cadc5]">Set it up with one command:</p>
        {/* The install itself, selectable as one line where it fits, broken at its spaces where it doesn't. */}
        <pre
          className="overflow-hidden rounded-lg border border-white/10 bg-[#07101d]/80 px-2.5 py-1.5 font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap text-slate-200"
          aria-label="Install it with one command"
          data-release-kit-install
        >
          <span aria-hidden="true" className="text-emerald-300 select-none">$ </span>
          {RELEASE_KIT_INSTALL}
        </pre>
        {/* Get it, then its stars: the get link first, so it follows the updates from the keyboard. */}
        <div className="flex items-stretch md:w-full lg:w-auto">
          <a
            href={RELEASE_KIT}
            target="_blank"
            rel="noopener noreferrer"
            className="group btn-shimmer flex flex-1 items-center justify-center gap-1.5 rounded-l-xl bg-linear-to-r from-cyan-500 to-emerald-400 px-2.5 py-2 text-[13px] font-semibold whitespace-nowrap text-slate-950 transition-colors hover:from-cyan-400 hover:to-emerald-300 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            <FiGithub className="h-4 w-4 shrink-0" aria-hidden="true" />
            Get release-kit
            <span className="sr-only"> on GitHub (opens in a new tab)</span>
          </a>
          <a
            href={RELEASE_KIT}
            target="_blank"
            rel="noopener noreferrer"
            className="group/star -ml-px flex items-center gap-1.5 rounded-r-xl border border-amber-300/35 bg-amber-300/[0.08] px-2.5 text-sm font-semibold text-amber-200 transition-colors hover:border-amber-300/55 hover:bg-amber-300/[0.15] focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            <FiStar className="h-3.5 w-3.5 shrink-0 transition-[fill] group-hover/star:fill-current" aria-hidden="true" />
            {stars !== null && stars > 0 ? (
              <span aria-hidden="true" className="tabular-nums" data-stars>
                {formatStars(stars)}
              </span>
            ) : null}
            <span className="sr-only">
              Star release-kit on GitHub{stars ? `, ${stars} ${stars === 1 ? 'star' : 'stars'}` : ''} (opens in a new tab)
            </span>
          </a>
        </div>
      </div>
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
    rows: rows.map((entry) => <LogRow key={entry.id} entry={entry} twoLines />),
    labels: rows.map((entry) => `${names[entry.build] ?? entry.build}, ${entry.title}`),
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
        <div className="mx-auto max-w-site px-5 sm:px-8">
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
            <BuildLogMonths months={months} aside={<ReleaseKitAd />} />
          </Reveal>
        </div>
      </section>
    </LogMonthProvider>
  )
}
