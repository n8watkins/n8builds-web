'use client'
import React, { useEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiPause, FiPlay } from 'react-icons/fi'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const CYCLE_MS = 7000

const arrowClass =
  'flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-100'

/**
 * The rotating card of "What I'm working on" (components/sections/NowBuilding.tsx).
 * The cards arrive rendered on the server; this only decides which one shows.
 */
const NowCarousel = ({ labels, cards }: { labels: string[]; cards: React.ReactNode[] }) => {
  const [index, setIndex] = useState(0)
  // Why the cycle is paused, if it is: each reason clears independently.
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  // Set by the pause button, or by any tap: a visitor who touched the card is
  // reading it, so it stops moving under their finger.
  const [stopped, setStopped] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const count = cards.length
  const reduceMotion = usePrefersReducedMotion()
  const cycling = !reduceMotion && count > 1 && !stopped && !hovered && !focused && visible

  const go = (next: number) => setIndex((next + count) % count)

  // Only cycle while the card is on screen, so it never shifts what a visitor
  // is reading elsewhere (and costs nothing while scrolled away).
  useEffect(() => {
    const el = card.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!cycling) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), CYCLE_MS)
    return () => clearInterval(t)
  }, [cycling, count])

  return (
    <div
      ref={card}
      // Off screen, the card's animations (the phone's scroll) hold still.
      data-offscreen={visible ? undefined : ''}
      className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-linear-to-br from-cyan-500/6 via-white/2 to-blue-600/5 p-5 shadow-2xl shadow-cyan-950/40 sm:p-6 md:p-9"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'touch') setStopped(true)
      }}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-cyan-400 via-blue-500 to-cyan-400" />

      {/* Every card sits in the same grid cell, so the box is always as tall
          as the tallest one and the page never jumps when they swap. Only
          the current one is visible; the rest are inert. */}
      <div className="grid">
        {cards.map((cardNode, i) => (
          <div
            key={labels[i]}
            inert={i !== index}
            aria-hidden={i !== index}
            className={`col-start-1 row-start-1 transition-opacity duration-500 ease-out motion-reduce:transition-none ${
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {cardNode}
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-white/6 pt-4">
          {/* dots */}
          <div className="-ml-2 flex items-center">
            {labels.map((label, i) => (
              // 24px hit area (WCAG 2.5.8) around the small visual dot.
              <button
                key={label}
                onClick={() => go(i)}
                aria-label={`Show ${label}`}
                aria-current={i === index ? 'true' : undefined}
                className="group flex h-6 min-w-6 items-center justify-center px-1"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-200 ${
                    i === index ? 'w-6 bg-cyan-400' : 'w-2 bg-white/15 group-hover:bg-white/30'
                  }`}
                />
              </button>
            ))}
          </div>
          {/* pause and arrows */}
          <div className="flex items-center gap-2">
            {!reduceMotion && (
              <button
                type="button"
                onClick={() => setStopped((v) => !v)}
                aria-label={stopped ? 'Resume rotation' : 'Pause rotation'}
                className={arrowClass}
              >
                {stopped ? <FiPlay className="h-4 w-4" /> : <FiPause className="h-4 w-4" />}
              </button>
            )}
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous" className={arrowClass}>
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Next" className={arrowClass}>
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NowCarousel
