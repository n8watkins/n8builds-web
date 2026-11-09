'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FiX } from 'react-icons/fi'
import { useHydrated } from '@/hooks/useHydrated'
import { PICK_EVENT } from './JoinButton'

/**
 * The homepage's What's cookin' waitlist in a modal (owner, round 7 of
 * 2026-11-09; an inline dropdown before): "Join the waitlist" opens the same
 * form as /upcoming (WaitlistPanel, rendered on the server and passed in) in a
 * native <dialog>, so focus stays inside, Escape and a click on the backdrop
 * close it, and the page behind doesn't scroll. It opens by itself for a
 * visitor who arrives at #waitlist or with `?interest=` (the projects' landing
 * pages link here with it, and the form ticks that project), and for a pick
 * (PICK_EVENT). Closed, the form stays in the page, so it keeps what was typed.
 */
export default function WaitlistDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const hydrated = useHydrated()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const arrived = () =>
      window.location.hash === '#waitlist' || new URLSearchParams(window.location.search).has('interest')
    // Read once on arrival, from the address bar: setting state here is the point.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (arrived()) setOpen(true)
    const onHash = () => {
      if (window.location.hash === '#waitlist') setOpen(true)
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
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    // The page behind stays put while the modal is open (scrollbar-gutter keeps its width).
    document.documentElement.classList.toggle('modal-open', open)
    return () => document.documentElement.classList.remove('modal-open')
  }, [open])

  const close = () => {
    setOpen(false)
    // Leaving #waitlist in the address bar would make the next link to it a no-op.
    if (window.location.hash === '#waitlist') {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        // Server-rendered: a click before hydration would be lost (as the Details buttons).
        disabled={!hydrated}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange-400 to-pink-400 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-orange-950/30 transition-[filter] duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 disabled:cursor-wait"
      >
        Join the waitlist
      </button>
      <dialog
        ref={ref}
        id="waitlist"
        aria-labelledby="waitlist-dialog-title"
        onClose={close}
        // A click on the backdrop (the dialog element itself) closes it.
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#0a1220] p-0 text-slate-200 shadow-2xl shadow-black/60 opacity-0 transition-[opacity,translate,display,overlay] duration-200 transition-discrete translate-y-2 open:translate-y-0 open:opacity-100 starting:open:translate-y-2 starting:open:opacity-0 backdrop:bg-black/70 backdrop:backdrop-blur-sm motion-reduce:transition-none"
      >
        <div className="relative">
          <button
            type="button"
            onClick={close}
            aria-label="Close the waitlist"
            className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-cyan-300 sm:top-4 sm:right-4"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
          {children}
        </div>
      </dialog>
    </>
  )
}
