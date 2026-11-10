import Image from 'next/image'
import Link from 'next/link'
import { FiArrowRight } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import { builds } from '@/data/builds'
import { BUILD_ICONS } from '@/lib/build-meta'

/**
 * The order "More builds" picks from (owner, 2026-11-08): the homepage's
 * featured builds first, then Scribe, then the rest. Any build missing here
 * comes after, in data order.
 */
const ORDER = [
  'openping',
  'solara',
  'wren',
  'scribe',
  'portfolio-rank',
  'voicedock',
  'tldw',
  'tubevault',
  'n8builds',
]

/** How many other builds a page suggests. */
const SHOWN = 3

/** The builds a page suggests: the first few in ORDER, leaving out the page's own. */
export function moreBuilds(current: string) {
  const rank = (slug: string) => (ORDER.includes(slug) ? ORDER.indexOf(slug) : ORDER.length)
  return builds
    .filter((b) => b.slug !== current)
    .sort((a, b) => rank(a.slug) - rank(b.slug))
    .slice(0, SHOWN)
}

/**
 * "More builds" at the foot of a build page: small cards (icon, name,
 * tagline) to the next builds, so a visitor can go from OpenPing to Solara
 * and on without going back to the homepage.
 */
export default function MoreBuilds({
  current,
  className = 'mt-16',
}: {
  current: string
  className?: string
}) {
  const others = moreBuilds(current)
  return (
    <section aria-labelledby="more-builds-heading" className={className}>
      <Reveal>
        <h2 id="more-builds-heading" className="text-center text-3xl font-bold tracking-tight">
          More{' '}
          <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            builds
          </span>
        </h2>
      </Reveal>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {others.map((build, i) => {
          const icon = BUILD_ICONS[build.slug]
          return (
            <li key={build.slug}>
              <Reveal delay={i * 0.08} className="h-full">
                <Link
                  href={`/builds/${build.slug}`}
                  className="group flex h-full items-center gap-3.5 rounded-2xl border border-white/8 bg-white/3 p-4 transition-[border-color,background-color,translate] duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  {icon && (
                    <Image
                      src={icon}
                      alt=""
                      width={44}
                      height={44}
                      unoptimized={icon.endsWith('.svg')}
                      className="h-11 w-11 shrink-0 rounded-xl ring-1 ring-white/10"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-100 transition-colors group-hover:text-cyan-200">
                      {build.name}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-slate-400">
                      {build.tagline}
                    </span>
                  </span>
                  <FiArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-slate-475 transition-[color,translate] group-hover:translate-x-0.5 group-hover:text-cyan-300"
                  />
                </Link>
              </Reveal>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
