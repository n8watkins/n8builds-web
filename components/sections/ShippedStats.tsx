'use client'
import Image from 'next/image'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { BUILD_ICONS } from '@/lib/build-meta'
import type { DayCount, ShippedStat } from '@/lib/log-stats'
import { latestEntry } from '@/lib/intersection'

// The card beside the homepage build log's rows (livelier since the
// owner's ask, 2026-11-02): the month, its changes as a big number that counts
// up the first time the card comes into view, a bar per day of the month (the
// days still to come as faint slots), then the month's other figures (the
// busiest build with its icon, the streak, releases, builds touched, active
// days) one at a time.
//
// Everything is in the server HTML with its final values, so the card is
// complete before any JavaScript runs. The count-up and the bars' rise play
// only when the card was still off screen once hydrated (so nothing on screen
// ever blinks back to zero), and never under reduced motion. The figures move
// on every few seconds while in view, pause while hovered or focused (WCAG
// 2.2.2) and hold the first figure under reduced motion; the dots pick one.
// Screen readers hear a figure only when someone picks it, never on the timer.

// Slower since round 3 of 2026-11-08 (was 4s a figure and a 1.1s count).
const EVERY_MS = 7000
const COUNT_MS = 1600

/** The other figures, the most telling first: the headline number is `changes`. */
const ORDER: ShippedStat['id'][] = ['busiest', 'streak', 'releases', 'builds', 'days']

const shortDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export default function ShippedStats({
  stats,
  days,
  period,
  header,
}: {
  stats: ShippedStat[]
  days: DayCount[]
  period: string
  /** Shown at the top in place of the period's name (the month switcher, BuildLogMonths.tsx). */
  header?: ReactNode
}) {
  const headline = stats.find((s) => s.id === 'changes')
  const facts = ORDER.map((id) => stats.find((s) => s.id === id)).filter((s): s is ShippedStat => !!s)
  const total = Number(headline?.value ?? 0)

  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)
  const [inView, setInView] = useState(false)
  const [announce, setAnnounce] = useState('')
  // 'idle': as rendered on the server. 'armed': off screen when hydrated, so
  // the number and bars wait at zero. 'played': they have risen into place.
  const [entrance, setEntrance] = useState<'idle' | 'armed' | 'played'>('idle')
  const [shown, setShown] = useState(total)
  const reduceMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let first = true
    const observer = new IntersectionObserver((entries) => {
      const entry = latestEntry(entries)
      setInView(entry.isIntersecting)
      if (first) {
        first = false
        // Off screen on arrival, with motion allowed: the entrance waits for the first view.
        const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (!entry.isIntersecting && motion && total > 0) {
          setEntrance('armed')
          setShown(0)
        }
        return
      }
      if (entry.isIntersecting) setEntrance((e) => (e === 'armed' ? 'played' : e))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [total])

  // The count-up: eased out, so it settles on the final number.
  useEffect(() => {
    if (entrance !== 'played') return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS)
      setShown(Math.round(total * (1 - (1 - t) ** 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [entrance, total])

  // Turning on reduced motion mid-way shows the final number at once.
  useEffect(() => {
    // Syncing with a setting that changed outside React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (reduceMotion) setShown(total)
  }, [reduceMotion, total])

  useEffect(() => {
    if (reduceMotion || held || !inView || facts.length < 2) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % facts.length), EVERY_MS)
    return () => clearTimeout(id)
  }, [reduceMotion, held, inView, index, facts.length])

  const pick = (i: number) => {
    setIndex(i)
    setAnnounce(`${facts[i].value} ${facts[i].label}`)
  }

  const peak = Math.max(1, ...days.map((d) => d.count))
  const past = days.filter((d) => !d.future)
  const active = past.filter((d) => d.count > 0).length
  const busiestDay = past.reduce<DayCount | undefined>((best, d) => (d.count > (best?.count ?? 0) ? d : best), undefined)
  const barsLabel = busiestDay
    ? `Changes per day: something shipped on ${active} of ${past.length} days so far, the most on ${shortDay(busiestDay.day)} (${busiestDay.count}).`
    : 'Changes per day: nothing shipped yet.'
  const risen = entrance !== 'armed'

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="carousel"
      aria-label={`Shipped ${period}`}
      // Marks that the on-screen watcher (hydrated) sees the card, so tests can
      // wait for it instead of guessing how long a loaded machine takes to hydrate.
      data-in-view={inView ? '' : undefined}
      data-entrance={entrance}
      className="flex h-full flex-col"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      {header ?? <p className="text-2xl font-bold tracking-tight text-cyan-300">{period}</p>}

      {headline && (
        <p className="mt-2 flex items-baseline gap-2" data-headline>
          {/* The final number for screen readers; the counting one is for the eye. */}
          <span className="sr-only">
            {headline.value} {headline.label}
          </span>
          <span aria-hidden="true" className="text-5xl font-bold tracking-tight text-slate-50 tabular-nums" data-count>
            {shown}
          </span>
          <span aria-hidden="true" className="text-sm text-[#9cadc5]">
            {headline.label}
          </span>
        </p>
      )}

      {/* A bar per day: height by what shipped, days to come as faint slots. */}
      {days.length > 0 && (
        <div className="mt-3">
          <div role="img" aria-label={barsLabel} className="flex h-10 items-end gap-[2px]" data-bars>
            {days.map((d, i) => (
              <span
                key={d.day}
                title={d.future ? undefined : `${shortDay(d.day)}: ${d.count} ${d.count === 1 ? 'change' : 'changes'}`}
                data-day={d.day}
                className={`min-w-0 flex-1 origin-bottom rounded-[2px] transition-transform duration-700 ease-out motion-reduce:transition-none ${
                  d.future ? 'bg-white/[0.05]' : d.count > 0 ? 'bg-linear-to-t from-emerald-400/70 to-cyan-300' : 'bg-white/10'
                }`}
                style={{
                  height: d.count > 0 ? `${Math.max(18, (d.count / peak) * 100)}%` : '3px',
                  transform: risen ? 'scaleY(1)' : 'scaleY(0)',
                  transitionDelay: entrance === 'played' ? `${i * 18}ms` : '0ms',
                }}
              />
            ))}
          </div>
          <div aria-hidden="true" className="mt-1 flex justify-between font-mono text-[0.65rem] uppercase tracking-wider text-slate-450">
            <span>{shortDay(days[0].day)}</span>
            <span>{shortDay(days[days.length - 1].day)}</span>
          </div>
        </div>
      )}

      {/* The other figures, centred in the space below, one at a time. */}
      {facts.length > 0 && (
        <div className="mt-3 flex flex-1 flex-col justify-end gap-1.5 border-t border-white/8 pt-3">
          {/* Every figure in one grid cell; only the current one shows. Clicking
              it moves on to the next figure, like the dots below. */}
          <button
            type="button"
            onClick={() => pick((index + 1) % facts.length)}
            disabled={facts.length < 2}
            title={facts.length > 1 ? 'Next figure' : undefined}
            className="group -mx-2 grid min-h-[3.25rem] items-center rounded-xl px-2 py-1 text-left transition-colors enabled:cursor-pointer enabled:hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            {facts.map((stat, i) => {
              const current = i === index
              const icon = stat.build ? BUILD_ICONS[stat.build] : undefined
              return (
                <span
                  key={stat.id}
                  data-stat={stat.id}
                  aria-roledescription="slide"
                  aria-hidden={!current}
                  className={`col-start-1 row-start-1 flex items-center gap-2.5 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
                    current ? 'opacity-100' : 'pointer-events-none translate-y-1.5 opacity-0'
                  }`}
                >
                  {icon ? (
                    <Image src={icon} alt="" width={28} height={28} unoptimized={icon.endsWith('.svg')} className="h-7 w-7 shrink-0 rounded-md" />
                  ) : (
                    <span className="min-w-7 shrink-0 text-center text-2xl font-bold tracking-tight text-slate-50 tabular-nums">{stat.value}</span>
                  )}
                  <span className="min-w-0">
                    {icon && <span className="block truncate text-base font-bold leading-tight text-slate-50">{stat.value}</span>}
                    <span className="block text-sm leading-snug text-[#9cadc5] transition-colors group-enabled:group-hover:text-cyan-200">
                      {stat.label}
                    </span>
                  </span>
                </span>
              )
            })}
          </button>

          {facts.length > 1 && (
            <div className="flex items-center gap-1">
              {facts.map((stat, i) => (
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
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
