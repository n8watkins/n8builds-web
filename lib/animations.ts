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

// Common animation configuration
export const defaultAnimationConfig = {
  initial: "hidden",
  whileInView: "visible",
  viewport: {
    once: true,
    amount: 0.3
  }
}
