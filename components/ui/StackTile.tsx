'use client'

import React, { ReactElement, useContext } from 'react'
import { MarqueeCopyContext } from '@/components/magicui/marquee'
import { cn } from '@/lib/utils'

// A tech-stack tile for the marquees: icon + name, with the description
// revealed on hover, or on focus (keyboard, or a tap on touch screens, where
// Tailwind 4 doesn't apply hover: styles).
export default function StackTile({
  name,
  icon,
  description,
  iconClassName,
}: {
  name: string
  icon?: string | ReactElement
  description: string
  iconClassName?: string
}) {
  // Duplicate marquee copies stay tappable but out of the tab order.
  const isCopy = useContext(MarqueeCopyContext)
  return (
    <figure
      tabIndex={isCopy ? -1 : 0}
      className={cn(
        'relative flex h-28 min-w-40 max-w-52 cursor-pointer items-center justify-center overflow-hidden rounded-xl border px-2 pb-2',
        'border-white/8 bg-white/4 transition-all duration-300 ease-in-out outline-none',
        'focus-visible:ring-2 focus-visible:ring-cyan-400',
        // Classes spelled out in full so Tailwind's scanner sees them.
        'hover:border-cyan-400/30 hover:bg-white/8 hover:shadow-lg hover:shadow-cyan-500/5 hover:[&_.content-wrapper]:scale-75 hover:[&_.content-wrapper]:-translate-y-9 hover:[&_.description]:opacity-100',
        'focus:border-cyan-400/30 focus:bg-white/8 focus:shadow-lg focus:shadow-cyan-500/5 focus:[&_.content-wrapper]:scale-75 focus:[&_.content-wrapper]:-translate-y-9 focus:[&_.description]:opacity-100'
      )}
    >
      <div className="content-wrapper flex flex-col items-center transition-all duration-300 ease-in-out">
        <figcaption className="mt-2 flex flex-col items-center text-xl font-medium text-white transition-all duration-300 ease-in-out">
          <div className="flex flex-row items-center gap-2 pt-24">
            <span className={cn('transition-transform duration-300 ease-in-out', iconClassName)}>{icon}</span>
            <span className="whitespace-nowrap text-white transition-all duration-300 ease-in-out">{name}</span>
          </div>
          <div className="description flex h-24 w-48 items-start justify-center text-center text-sm text-[#9cadc5] opacity-0 transition-all duration-300 ease-in-out">
            {description}
          </div>
        </figcaption>
      </div>
    </figure>
  )
}
