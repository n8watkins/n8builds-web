import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { FiArrowRight, FiArrowUpRight } from 'react-icons/fi'
import { UPCOMING, waitlistHref } from '@/data/upcoming'

/**
 * The homepage's short take on /upcoming (owner, 2026-11-01): one line on what
 * it is, then each project as one compact item (icon, name, tagline, its
 * landing page and its waitlist). No statuses, points or audiences here: the
 * full detail stays on /upcoming. Server-rendered, no client code of its own.
 */
export default function UpcomingStrip() {
  return (
    <section id="upcoming" aria-labelledby="upcoming-heading" className="py-3">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="mb-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">Upcoming</p>
          <h2 id="upcoming-heading" className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
            What I&rsquo;m outlining next
          </h2>
          <p className="mt-2 text-[#9cadc5]">
            Things I&rsquo;m outlining in public. Join a waitlist to hear when there&rsquo;s something to try.
          </p>
        </div>
        <Link
          href="/upcoming"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 transition-colors hover:text-cyan-200"
        >
          See all upcoming
          <FiArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <ul className="grid gap-4 md:grid-cols-3">
        {UPCOMING.map((p) => (
          <li
            key={p.slug}
            style={{ '--accent': p.accent } as CSSProperties}
            className="flex flex-col rounded-2xl border border-white/8 bg-white/[0.025] p-5"
          >
            <div className="flex items-center gap-3.5">
              <Image src={p.icon} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-50">{p.name}</h3>
                <p className="text-sm text-balance text-(--accent)">{p.tagline}</p>
              </div>
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
              <Link
                href={waitlistHref(p.slug)}
                className="inline-flex h-9 items-center rounded-lg border border-(--accent)/45 bg-(--accent)/10 px-3.5 text-sm font-semibold text-slate-50 transition-colors hover:border-(--accent)/70 hover:bg-(--accent)/18"
              >
                Join the waitlist
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
    </section>
  )
}
