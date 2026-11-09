import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { FiArrowRight, FiArrowUpRight, FiBriefcase, FiCode, FiCoffee, FiGithub } from 'react-icons/fi'
import LabSubheader from '@/components/sections/LabSubheader'
import { PotIcon } from '@/components/ui/PartIcons'
import WaitlistDialog from '@/components/upcoming/WaitlistDialog'
import WaitlistPanel from '@/components/upcoming/WaitlistPanel'
import { UPCOMING, UPCOMING_GROUPS, type UpcomingGroup, type UpcomingProject } from '@/data/upcoming'

const GROUP_ICONS: Record<UpcomingGroup, ReactNode> = {
  business: <FiBriefcase />,
  // A coffee mug, not the sun (round 8 of 2026-11-09): Solara owns the sun on this page.
  life: <FiCoffee />,
  creators: <FiCode />,
}

/**
 * Where each group sits from 1024px (round 7 of 2026-11-09): two columns, the
 * everyday apps (the most) down the right, the business and the developer
 * ones stacked on the left, so both columns end level. One column below that,
 * in reading order.
 */
const GROUP_PLACE: Record<UpcomingGroup, string> = {
  business: 'lg:col-start-1 lg:row-start-1',
  life: 'lg:col-start-2 lg:row-span-2 lg:row-start-1',
  creators: 'lg:col-start-1 lg:row-start-2',
}

/**
 * One project, one tight line (round 8 of 2026-11-09): its mark, its name as
 * the link to its landing page over its few words (cut short with an ellipsis
 * when they don't fit), and a GitHub button when its repo is public (every one
 * but Asset Arsenal today; `repo` in data/upcoming.ts is set only then).
 */
function Row({ project: p }: { project: UpcomingProject }) {
  return (
    <li className="group/row flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-150 hover:bg-white/[0.04] sm:gap-3.5 sm:px-3">
      <Image src={p.icon} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-[10px] ring-1 ring-white/10" />
      <div className="min-w-0 flex-1">
        <a
          href={p.landing}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-1 text-[0.94rem] leading-tight font-semibold text-slate-50 underline decoration-white/0 underline-offset-4 transition-colors hover:text-orange-200 hover:decoration-orange-200/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
          data-upcoming-name
        >
          <span className="truncate">{p.name}</span>
          <FiArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-450 transition-all group-hover/row:text-orange-200 hover:translate-x-0.5 hover:-translate-y-0.5" />
          <span className="sr-only"> landing page (opens in a new tab)</span>
        </a>
        <p className="mt-0.5 truncate text-[0.84rem] leading-snug text-[#9cadc5]" title={p.short} data-upcoming-short>
          {p.short}
        </p>
      </div>
      {p.repo && (
        <a
          href={`https://github.com/${p.repo}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Code on GitHub"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/4 text-slate-300 transition-colors hover:border-white/25 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-300"
          data-upcoming-github
        >
          <FiGithub aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">{p.name} on GitHub (opens in a new tab)</span>
        </a>
      )}
    </li>
  )
}

/**
 * The homepage's short take on /upcoming (owner, 2026-11-01), as the Lab's last
 * part, "What's cookin'". Since round 7 of 2026-11-09 (owner: "much tighter and
 * easier to scan") the projects are grouped by who they are for, each a
 * single line: its mark, its name (the link to its landing page) over a few
 * words, and its GitHub button when the repo is public (round 8). No statuses
 * (every one has a live landing page). "Join the waitlist" opens the same form
 * as /upcoming in a modal (WaitlistDialog). The full cards and code links stay
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
            blurb="Things I’m building in public, each with a landing page and a waitlist."
          />
          <Link
            href="/upcoming"
            className="group mb-8 -mt-3 inline-flex sm:mt-0 items-center gap-1.5 text-sm font-semibold text-slate-300 transition-colors hover:text-cyan-200"
          >
            See all upcoming
            <FiArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          {UPCOMING_GROUPS.map((group) => {
            const members = projects.filter((p) => p.group === group.id)
            if (members.length === 0) return null
            return (
              <section
                key={group.id}
                aria-labelledby={`upcoming-${group.id}`}
                data-group={group.id}
                className={`flex flex-col rounded-2xl border border-white/8 bg-[#0a1222]/70 p-2 sm:p-2.5 ${GROUP_PLACE[group.id]}`}
              >
                <h4
                  id={`upcoming-${group.id}`}
                  className="flex items-center gap-2 px-2.5 pt-1.5 pb-1 text-[0.7rem] font-bold tracking-[0.14em] text-orange-200/90 uppercase sm:px-3 [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-orange-300"
                >
                  <span aria-hidden="true">{GROUP_ICONS[group.id]}</span>
                  {group.label}
                </h4>
                {/* Centred in what's left when the column beside it is the taller. */}
                <ul className="flex flex-1 flex-col justify-center">
                  {members.map((p) => (
                    <Row key={p.slug} project={p} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>

        <div className="mt-5">
          <WaitlistDialog>
            <WaitlistPanel heading="h2" headingId="waitlist-dialog-title" layout="modal" />
          </WaitlistDialog>
        </div>
      </div>
    </section>
  )
}
