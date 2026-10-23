import { Variants } from 'motion/react'

// Common animation variants for fade-in effects
export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

// Container variants for staggered animations
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

// Item variants for staggered children
export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 25,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

/**
 * The site's scroll reveal: fade up once as it enters the viewport, with the
 * hero's easing curve. Opacity and transform only, so it never shifts layout.
 * Under reduced motion, MotionConfig (app/provider.tsx) drops the movement.
 */
export const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] },
} as const

// Common animation configuration
export const defaultAnimationConfig = {
  initial: "hidden",
  whileInView: "visible",
  viewport: {
    once: true,
    amount: 0.3
  }
}
