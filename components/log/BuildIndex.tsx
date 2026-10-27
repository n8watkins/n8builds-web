import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import type { BuildActivity } from '@/lib/build-log'
import { BUILD_ICONS } from '@/lib/build-meta'

// The builds index that leads /builds: a card per build, most recently active
// first, with when it last shipped (a month, never "N months ago", so a quiet
// build reads as finished rather than abandoned) and its newest entries.

export default function BuildIndex({ activity }: { activity: BuildActivity[] }) {
  return (
    <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Builds by latest activity">
      {activity.map((build) => (
        <li
          key={build.slug}
          data-build={build.slug}
          className="group relative isolate flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/2 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/4"
        >
          {/* Accent wash */}
          <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-24 bg-linear-to-b ${build.color} opacity-40 blur-2xl`} />

          <span className="font-mono text-[0.7rem] uppercase tracking-wider text-slate-450">{build.category}</span>

          <div className="mt-3">
            <h3 className="flex items-center gap-2.5 text-lg font-bold leading-tight text-slate-50">
              {BUILD_ICONS[build.slug] && (
                <Image
                  src={BUILD_ICONS[build.slug]}
                  alt=""
                  width={28}
                  height={28}
                  unoptimized={BUILD_ICONS[build.slug].endsWith('.svg')}
                  className="h-7 w-7 shrink-0 rounded-lg"
                />
              )}
              {/* Stretched over the card: the whole card opens the build page. */}
              <Link
                href={`/builds/${build.slug}`}
                className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-cyan-400/60"
              >
                {build.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-[#9cadc5]">{build.tagline}</p>
          </div>

          {build.latest.length > 0 && (
            <ul className="mt-4 space-y-3 border-t border-white/6 pt-4" aria-label={`Latest from ${build.name}`}>
              {build.latest.map((entry) => (
                <li key={entry.id} className="flex gap-3 text-sm">
                  <time dateTime={entry.date} className="w-12 shrink-0 pt-px font-mono text-[0.7rem] uppercase tracking-wider text-slate-450">
                    {entry.dayLabel}
                  </time>
                  <span className="line-clamp-2 leading-snug text-slate-300">{entry.title}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <span className="font-mono text-[0.7rem] text-slate-450">
              {build.lastShippedLabel ? (
                <>
                  Last shipped <span className="text-slate-300">{build.lastShippedLabel}</span>
                </>
              ) : (
                'Nothing logged yet'
              )}
            </span>
            <span aria-hidden className="flex items-center gap-1 font-mono text-[0.7rem] text-slate-475 transition-colors group-hover:text-cyan-400">
              read
              <FiArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
