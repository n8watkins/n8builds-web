'use client'
import type { CSSProperties } from 'react'
import type { UpcomingSlug } from '@/data/upcoming'

/** The event a project's card sends the waitlist form, to tick that project. */
export const PICK_EVENT = 'waitlist:pick'

/**
 * "Join the <name> waitlist" on a project's card: ticks that project in the
 * form and brings the form into view, or, when it is already in view (the
 * sticky column on /upcoming's wide screens), makes it glow once. A real link to #waitlist, so it still
 * works before hydration (the form then reads nothing, and nothing is lost).
 */
export default function JoinButton({
  slug,
  name,
  accent,
  compact = false,
}: {
  slug: UpcomingSlug
  name: string
  accent: string
  /** /upcoming's cards: "Waitlist", read out as "Join the waitlist for <name>". */
  compact?: boolean
}) {
  return (
    <a
      href="#waitlist"
      onClick={(e) => {
        const form = document.getElementById('waitlist')
        if (!form) return
        e.preventDefault()
        window.dispatchEvent(new CustomEvent(PICK_EVENT, { detail: slug }))
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const box = form.getBoundingClientRect()
        // Mostly in view counts: near the page's end the sticky column rides up with its row
        // and its top can sit just above the window (round 11's shorter teaser cards).
        const seen = Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0)
        if (seen >= Math.min(box.height, window.innerHeight) * 0.6) {
          // Already in view (the sticky column on /upcoming's wide screens): a glow
          // round it says where the pick went, instead of a scroll.
          form.removeAttribute('data-flash')
          void form.offsetWidth
          form.setAttribute('data-flash', '')
        } else {
          form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
        }
        window.history.replaceState(null, '', '#waitlist')
      }}
      style={{ '--accent': accent } as CSSProperties}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-(--accent)/45 bg-(--accent)/10 text-sm font-semibold text-slate-50 transition-colors duration-150 hover:border-(--accent)/70 hover:bg-(--accent)/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) ${compact ? 'w-full px-3 whitespace-nowrap' : 'px-5'}`}
    >
      {compact ? (
        <>
          {/* Short, beside "Check it out" on a teaser card (round 11 of 2026-11-09); read out in full. */}
          <span aria-hidden="true">Waitlist</span>
          <span className="sr-only">Join the waitlist for {name}</span>
        </>
      ) : (
        <>Join the {name} waitlist</>
      )}
      <span aria-hidden="true">&darr;</span>
    </a>
  )
}
