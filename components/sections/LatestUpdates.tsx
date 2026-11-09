'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { latestEntry } from '@/lib/intersection'

/** How long each step shows before the next update moves in; the progress bar fills over it. */
export const LATEST_EVERY_MS = 6500
/** Updates on show at once. */
const SHOWN = 3

const arrowClass =
  'flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg border border-white/10 bg-white/4 text-slate-400 transition-colors hover:border-emerald-400/30 hover:bg-white/8 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60'

/**
 * The homepage build log's updates for the month on show (owner, rounds 4 and
 * 5 of 2026-11-08): "Some of the latest changes I've made", three at a time,
 * newest first, moving on one update at a time through the whole month and
 * round again. Visitors step through them themselves too (round 7 of
 * 2026-11-09): arrows either side of a progress bar along the foot, and a
 * click on the bar jumps to that point. The bar shows where the three on show
 * sit in the month, and its current step fills until the next one moves in;
 * the step happens when that fill's animation ends, so pausing it pauses the
 * list exactly where it is. It runs only while on screen and the tab is shown,
 * holds while hovered or focused (WCAG 2.2.2) and starts again after, and
 * never moves by itself under reduced motion (the arrows still work). Every
 * row is rendered on the server.
 */
export default function LatestUpdates({ rows, label }: { rows: ReactNode[]; label: string }) {
  const [start, setStart] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [tabShown, setTabShown] = useState(true)
  const [announce, setAnnounce] = useState('')
  const reduce = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const n = rows.length
  const steps = n > SHOWN
  const auto = steps && !reduce
  const playing = auto && onScreen && tabShown && !hovered && !focused

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

  /** A step the visitor took: shown at once, and read out (the timer's steps never are). */
  const goTo = (to: number) => {
    const next = ((to % n) + n) % n
    setStart(next)
    const last = Math.min(next + SHOWN, n)
    setAnnounce(
      next + SHOWN <= n
        ? `Updates ${next + 1} to ${last} of ${n}`
        : `Updates ${next + 1} to ${n} and 1 to ${(next + SHOWN) % n} of ${n}`,
    )
  }

  return (
    <div
      ref={ref}
      data-cycling={playing ? '' : undefined}
      data-position={start + 1}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Keyboard focus holds it; a click on an arrow doesn't keep it held once the pointer leaves.
      onFocus={(e) => setFocused(e.target.matches(':focus-visible'))}
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
      {steps && (
        <div className="mt-2 flex items-center gap-2 px-2" data-latest-controls>
          <button type="button" onClick={() => goTo(start - 1)} aria-label="Previous update" title="Previous update" className={arrowClass}>
            <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          {/* Where the three on show sit in the month: done steps filled, the current one
              filling until the next moves in. A click jumps to that point; the arrows are
              the keyboard's way (and a screen reader's), so the bar itself is for the eye. */}
          <div
            aria-hidden="true"
            data-latest-timer
            onClick={(e) => {
              const box = e.currentTarget.getBoundingClientRect()
              goTo(Math.min(n - 1, Math.floor(((e.clientX - box.left) / box.width) * n)))
            }}
            className="group relative flex h-6 min-w-0 flex-1 cursor-pointer items-center"
          >
            <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/8 transition-[height] duration-150 group-hover:h-[5px]">
              <div
                className="absolute inset-y-0 left-0 bg-emerald-400/45"
                style={{ width: `${(start / n) * 100}%` }}
                data-latest-done
              />
              {/* Keyed by the step, so its fill starts over each time. */}
              <div
                key={start}
                className={`absolute inset-y-0 origin-left bg-linear-to-r from-emerald-400 to-cyan-400 ${auto ? 'template-timer' : ''}`}
                style={{
                  left: `${(start / n) * 100}%`,
                  width: `${100 / n}%`,
                  ...(auto
                    ? { animationDuration: `${LATEST_EVERY_MS}ms`, animationPlayState: playing ? 'running' : 'paused' }
                    : {}),
                }}
                onAnimationEnd={() => setStart((s) => (s + 1) % n)}
              />
            </div>
          </div>
          <button type="button" onClick={() => goTo(start + 1)} aria-label="Next update" title="Next update" className={arrowClass}>
            <FiChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
