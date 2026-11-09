'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { PICK_EVENT } from './JoinButton'

/**
 * The homepage's What's cookin' waitlist behind one button (owner,
 * 2026-11-08): "Join the waitlist" opens the same form as /upcoming
 * (WaitlistPanel, rendered on the server and passed in) right under it, and
 * closes it again. It opens by itself for a visitor who arrives at #waitlist
 * or with `?interest=` (the projects' landing pages link here with it, and the
 * form ticks that project), and for a card's pick (PICK_EVENT). Closed, the
 * form stays in the page, hidden, so it keeps what was typed.
 */
export default function WaitlistDisclosure({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  // Set when the form opens on arrival, so it comes into view once shown.
  const reveal = useRef(false)

  useEffect(() => {
    const arrived = () =>
      window.location.hash === '#waitlist' || new URLSearchParams(window.location.search).has('interest')
    if (arrived()) {
      reveal.current = true
      // Read once on arrival, from the address bar: setting state here is the point.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true)
    }
    const onHash = () => {
      if (window.location.hash !== '#waitlist') return
      reveal.current = true
      setOpen(true)
    }
    const onPick = () => setOpen(true)
    window.addEventListener('hashchange', onHash)
    window.addEventListener(PICK_EVENT, onPick)
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener(PICK_EVENT, onPick)
    }
  }, [])

  useEffect(() => {
    if (!open || !reveal.current) return
    reveal.current = false
    panel.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, [open])

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="waitlist"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange-400 to-pink-400 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-orange-950/30 transition-[filter] duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
      >
        Join the waitlist
        <FiChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {/* The same form as /upcoming; `?interest=` still ticks a project here. */}
      <div
        ref={panel}
        id="waitlist"
        role="region"
        aria-label="Join the waitlist"
        hidden={!open}
        className="mt-4 max-w-2xl scroll-mt-24"
      >
        {children}
      </div>
    </div>
  )
}
