import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { FiArrowRight, FiArrowUpRight } from 'react-icons/fi'
import LabSubheader from '@/components/sections/LabSubheader'
import { UPCOMING, waitlistHref } from '@/data/upcoming'

/**
 * The homepage's short take on /upcoming (owner, 2026-11-01), as the Lab's last
 * part, "What's cookin'": one line on what it is, then each project as one compact item (icon, name, tagline, its
 * landing page and its waitlist). No statuses, points or audiences here: the
 * full detail stays on /upcoming. Server-rendered, no client code of its own.
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

        {/* Two by two from tablets up: four across would squeeze each button onto two lines. */}
        <ul className="grid gap-4 md:grid-cols-2">
          {UPCOMING.map((p) => (
            <li
              key={p.slug}
              style={{ '--accent': p.accent } as CSSProperties}
              className="flex flex-col rounded-2xl border border-white/8 bg-[#0a1222]/70 p-4 min-[360px]:p-5"
            >
              <div className="flex items-center gap-3.5">
                <Image src={p.icon} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl ring-1 ring-white/10" />
                <div className="min-w-0">
                  <h4 className="text-lg font-bold text-slate-50">{p.name}</h4>
                  <p className="text-sm text-balance text-(--accent)">{p.tagline}</p>
                </div>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
                <Link
                  href={waitlistHref(p.slug)}
                  className="inline-flex min-h-9 items-center rounded-lg border border-(--accent)/45 bg-(--accent)/10 px-3 py-1.5 text-sm leading-snug font-semibold min-[360px]:px-3.5 text-slate-50 transition-colors hover:border-(--accent)/70 hover:bg-(--accent)/18"
                >
                  Let &rsquo;em cook: join the waitlist
                  <span className="sr-only"> for {p.name}</span>
                </Link>
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
      </div>
    </section>
  )
}
