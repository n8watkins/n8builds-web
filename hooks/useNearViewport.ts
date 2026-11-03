import { useEffect, useRef, useState } from 'react'
import { latestEntry } from '@/lib/intersection'

/**
 * True once the element comes within `rootMargin` of the screen or something
 * inside it takes focus, and from then on. For work that only matters near the
 * element, such as a form's Turnstile widget: three forms on the homepage each
 * loading Cloudflare's challenge iframe at page load slowed its first paint on
 * phones (2026-11-02). Every browser the site supports has IntersectionObserver.
 */
export function useNearViewport<T extends Element>(rootMargin = '600px') {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = latestEntry(entries)
        if (entry.isIntersecting) setNear(true)
      },
      { rootMargin }
    )
    observer.observe(el)
    // Focus inside it counts too (a jump to the form's field, say).
    const wake = () => setNear(true)
    el.addEventListener('focusin', wake)
    return () => {
      observer.disconnect()
      el.removeEventListener('focusin', wake)
    }
  }, [near, rootMargin])

  return [ref, near] as const
}
