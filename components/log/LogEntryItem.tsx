import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import type { HighlightKind, LogEntry } from '@/lib/build-log'

// One entry on the build log's timeline: a release ("Shipped v0.8.0"), a day's
// changes, or a hand-written highlight (a featured card). Used by the /builds
// feed and by each build page's "Recent activity"; renders on the server or
// the client.

const HIGHLIGHT_LABEL: Record<HighlightKind, string> = {
  shipped: 'Shipped',
  fixed: 'Fixed',
  learned: 'Learned',
  next: 'Up next',
}

function Title({ entry }: { entry: LogEntry }) {
  const version = entry.kind === 'release' ? /^Shipped (v\S+)$/.exec(entry.title)?.[1] : undefined
  const text = version ? (
    <>
      Shipped <span className="font-mono text-[0.92em] text-cyan-300">{version}</span>
    </>
  ) : (
    entry.title
  )
  if (!entry.url) return text

  const external = /^https?:/.test(entry.url)
  return (
    <a
      href={entry.url}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group/link rounded-sm transition-colors hover:text-cyan-200"
    >
      {text}
      <FiArrowUpRight className="ml-1 inline-block h-3.5 w-3.5 align-[-0.1em] text-slate-475 transition-all group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 group-hover/link:text-cyan-300" />
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  )
}

export default function LogEntryItem({
  entry,
  buildName,
  showBuild = true,
}: {
  entry: LogEntry
  buildName: string
  /** Off on a build's own page, where the name would repeat on every line. */
  showBuild?: boolean
}) {
  const highlight = entry.kind === 'highlight'

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.7rem] uppercase tracking-wider">
        {highlight && (
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-px text-[0.62rem] font-bold text-cyan-300">
            {HIGHLIGHT_LABEL[entry.highlightKind ?? 'shipped']}
          </span>
        )}
        {showBuild && (
          <>
            <Link
              href={`/builds/${entry.build}`}
              className="-my-1 py-1 font-semibold text-slate-300 transition-colors hover:text-cyan-300"
            >
              {buildName}
            </Link>
            <span aria-hidden className="text-slate-475">
              /
            </span>
          </>
        )}
        <time dateTime={entry.date} className="text-slate-450">
          {entry.dayLabel}
        </time>
      </div>

      <p className="mt-1.5 text-[0.95rem] font-semibold leading-snug text-slate-100">
        <Title entry={entry} />
      </p>
      {entry.detail && <p className="mt-1 text-sm leading-relaxed text-[#9cadc5]">{entry.detail}</p>}
      {entry.more > 0 && (
        <p className="mt-1.5 font-mono text-[0.7rem] text-slate-450">
          and {entry.more} more {entry.more === 1 ? 'change' : 'changes'}
        </p>
      )}
      {entry.image && (
        <div className="relative mt-4 aspect-video overflow-hidden rounded-xl border border-white/8 bg-white/3">
          <Image src={entry.image.url} alt={entry.image.alt} fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" />
        </div>
      )}
    </>
  )

  return (
    <li className="relative pb-7 pl-6 last:pb-0" data-kind={entry.kind} data-build={entry.build}>
      {/* The timeline dot: releases and highlights glow, a day's changes don't. */}
      <span
        aria-hidden
        className={`absolute left-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full ${
          // Level with the meta line, which a highlight's card pads down.
          highlight ? 'top-[1.35rem] sm:top-[1.6rem]' : 'top-[0.3rem]'
        } ${
          entry.kind === 'change'
            ? 'border border-slate-450 bg-darkBlue'
            : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
        }`}
      />
      {highlight ? (
        <div className="rounded-2xl border border-cyan-400/20 bg-linear-to-br from-cyan-500/[0.07] to-blue-600/[0.07] p-4 sm:p-5">
          {body}
        </div>
      ) : (
        body
      )}
    </li>
  )
}

/** The vertical line the entries hang on. */
export function Timeline({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <ol className={`relative ml-1.5 before:absolute before:bottom-1 before:left-0 before:top-1.5 before:w-px before:-translate-x-1/2 before:bg-white/10 ${className}`}>
      {children}
    </ol>
  )
}
