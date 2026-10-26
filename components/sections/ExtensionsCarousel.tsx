'use client'
import React, { useEffect, useRef, useState } from 'react'
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
 * The active card's timer: a bar that fills over one cycle, or quickly while
 * the cycle is paused on hover. Re-keyed on each change, so it starts empty;
 * its duration is fixed when it mounts, so un-pausing doesn't rewind it.
 */
function ProgressBar({ fast }: { fast: boolean }) {
  const [duration] = useState(fast ? 0.3 : CYCLE_MS / 1000)
  return (
    <div
      className="h-full w-full origin-left bg-linear-to-r from-cyan-400 to-blue-500 animate-[progress-fill_linear_both]"
      style={{ animationDuration: `${duration}s` }}
    />
  )
}

/**
 * The desktop extensions showcase (components/sections/ExtensionsShowcase.tsx):
 * three cards that auto-cycle (hover or focus picks one and pauses), and the
 * active one's detail, which arrives rendered on the server.
 */
export default function ExtensionsCarousel({ cards, details }: { cards: ExtensionCard[]; details: React.ReactNode[] }) {
  // The active card, and the one before it (its detail slides out to the left).
  const [{ active, previous }, setShown] = useState({ active: 0, previous: -1 })
  const show = (next: (current: number) => number) =>
    setShown((s) => {
      const i = next(s.active)
      return i === s.active ? s : { active: i, previous: s.active }
    })
  const [paused, setPaused] = useState(false)
  const [progressKey, setProgressKey] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const reduceMotion = usePrefersReducedMotion()

  // auto-cycle (desktop). Pauses on hover, and never runs under reduced motion.
  useEffect(() => {
    if (paused || reduceMotion) return
    timer.current = setInterval(() => {
      show((a) => (a + 1) % cards.length)
      setProgressKey((k) => k + 1)
    }, CYCLE_MS)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [paused, reduceMotion, cards.length])

  const select = (i: number) => {
    show(() => i)
    setProgressKey((k) => k + 1)
  }

  return (
    <div className="hidden md:block">
      <div className="grid grid-cols-3 gap-4">
        {cards.map((ext, i) => {
          const isActive = i === active
          return (
            <button
              key={ext.slug}
              onMouseEnter={() => {
                setPaused(true)
                select(i)
              }}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => {
                setPaused(true)
                select(i)
              }}
              className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
                isActive
                  ? 'border-cyan-400/40 bg-white/5 shadow-lg shadow-cyan-500/5'
                  : 'border-white/8 bg-white/2 opacity-55 blur-[1.5px] hover:opacity-80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Image src={ext.icon} alt="" width={40} height={40} className="rounded-xl" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-100">{ext.name}</p>
                  <p className="truncate font-mono text-[0.7rem] text-slate-450">{ext.tagline}</p>
                </div>
              </div>
              {/* progress timer on the active card */}
              <div className="mt-4 h-0.5 w-full overflow-hidden rounded-full bg-white/6">
                {isActive && <ProgressBar key={progressKey} fast={paused} />}
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
