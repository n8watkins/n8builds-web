'use client'
import { motion } from 'motion/react'
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
    <motion.div {...useReveal(delay)} className={className}>
      {children}
    </motion.div>
  )
}
