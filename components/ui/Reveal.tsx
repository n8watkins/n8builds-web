'use client'
import { m } from 'motion/react'
import { useReveal } from '@/hooks/useReveal'

/**
 * Fades its content up as it scrolls into view (once). Use it for sections
 * and blocks below the fold, never for the hero or anything above the fold.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <m.div {...useReveal(delay)} className={className}>
      {children}
    </m.div>
  )
}
