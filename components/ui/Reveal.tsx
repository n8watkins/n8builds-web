'use client'
import { useEffect, useRef, type CSSProperties } from 'react'

/**
 * Fades its content up as it scrolls into view (once). Use it for sections
 * and blocks below the fold, never for the hero or anything above the fold.
 *
 * The fade is a CSS transition (`.reveal` in app/globals.css) started by an
 * IntersectionObserver, not motion: Reveal wraps most of the site, and this
 * way no page loads the animation library for it. It rises 24px over 0.55s on
 * the hero's easing, once the block is 80px inside the viewport. Reduced
 * motion shows it at once.
 */
/** Whether the browser gets the Safari-only scroll-anchoring rule for rising blocks (app/globals.css). */
const SKIPS_RISING_ANCHORS = typeof CSS !== 'undefined' && CSS.supports('hanging-punctuation', 'first')

export default function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  id,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section'
  id?: string
}) {
  const ref = useRef<HTMLElement>(null)

  // Sets data-revealed on the element directly: nothing else changes, so
  // there's no need for a React render.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // In Safari, settled once the rise (0.55s, after its delay) is over: from
    // then on it may be the scroll anchor again. The same feature test as the
    // rule in app/globals.css, so other browsers run nothing extra.
    let settle: ReturnType<typeof setTimeout> | undefined
    const reveal = () => {
      el.setAttribute('data-revealed', '')
      if (SKIPS_RISING_ANCHORS) settle = setTimeout(() => el.setAttribute('data-settled', ''), (delay + 0.6) * 1000)
    }
    if (typeof IntersectionObserver === 'undefined') {
      reveal()
      return () => clearTimeout(settle)
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        reveal()
        observer.disconnect()
      },
      { rootMargin: '-80px' }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(settle)
    }
  }, [delay])

  const style: CSSProperties | undefined = delay ? { transitionDelay: `${delay}s` } : undefined
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} id={id} className={`reveal ${className ?? ''}`.trim()} style={style}>
      {children}
    </Tag>
  )
}
