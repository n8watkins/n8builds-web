'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MY_TOOLS_HASH, MY_TOOLS_TARGET } from '@/lib/movedAnchors'
import { useSectionTracking } from '@/hooks/useSectionTracking'
import { useScrollTracking } from '@/hooks/useScrollTracking'
import { useHydrated } from '@/hooks/useHydrated'
import { latestEntry } from '@/lib/intersection'

/**
 * The homepage's script that belongs to no one section: section and scroll
 * analytics, the ambient color glows behind the page, pausing the animations
 * of blocks off screen, and sending an old /#my-tools link on to /loadout.
 */
export default function HomeEffects() {
  useSectionTracking()
  useScrollTracking()
  const hydrated = useHydrated()
  const router = useRouter()

  // Every homepage band and Lab part (data-pause-offscreen) is marked
  // data-offscreen while it is out of view, and app/globals.css pauses the
  // animations inside it: the page runs a dozen looping animations (marquees,
  // the flask, shimmers, spinners), and restyling and repainting them every
  // frame where no one sees them was most of a phone's main thread after load
  // (2026-11-04). On screen they run as before.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      const byTarget = new Map<Element, IntersectionObserverEntry[]>()
      for (const entry of entries) byTarget.set(entry.target, [...(byTarget.get(entry.target) ?? []), entry])
      for (const [target, list] of byTarget) target.toggleAttribute('data-offscreen', !latestEntry(list).isIntersecting)
    })
    for (const el of document.querySelectorAll('[data-pause-offscreen]')) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // A client-side arrival at /#my-tools (the root layout's script handles a full load).
  useEffect(() => {
    if (window.location.hash === MY_TOOLS_HASH) router.replace(MY_TOOLS_TARGET)
  }, [router])

  // Ambient color shift - soft glows so the page isn't one flat color. They
  // sit at percentages of the page height, so they mount only after
  // hydration: while a slow device is still painting the streamed page, the
  // page grows and they would slide down (a layout shift).
  if (!hydrated) return null
  return (
    <div
      aria-hidden
      className="fade-in pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ animationDuration: '0.8s' }}
    >
      <div className="absolute left-[-10%] top-[6%] h-160 w-160 scale-[1.6] bg-radial from-cyan-500/10 to-transparent to-70%" />
      <div className="absolute right-[-12%] top-[26%] h-152 w-152 scale-[1.6] bg-radial from-blue-600/11 to-transparent to-70%" />
      <div className="absolute left-[12%] top-[46%] h-136 w-136 scale-[1.6] bg-radial from-teal-500/9 to-transparent to-70%" />
      <div className="absolute right-[-8%] top-[66%] h-136 w-136 scale-[1.6] bg-radial from-indigo-600/9 to-transparent to-70%" />
      <div className="absolute left-[8%] top-[86%] h-136 w-136 scale-[1.6] bg-radial from-emerald-500/[0.07] to-transparent to-70%" />
    </div>
  )
}
