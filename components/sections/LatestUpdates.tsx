'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { latestEntry } from '@/lib/intersection'

/** How long each step shows before the next update moves in; the line at the foot fills over it. */
export const LATEST_EVERY_MS = 6500
/** Updates on show at once. */
const SHOWN = 3

/**
 * The homepage build log's updates for the month on show (owner, rounds 4 and
 * 5 of 2026-11-08): "Some of the latest changes I've made", three at a time,
 * newest first, moving on one update at a time through the whole month and
 * round again. A thin line along the foot fills up until the next step, and
 * the step happens when that line's animation ends, so pausing the line
 * pauses the list exactly where it is. It runs only while on screen and the
 * tab is shown, holds while hovered or focused (WCAG 2.2.2), and never moves
 * by itself under reduced motion (no line then). Every row is rendered on the
 * server.
 */
export default function LatestUpdates({ rows, label }: { rows: ReactNode[]; label: string }) {
  const [start, setStart] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [tabShown, setTabShown] = useState(true)
  const reduce = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const n = rows.length
  const steps = n > SHOWN && !reduce
  const playing = steps && onScreen && tabShown && !hovered && !focused

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => setOnScreen(latestEntry(entries).isIntersecting))
    observer.observe(el)
    const onVisibility = () => setTabShown(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    el.dataset.watching = ''
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const shown = Array.from({ length: Math.min(SHOWN, n) }, (_, i) => (start + i) % n)

  return (
    <div
      ref={ref}
      data-cycling={playing ? '' : undefined}
      data-position={start + 1}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      className="relative flex h-full flex-col"
    >
      <p className="mb-1.5 px-2 text-sm font-semibold text-emerald-300/90">Some of the latest changes I&apos;ve made</p>
      <ul aria-label={label} className="flex-1 space-y-0.5">
        {shown.map((i) => (
          // Keyed by the update, so the ones that stay move up and the new one fades in.
          <li key={i} data-row={i} className="log-month-in">
            {rows[i]}
          </li>
        ))}
      </ul>
      {/* The timer: fills over LATEST_EVERY_MS, then the next update moves in. Keyed by
          the step, so it starts over each time. */}
      {steps && (
        <div aria-hidden className="mx-2 mt-2 h-[2px] overflow-hidden rounded-full bg-white/8" data-latest-timer>
          <div
            key={start}
            className="template-timer h-full origin-left bg-linear-to-r from-emerald-400 to-cyan-400"
            style={{ animationDuration: `${LATEST_EVERY_MS}ms`, animationPlayState: playing ? 'running' : 'paused' }}
            onAnimationEnd={() => setStart((s) => (s + 1) % n)}
          />
        </div>
      )}
    </div>
  )
}
