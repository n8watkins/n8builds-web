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
 * waitlist as one screen (owner, 2026-11-02): on desktop the cards two by two
 * on the left and "Join the waitlist" on the right, stacked below 1024px. With
 * an odd number of projects (five since Asset Arsenal joined KeysReady), the
 * last card spans both columns from tablets up and lays itself out as a row:
 * name and tagline on the left, summary and buttons on the right.
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
            // A pot on the stove (round 5 of 2026-11-02; there's no crockpot emoji), for the eye only.
            title={
              <>
                What&rsquo;s cookin&rsquo;{' '}
                <span aria-hidden="true" className="inline-block translate-y-[-0.04em]">
                  🍲
                </span>
              </>
            }
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
          {/* Two by two from tablets up, stacked on phones. An odd last card spans the row,
              and its width (a container query) turns it into a row of its own. */}
          <ul className="grid gap-4 md:grid-cols-2">
            {UPCOMING.map((p) => (
              <li
                key={p.slug}
                style={{ '--accent': p.accent } as CSSProperties}
                className="@container relative overflow-hidden rounded-2xl border border-white/8 bg-[#0a1222]/70 md:odd:last:col-span-2"
              >
                <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-(--accent)" />
                <div className="flex h-full flex-col p-4 sm:px-5 lg:px-4 @lg:grid @lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] @lg:items-center @lg:gap-x-6">
                  <div className="flex items-center gap-3.5">
                    <Image src={p.icon} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl ring-1 ring-white/10" />
                    <div className="min-w-0">
                      <h4 className="text-lg font-bold text-slate-50">{p.name}</h4>
                      <p className="mt-0.5 text-sm leading-snug text-balance text-(--accent)">{p.tagline}</p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="mt-2.5 text-sm leading-relaxed text-pretty text-slate-300 @lg:mt-0">{p.summary}</p>
                    {/* The landing page and the code side by side, in one row at every width
                        (round 3 of 2026-11-02): even halves, except that neither button gets
                        narrower than its label. "Landing page" (round 4) is long enough that the
                        narrowest cards (320px phones, and beside the waitlist from 1024px, where
                        the cards' side padding drops to 16px) only just fit both, so the buttons'
                        own padding is tight. mt-auto keeps the rows level when one card's text runs longer. */}
                    <div
                      className={`mt-auto grid gap-2 pt-3.5 @lg:w-80 ${p.repo ? 'grid-cols-[minmax(max-content,1fr)_minmax(max-content,1fr)]' : ''}`}
                    >
                      <LandingButton project={p} compact />
                      {p.repo && <CodeLink project={p} button />}
                    </div>
                  </div>
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
