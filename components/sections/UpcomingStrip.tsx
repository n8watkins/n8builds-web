import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { FiArrowRight, FiArrowUpRight } from 'react-icons/fi'
import LabSubheader from '@/components/sections/LabSubheader'
import { PotIcon } from '@/components/ui/PartIcons'
import WaitlistDisclosure from '@/components/upcoming/WaitlistDisclosure'
import WaitlistPanel from '@/components/upcoming/WaitlistPanel'
import { UPCOMING } from '@/data/upcoming'

/**
 * The homepage's short take on /upcoming (owner, 2026-11-01), as the Lab's last
 * part, "What's cookin'". Compact since 2026-11-08 (owner): one row per
 * project, its icon, name, one-line tagline and its landing page, then a
 * single "Join the waitlist" button that opens the same form as /upcoming
 * under it (WaitlistDisclosure). The full cards, statuses and code links stay
 * on /upcoming.
 */
export default function UpcomingStrip() {
  const projects = UPCOMING.filter((p) => p.homepage !== false)
  return (
    // The Lab's last part, in its own warm wash (`.lab-accent-upcoming` in app/globals.css).
    <section id="upcoming" aria-label="What's cookin': upcoming projects" className="lab-accent-upcoming lab-part-wash py-10">
      <div className="mx-auto max-w-site px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6">
          <LabSubheader
            eyebrow="Upcoming"
            eyebrowClass="text-orange-300"
            icon={<PotIcon />}
            title={<>What&rsquo;s cookin&rsquo;</>}
            blurb="Things I’m outlining in public, each with a waitlist."
          />
          <Link
            href="/upcoming"
            className="group mb-8 -mt-3 inline-flex sm:mt-0 items-center gap-1.5 text-sm font-semibold text-slate-300 transition-colors hover:text-cyan-200"
          >
            See all upcoming
            <FiArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* One row per project: the name and tagline side by side from tablets up, stacked on phones. */}
        <ul className="divide-y divide-white/6 overflow-hidden rounded-2xl border border-white/8 bg-[#0a1222]/70">
          {projects.map((p) => (
            <li
              key={p.slug}
              style={{ '--accent': p.accent } as CSSProperties}
              className="relative flex items-center gap-3.5 py-3 pr-3 pl-4 transition-colors duration-150 hover:bg-white/[0.035] sm:gap-4 sm:pr-4 sm:pl-5"
            >
              <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-(--accent)" />
              <Image src={p.icon} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-lg ring-1 ring-white/10" />
              <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-4">
                <h4 className="font-bold text-slate-50 sm:w-36 sm:shrink-0">{p.name}</h4>
                <p className="text-sm leading-snug text-pretty text-(--accent) sm:truncate">{p.tagline}</p>
              </div>
              <a
                href={p.landing}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-white/12 bg-white/4 px-2.5 text-[13px] font-semibold whitespace-nowrap text-slate-200 transition-colors hover:border-(--accent)/50 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
              >
                Landing page
                <span className="sr-only"> for {p.name} (opens in a new tab)</span>
                <FiArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <WaitlistDisclosure>
            <WaitlistPanel heading="h4" />
          </WaitlistDisclosure>
        </div>
      </div>
    </section>
  )
}
