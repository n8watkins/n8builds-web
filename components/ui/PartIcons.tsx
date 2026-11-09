import { cn } from '@/lib/utils'

/**
 * The homepage parts' animated icons (owner, 2026-11-08), drawn in the style
 * of the Lab's BubblingFlask: inline SVG on a 24-unit square, a 2-unit
 * currentColor stroke with round ends, animated with CSS transforms, opacity
 * and stroke dashes only (`.part-icon` in app/globals.css), no motion library.
 *
 * - ScrollIcon (Build log): a scroll unrolls downwards, then its lines write in,
 *   and now and then write again, one after the other, for as long as it shows.
 * - StarIcon (Featured): a star twinkles, with two glints beside it.
 * - PuzzleIcon (Chrome extensions): a puzzle piece snaps into place. The
 *   Chrome logo itself is never animated (brand rules), so this stands in.
 * - PotIcon (What's cookin'): a cooking pot whose lid jiggles; its steam keeps
 *   rising in a soft loop.
 * - HammerIcon (Tools I built and use; round 8 of 2026-11-09): Lucide's hammer
 *   swings down from its handle's end and strikes, twice, with a spark at
 *   each strike, then rests a beat, for as long as it shows.
 *
 * Each plays once, when it comes into view: inside a scroll reveal
 * (components/ui/Reveal.tsx) when that reveals, and in a side rail
 * (components/ui/SectionRail.tsx) when its part becomes the current one.
 * Until then, and under reduced motion, it shows its finished drawing, the
 * steam still. Size it with className; the drawing fills the box.
 */
type IconProps = { className?: string }

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export function ScrollIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={cn('part-icon part-icon-scroll inline-block shrink-0 overflow-visible', className)}>
      {/* The sheet and its rolls (Lucide's scroll), unrolling from the top. */}
      <g className="scroll-sheet">
        <path d="M19 17V5a2 2 0 0 0-2-2H4" />
        <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
      </g>
      {/* Its two lines, written in once it is open. */}
      <path className="scroll-line" pathLength={1} d="M10 8h5" />
      <path className="scroll-line scroll-line-2" pathLength={1} d="M10 12h5" />
    </svg>
  )
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={cn('part-icon part-icon-star inline-block shrink-0 overflow-visible', className)}>
      {/* Lucide's star; it fills with light for a moment as it twinkles. */}
      <path
        className="star-body"
        d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
      />
      {/* Two glints, at the star's shoulders, that flash and go. */}
      <path className="star-glint" d="M20.5 1.5v3M19 3h3" strokeWidth={1.5} />
      <path className="star-glint star-glint-2" d="M3 19.5v2.5M1.75 20.75h2.5" strokeWidth={1.5} />
    </svg>
  )
}

export function PuzzleIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={cn('part-icon part-icon-puzzle inline-block shrink-0 overflow-visible', className)}>
      {/* Lucide's puzzle piece, coming in from the top right and clicking into place. */}
      <path
        className="puzzle-piece"
        d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"
      />
      {/* The click: a short burst at the corner it lands on. */}
      <path className="puzzle-snap" d="M22.5 1.5l-1.5 1.5M18.5 0.5v1.25M23.5 5.5h-1.25" strokeWidth={1.5} />
    </svg>
  )
}

export function PotIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={cn('part-icon part-icon-pot inline-block shrink-0 overflow-visible', className)}>
      {/* Steam: three wisps rising off the lid, in a soft loop. */}
      <path className="pot-steam" d="M8 7c-.8-.9.8-1.6 0-2.5" strokeWidth={1.5} />
      <path className="pot-steam pot-steam-2" d="M12 6.5c-.8-.9.8-1.6 0-2.5S12.8 2.4 12 1.5" strokeWidth={1.5} />
      <path className="pot-steam pot-steam-3" d="M16 7c-.8-.9.8-1.6 0-2.5" strokeWidth={1.5} />
      {/* The lid and its knob, which jiggle once as it comes to the boil. */}
      <g className="pot-lid">
        <path d="M4.5 13a7.5 3.5 0 0 1 15 0" />
        <path d="M12 9.5v-.75" />
      </g>
      {/* The pot: its rim with handles, and its body. */}
      <path d="M2 13h20" />
      <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    </svg>
  )
}

export function HammerIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={cn('part-icon part-icon-hammer inline-block shrink-0 overflow-visible', className)}>
      {/* Lucide's hammer, swinging about the end of its handle. */}
      <g className="hammer-head">
        <path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9" />
        <path d="m18 15 4-4" />
        <path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" />
      </g>
      {/* The spark where its face lands. */}
      <g className="hammer-spark" strokeWidth={1.5}>
        <path d="M22.5 15.5l1.5 .5" />
        <path d="M21 17l.75 1.5" />
      </g>
    </svg>
  )
}
