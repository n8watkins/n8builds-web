'use client'
import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

// Same rhythm as the dev portfolio's portrait: each version holds 3s, then
// they cross-fade over 0.8s.
const HOLD_MS = 3000
const SRCSET = '/hero/portrait-watercolor-400.webp 400w, /hero/portrait-watercolor-800.webp 800w'

/**
 * The hero portrait's second look, borrowed from the dev portfolio: a
 * watercolor version that fades in and out over the photo.
 *
 * The photo (next/image, priority) stays the first paint and the LCP element;
 * this island renders nothing in the server HTML. Once the page has loaded and
 * the browser is idle it fetches and decodes the watercolor, then mounts it
 * transparent over the photo and starts the cross-fade: a CSS opacity
 * transition, no motion library. It holds still while the hero is off screen
 * (HeroChainMeter sets data-offscreen) or the tab is hidden, and never starts
 * under reduced motion. Decorative: the photo carries the alt text.
 */
export default function HeroPortraitSwap({ sizes }: { sizes: string }) {
  const reduceMotion = usePrefersReducedMotion()
  const [ready, setReady] = useState(false)
  const [shown, setShown] = useState(false)
  const ref = useRef<HTMLImageElement>(null)

  // Load once the page is done and the browser is idle.
  useEffect(() => {
    if (reduceMotion) return
    let cancelled = false
    let idle: number | undefined
    const load = () => {
      const img = new Image()
      img.sizes = sizes
      img.srcset = SRCSET
      img
        .decode()
        .then(() => !cancelled && setReady(true))
        .catch(() => {}) // a failed fetch just leaves the photo
    }
    const whenIdle = () => {
      idle =
        typeof requestIdleCallback === 'function'
          ? requestIdleCallback(load, { timeout: 3000 })
          : window.setTimeout(load, 1000)
    }
    if (document.readyState === 'complete') whenIdle()
    else window.addEventListener('load', whenIdle, { once: true })
    return () => {
      cancelled = true
      window.removeEventListener('load', whenIdle)
      if (idle !== undefined) {
        if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idle)
        else clearTimeout(idle)
      }
    }
  }, [reduceMotion, sizes])

  // The cross-fade: flip every HOLD_MS while the hero is on screen.
  useEffect(() => {
    if (!ready || reduceMotion) return
    const hero = ref.current?.closest<HTMLElement>('#home')
    const id = window.setInterval(() => {
      if (document.hidden || hero?.hasAttribute('data-offscreen')) return
      setShown((s) => !s)
    }, HOLD_MS)
    return () => clearInterval(id)
  }, [ready, reduceMotion])

  if (!ready || reduceMotion) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element -- already decoded above; next/image would refetch it
    <img
      ref={ref}
      data-portrait-swap=""
      srcSet={SRCSET}
      sizes={sizes}
      alt=""
      aria-hidden="true"
      decoding="async"
      className="absolute inset-0 h-full w-full rounded-full object-cover transition-opacity duration-800 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
      style={{ opacity: shown ? 1 : 0 }}
    />
  )
}
