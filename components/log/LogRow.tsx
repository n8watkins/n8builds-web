import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import { ReleaseBadge } from '@/components/log/LogEntryItem'
import { allBuilds, type LogEntry } from '@/lib/build-log'
import { BUILD_ICONS } from '@/lib/build-meta'

// One compact row of the build log: the build's icon (the same frame for
// every row, release or not), a mono line (the build's name, or on a build's
// own page the date) with a "Release" badge on releases, the title, and the
// date. The homepage's build log strip (components/sections/BuildLogStrip.tsx)
// and each build page's build log (components/log/BuildPageLog.tsx) share it,
// so the two read as one log.

const names = Object.fromEntries(allBuilds.map((b) => [b.slug, b.name]))

export default function LogRow({
  entry,
  showBuild = true,
  twoLines = false,
}: {
  entry: LogEntry
  /**
   * Exactly two lines under the mono line, whatever the entry (the homepage's
   * latest updates, owner 2026-11-09), so rows that move on keep one height:
   * the title and one line of what's in it, or a title alone over both lines
   * (a short one keeps the second line empty).
   */
  twoLines?: boolean
  /**
   * The strip names the build and links the row to its part of the full log.
   * Off on a build's own page: the name would repeat on every row, so the
   * mono line carries the date, and the row opens the entry itself on GitHub
   * when it has a link.
   */
  showBuild?: boolean
}) {
  const name = names[entry.build] ?? entry.build
  const icon = BUILD_ICONS[entry.build]
  const version = entry.kind === 'release' ? /^Shipped (v\S+)$/.exec(entry.title)?.[1] : undefined
  // A line of what's in it (round 5 of 2026-11-08): the release's note, or the day's other changes.
  const more =
    entry.detail ??
    (entry.notes?.length ? entry.notes.map((n) => n.text).join('. ') : undefined) ??
    (entry.more > 0 ? `And ${entry.more} more ${entry.more === 1 ? 'change' : 'changes'} that day.` : undefined)
  const href = showBuild ? `/builds?build=${entry.build}` : entry.url
  const external = !!href && /^https?:/.test(href)
  const row = 'group relative flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04] sm:gap-3.5'

  const content = (
    <>
      {icon ? (
        <Image
          src={icon}
          alt=""
          width={32}
          height={32}
          unoptimized={icon.endsWith('.svg')}
          className="mt-0.5 h-8 w-8 shrink-0 rounded-lg ring-1 ring-white/10 sm:mt-0"
        />
      ) : (
        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/6 font-mono text-xs text-slate-300">
          {name.charAt(0)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[0.7rem] font-semibold tracking-wider text-slate-400 uppercase">
          {showBuild ? name : <time dateTime={entry.date}>{entry.dayLabel}</time>}
          {entry.kind === 'release' && (
            <>
              {' '}
              <ReleaseBadge />
            </>
          )}
          {/* Phones: the strip's date rides on this line, so the title gets the width. */}
          {showBuild && (
            <span className="font-normal text-slate-475 sm:hidden">
              {' '}
              <span aria-hidden>/</span> <span className="text-slate-450">{entry.dayLabel}</span>
            </span>
          )}
        </p>
        <div className={twoLines ? 'h-11 overflow-hidden' : undefined}>
          <p
            className={`${twoLines && !more ? 'line-clamp-2' : 'line-clamp-1'} text-base leading-snug font-semibold text-slate-100 transition-colors group-hover:text-cyan-100`}
          >
            {version ? (
              <>
                Shipped <span className="font-mono text-[0.92em] text-cyan-300">{version}</span>
              </>
            ) : (
              entry.title
            )}
            {external && <span className="sr-only"> (opens in a new tab)</span>}
          </p>
          {more && (
            <p className={`mt-0.5 ${twoLines ? 'line-clamp-1' : 'line-clamp-2'} text-sm leading-snug text-[#9cadc5]`}>{more}</p>
          )}
        </div>
      </div>
      {showBuild ? (
        <time
          dateTime={entry.date}
          className="hidden shrink-0 self-start pt-0.5 font-mono text-[0.7rem] tracking-wider text-slate-450 uppercase sm:block"
        >
          {entry.dayLabel}
        </time>
      ) : external ? (
        <FiArrowUpRight
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 text-slate-475 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-300"
        />
      ) : null}
    </>
  )

  // The whole row is the link: it opens this build's part of the full log, or
  // the entry itself, named by what it shows (the build or date, the title).
  return href ? (
    <Link
      href={href}
      data-kind={entry.kind}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`${row} focus-visible:outline-2 focus-visible:outline-cyan-400/60`}
    >
      {content}
    </Link>
  ) : (
    <div data-kind={entry.kind} className={row}>
      {content}
    </div>
  )
}
