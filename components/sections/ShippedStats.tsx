'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { BUILD_ICONS } from '@/lib/build-meta'
import type { ShippedStat } from '@/lib/log-stats'

// The figures beside the homepage's "Shipped this month" rows, one at a time.
// Every figure is in the server HTML, stacked in one spot with the first one
// showing, so the card is complete before any JavaScript runs. It moves on
// every few seconds while in view, pauses while hovered or focused (WCAG
// 2.2.2) and holds the first figure under reduced motion; the dots pick one.
// Screen readers hear a figure only when someone picks it, never on the timer.

const EVERY_MS = 4000

export default function ShippedStats({ stats, period }: { stats: ShippedStat[]; period: string }) {
  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)
  const [inView, setInView] = useState(false)
  const [announce, setAnnounce] = useState('')
  const reduceMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (reduceMotion || held || !inView || stats.length < 2) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % stats.length), EVERY_MS)
    return () => clearTimeout(id)
  }, [reduceMotion, held, inView, index, stats.length])

  const pick = (i: number) => {
    setIndex(i)
    setAnnounce(`${stats[i].value} ${stats[i].label}`)
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="carousel"
      aria-label={`Shipped ${period}`}
      className="flex flex-col gap-3 md:gap-4"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <p className="text-2xl font-bold tracking-tight text-cyan-300">{period}</p>

      {/* Every figure in one grid cell; only the current one shows. Clicking
          it moves on to the next figure, like the dots below. */}
      <button
        type="button"
        onClick={() => pick((index + 1) % stats.length)}
        disabled={stats.length < 2}
        title={stats.length > 1 ? 'Next figure' : undefined}
        className="group -m-2 grid min-h-[4.75rem] items-center rounded-xl p-2 text-left transition-colors enabled:cursor-pointer enabled:hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-cyan-400 md:min-h-[5.5rem]"
      >
        {stats.map((stat, i) => {
          const current = i === index
          const icon = stat.build ? BUILD_ICONS[stat.build] : undefined
          return (
            <span
              key={stat.id}
              data-stat={stat.id}
              aria-roledescription="slide"
              aria-hidden={!current}
              className={`col-start-1 row-start-1 block transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
                current ? 'opacity-100' : 'pointer-events-none translate-y-1.5 opacity-0'
              }`}
            >
              <span className="flex items-center gap-2.5">
                {icon && (
                  <Image src={icon} alt="" width={28} height={28} unoptimized={icon.endsWith('.svg')} className="h-7 w-7 shrink-0 rounded-md" />
                )}
                <span className={`font-bold tracking-tight text-slate-50 ${stat.id === 'busiest' ? 'text-2xl' : 'text-4xl tabular-nums'}`}>
                  {stat.value}
                </span>
              </span>
              <span className="mt-1 block text-sm text-[#9cadc5] transition-colors group-enabled:group-hover:text-cyan-200">{stat.label}</span>
            </span>
          )
        })}
      </button>

      {stats.length > 1 && (
        <div className="flex items-center gap-1">
          {stats.map((stat, i) => (
            <button
              key={stat.id}
              type="button"
              aria-label={`Show ${stat.value} ${stat.label}`}
              aria-current={i === index}
              onClick={() => pick(i)}
              // A 24px target (WCAG 2.5.8) around a small bar.
              className="group flex h-6 items-center rounded-full px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              <span
                className={`block h-1 rounded-full transition-all duration-300 ${
                  i === index ? 'w-5 bg-cyan-300' : 'w-2 bg-white/20 group-hover:bg-white/40'
                }`}
              />
            </button>
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
