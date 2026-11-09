'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { latestEntry } from '@/lib/intersection'

/** How long each step shows before the next update moves in. */
export const LATEST_EVERY_MS = 6500
/** Updates on show at once. */
const SHOWN = 2

const arrow =
  'flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-white/8 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60'

/**
 * The homepage build log's updates for the month on show (owner, round 4 of
 * 2026-11-08): two at a time, newest first, moving on one update at a time,
 * slowly, through the whole month and round again. It runs only while on
 * screen and the tab is shown, holds while hovered or focused (WCAG 2.2.2),
 * and never moves by itself under reduced motion; the arrows step either way
 * and say where they are. Every row is rendered on the server.
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
  const playing = steps && !reduce && onScreen && tabShown && !hovered && !focused

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

  useEffect(() => {
    if (!playing) return
    const id = setTimeout(() => setStart((s) => (s + 1) % n), LATEST_EVERY_MS)
    return () => clearTimeout(id)
  }, [playing, start, n])

  const step = (by: number) => {
    const next = (start + by + n) % n
    setStart(next)
    setAnnounce(`Updates ${next + 1} and ${((next + 1) % n) + 1} of ${n}`)
  }

  const shown = Array.from({ length: Math.min(SHOWN, n) }, (_, i) => (start + i) % n)

  return (
    <div
      ref={ref}
      data-cycling={playing ? '' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      className="flex h-full flex-col justify-center"
    >
      <div className="mb-1 flex items-center justify-between gap-3 px-2">
        <p className="font-mono text-[0.68rem] font-bold tracking-[0.16em] text-emerald-300/90 uppercase" aria-hidden="true">
          Latest
        </p>
        {steps && (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[0.68rem] text-slate-450 tabular-nums" data-position>
              {start + 1} / {n}
            </span>
            <button type="button" aria-label="Newer update" onClick={() => step(-1)} className={arrow}>
              <FiChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" aria-label="Older update" onClick={() => step(1)} className={arrow}>
              <FiChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <ul aria-label={label} className="space-y-1.5">
        {shown.map((i) => (
          // Keyed by the update, so the one that stays slides up and the new one fades in.
          <li key={i} data-row={i} className="log-month-in">
            {rows[i]}
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
