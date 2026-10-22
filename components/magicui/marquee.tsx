import React, { createContext, useState } from 'react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

/**
 * True inside the loop's duplicate copies. Focusable children should leave the
 * tab order there (tabIndex -1), so keyboard users reach each item once.
 */
export const MarqueeCopyContext = createContext(false)

interface MarqueeProps {
  /** Accessible name for the list, used when it becomes a scrollable region. */
  label: string
  className?: string
  reverse?: boolean
  pauseOnHover?: boolean
  children?: React.ReactNode
  vertical?: boolean
  repeat?: number
  [key: string]: any
}

export default function Marquee({
  label,
  className,
  reverse,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  const [isHovered, setIsHovered] = useState(false)
  // Focus inside (a keyboard user, or a tapped tile) always pauses, so the
  // focused item doesn't slide out from under the visitor.
  const [hasFocus, setHasFocus] = useState(false)
  const isPaused = (pauseOnHover && isHovered) || hasFocus
  const reduceMotion = usePrefersReducedMotion()

  // Reduced motion: show every item once instead of a frozen track that clips
  // items at the edges. Small screens get a row the visitor swipes themselves;
  // wider ones wrap the items into a centred grid.
  if (reduceMotion) {
    return (
      <div
        {...props}
        // Scrollable on small screens, so it must be reachable by keyboard.
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cn(
          'flex p-2 [--gap:1rem] gap-(--gap)',
          vertical
            ? 'flex-col items-center'
            : 'w-full snap-x overflow-x-auto md:flex-wrap md:justify-center md:overflow-visible *:shrink-0 *:snap-start',
          className
        )}>
        {children}
      </div>
    )
  }

  return (
    <div
      {...props}
      className={cn(
        'flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] gap-(--gap)',
        {
          'flex-row': !vertical,
          'flex-col': vertical,
        },
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setHasFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHasFocus(false)
      }}>
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            // The copies only make the loop seamless: hide them from assistive
            // tech so each item is announced once (see MarqueeCopyContext).
            aria-hidden={i > 0 || undefined}
            className={cn('flex shrink-0 justify-around gap-(--gap)', {
              'animate-marquee flex-row': !vertical,
              'animate-marquee-vertical flex-col': vertical,
              '[animation-play-state:paused]': isPaused,
              '[animation-direction:reverse]': reverse,
            })}>
            <MarqueeCopyContext.Provider value={i > 0}>{children}</MarqueeCopyContext.Provider>
          </div>
        ))}
    </div>
  )
}
