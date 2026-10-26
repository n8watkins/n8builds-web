'use client'
import React, { useEffect, useRef, useState } from 'react'
import { FiActivity, FiX } from 'react-icons/fi'
import { useHydrated } from '@/hooks/useHydrated'

/**
 * The "What's new" button on the "What I'm working on" ad
 * (components/sections/NowBuilding.tsx) and its native <dialog>, which holds
 * the build-in-public detail (what is being built, the goal, recent activity)
 * so the card face stays an ad. The dialog's content arrives rendered on the
 * server; showModal() gives it the focus trap, Escape and the inert page.
 */
export default function NowDetails({
  project,
  labelledBy,
  header,
  children,
}: {
  /** The project's name, so the button has its own accessible name. */
  project: string
  labelledBy: string
  header: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const hydrated = useHydrated()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  const close = () => setOpen(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        // Server-rendered: a click before hydration would be lost, so it stays
        // disabled until its handler exists (as the Lab rows' Details).
        disabled={!hydrated}
        className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2.5 text-sm sm:w-auto font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8 hover:text-slate-100 disabled:cursor-wait motion-reduce:hover:scale-100"
      >
        <FiActivity className="h-3.5 w-3.5 text-cyan-400" aria-hidden />
        What&apos;s new<span className="sr-only"> at {project}</span>
      </button>
      <dialog
        ref={ref}
        aria-labelledby={labelledBy}
        onClose={close}
        // A click on the backdrop (the dialog element itself) closes it.
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(38rem,calc(100vw-2rem))] translate-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1220] p-0 text-slate-200 opacity-0 shadow-2xl shadow-black/60 transition-[opacity,translate,display,overlay] transition-discrete duration-200 backdrop:bg-black/70 backdrop:backdrop-blur-sm open:translate-y-0 open:opacity-100 starting:open:translate-y-2 starting:open:opacity-0 motion-reduce:transition-none"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            {header}
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-100"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  )
}
