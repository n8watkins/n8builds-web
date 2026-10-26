'use client'
import { LazyMotion, MotionConfig } from 'motion/react'

const motionFeatures = () => import('@/lib/motion-features').then((mod) => mod.default)

/**
 * Motion's setup for the few parts of the site that still animate with it
 * (the contact form's sending and success screens, the live player). Each
 * wraps itself in this, inside its own lazily loaded chunk, so motion loads
 * only when one of them appears, never with a page; everything else animates
 * with CSS. Animations follow the OS reduced-motion setting, and the
 * features (domAnimation) load as a further chunk.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={motionFeatures}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
