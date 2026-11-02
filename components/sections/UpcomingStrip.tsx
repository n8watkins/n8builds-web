import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import LabSubheader from '@/components/sections/LabSubheader'
import { CodeLink, LandingButton } from '@/components/upcoming/ProjectLinks'
import WaitlistPanel from '@/components/upcoming/WaitlistPanel'
import { UPCOMING } from '@/data/upcoming'

/**
 * The homepage's short take on /upcoming (owner, 2026-11-01), as the Lab's last
 * part, "What's cookin'": one line on what it is, then the projects and the
 * waitlist as one screen (owner, 2026-11-02): on desktop the four cards two by
 * two on the left and "Join the waitlist" on the right, stacked below 1024px.
 * Each card has its icon, name, tagline, a plain summary, its landing page as
 * the one button, and its code where the repository is public. There is no
 * per-card Join here: the visitor picks projects in the form beside them.
 * No statuses, points or audiences: the full detail stays on /upcoming.
 */
export default function UpcomingStrip() {
  return (
    // The Lab's last part, in its own warm wash (`.lab-accent-upcoming` in app/globals.css).
    <section id="upcoming" aria-label="What's cookin': upcoming projects" className="lab-accent-upcoming lab-part-wash py-10">
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

        {/* Cards and waitlist side by side from 1024px; stacked below it. */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_27rem]">
          {/* Two by two from tablets up (rows share the waitlist's height on desktop), stacked on phones. */}
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-rows-2">
            {UPCOMING.map((p) => (
              <li
                key={p.slug}
                style={{ '--accent': p.accent } as CSSProperties}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0a1222]/70 p-5"
              >
                <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-(--accent)" />
                <div className="flex items-center gap-3.5">
                  <Image src={p.icon} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl ring-1 ring-white/10" />
                  <div className="min-w-0">
                    <h4 className="text-lg font-bold text-slate-50">{p.name}</h4>
                    <p className="mt-0.5 text-sm leading-snug text-balance text-(--accent)">{p.tagline}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-pretty text-slate-300">{p.summary}</p>
                {/* mt-auto keeps the buttons level when one card's text runs longer. */}
                <div className="mt-auto flex flex-col gap-3 pt-4">
                  {p.repo && <CodeLink project={p} />}
                  <LandingButton project={p} compact />
                </div>
              </li>
            ))}
          </ul>

          {/* The same form as /upcoming; `?interest=` still ticks a project here. */}
          <section id="waitlist" aria-label="Join the waitlist" className="scroll-mt-24">
            <WaitlistPanel heading="h4" layout="side" />
          </section>
        </div>
      </div>
    </section>
  )
}
