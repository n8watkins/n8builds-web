'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { IconType } from 'react-icons'
import { FiArrowUpRight } from 'react-icons/fi'
import { refHref } from '@/lib/referrals'
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
 * scrolling on a phone in front of it, and under the window's right side one
 * labelled chip per trade, then "Don't see yours? We'll build it." as a
 * link to Tech for Pros' templates (owner, 2026-11-08). A thin line along the window's bottom fills up until the next template:
 * the slide moves on when that line's CSS animation ends, so pausing the line
 * pauses the carousel exactly where it is. It runs only while on screen and
 * the tab is shown, and holds while hovered or focused (WCAG 2.2.2); under
 * reduced motion it never moves by itself and the line is hidden. The chips
 * jump to a template. Every slide is in the server
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
      className="relative mx-auto w-full max-w-[38rem] lg:mr-0 lg:max-w-[28rem]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
    >
      <div aria-hidden className="pointer-events-none absolute -inset-[10%] bg-[radial-gradient(closest-side,rgba(34,211,238,0.13),transparent)]" />

      {/* The window, with the phone in front of its foot. */}
      {/* A little smaller since round 4 of 2026-11-08 (13% inset, the phone 7% below it, before). */}
      <div className="relative pb-[3%] pl-[16%]">
        {/* Browser window */}
        <div className="relative overflow-hidden rounded-xl border border-white/12 bg-[#0b1424] shadow-2xl shadow-black/50 ring-1 ring-black/40">
          <div className="flex h-8 items-center gap-1.5 border-b border-white/8 bg-[#0e192c] pr-1 pl-3">
            {/* macOS traffic lights (round 4 of 2026-11-08). */}
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[#ff5f57]" />
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[#febc2e]" />
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[#28c840]" />
            <span
              className="ml-2 hidden min-w-0 truncate rounded-md bg-white/6 px-2 py-0.5 text-[0.62rem] font-medium text-slate-400 min-[360px]:block"
            >
              {/* The short name on phones, where the full label would be cut off. */}
              <span className="sm:hidden">{slides[index].name}</span>
              <span className="hidden sm:inline" data-template-label>
                {slides[index].label}
              </span>
            </span>
          </div>

          {/* From 1024px the window shows the top of each template a little wider than its
              shot (round 5 of 2026-11-08), so the picture is no taller than the copy beside it. */}
          <div
            className="relative overflow-hidden [aspect-ratio:var(--shot)] lg:[aspect-ratio:var(--shot-wide)]"
            style={{ ['--shot' as string]: `${first.width} / ${first.height}`, ['--shot-wide' as string]: `${first.width} / ${Math.round(first.height * 0.86)}` }}
          >
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
        <div aria-hidden className="absolute bottom-[6%] left-0 w-[20%] rotate-[-4deg]">
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
      </div>

      {/* The picker (owner, 2026-11-08): one labelled chip per trade, so each
          one is clear, then the caption, under the window: on its right from
          640px, two by two on phones, where one row doesn't fit. */}
      <div className="relative mt-3">
        <div className="mx-auto grid max-w-xs grid-cols-2 gap-1.5 sm:mx-0 sm:flex sm:max-w-none sm:flex-wrap sm:justify-end sm:gap-2 lg:gap-1">
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
                className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-300 sm:px-3 sm:text-[13px] lg:h-7 lg:gap-1 lg:px-2 lg:text-xs ${
                  current
                    ? 'border-cyan-300/45 bg-cyan-400/15 text-cyan-100'
                    : 'border-white/12 bg-white/4 text-slate-300 hover:border-white/20 hover:bg-white/8 hover:text-slate-100'
                }`}
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                {slide.name}
              </button>
            )
          })}
        </div>
        {/* A small ad of its own (owner, round 3 of 2026-11-08): Tech for Pros' templates,
            through the counted short link, in a new tab (round 4). */}
        <p className="mt-3 text-center sm:text-right">
          <a
            href={refHref('techforpros', 'hero', 'templates')}
            target="_blank"
            rel="noopener noreferrer"
            className="group/cta inline-flex items-center gap-1.5 rounded-md text-sm font-bold text-cyan-200 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:text-[15px]"
          >
            Don&apos;t see yours? We&apos;ll build it.
            <FiArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5 motion-reduce:transition-none" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  )
}
