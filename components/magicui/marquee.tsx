import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

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
  const [isPaused, setIsPaused] = useState(false)
  const reduceMotion = usePrefersReducedMotion()

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true)
    }
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
  }

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
          'flex p-2 [--gap:1rem] [gap:var(--gap)]',
          vertical
            ? 'flex-col items-center'
            : 'w-full snap-x overflow-x-auto md:flex-wrap md:justify-center md:overflow-visible [&>*]:shrink-0 [&>*]:snap-start',
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
        'flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]',
        {
          'flex-row': !vertical,
          'flex-col': vertical,
        },
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn('flex shrink-0 justify-around [gap:var(--gap)]', {
              'animate-marquee flex-row': !vertical,
              'animate-marquee-vertical flex-col': vertical,
              '[animation-play-state:paused]': isPaused,
              '[animation-direction:reverse]': reverse,
            })}>
            {children}
          </div>
        ))}
    </div>
  )
}
