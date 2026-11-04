'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { IconType } from 'react-icons'
import { LuFan, LuHouse, LuTrees, LuWaves } from 'react-icons/lu'
import type { NowShot } from '@/data/now'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { latestEntry } from '@/lib/intersection'

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

/** How long each template shows; the timer line under the window fills over it. */
export const TEMPLATE_EVERY_MS = 5000

/**
 * The Tech for Pros ad's picture (round 3 of 2026-11-02): its trade templates
 * in a browser window, sliding side to side without end, a full-length page
 * scrolling on a phone in front of it, and "Pick a template, or we'll build
 * one for your business." under it (round 5 of 2026-11-02). A thin line along the window's bottom fills up until the next template:
 * the slide moves on when that line's CSS animation ends, so pausing the line
 * pauses the carousel exactly where it is. It runs only while on screen and
 * the tab is shown, and holds while hovered or focused (WCAG 2.2.2); under
 * reduced motion it never moves by itself and the line is hidden. Small icons
 * in the window's title bar jump to a template. Every slide is in the server
 * HTML, the first showing with its image; the other images and the phone's
 * page load once the carousel is near the screen. The frames keep their
 * images' aspect ratios, so nothing shifts.
 */
export default function TemplateCarousel({ slides, phone }: { slides: TemplateSlide[]; phone: NowShot }) {
  const [index, setIndex] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  // Whether the carousel has come near the screen. The other three templates
  // and the phone's full-length page (about 75 KB and 250 KB) load from then
  // on, not with the page: on a phone they were fetched before the hero had
  // painted, on a slow connection right behind it.
  const [near, setNear] = useState(false)
  const [tabShown, setTabShown] = useState(true)
  const [announce, setAnnounce] = useState('')
  const reduceMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const count = slides.length
  const autoplay = !reduceMotion && count > 1
  const playing = autoplay && onScreen && tabShown && !hovered && !focused

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => setOnScreen(latestEntry(entries).isIntersecting))
    observer.observe(el)
    const nearObserver = new IntersectionObserver(
      (entries) => {
        if (!latestEntry(entries).isIntersecting) return
        setNear(true)
        nearObserver.disconnect()
      },
      { rootMargin: '400px' }
    )
    nearObserver.observe(el)
    const onVisibility = () => setTabShown(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    // Watching from here on (tests wait for this).
    el.dataset.watching = ''
    return () => {
      observer.disconnect()
      nearObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const show = (next: number) => {
    if (next === index) return
    setPrev(index)
    setIndex(next)
  }

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
      className="relative mx-auto w-full max-w-[38rem] pb-[7%] pl-[13%] lg:max-w-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
    >
      <div aria-hidden className="pointer-events-none absolute -inset-[10%] bg-[radial-gradient(closest-side,rgba(34,211,238,0.13),transparent)]" />

      {/* Browser window */}
      <div className="relative overflow-hidden rounded-xl border border-white/12 bg-[#0b1424] shadow-2xl shadow-black/50 ring-1 ring-black/40">
        <div className="flex h-8 items-center gap-1.5 border-b border-white/8 bg-[#0e192c] pr-1 pl-3">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-white/15" />
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-white/15" />
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-white/15" />
          <span
            className="ml-2 hidden min-w-0 truncate rounded-md bg-white/6 px-2 py-0.5 text-[0.62rem] font-medium text-slate-400 min-[360px]:block"
          >
            {/* The short name on phones, where the full label would be cut off. */}
            <span className="sm:hidden">{slides[index].name}</span>
            <span className="hidden sm:inline" data-template-label>
              {slides[index].label}
            </span>
          </span>
          {/* The picker: one small icon per template, at the title bar's right. */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            {slides.map((slide, i) => {
              const Icon = ICONS[slide.kind]
              const current = i === index
              return (
                <button
                  key={slide.src}
                  type="button"
                  aria-label={`Show the ${slide.label}`}
                  aria-current={current}
                  title={slide.name}
                  onClick={() => pick(i)}
                  className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-300 ${
                    current ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-450 hover:bg-white/8 hover:text-slate-200'
                  }`}
                >
                  <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              )
            })}
          </div>
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
                className={`absolute inset-0 transition-[translate] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${
                  current ? 'translate-x-0' : leaving ? '-translate-x-full' : 'translate-x-full'
                } ${current || leaving ? '' : 'invisible'} ${current ? '' : 'pointer-events-none'}`}
              >
                {(i === 0 || near) && (
                  <Image
                    src={slide.src}
                    alt={`${slide.label}: an example Tech for Pros site`}
                    width={slide.width}
                    height={slide.height}
                    sizes="(min-width: 1280px) 560px, (min-width: 1024px) 46vw, (min-width: 640px) 520px, 85vw"
                    className="block h-auto w-full"
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* The timer: fills over TEMPLATE_EVERY_MS, then the next template
            slides in. Keyed by the slide, so it starts over with each one. */}
        {autoplay && (
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/8" data-template-timer>
            <div
              key={index}
              className="template-timer h-full origin-left bg-linear-to-r from-cyan-400 to-blue-500"
              style={{ animationDuration: `${TEMPLATE_EVERY_MS}ms`, animationPlayState: playing ? 'running' : 'paused' }}
              onAnimationEnd={() => show((index + 1) % count)}
            />
          </div>
        )}
      </div>

      {/* Phone: a full-length page scrolling slowly inside the frame (down,
          a pause, back up). CSS only (now-phone-scroll in app/globals.css);
          it pauses while the card is off screen (NowCarousel) and holds
          still under reduced motion. */}
      <div aria-hidden className="absolute bottom-0 left-0 w-[21%] rotate-[-4deg]">
        <div className="overflow-hidden rounded-[1.1rem] border-[5px] border-[#0b1220] bg-[#0b1220] shadow-2xl shadow-black/60 ring-1 ring-white/12">
          <div
            className="relative overflow-hidden rounded-[0.7rem] [transform:translateZ(0)]"
            style={{ aspectRatio: `${phone.width} / ${phone.frameHeight ?? phone.height}` }}
          >
            {near && (
              <Image
                src={phone.src}
                alt=""
                width={phone.width}
                height={phone.height}
                sizes="(min-width: 640px) 140px, 24vw"
                // As is: the file is already a 280px WebP, and Cloudflare's
                // optimizer can't make an AVIF this tall, so for browsers that
                // take AVIF it sent a 250 KB JPEG instead (2026-11-04).
                unoptimized={phone.frameHeight !== undefined}
                className={`block h-auto w-full ${phone.frameHeight ? 'now-phone-scroll' : ''}`}
                style={
                  phone.frameHeight
                    ? { ['--travel' as string]: `${(-(1 - phone.frameHeight / phone.height) * 100).toFixed(3)}%` }
                    : undefined
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Beside the phone's foot from 640px; under it on phones, where the line
          wraps and would run over the phone. */}
      <p className="relative mt-3 -mb-[7%] pl-[25%] text-right text-[0.7rem] font-medium text-slate-450 sm:absolute sm:right-0 sm:bottom-0 sm:mt-0 sm:mb-0 sm:translate-y-1/2 sm:pl-0 sm:text-xs">
        Pick a template, or we&apos;ll build one for your business.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
