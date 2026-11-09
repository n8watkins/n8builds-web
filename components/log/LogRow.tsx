import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import { allBuilds, type LogEntry } from '@/lib/build-log'
import { BUILD_ICONS } from '@/lib/build-meta'

// One compact row of the build log: the build's icon, a mono line (the build's
// name, or on a build's own page the kind of entry), the title, and the date.
// The homepage's build log strip (components/sections/BuildLogStrip.tsx) and
// each build page's build log (components/log/BuildPageLog.tsx) share it, so
// the two read as one log.

const names = Object.fromEntries(allBuilds.map((b) => [b.slug, b.name]))

export default function LogRow({ entry, showBuild = true }: {
  entry: LogEntry
  /**
   * The strip names the build and links the row to its part of the full log.
   * Off on a build's own page: the name would repeat on every row, so the mono
   * line says what kind of entry it is, and the row opens the entry itself on
   * GitHub when it has a link.
   */
  showBuild?: boolean
}) {
  const name = names[entry.build] ?? entry.build
  const icon = BUILD_ICONS[entry.build]
  const version = entry.kind === 'release' ? /^Shipped (v\S+)$/.exec(entry.title)?.[1] : undefined
  const label = showBuild ? name : entry.kind === 'release' ? 'Release' : entry.kind === 'highlight' ? 'Highlight' : 'Update'
  const href = showBuild ? `/builds?build=${entry.build}` : entry.url
  const external = !!href && /^https?:/.test(href)
  const row = 'group relative flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04] sm:items-center sm:gap-3.5'
  const content = (
    <>
      {icon ? (
        <Image
          src={icon}
          alt=""
          width={32}
          height={32}
          unoptimized={icon.endsWith('.svg')}
          className={`mt-0.5 h-8 w-8 shrink-0 rounded-lg sm:mt-0 ${!showBuild && entry.kind === 'release' ? 'ring-2 ring-cyan-400/50' : ''}`}
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
        <p
          className={`font-mono text-[0.7rem] font-semibold uppercase tracking-wider ${
            !showBuild && entry.kind === 'release' ? 'text-cyan-300' : 'text-slate-400'
          }`}
        >
          {label}
          {/* Phones: the date rides on this line, so the title gets the width. */}
          <span className="font-normal text-slate-475 sm:hidden">
            {' '}
            / <span className="text-slate-450">{entry.dayLabel}</span>
          </span>
        </p>
        <p
          className="line-clamp-2 text-[0.95rem] sm:line-clamp-none sm:truncate font-semibold leading-snug text-slate-100 transition-colors group-hover:text-cyan-100"
        >
          {version ? (
            <>
              Shipped <span className="font-mono text-[0.92em] text-cyan-300">{version}</span>
              {entry.detail && <span className="font-normal text-[#9cadc5]"> - {entry.detail}</span>}
            </>
          ) : (
            entry.title
          )}
          {external && <span className="sr-only"> (opens in a new tab)</span>}
        </p>
      </div>
      <time
        dateTime={entry.date}
        className="hidden shrink-0 self-start pt-0.5 font-mono sm:flex sm:items-center sm:gap-1 text-[0.7rem] uppercase tracking-wider text-slate-450"
      >
        {entry.dayLabel}
        {external && (
          <FiArrowUpRight
            aria-hidden
            className="h-3.5 w-3.5 text-slate-475 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-300"
          />
        )}
      </time>
    </>
  )
  // The whole row is the link: it opens this build's part of the full log, or
  // the entry itself, named by what it shows (the build or kind, the title, the date).
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
