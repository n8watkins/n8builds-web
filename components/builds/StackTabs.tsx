'use client'
import { useId, useRef, useState, type ReactNode } from 'react'

/**
 * How a build is built, by layer (owner, 2026-11-08): tabs for Frontend,
 * Backend and Cloud (only the layers the build has), each showing its stack
 * cards. A proper tablist: the arrow keys, Home and End move between tabs.
 * Every panel is laid out in the same grid cell, the others invisible and
 * inert, so the section is as tall as its fullest tab and never jumps as you
 * switch. Rendered on the server with the first tab shown.
 */
export default function StackTabs({ tabs }: { tabs: { label: string; panel: ReactNode }[] }) {
  const [active, setActive] = useState(0)
  const id = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const go = (i: number) => {
    const next = (i + tabs.length) % tabs.length
    setActive(next)
    refs.current[next]?.focus()
  }
  return (
    <div>
      <div role="tablist" aria-label="Layers" className="flex flex-wrap justify-center gap-2">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key]
              if (to === undefined) return
              e.preventDefault()
              go(to)
            }}
            className={`rounded-full border px-5 py-2.5 text-base font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
              i === active
                ? 'border-blue-400/40 bg-blue-500/15 text-blue-200'
                : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/8 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] *:col-start-1 *:row-start-1">
        {tabs.map((tab, i) => (
          <div
            key={tab.label}
            role="tabpanel"
            id={`${id}-panel-${i}`}
            aria-labelledby={`${id}-tab-${i}`}
            inert={i !== active}
            className={`transition-opacity duration-300 motion-reduce:transition-none ${i === active ? 'opacity-100' : 'invisible opacity-0'}`}
          >
            {tab.panel}
          </div>
        ))}
      </div>
    </div>
  )
}
