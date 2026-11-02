'use client'
import type { CSSProperties } from 'react'
import type { UpcomingSlug } from '@/data/upcoming'

/** The event a project's card sends the waitlist form, to tick that project. */
export const PICK_EVENT = 'waitlist:pick'

/**
 * "Join the <name> waitlist" on a project's card: ticks that project in the
 * form and brings the form into view. A real link to #waitlist, so it still
 * works before hydration (the form then reads nothing, and nothing is lost).
 */
export default function JoinButton({ slug, name, accent }: { slug: UpcomingSlug; name: string; accent: string }) {
  return (
    <a
      href="#waitlist"
      onClick={(e) => {
        const form = document.getElementById('waitlist')
        if (!form) return
        e.preventDefault()
        window.dispatchEvent(new CustomEvent(PICK_EVENT, { detail: slug }))
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
        window.history.replaceState(null, '', '#waitlist')
      }}
      style={{ '--accent': accent } as CSSProperties}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-(--accent)/45 bg-(--accent)/10 px-5 text-sm font-semibold text-slate-50 transition-colors duration-150 hover:border-(--accent)/70 hover:bg-(--accent)/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
    >
      Join the {name} waitlist
      <span aria-hidden="true">&darr;</span>
    </a>
  )
}
