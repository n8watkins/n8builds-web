'use client'
import { Suspense, useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import LogEntryItem, { Timeline } from '@/components/log/LogEntryItem'
import type { LogEntry } from '@/lib/build-log'
import { LOG_KINDS, type LogKind } from '@/lib/build-meta'

// The activity feed on /builds: month by month, newest first, with two
// filters: the kind of build (Tools, Web apps, Chrome extensions, This site)
// and the build itself (chips with each build's icon, like the N8 Notions
// topic filter). Both live in the URL (`/builds?kind=extensions`,
// `/builds?build=scribe`), so build pages can link to their part of the log
// and a filtered view can be shared. It opens on the last 12 months; older
// months wait behind "Show older entries".
//
// The feed is prerendered unfiltered and hydrated in place: it is visible in
// the HTML before any JavaScript runs, and no entry animates in. Only the URL
// reader below is rendered on the client.

type FeedProps = {
  entries: LogEntry[]
  /** Builds in index order, for the chips and entry labels. */
  builds: { slug: string; name: string; kind: LogKind; icon?: string }[]
  months: Record<string, string>
  recentFrom: string | null
}

// Runs while the page parses: a shared filtered link (?build=x, ?kind=x) hides the
// prerendered, unfiltered feed until the filter applies, so a slow phone never
// shows every build and then collapses. It marks <html>, which suppresses
// hydration warnings for exactly this kind of attribute.
const HIDE_UNFILTERED = `var q=new URLSearchParams(location.search);if(q.get('build')||q.get('kind'))document.documentElement.dataset.logFiltered=''`

/**
 * Reports the URL's `?build=` and `?kind=` to the feed. useSearchParams opts everything up
 * to the nearest Suspense boundary out of prerendering, and that boundary is
 * rendered again on the client, so it gets a boundary of its own and renders
 * nothing. (Around the whole feed, every visitor's prerendered feed was thrown
 * away on hydration and rendered again, hidden, then faded back in.) Its
 * fallback, which only the prerendered HTML has, is the script above.
 */
function UrlFilter({ onChange }: { onChange: (build: string | null, kind: string | null) => void }) {
  const params = useSearchParams()
  const build = params.get('build')
  const kind = params.get('kind')
  // Before paint, so neither hydration nor a client navigation shows a frame of the wrong feed.
  useLayoutEffect(() => onChange(build, kind), [build, kind, onChange])
  return null
}

/** Sets the filters in the URL: a kind, and optionally one of its builds. */
function setFilter({ kind = null, build = null }: { kind?: LogKind | null; build?: string | null }) {
  const url = new URL(window.location.href)
  url.searchParams.delete('kind')
  url.searchParams.delete('build')
  if (kind) url.searchParams.set('kind', kind)
  if (build) url.searchParams.set('build', build)
  // Next.js syncs useSearchParams with the native history API, but only for a
  // null (or app-owned) state: a state carrying Next's own router internals is
  // taken as Next's own call and not synced, and the filter would never apply.
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
}

export default function LogFeed({ entries, builds, months, recentFrom }: FeedProps) {
  // Null until the URL is read: the prerendered feed is unfiltered.
  const [active, setActive] = useState<string | null>(null)
  const [kind, setKind] = useState<LogKind | null>(null)
  const [synced, setSynced] = useState(false)
  const [showOlder, setShowOlder] = useState(false)
  const bySlug = useMemo(() => Object.fromEntries(builds.map((b) => [b.slug, b])), [builds])
  const withEntries = useMemo(() => builds.filter((b) => entries.some((e) => e.build === b.slug)), [builds, entries])
  const kinds = useMemo(() => LOG_KINDS.filter((k) => withEntries.some((b) => b.kind === k.id)), [withEntries])

  const onUrl = useCallback(
    (build: string | null, kindParam: string | null) => {
      const b = build && Object.hasOwn(bySlug, build) ? build : null
      const k = LOG_KINDS.find((x) => x.id === kindParam)?.id ?? null
      setActive(b)
      // A kind that doesn't hold the build is dropped, so the build's chip stays in the row.
      setKind(b && k && bySlug[b].kind !== k ? null : k)
      setSynced(true)
    },
    [bySlug],
  )
  // The URL's filter has applied: show what the inline script hid.
  useLayoutEffect(() => {
    if (synced) delete document.documentElement.dataset.logFiltered
  }, [synced])

  const visible = active
    ? entries.filter((e) => e.build === active)
    : kind
      ? entries.filter((e) => bySlug[e.build]?.kind === kind)
      : entries
  const isRecent = (e: LogEntry) => !recentFrom || e.month >= recentFrom
  const recent = visible.filter(isRecent)
  const older = visible.filter((e) => !isRecent(e))
  const shown = showOlder ? visible : recent
  // The build chips: every build, or the chosen kind's.
  const buildChips = kind ? withEntries.filter((b) => b.kind === kind) : withEntries
  const countFor = (k: LogKind) => entries.filter((e) => bySlug[e.build]?.kind === k).length

  // Entries arrive in feed order, so each month is one contiguous run.
  const groups: { month: string; entries: LogEntry[] }[] = []
  for (const entry of shown) {
    const last = groups.at(-1)
    if (last?.month === entry.month) last.entries.push(entry)
    else groups.push({ month: entry.month, entries: [entry] })
  }

  const emptyName = active ? bySlug[active].name : kinds.find((k) => k.id === kind)?.label

  return (
    <div className="[[data-log-filtered]_&]:invisible">
      <Suspense fallback={<script dangerouslySetInnerHTML={{ __html: HIDE_UNFILTERED }} />}>
        <UrlFilter onChange={onUrl} />
      </Suspense>

      {withEntries.length > 1 && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by kind">
            <button type="button" aria-pressed={!active && !kind} onClick={() => setFilter({})} className={chip(!active && !kind)}>
              All<span className="ml-1.5 text-xs font-normal">{entries.length}</span>
            </button>
            {kinds.length > 1 &&
              kinds.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={!active && kind === k.id}
                  onClick={() => setFilter(!active && kind === k.id ? {} : { kind: k.id })}
                  className={chip(!active && kind === k.id)}
                >
                  {k.label}
                  <span className="ml-1.5 text-xs font-normal">{countFor(k.id)}</span>
                </button>
              ))}
          </div>
          {/* Phones: one row that scrolls sideways, so eight builds don't stack four rows deep. */}
          <div
            className="flex items-center gap-2 max-sm:-mx-5 max-sm:overflow-x-auto max-sm:px-5 max-sm:pb-1 max-sm:[scrollbar-width:none] sm:flex-wrap"
            role="group"
            aria-label="Filter by build"
          >
            {buildChips.map((b) => (
              <button
                key={b.slug}
                type="button"
                aria-pressed={active === b.slug}
                onClick={() => setFilter({ kind, build: active === b.slug ? null : b.slug })}
                className={`${chip(active === b.slug, true)} inline-flex shrink-0 items-center gap-2`}
              >
                {b.icon && (
                  <Image src={b.icon} alt="" width={18} height={18} unoptimized={b.icon.endsWith('.svg')} className="h-[18px] w-[18px] rounded-[5px]" />
                )}
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {groups.length > 0 ? (
        <div className="mt-10 space-y-10">
          {groups.map((group) => (
            <section key={group.month} aria-labelledby={`month-${group.month}`}>
              <h3
                id={`month-${group.month}`}
                className="mb-4 flex items-center gap-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] text-cyan-400 after:h-px after:flex-1 after:bg-white/8"
              >
                {months[group.month]}
              </h3>
              <Timeline className="ml-3">
                {group.entries.map((entry) => (
                  <LogEntryItem
                    key={entry.id}
                    entry={entry}
                    buildName={bySlug[entry.build]?.name ?? entry.build}
                    icon={bySlug[entry.build]?.icon}
                  />
                ))}
              </Timeline>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-12 font-mono text-sm text-slate-450">
          {emptyName ? `// nothing from ${emptyName} in the last 12 months.` : '// nothing logged yet - check back soon.'}
        </p>
      )}

      {older.length > 0 && !showOlder && (
        <button
          type="button"
          onClick={() => setShowOlder(true)}
          className="mt-10 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
        >
          Show older entries<span className="ml-1.5 text-xs text-slate-450">{older.length}</span>
        </button>
      )}
    </div>
  )
}

function chip(isActive: boolean, withIcon = false): string {
  return `rounded-full border ${withIcon ? 'py-1 pl-1.5 pr-3' : 'px-3 py-1'} text-sm font-semibold transition-all ${
    isActive
      ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
      : 'border-white/10 bg-white/3 text-slate-400 hover:bg-white/6 hover:text-slate-200'
  }`
}
