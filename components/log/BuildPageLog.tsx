import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import LogRow from '@/components/log/LogRow'
import type { LogEntry } from '@/lib/build-log'

/** How many of a build's newest entries its page shows. */
export const BUILD_PAGE_LOG_SIZE = 10

/**
 * A build page's build log (owner, 2026-11-08): the build's newest entries
 * from the same hourly-cached GitHub log as the homepage strip and /builds
 * (lib/build-log.ts), in the strip's rows and green log colours, with the way
 * to the full log filtered to this build. Left out when the build has none.
 */
export default function BuildPageLog({
  slug,
  name,
  entries,
  className = 'mt-12',
}: {
  slug: string
  name: string
  entries: LogEntry[]
  /** The section's spacing on its page. */
  className?: string
}) {
  if (entries.length === 0) return null
  const releases = entries.filter((e) => e.kind === 'release').length
  return (
    <Reveal>
      <section className={className} aria-labelledby="build-log-heading">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h2 id="build-log-heading" className="text-2xl font-bold tracking-tight">
              Build{' '}
              <span className="bg-linear-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">log</span>
            </h2>
            <p className="mt-1.5 text-sm text-[#9cadc5]">
              The latest {entries.length === 1 ? 'update' : `${entries.length} updates`} to {name}
              {releases > 0 ? `, ${releases} of them ${releases === 1 ? 'a release' : 'releases'}` : ''}, pulled from GitHub.
            </p>
          </div>
          <Link
            href={`/builds?build=${slug}#activity`}
            className="group flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-emerald-400/40 hover:bg-white/8 hover:text-emerald-200"
          >
            See the full build log
            <FiArrowUpRight
              aria-hidden
              className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* The strip's look: its green-to-teal tint, the rows on a quiet card. */}
        <ul
          aria-label={`${name}'s latest updates`}
          className="mt-5 divide-y divide-white/[0.05] rounded-2xl border border-emerald-300/12 bg-linear-to-br from-emerald-400/[0.06] via-white/[0.02] to-teal-400/[0.04] p-2 sm:p-3"
        >
          {entries.map((entry) => (
            <li key={entry.id} className="py-0.5">
              <LogRow entry={entry} showBuild={false} />
            </li>
          ))}
        </ul>
      </section>
    </Reveal>
  )
}
