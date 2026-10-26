'use client'
import { useSectionTracking } from '@/hooks/useSectionTracking'
import { useScrollTracking } from '@/hooks/useScrollTracking'
import { useHydrated } from '@/hooks/useHydrated'

/**
 * The homepage's script that belongs to no one section: section and scroll
 * analytics, and the ambient color glows behind the page.
 */
export default function HomeEffects() {
  useSectionTracking()
  useScrollTracking()
  const hydrated = useHydrated()

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
