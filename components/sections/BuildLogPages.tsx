'use client'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiPause, FiPlay } from 'react-icons/fi'
import { fullPages } from '@/lib/full-pages'
import { usePageVisible } from '@/hooks/usePageVisible'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

// The homepage strip's rows, a page at a time (BuildLogStrip.tsx): four rows
// at every width, and every few seconds the page moves on, its rows fading
// out to the right one after another as the next page's fade in behind them,
// round the whole month. The rows arrive rendered on the server.
//
// Every page is full (round 3 of 2026-11-02, "never fewer" than four): when
// the month runs out partway through the last page, it fills up with the
// newest updates again, wrapping round to the start. With four updates or
// fewer there is one page and no paging.
//
// Each entry has a slot (its place on the page), and every entry sharing a
// slot sits in the same grid cell, so the list is as tall as its tallest rows
// and never shifts the page as they change. The slots are set in the HTML, so
// the first page is right before any JavaScript runs.
//
// The cycle holds while the list is hovered or focused (WCAG 2.2.2), while it
// is off screen or the tab is hidden, and for good after the pause button or
// any touch. The arrows (and the arrow keys) move by hand, and only those
// moves are announced. Under reduced motion it never moves by itself and the
// pages swap without the fade; the arrows still reach the whole month.

/** How long each page stays. */
const DWELL_MS = 5000
/** The fade: each row's, and the gap between rows. A slot's new row starts as its old one is gone. */
const FADE_MS = 340
const STAGGER_MS = 70
const IN_AFTER_MS = FADE_MS
/** Rows per page, at every width. */
const PER_PAGE = 4

const arrowClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-white/8 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60'

type Turn = {
  page: number
  /** The page before the last move, and which way it went. */
  from: number
  dir: 1 | -1
  /** Counts moves, so each one restarts the timer and its bar. */
  seq: number
}

export default function BuildLogPages({ rows, labels, label }: { rows: React.ReactNode[]; labels: string[]; label: string }) {
  const count = rows.length
  const perPage = PER_PAGE
  // The entries, page after page, each page full (lib/full-pages.ts): a short
  // last page wraps round to the newest rows. With a page or less, just the rows.
  const layout = fullPages(count, perPage)
  const pages = Math.max(1, layout.length)
  const entries = layout.flat()
  const [turn, setTurn] = useState<Turn>({ page: 0, from: 0, dir: 1, seq: 0 })
  const { from, dir, seq } = turn
  // A width change re-pages the list; a page past its new end starts it over.
  const page = turn.page < pages ? turn.page : 0
  // Why the cycle is held, if it is: each reason clears independently.
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [inView, setInView] = useState(false)
  // Set by the pause button, or by any touch: someone touching the list is
  // reading it, so it stops moving under their finger.
  const [stopped, setStopped] = useState(false)
  const [announce, setAnnounce] = useState('')
  const reduceMotion = usePrefersReducedMotion()
  const pageVisible = usePageVisible()
  const cycling = !reduceMotion && pages > 1 && !stopped && !hovered && !focused && inView && pageVisible

  const root = useRef<HTMLDivElement>(null)
  const rowEls = useRef<(HTMLLIElement | null)[]>([])
  // What was left of a page's turn when the cycle was held, so hovering
  // pauses the clock instead of restarting it (the bar holds where it is).
  const left = useRef({ seq: 0, ms: DWELL_MS })
  // Set when a move takes away the row holding focus: focus follows to the new page.
  const refocus = useRef(false)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const go = (step: 1 | -1, byHand: boolean) => {
    if (pages < 2) return
    const next = (page + step + pages) % pages
    refocus.current = rowEls.current.some((el, i) => Math.floor(i / perPage) === page && el?.contains(document.activeElement))
    setTurn({ page: next, from: page, dir: step, seq: seq + 1 })
    if (byHand) {
      const onPage = layout[next]
      const wraps = onPage[perPage - 1] < onPage[0]
      const span = wraps
        ? `Updates ${onPage[0] + 1} to ${count} of ${count}, then the newest again`
        : `Updates ${onPage[0] + 1} to ${onPage[perPage - 1] + 1} of ${count}`
      setAnnounce(`${span}: ${onPage.map((r) => labels[r]).join('; ')}`)
    }
  }

  useEffect(() => {
    const el = root.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    observer.observe(el)
    // Native enter and leave: React's are pieced together from over and out
    // events, which WebKit skips when the element under the pointer is
    // replaced (the pause button's icon), leaving the list held for good.
    const enter = () => setHovered(true)
    const leave = () => setHovered(false)
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    return () => {
      observer.disconnect()
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
    }
  }, [])

  // The timer: one turn per page, resumed (not restarted) after a hold.
  useEffect(() => {
    if (!cycling) return
    const ms = left.current.seq === seq ? left.current.ms : DWELL_MS
    const started = performance.now()
    let fired = false
    const timer = setTimeout(() => {
      fired = true
      setTurn((t) => {
        const current = t.page < pages ? t.page : 0
        return { page: (current + 1) % pages, from: current, dir: 1, seq: t.seq + 1 }
      })
    }, ms)
    // Marks a running timer (set here, not at render), so tests can move their clock on once it is set.
    const el = root.current
    el?.setAttribute('data-cycling', '')
    return () => {
      el?.removeAttribute('data-cycling')
      clearTimeout(timer)
      if (!fired) left.current = { seq, ms: Math.max(0, ms - (performance.now() - started)) }
    }
  }, [cycling, seq, pages])

  // The fade. Each row's resting state is inline (shown or not); a move adds
  // the staggered flight on top: the old page's rows fade out toward where
  // the list is heading, slot by slot, and the new page's fade in behind
  // them. Started before paint, so no row flashes in its new state first.
  useLayoutEffect(() => {
    if (seq === 0) return
    if (refocus.current) {
      refocus.current = false
      rowEls.current[page * perPage]?.querySelector<HTMLElement>('a')?.focus({ preventScroll: true })
    }
    if (from === page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const flights: Animation[] = []
    rowEls.current.forEach((el, i) => {
      if (!el || typeof el.animate !== 'function') return
      const p = Math.floor(i / perPage)
      const slot = i % perPage
      if (p === from) {
        flights.push(
          el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${dir * 28}px)` }], {
            duration: FADE_MS,
            delay: slot * STAGGER_MS,
            easing: 'cubic-bezier(0.4, 0, 0.7, 0.6)',
            fill: 'backwards',
          })
        )
      } else if (p === page) {
        flights.push(
          el.animate([{ opacity: 0, transform: `translateX(${dir * -20}px)` }, { opacity: 1, transform: 'none' }], {
            duration: FADE_MS + 60,
            delay: IN_AFTER_MS + slot * STAGGER_MS,
            easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)',
            fill: 'backwards',
          })
        )
      }
    })
    return () => flights.forEach((f) => f.finish())
  }, [seq, page, from, dir, perPage])

  return (
    <div
      ref={root}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      // Marks that the on-screen watcher (hydrated) sees the list, so tests can
      // wait for it instead of guessing how long a loaded machine takes to hydrate.
      data-in-view={inView ? '' : undefined}
      data-page={page}
      className="flex h-full flex-col"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        e.preventDefault()
        go(e.key === 'ArrowRight' ? 1 : -1, true)
      }}
    >
      {/* Every row in its slot's cell; only the current page's show. Swipes
          sideways move it on phones. */}
      <ul
        className="grid flex-1 grid-cols-1 content-start touch-pan-y"
        onPointerDown={(e) => {
          swiped.current = false
          if (e.pointerType === 'mouse') return
          setStopped(true)
          swipe.current = { x: e.clientX, y: e.clientY }
        }}
        onPointerUp={(e) => {
          const start = swipe.current
          swipe.current = null
          if (!start) return
          const dx = e.clientX - start.x
          if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(e.clientY - start.y) * 1.5) return
          swiped.current = true
          go(dx < 0 ? 1 : -1, true)
        }}
        onPointerCancel={() => (swipe.current = null)}
        onClickCapture={(e) => {
          // A swipe that ends on a row isn't a tap on it.
          if (swiped.current) e.preventDefault()
          swiped.current = false
        }}
      >
        {entries.map((row, i) => {
          const shown = Math.floor(i / perPage) === page
          return (
            <li
              key={i}
              ref={(el) => {
                rowEls.current[i] = el
              }}
              aria-hidden={!shown}
              inert={!shown}
              data-row={row}
              // A newer update again, filling the last page.
              data-wrap={i >= count ? '' : undefined}
              data-shown={shown ? '' : undefined}
              className={`col-start-1 ${shown ? '' : 'pointer-events-none opacity-0'}`}
              style={{ gridRow: (i % perPage) + 1 }}
            >
              {rows[row]}
            </li>
          )
        })}
      </ul>

      {pages > 1 && (
        <div className="mt-2 flex items-center gap-3 px-2">
          <p data-position className="min-w-[4.5ch] shrink-0 font-mono text-xs tabular-nums text-slate-450">
            <span className="text-slate-100">{page + 1}</span> / {pages}
          </p>
          {/* The current page's turn, filling up; it holds with the cycle. */}
          <div aria-hidden className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/8">
            {!stopped && !reduceMotion && (
              <div
                key={seq}
                data-progress
                className="h-full w-full origin-left rounded-full bg-linear-to-r from-cyan-400 to-blue-500 animate-[progress-fill_linear_both]"
                style={{ animationDuration: `${DWELL_MS}ms`, animationPlayState: cycling ? 'running' : 'paused' }}
              />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {!reduceMotion && (
              <button
                type="button"
                onClick={() => setStopped((v) => !v)}
                aria-label={stopped ? 'Resume rotation' : 'Pause rotation'}
                className={arrowClass}
              >
                {stopped ? <FiPlay className="h-3.5 w-3.5" /> : <FiPause className="h-3.5 w-3.5" />}
              </button>
            )}
            <button type="button" onClick={() => go(-1, true)} aria-label="Previous updates" className={arrowClass}>
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => go(1, true)} aria-label="Next updates" className={arrowClass}>
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
