'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * One clock for the part icons that keep moving (components/ui/PartIcons.tsx):
 * the hammer of Tools I've built swings in its heading and, while that part is
 * the current one, in the side rail too, and the two must swing together
 * (owner, round 9 of 2026-11-09: "the two hammer icons must animate in sync").
 * Each copy's CSS animation starts when its copy shows (a reveal, or the rail's
 * current stop), so on its own each would run on its own beat. As each starts,
 * this sets its start time to the document's time origin: every repeating
 * part-icon animation then sits at the same point of its cycle, wherever and
 * whenever it began. Under reduced motion there is nothing to align.
 */
export default function PartIconClock() {
  // Each heading's icon plays once it is in view itself (owner, round 10 of 2026-11-09:
  // the hammer starts as it comes into view; a whole band's scroll reveal started it
  // long before). data-seen starts its CSS animation (.part-icon in app/globals.css). The
  // side rails' copies play while their part is current instead, so they are left out.
  const pathname = usePathname()
  useEffect(() => {
    const icons = [...document.querySelectorAll<SVGElement>('.part-icon:not([data-seen])')].filter(
      (icon) => !icon.closest('[data-section-rail]')
    )
    if (!icons.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-seen', '')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 1 }
    )
    icons.forEach((icon) => observer.observe(icon))
    return () => observer.disconnect()
  }, [pathname])

  useEffect(() => {
    if (typeof document.getAnimations !== 'function' || typeof CSSAnimation === 'undefined') return
    const alignAll = (animations: Animation[], name?: string) => {
      for (const animation of animations) {
        if (!(animation instanceof CSSAnimation) || !animation.animationName.startsWith('part-')) continue
        if (name && animation.animationName !== name) continue
        if (animation.effect?.getTiming().iterations !== Infinity) continue
        animation.startTime = 0
      }
    }
    // Any already running when this mounts, then each one as it starts.
    alignAll(document.getAnimations())
    const align = (event: AnimationEvent) => {
      if (!event.animationName.startsWith('part-')) return
      alignAll((event.target as Element).getAnimations(), event.animationName)
    }
    document.addEventListener('animationstart', align, true)
    return () => document.removeEventListener('animationstart', align, true)
  }, [])
  return null
}
