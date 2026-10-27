'use client'

import { useEffect } from 'react'

/**
 * Runs the page's shimmers (.btn-shimmer, .lab-eyebrow) only while they're on
 * screen, each on its own random rhythm so no two sweep at once. Sets
 * data-seen while an element is in view, plus --shimmer-every (5 to 9s) and
 * --shimmer-delay (0 to 3s) once; app/globals.css does the rest.
 */
export default function ShimmerWhenSeen() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.btn-shimmer, .lab-eyebrow')
    els.forEach((el) => {
      el.style.setProperty('--shimmer-every', `${(5 + Math.random() * 4).toFixed(2)}s`)
      el.style.setProperty('--shimmer-delay', `${(Math.random() * 3).toFixed(2)}s`)
    })
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.target as HTMLElement).toggleAttribute('data-seen', e.isIntersecting)
      },
      { threshold: 0.6 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return null
}
