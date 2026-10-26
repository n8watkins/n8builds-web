'use client'
import { Suspense, useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import LogEntryItem, { Timeline } from '@/components/log/LogEntryItem'
import type { LogEntry } from '@/lib/build-log'

// The activity feed on /builds: month by month, newest first, with a filter by
// build (chips, like the N8 Notions topic filter). The filter lives in the URL
// (`/builds?build=scribe`), so build pages can link to their part of the log
// and a filtered view can be shared. It opens on the last 12 months; older
// months wait behind "Show older entries".
//
// The feed is prerendered unfiltered and hydrated in place: it is visible in
// the HTML before any JavaScript runs, and no entry animates in. Only the URL
// reader below is rendered on the client.

type FeedProps = {
  entries: LogEntry[]
  /** Builds in index order, for the chips and entry labels. */
  builds: { slug: string; name: string }[]
  months: Record<string, string>
  recentFrom: string | null
}

// Runs while the page parses: a shared filtered link (?build=x) hides the
// prerendered, unfiltered feed until the filter applies, so a slow phone never
// shows every build and then collapses. It marks <html>, which suppresses
// hydration warnings for exactly this kind of attribute.
const HIDE_UNFILTERED = `if(new URLSearchParams(location.search).get('build'))document.documentElement.dataset.logFiltered=''`

/**
 * Reports the URL's `?build=` to the feed. useSearchParams opts everything up
 * to the nearest Suspense boundary out of prerendering, and that boundary is
 * rendered again on the client, so it gets a boundary of its own and renders
 * nothing. (Around the whole feed, every visitor's prerendered feed was thrown
 * away on hydration and rendered again, hidden, then faded back in.) Its
 * fallback, which only the prerendered HTML has, is the script above.
 */
function UrlFilter({ onChange }: { onChange: (build: string | null) => void }) {
  const param = useSearchParams().get('build')
  // Before paint, so neither hydration nor a client navigation shows a frame of the wrong feed.
  useLayoutEffect(() => onChange(param), [param, onChange])
  return null
}

function setFilter(slug: string | null) {
  const url = new URL(window.location.href)
  if (slug) url.searchParams.set('build', slug)
  else url.searchParams.delete('build')
  // Next.js syncs useSearchParams with the native history API, but only for a
  // null (or app-owned) state: a state carrying Next's own router internals is
  // taken as Next's own call and not synced, and the filter would never apply.
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
}

export default function LogFeed({ entries, builds, months, recentFrom }: FeedProps) {
  // Null until the URL is read: the prerendered feed is unfiltered.
  const [active, setActive] = useState<string | null>(null)
  const [synced, setSynced] = useState(false)
  const [showOlder, setShowOlder] = useState(false)
  const names = useMemo(() => Object.fromEntries(builds.map((b) => [b.slug, b.name])), [builds])
  const withEntries = useMemo(() => builds.filter((b) => entries.some((e) => e.build === b.slug)), [builds, entries])

  const onUrl = useCallback(
    (param: string | null) => {
      setActive(param && Object.hasOwn(names, param) ? param : null)
      setSynced(true)
    },
    [names],
  )
  // The URL's filter has applied: show what the inline script hid.
  useLayoutEffect(() => {
    if (synced) delete document.documentElement.dataset.logFiltered
  }, [synced])

  const visible = active ? entries.filter((e) => e.build === active) : entries
  const isRecent = (e: LogEntry) => !recentFrom || e.month >= recentFrom
  const recent = visible.filter(isRecent)
  const older = visible.filter((e) => !isRecent(e))
  const shown = showOlder ? visible : recent

  // Entries arrive in feed order, so each month is one contiguous run.
  const groups: { month: string; entries: LogEntry[] }[] = []
  for (const entry of shown) {
    const last = groups.at(-1)
    if (last?.month === entry.month) last.entries.push(entry)
    else groups.push({ month: entry.month, entries: [entry] })
  }

  return (
    <div className="[[data-log-filtered]_&]:invisible">
      <Suspense fallback={<script dangerouslySetInnerHTML={{ __html: HIDE_UNFILTERED }} />}>
        <UrlFilter onChange={onUrl} />
      </Suspense>

      {withEntries.length > 1 && (
        <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by build">
          <button type="button" aria-pressed={active === null} onClick={() => setFilter(null)} className={chip(active === null)}>
            All<span className="ml-1.5 text-xs opacity-60">{entries.length}</span>
          </button>
          {withEntries.map((b) => (
            <button
              key={b.slug}
              type="button"
              aria-pressed={active === b.slug}
              onClick={() => setFilter(active === b.slug ? null : b.slug)}
              className={chip(active === b.slug)}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {groups.length > 0 ? (
        <div className="mt-10 space-y-12">
          {groups.map((group) => (
            <section key={group.month} aria-labelledby={`month-${group.month}`}>
              <h3
                id={`month-${group.month}`}
                className="mb-5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] text-cyan-400"
              >
                {months[group.month]}
              </h3>
              <Timeline>
                {group.entries.map((entry) => (
                  <LogEntryItem key={entry.id} entry={entry} buildName={names[entry.build] ?? entry.build} />
                ))}
              </Timeline>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-12 font-mono text-sm text-slate-450">
          {active ? `// nothing from ${names[active]} in the last 12 months.` : '// nothing logged yet - check back soon.'}
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

function chip(isActive: boolean): string {
  return `rounded-full border px-3 py-1 text-sm font-semibold transition-all ${
    isActive
      ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
      : 'border-white/10 bg-white/3 text-slate-400 hover:bg-white/6 hover:text-slate-200'
  }`
}
