'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { IconType } from 'react-icons'
import { LuFan, LuHouse, LuTrees, LuWaves } from 'react-icons/lu'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

export type TemplateSlide = {
  src: string
  width: number
  height: number
  /** The picker's short name, e.g. "Pool". */
  name: string
  /** The browser frame's label, e.g. "Pool service template". */
  label: string
  /** Which picker icon it gets (icons can't cross from the server as props). */
  kind: TemplateKind
}

export type TemplateKind = 'pool' | 'hvac' | 'landscaping' | 'roofing'

const ICONS: Record<TemplateKind, IconType> = { pool: LuWaves, hvac: LuFan, landscaping: LuTrees, roofing: LuHouse }

const EVERY_MS = 4500

/**
 * The Tech for Pros ad's picture (owner, 2026-11-02): its trade templates in
 * a browser window, one after another without end; the current page slides
 * out to the left as the next comes in from the right. Small named icons under
 * it jump to a template. It moves on only while on screen and the tab is
 * shown, pauses while hovered or focused (WCAG 2.2.2), and under reduced
 * motion never moves by itself (the picker swaps at once). Every slide is in
 * the server HTML, the first showing; the frame keeps the images' aspect
 * ratio, so nothing shifts.
 */
export default function TemplateCarousel({ slides }: { slides: TemplateSlide[] }) {
  const [index, setIndex] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [tabShown, setTabShown] = useState(true)
  const [announce, setAnnounce] = useState('')
  const reduceMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const count = slides.length
  const playing = !reduceMotion && count > 1 && onScreen && tabShown && !hovered && !focused

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    observer.observe(el)
    const onVisibility = () => setTabShown(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    // Watching from here on (tests wait for this).
    el.dataset.watching = ''
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const show = (next: number) => {
    if (next === index) return
    setPrev(index)
    setIndex(next)
  }

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      setPrev(index)
      setIndex((index + 1) % count)
    }, EVERY_MS)
    return () => clearTimeout(t)
  }, [playing, index, count])

  const pick = (i: number) => {
    show(i)
    setAnnounce(slides[i].label)
  }

  const first = slides[0]

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="carousel"
      aria-label="Tech for Pros templates"
      data-playing={playing ? '' : undefined}
      className="relative mx-auto w-full max-w-[34rem] lg:max-w-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
    >
      <div aria-hidden className="pointer-events-none absolute -inset-[10%] bg-[radial-gradient(closest-side,rgba(34,211,238,0.12),transparent)]" />
      {/* Browser window */}
      <div className="relative overflow-hidden rounded-xl border border-white/12 bg-[#0b1424] shadow-2xl shadow-black/50 ring-1 ring-black/40">
        <div className="flex h-7 items-center gap-1.5 border-b border-white/8 bg-[#0e192c] px-3">
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="ml-2 truncate rounded-md bg-white/6 px-2 py-0.5 text-[0.62rem] font-medium text-slate-400" data-template-label>
            {slides[index].label}
          </span>
        </div>
        <div className="relative overflow-hidden" style={{ aspectRatio: `${first.width} / ${first.height}` }}>
          {slides.map((slide, i) => {
            const current = i === index
            const leaving = i === prev && !current
            return (
              <div
                key={slide.src}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}: ${slide.label}`}
                aria-hidden={!current}
                data-slide={slide.name}
                className={`absolute inset-0 transition-[translate,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  current ? 'translate-x-0 opacity-100' : leaving ? '-translate-x-[12%] opacity-0' : 'translate-x-[12%] opacity-0'
                } ${current ? '' : 'pointer-events-none'}`}
              >
                <Image
                  src={slide.src}
                  alt={`${slide.label}: an example Tech for Pros site`}
                  width={slide.width}
                  height={slide.height}
                  sizes="(min-width: 1280px) 520px, (min-width: 1024px) 42vw, (min-width: 640px) 544px, 90vw"
                  className="block h-auto w-full"
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* The picker: one small named icon per template (the name from 640px). */}
      <div className="relative mt-3 flex flex-wrap justify-center gap-1.5">
        {slides.map((slide, i) => {
          const Icon = ICONS[slide.kind]
          const current = i === index
          return (
            <button
              key={slide.src}
              type="button"
              aria-label={`Show the ${slide.label}`}
              aria-current={current}
              onClick={() => pick(i)}
              className={`inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold sm:px-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
                current
                  ? 'border-cyan-300/50 bg-cyan-400/12 text-cyan-100'
                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              {/* On phones the icons alone fit one row; the frame's label names the one showing. */}
              <span className="hidden sm:inline">{slide.name}</span>
            </button>
          )
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
