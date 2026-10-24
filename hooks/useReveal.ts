import { reveal } from '@/lib/animations'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

/**
 * Motion props for the site's scroll reveal (see `reveal` in lib/animations).
 * Under reduced motion the content is simply shown, with no fade and no rise:
 * MotionConfig's reduced-motion mode held the 24px offset through the fade
 * and then snapped it, which is a jump, not "less motion".
 */
export function useReveal(delay = 0) {
  const reduce = usePrefersReducedMotion()
  return reduce
    ? { ...reveal, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : { ...reveal, transition: { ...reveal.transition, delay } }
}
