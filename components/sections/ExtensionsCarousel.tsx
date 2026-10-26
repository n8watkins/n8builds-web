'use client'
import React, { useEffect, useState, type KeyboardEvent } from 'react'
import Image from 'next/image'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const CYCLE_MS = 5000

export interface ExtensionCard {
  slug: string
  icon: string
  name?: string
  tagline?: string
}

/**
 * The active tab's timer: a bar that fills over one cycle, or quickly while
 * the cycle is paused. Re-keyed on each change (and on pause and resume, when
 * the cycle restarts), so it starts empty and stays in step with the cycle.
 * Under reduced motion there is no cycle, so it simply shows full.
 */
function ProgressBar({ fast }: { fast: boolean }) {
  const [duration] = useState(fast ? 0.3 : CYCLE_MS / 1000)
  return (
    <div
      data-progress
      className="h-full w-full origin-left rounded-full bg-linear-to-r from-cyan-400 to-blue-500 animate-[progress-fill_linear_both] motion-reduce:animate-none"
      style={{ animationDuration: `${duration}s` }}
    />
  )
}

/**
 * The desktop extensions showcase (components/sections/ExtensionsShowcase.tsx):
 * three tabs that auto-cycle, and the active one's detail, which arrives
 * rendered on the server. Hovering or focusing a tab picks it; the cycle
 * pauses while the pointer or focus is anywhere in the showcase, so the
 * detail never changes under someone reading it or tabbing through it.
 */
export default function ExtensionsCarousel({ cards, details }: { cards: ExtensionCard[]; details: React.ReactNode[] }) {
  // The active tab, and the one before it (its detail slides out to the left).
  const [{ active, previous }, setShown] = useState({ active: 0, previous: -1 })
  const show = (next: (current: number) => number) =>
    setShown((s) => {
      const i = next(s.active)
      return i === s.active ? s : { active: i, previous: s.active }
    })
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const paused = hovered || focused
  const [progressKey, setProgressKey] = useState(0)
  const reduceMotion = usePrefersReducedMotion()

  // auto-cycle (desktop). Pauses on hover and focus, and never runs under reduced motion.
  useEffect(() => {
    if (paused || reduceMotion) return
    const timer = setInterval(() => {
      show((a) => (a + 1) % cards.length)
      setProgressKey((k) => k + 1)
    }, CYCLE_MS)
    return () => clearInterval(timer)
  }, [paused, reduceMotion, cards.length])

  const select = (i: number) => {
    show(() => i)
    setProgressKey((k) => k + 1)
  }

  // Arrow keys, Home and End move between the tabs (roving tabindex).
  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const n = cards.length
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? n - 1 : (active + (event.key === 'ArrowRight' ? 1 : -1) + n) % n
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div
      className="hidden md:block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
    >
      <div role="tablist" aria-label="Chrome extensions" onKeyDown={onTabKey} className="grid grid-cols-3 gap-4">
        {cards.map((ext, i) => {
          const isActive = i === active
          return (
            <button
              key={ext.slug}
              type="button"
              role="tab"
              id={`ext-tab-${ext.slug}`}
              aria-selected={isActive}
              aria-controls={`ext-panel-${ext.slug}`}
              tabIndex={isActive ? 0 : -1}
              onMouseEnter={() => select(i)}
              onFocus={() => select(i)}
              className={`relative flex flex-col overflow-hidden rounded-2xl border p-5 text-left transition-[border-color,background-color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 motion-reduce:transition-none ${
                isActive
                  ? 'border-cyan-400/55 bg-cyan-400/[0.07] shadow-[0_0_28px_-8px_rgba(34,211,238,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'border-white/12 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Image src={ext.icon} alt="" width={32} height={32} className="shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <p className={`text-lg font-bold leading-snug transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-200'}`}>{ext.name}</p>
                  <p className={`text-sm leading-snug transition-colors duration-300 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{ext.tagline}</p>
                </div>
              </div>
              {/* the cycle's timer, on the active tab */}
              <div className="mt-auto pt-4">
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/8">
                  {isActive && <ProgressBar key={`${progressKey}-${paused}`} fast={paused} />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail panel - carousels as active changes */}
      <div className="mt-6 rounded-3xl border border-white/8 bg-white/2 p-6 md:p-8">
        {/* Every detail sits in the same grid cell, so the panel is as tall as
            the tallest and never jumps; the active one slides in from the
            right (CSS), the one it replaces slides out to the left. */}
        <div className="grid">
          {details.map((detail, i) => (
            <div
              key={cards[i].slug}
              id={`ext-panel-${cards[i].slug}`}
              role="tabpanel"
              aria-labelledby={`ext-tab-${cards[i].slug}`}
              inert={i !== active}
              aria-hidden={i !== active}
              className={`col-start-1 row-start-1 transition-[opacity,translate] duration-350 ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-reduce:transition-none ${
                i === active ? 'translate-x-0 opacity-100 delay-150' : `pointer-events-none opacity-0 ${i === previous ? '-translate-x-6' : 'translate-x-6'}`
              }`}
            >
              {detail}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
