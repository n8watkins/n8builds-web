'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useLayoutEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiArrowUpRight, FiFilter } from 'react-icons/fi'
import { setFilter } from '@/components/log/LogFeed'
import type { BuildActivity } from '@/lib/build-log'
import { BUILD_ICONS } from '@/lib/build-meta'

// The builds index that leads /builds: a card per build, most recently active
// first, with when it last shipped (a month, never "N months ago", so a quiet
// build reads as finished rather than abandoned) and its newest entries.
//
// Each card is also the feed's build filter (owner, round 5 of 2026-11-08): a
// click shows only that build's updates in the activity below (the same
// `?build=` as the chips) and marks the card; a second click, or "All", clears
// it. "Full story" on the card goes to the build's page.

/** Reports the URL's `?build=`; in its own Suspense boundary so the cards still prerender (see LogFeed's UrlFilter). */
function UrlBuild({ onChange }: { onChange: (build: string | null) => void }) {
  const build = useSearchParams().get('build')
  useLayoutEffect(() => onChange(build), [build, onChange])
  return null
}

export default function BuildIndex({ activity }: { activity: BuildActivity[] }) {
  const [active, setActive] = useState<string | null>(null)
  const pick = (slug: string) => {
    setFilter({ build: active === slug ? null : slug })
    const feed = document.getElementById('activity')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (active !== slug && feed) feed.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }
  return (
    <>
      <Suspense fallback={null}>
        <UrlBuild onChange={setActive} />
      </Suspense>
      <ul
        className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Builds by latest activity"
      >
        {activity.map((build) => {
          // The newest release in the card's entries, as a chip by the name.
          const release = build.latest.find((e) => e.kind === 'release')
          const version = release && /^Shipped (v\S+)$/.exec(release.title)?.[1]
          const selected = active === build.slug
          return (
            <li
              key={build.slug}
              data-build={build.slug}
              data-selected={selected ? '' : undefined}
              className={`group relative isolate flex cursor-pointer flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400/45 hover:bg-white/5 hover:shadow-lg hover:shadow-cyan-950/40 motion-reduce:hover:translate-y-0 ${
                selected
                  ? 'border-cyan-400/70 bg-cyan-400/[0.06] ring-1 ring-cyan-400/50'
                  : 'border-white/8 bg-white/2'
              }`}
            >
              {/* The build's colour: a wash and a bright edge along the top */}
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 bg-linear-to-b ${build.color} opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-90`}
              />
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r ${build.color} opacity-90`}
              />

              {/* A fixed-height row, so a version or Showing badge never pushes the
                  name lower than on cards without one. */}
              <div className="flex h-5 items-center justify-between gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                  {build.category}
                </span>
                <span className="flex items-center gap-2">
                  {/* Picked: the feed below shows only this build. */}
                  {selected && (
                    <span className="flex items-center gap-1 rounded-full bg-cyan-400/15 px-2 py-px font-mono text-[0.68rem] font-semibold tracking-wide text-cyan-200 uppercase">
                      <FiFilter className="h-3 w-3" aria-hidden="true" />
                      Showing
                    </span>
                  )}
                  {version && (
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-px font-mono text-[0.7rem] font-semibold text-cyan-300">
                      {version}
                    </span>
                  )}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="flex items-center gap-3 text-lg font-bold leading-tight text-slate-50">
                  {BUILD_ICONS[build.slug] && (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0a1428] ring-1 ring-white/10">
                      <Image
                        src={BUILD_ICONS[build.slug]}
                        alt=""
                        width={28}
                        height={28}
                        unoptimized={BUILD_ICONS[build.slug].endsWith('.svg')}
                        className="h-7 w-7 rounded-lg"
                      />
                    </span>
                  )}
                  {/* Stretched over the card: the whole card filters the feed below to this build. */}
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => pick(build.slug)}
                    className="cursor-pointer text-left after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-cyan-400/60"
                  >
                    {build.name}
                    <span className="sr-only">
                      {selected
                        ? ': showing only its updates below, press to show all'
                        : ': show only its updates below'}
                    </span>
                  </button>
                </h3>
                <p className="mt-1.5 text-[0.95rem] leading-snug text-slate-300">{build.tagline}</p>
              </div>

              {build.latest.length > 0 && (
                <ul
                  className="mt-4 space-y-3 border-t border-white/6 pt-4"
                  aria-label={`Latest from ${build.name}`}
                >
                  {build.latest.map((entry) => (
                    <li key={entry.id} className="flex gap-3 text-[0.9rem]">
                      <time
                        dateTime={entry.date}
                        className="w-14 shrink-0 pt-px font-mono text-xs uppercase tracking-wider text-slate-400"
                      >
                        {entry.dayLabel}
                      </time>
                      <span className="line-clamp-2 leading-snug text-slate-200">
                        {entry.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <span className="font-mono text-xs text-slate-400">
                  {build.lastShippedLabel ? (
                    <>
                      Last shipped <span className="text-slate-300">{build.lastShippedLabel}</span>
                    </>
                  ) : (
                    'Nothing logged yet'
                  )}
                </span>
                {/* Above the card's stretched button: its own way to the build's page. */}
                <Link
                  href={build.href}
                  className="relative z-10 flex shrink-0 items-center gap-1 whitespace-nowrap rounded font-mono text-xs text-slate-400 transition-colors hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                >
                  Full story
                  <FiArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only"> of {build.name}</span>
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
