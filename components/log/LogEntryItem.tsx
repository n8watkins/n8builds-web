import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import { RELEASE_NOTES_SHOWN, type HighlightKind, type LogEntry, type ReleaseSection } from '@/lib/build-log'

// One entry on the build log's timeline: a release ("Shipped v0.8.0"), a day's
// changes, or a hand-written highlight (a featured card). Used by the /builds
// feed and by each build page's "Recent activity"; renders on the server or
// the client.

// A release's patch notes, by release-kit section: the label and its colour.
const SECTION: Record<ReleaseSection, { label: string; className: string }> = {
  breaking: { label: 'Breaking', className: 'border-rose-400/30 bg-rose-400/10 text-rose-300' },
  new: { label: 'New', className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' },
  fixed: { label: 'Fixed', className: 'border-amber-400/30 bg-amber-400/10 text-amber-300' },
  faster: { label: 'Faster', className: 'border-sky-400/30 bg-sky-400/10 text-sky-300' },
  safer: { label: 'Safer', className: 'border-violet-400/30 bg-violet-400/10 text-violet-300' },
}

/** A release's patch notes: each line with its section, the first few only. */
function PatchNotes({ entry }: { entry: LogEntry }) {
  const notes = entry.notes ?? []
  const shown = notes.slice(0, RELEASE_NOTES_SHOWN)
  const rest = notes.length - shown.length
  return (
    <ul aria-label={`What's in ${entry.title.replace(/^Shipped /, '')}`} className="mt-2.5 space-y-1.5">
      {shown.map((note, i) => (
        <li key={i} className="flex items-start gap-2 text-sm leading-snug text-slate-300">
          <span
            className={`mt-px w-[3.75rem] shrink-0 rounded-full border px-1.5 py-px text-center font-mono text-[0.6rem] font-bold uppercase tracking-wider ${SECTION[note.section].className}`}
          >
            {SECTION[note.section].label}
          </span>
          <span>{note.text}</span>
        </li>
      ))}
      {rest > 0 && <li className="pl-[4.25rem] font-mono text-[0.7rem] text-slate-450">and {rest} more in the release</li>}
    </ul>
  )
}

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
      // 2px of padding, cancelled by the margin, makes the target at least
      // 24px tall (WCAG 2.5.8) without moving anything; no more, or it would
      // overlap the build name's link above.
      className="group/link -my-0.5 inline-block rounded-sm py-0.5 transition-colors hover:text-cyan-200"
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
  icon,
}: {
  entry: LogEntry
  buildName: string
  /** Off on a build's own page, where the name would repeat on every line. */
  showBuild?: boolean
  /** The build's app icon: it takes the timeline dot's place, so the feed reads by build at a glance. */
  icon?: string
}) {
  const highlight = entry.kind === 'highlight'
  // A release with patch notes reads as a card, like a highlight.
  const card = highlight || (entry.kind === 'release' && (entry.notes?.length ?? 0) > 0)

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
      {entry.notes && entry.notes.length > 0 && <PatchNotes entry={entry} />}
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

  // Level with the meta line, which a highlight's card pads down.
  const top = card ? 'top-[1.35rem] sm:top-[1.6rem]' : 'top-[0.3rem]'
  return (
    // `log-in` (globals.css) eases the entry in as it scrolls into view.
    <li className={`log-in relative pb-6 last:pb-0 ${icon ? 'pl-8' : 'pl-6'}`} data-kind={entry.kind} data-build={entry.build}>
      {icon ? (
        // The build's icon on the line: releases and highlights get a cyan ring, a day's changes don't.
        <Image
          src={icon}
          alt=""
          width={24}
          height={24}
          unoptimized={icon.endsWith('.svg')}
          className={`absolute left-0 h-6 w-6 -translate-x-1/2 -translate-y-[0.2rem] rounded-md bg-darkBlue ${
            card ? 'top-[1.35rem] sm:top-[1.6rem]' : 'top-0'
          } ${entry.kind === 'change' ? 'ring-1 ring-white/10' : 'ring-2 ring-cyan-400/70 shadow-[0_0_10px_rgba(34,211,238,0.45)]'}`}
        />
      ) : (
        // The timeline dot: releases and highlights glow, a day's changes don't.
        <span
          aria-hidden
          className={`absolute left-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full ${top} ${
            entry.kind === 'change'
              ? 'border border-slate-450 bg-darkBlue'
              : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
          }`}
        />
      )}
      {card ? (
        <div
          className={`rounded-2xl border p-4 sm:p-5 ${
            highlight
              ? 'border-cyan-400/20 bg-linear-to-br from-cyan-500/[0.07] to-blue-600/[0.07]'
              : 'border-white/8 bg-linear-to-br from-white/[0.035] to-cyan-500/[0.03]'
          }`}
        >
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
