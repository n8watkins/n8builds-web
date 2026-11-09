import type { CSSProperties, ReactNode } from 'react'

/**
 * Each part's colour (an `r g b` triple), for its heading's icon tile: the
 * same as its stop on /loadout where it has one (data/loadout.tsx).
 */
export const HOME_PART_ACCENTS = {
  setup: '34 211 238',
  aiKit: '167 139 250',
  stacks: '52 211 153',
  tools: '251 191 36',
} as const

/**
 * A part's heading in the homepage's Loadout (owner, round 9 of 2026-11-09:
 * Dev setup, AI kit, My tech stacks and Tools I've built "all get the same
 * treatment"): its own icon in a rounded tile in its colour, the title, an
 * optional line under it, and an optional action on the right. `accent` is
 * the part's colour as an `r g b` triple, the same one its rail stop and
 * /loadout's part use.
 */
export default function LoadoutPartHeading({
  id,
  icon,
  title,
  blurb,
  accent,
  action,
}: {
  /** The heading's id, for the part's aria-labelledby. */
  id: string
  icon: ReactNode
  title: string
  blurb?: ReactNode
  accent: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3" style={{ '--part': accent } as CSSProperties} data-part-heading>
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--part)/0.1)] text-[rgb(var(--part))] ring-1 ring-[rgb(var(--part)/0.3)] sm:size-10 [&_svg]:size-5 sm:[&_svg]:size-[1.375rem]"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h3 id={id} className="text-2xl font-bold tracking-tight text-slate-50">
            {title}
          </h3>
          {blurb && <p className="mt-0.5 text-sm font-semibold text-blue-300">{blurb}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
