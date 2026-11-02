import { useId } from 'react'
import { cn } from '@/lib/utils'

/** The liquid's surface: a gentle wave, twice as wide as the flask so it can slide sideways without end. */
const WAVE = `M-16 14.6 ${'q2 -0.9 4 0 t4 0 '.repeat(14)}V24 H-16 Z`

/** Bubbles rising through the liquid: where they start, how big, and when. */
const BUBBLES = [
  { cx: 10.4, r: 0.9, delay: '0s', dur: '1.9s' },
  { cx: 13.3, r: 0.65, delay: '0.7s', dur: '1.6s' },
  { cx: 11.9, r: 1.1, delay: '1.25s', dur: '2.2s' },
  { cx: 8.6, r: 0.55, delay: '1.6s', dur: '1.7s' },
  { cx: 15.2, r: 0.75, delay: '0.35s', dur: '2s' },
]

/**
 * The Lab's flask, percolating (round 5 of 2026-11-02): the Lucide conical
 * flask's outline holding real liquid, whose surface sways in a slow wave,
 * with bubbles of a few sizes rising through it and popping at the surface,
 * and now and then one drifting up the neck and out. Inline SVG and CSS only
 * (`.flask-*` in app/globals.css), transforms and opacity, so it costs
 * nothing to run. Under reduced motion the liquid is still and the bubbles are
 * hidden. Size it with className (the drawing fills the box).
 */
export default function BubblingFlask({ className }: { className?: string }) {
  const clip = `flask-${useId().replace(/:/g, '')}`
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('flask inline-block shrink-0 overflow-visible', className)}
    >
      <defs>
        <clipPath id={clip}>
          {/* The flask's inside, just within the stroke. */}
          <path d="M11 2.5H13V8.3L18.9 19.4Q19.3 21 17.8 21H6.2Q4.7 21 5.1 19.4L11 8.3Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`} stroke="none">
        <path className="flask-liquid" d={WAVE} fill="currentColor" fillOpacity="0.28" />
        {BUBBLES.map((b) => (
          <circle
            key={b.delay}
            className="flask-rise"
            cx={b.cx}
            cy="20"
            r={b.r}
            fill="currentColor"
            style={{ animationDelay: b.delay, animationDuration: b.dur }}
          />
        ))}
      </g>
      {/* One bubble now and then escapes up the neck. */}
      <circle className="flask-escape" cx="12" cy="13" r="0.75" fill="currentColor" stroke="none" />
      <path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" />
      <path d="M8.5 2h7" />
    </svg>
  )
}
