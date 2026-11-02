import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { FiArrowRight, FiArrowUpRight } from 'react-icons/fi'
import LabSubheader from '@/components/sections/LabSubheader'
import JoinButton from '@/components/upcoming/JoinButton'
import WaitlistPanel from '@/components/upcoming/WaitlistPanel'
import { UPCOMING } from '@/data/upcoming'

/**
 * The homepage's short take on /upcoming (owner, 2026-11-01), as the Lab's last
 * part, "What's cookin'": one line on what it is, the projects four across
 * (icon, name, tagline, Join and its landing page), then the same waitlist
 * form as /upcoming, where visitors can pick several (owner, 2026-11-02). No
 * statuses, points or audiences here: the full detail stays on /upcoming.
 */
export default function UpcomingStrip() {
  return (
    // The Lab's last part, in its own warm wash (`.lab-accent-upcoming` in app/globals.css).
    <section id="upcoming" aria-label="What's cookin': upcoming projects" className="lab-accent-upcoming lab-part-wash py-12">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6">
          <LabSubheader
            eyebrow="Upcoming"
            eyebrowClass="text-orange-300"
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

        {/* Four across from 1024px, two by two on tablets, stacked on phones. */}
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {UPCOMING.map((p) => (
            <li
              key={p.slug}
              style={{ '--accent': p.accent } as CSSProperties}
              className="relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0a1222]/70 p-5"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-(--accent)" />
              {/* Icon beside the name while cards are wide, above it once four share a row. */}
              <div className="flex items-center gap-3.5 lg:flex-col lg:items-start lg:gap-3.5">
                <Image src={p.icon} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl ring-1 ring-white/10" />
                <div className="min-w-0">
                  <h4 className="text-lg font-bold text-slate-50">{p.name}</h4>
                  <p className="mt-0.5 text-sm text-balance text-(--accent)">{p.tagline}</p>
                </div>
              </div>
              {/* mt-auto keeps the four buttons level when one tagline runs longer. */}
              <div className="mt-auto flex flex-col items-center gap-3 pt-5">
                <JoinButton slug={p.slug} name={p.name} accent={p.accent} compact />
                <a
                  href={p.landing}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-slate-300 transition-colors hover:text-cyan-200"
                >
                  Visit the landing page
                  <span className="sr-only"> for {p.name} (opens in a new tab)</span>
                  <FiArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              </div>
            </li>
          ))}
        </ul>

        {/* The cards' Join buttons tick their project here and scroll to it. */}
        <section id="waitlist" aria-label="Join the waitlist" className="mx-auto mt-10 max-w-2xl scroll-mt-24">
          <WaitlistPanel heading="h4" />
        </section>
      </div>
    </section>
  )
}
