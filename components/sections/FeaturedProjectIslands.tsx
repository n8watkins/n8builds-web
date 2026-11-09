'use client'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { FiChevronLeft, FiChevronRight, FiPause, FiPlay } from 'react-icons/fi'
import { useHydrated } from '@/hooks/useHydrated'
import { usePageVisible } from '@/hooks/usePageVisible'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { latestEntry } from '@/lib/intersection'

/**
 * The interactive parts of a Lab row (components/sections/FeaturedProjects.tsx),
 * which is otherwise rendered on the server.
 */

export interface GalleryImage {
  src: string
  alt: string
}

/** How far a finger must travel sideways to count as a swipe, in pixels. */
const SWIPE = 40

/**
 * The row's screenshots, one at a time. Click (or tap) the left or right half
 * to step back or forward: an arrow shows on that side on hover or keyboard
 * focus. The arrow keys work once a side has focus, and a swipe works on touch.
 * Dots at the bottom show where you are. Only the first image loads up front;
 * the rest load once the visitor shows interest (hover, focus or touch), so
 * the homepage downloads no extra screenshots for rows nobody browses.
 */
export function ProjectGallery({
  title,
  images,
  imageClassName,
}: {
  title: string
  images: GalleryImage[]
  imageClassName: string
}) {
  const [active, setActive] = useState(0)
  const [warm, setWarm] = useState(false)
  const touchX = useRef<number | null>(null)
  const swiped = useRef(false)
  const hydrated = useHydrated()
  const count = images.length
  const many = count > 1
  const go = (step: number) => {
    setWarm(true)
    setActive((i) => (i + step + count) % count)
  }
  const warmUp = () => setWarm(true)
  return (
    <div
        data-gallery
        role={many ? 'group' : undefined}
        aria-roledescription={many ? 'carousel' : undefined}
        aria-label={many ? `${title} screenshots` : undefined}
        onPointerEnter={many ? warmUp : undefined}
        onFocus={many ? warmUp : undefined}
        onKeyDown={
          many
            ? (e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  go(e.key === 'ArrowLeft' ? -1 : 1)
                }
              }
            : undefined
        }
        onTouchStart={
          many
            ? (e) => {
                warmUp()
                touchX.current = e.touches[0].clientX
                swiped.current = false
              }
            : undefined
        }
        onTouchEnd={
          many
            ? (e) => {
                if (touchX.current === null) return
                const dx = e.changedTouches[0].clientX - touchX.current
                touchX.current = null
                if (Math.abs(dx) >= SWIPE) {
                  swiped.current = true
                  go(dx < 0 ? 1 : -1)
                }
              }
            : undefined
        }
        className="w-full shrink-0 touch-pan-y md:w-1/2"
      >
      <div className="group relative aspect-16/10 overflow-hidden rounded-2xl border border-white/8 bg-[#07101d]">
        {images.map((image, i) =>
          i === 0 || warm || i === active ? (
            <Image
              key={image.src}
              src={image.src}
              alt={i === active ? image.alt : ''}
              aria-hidden={i === active ? undefined : true}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={`${imageClassName} transition-opacity duration-300 motion-reduce:transition-none ${i === active ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : null,
        )}
        {/* Subtle overlay */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-darkBlue/40 to-transparent" />

        {many && (
          <>
            {(['prev', 'next'] as const).map((side) => (
              <button
                key={side}
                type="button"
                // Server-rendered: disabled until its handler exists, so an early click isn't lost.
                disabled={!hydrated}
                onClick={() => {
                  // A swipe that ends over a half must not also step.
                  if (swiped.current) {
                    swiped.current = false
                    return
                  }
                  go(side === 'prev' ? -1 : 1)
                }}
                aria-label={`${side === 'prev' ? 'Previous' : 'Next'} ${title} screenshot`}
                className={`group/side absolute inset-y-0 ${side === 'prev' ? 'left-0 justify-start' : 'right-0 justify-end'} flex w-1/2 cursor-pointer items-center px-3 focus-visible:outline-none disabled:cursor-default`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#07101d]/75 text-slate-100 opacity-0 shadow-lg shadow-black/40 backdrop-blur-sm transition-opacity duration-150 group-hover/side:opacity-100 group-focus-visible/side:opacity-100 group-focus-visible/side:ring-2 group-focus-visible/side:ring-cyan-300 motion-reduce:transition-none"
                >
                  {side === 'prev' ? <FiChevronLeft className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}
                </span>
              </button>
            ))}
          </>
        )}
      </div>
      {many && (
        <>
          {/* Where you are: small dots just under the image, clear of its content; for sight only, the live region says it aloud. */}
          <div aria-hidden="true" className="mt-2 flex justify-center gap-1.5">
            {images.map((image, i) => (
              <span
                key={image.src}
                data-dot
                data-active={i === active ? '' : undefined}
                className={`h-1 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none ${
                  i === active ? 'w-4 bg-cyan-300/70' : 'w-1 bg-white/25'
                }`}
              />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            {`Screenshot ${active + 1} of ${count}`}
          </p>
        </>
      )}
    </div>
  )
}

/**
 * Clips that take turns (owner, round 9 of 2026-11-09: Featured's OpenPing and
 * Solara side by side, "only one video plays at a time"; two moving clips at
 * once is too much): the one hovered or focused plays, else the one last
 * picked with its play button, else the first. The others rest on their
 * poster with a play button. `ClipTurns` holds whose turn it is; each
 * `ClipSlot` is one card, and the ProjectTour inside it plays only on its turn.
 */
type Turns = { active: number; enter: (slot: number) => void; leave: (slot: number) => void; pick: (slot: number) => void }
const TurnsContext = createContext<Turns | null>(null)
const SlotContext = createContext<number | null>(null)

export function ClipTurns({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [picked, setPicked] = useState(0)
  const active = hovered ?? picked
  const turns: Turns = {
    active,
    enter: (slot) => setHovered(slot),
    leave: (slot) => setHovered((h) => (h === slot ? null : h)),
    pick: (slot) => {
      setPicked(slot)
      setHovered(null)
    },
  }
  return <TurnsContext.Provider value={turns}>{children}</TurnsContext.Provider>
}

/** Whether any pointer on this device can hover (a mouse, a trackpad): not a phone or a tablet. */
const canHover = () => typeof window !== 'undefined' && window.matchMedia('(any-hover: hover)').matches

/**
 * One card of a ClipTurns group: pointing at it or moving keyboard focus into
 * it gives its clip the turn; leaving gives it back.
 */
export function ClipSlot({ slot, className, children }: { slot: number; className?: string; children: React.ReactNode }) {
  const turns = useContext(TurnsContext)
  return (
    <SlotContext.Provider value={slot}>
      <div
        data-clip-slot={slot}
        data-clip-turn={turns?.active === slot ? '' : undefined}
        className={className}
        // A mouse on a device that can hover. A phone (no hover) never takes a turn
        // this way: WebKit sends it mouse enters and leaves under a resting finger
        // as the page scrolls, which handed the turn back to the other clip.
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse' && canHover()) turns?.enter(slot)
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse' && canHover()) turns?.leave(slot)
        }}
        onFocus={() => turns?.enter(slot)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) turns?.leave(slot)
        }}
      >
        {children}
      </div>
    </SlotContext.Provider>
  )
}

/** A silent, looping tour of an app's own screens (Scribe's), in place of screenshots. */
export interface ProjectTourVideo {
  /** VP9 WebM, first choice. */
  webm: string
  /** H.264 MP4, for browsers without WebM. */
  mp4: string
  /** The first frame, shown until the video plays, and as the only frame under reduced motion. */
  poster: string
  /** What the tour shows, for screen readers. */
  alt: string
  /**
   * One loop's length, in ms: a carousel holds the clip's tab this long, so the
   * whole clip is seen (the Lab's extensions, round 7 of 2026-11-09).
   */
  durationMs?: number
}

/**
 * The row's picture as a short video of the app itself, like a GIF: muted,
 * looping and inline, in the gallery's 16:10 frame (the video is 16:10 too,
 * so nothing is cropped and nothing jumps when it starts). It loads nothing
 * but its poster until it is on screen, plays only while it is (and the tab
 * is in front), and under prefers-reduced-motion stays on its poster, the
 * first frame, without loading the video. A button in its corner pauses and resumes it (WCAG 2.2.2:
 * motion that runs over five seconds can be stopped).
 */
export function ProjectTour({
  title,
  tour,
  className = 'w-full shrink-0 md:w-1/2',
  frameClassName = 'rounded-2xl border border-white/8',
  sizes = '(min-width: 1152px) 576px, (min-width: 768px) 50vw, 100vw',
  noun = 'tour',
  aspect = 'aspect-16/10',
}: {
  title: string
  tour: ProjectTourVideo
  /** The tour's own box: half the row by default. */
  className?: string
  /** The video's frame: rounded and bordered by default; none inside a browser window. */
  frameClassName?: string
  /** The poster's rendered width, for its image sizes (half the row by default). */
  sizes?: string
  /** What its pause button calls it: "Pause the Scribe tour", "Pause the OpenPing clip". */
  noun?: string
  /** The frame's shape, the video's own: 16:10 by default, a phone's for a phone take. */
  aspect?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(false)
  const [paused, setPaused] = useState(false)
  // Inside a carousel's hidden panel (an inert ancestor): paused, and from the start when shown again.
  const [hidden, setHidden] = useState(false)
  const reduced = usePrefersReducedMotion()
  const visible = usePageVisible()
  const hydrated = useHydrated()
  // In a ClipTurns group, it plays only on its turn; on its own, always its turn.
  const turns = useContext(TurnsContext)
  const slot = useContext(SlotContext)
  const myTurn = !turns || slot === null || turns.active === slot
  // The play button gives way to the pause button once its clip has the turn (focusing the
  // card is enough for that): focus moves to the pause button, so the keyboard keeps its place.
  const pauseButton = useRef<HTMLButtonElement>(null)
  const focusPause = useRef(false)
  useEffect(() => {
    if (myTurn && focusPause.current) {
      focusPause.current = false
      pauseButton.current?.focus({ preventScroll: true })
    }
  }, [myTurn])

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const observer = new IntersectionObserver((entries) => setInView(latestEntry(entries).isIntersecting), { threshold: 0.2 })
    observer.observe(video)
    // An inert panel (ExtensionsCarousel's hidden ones) still intersects: watch the attribute too.
    const panel = video.closest('[role="tabpanel"]')
    const watch = new MutationObserver(() => {
      const now = !!video.closest('[inert]')
      setHidden((was) => {
        if (was && !now) video.currentTime = 0
        return now
      })
    })
    if (panel) {
      watch.observe(panel, { attributes: true, attributeFilter: ['inert'] })
      setHidden(!!video.closest('[inert]'))
    }
    return () => {
      observer.disconnect()
      watch.disconnect()
    }
  }, [])

  const playing = inView && visible && !reduced && !paused && !hidden && myTurn
  // Waiting for its turn: back to its first frame, so it starts from the top when its turn comes.
  useEffect(() => {
    if (!myTurn && ref.current && ref.current.currentTime > 0) ref.current.currentTime = 0
  }, [myTurn])
  // The sources go in only once it first plays: with none, no browser fetches
  // anything (Safari ignores preload="none"), so an off-screen row or reduced
  // motion costs only the poster.
  const [started, setStarted] = useState(false)
  if (playing && !started) setStarted(true)
  const loaded = useRef(false)
  useEffect(() => {
    const video = ref.current
    if (!video || !started) return
    if (!loaded.current) {
      loaded.current = true
      video.load()
    }
    if (playing) {
      // React leaves `muted` off the server's HTML; the property is what counts.
      video.muted = true
      // A browser may still refuse (a data saver); the poster stays, which is fine.
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [playing, started])

  return (
    <div data-tour data-clip-ms={tour.durationMs} className={className}>
      <div className={`relative ${aspect} overflow-hidden bg-[#07101d] ${frameClassName}`}>
        {/* The poster is an image behind the video, not its poster attribute: that way
            it loads lazily, at the size it shows (a poster attribute is fetched with the
            page, which slowed the homepage's first paint on phones, 2026-11-02). The
            video draws nothing until it has a frame, so the image shows through. */}
        <Image src={tour.poster} alt="" fill sizes={sizes} className="object-cover" data-tour-poster />
        <video
          ref={ref}
          aria-label={tour.alt}
          // Muted, inline and looping, like a GIF; played from script, so
          // reduced motion and off-screen rows never start it.
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          disableRemotePlayback
          // Not a stop for the keyboard: it has no controls (its button pauses it), and
          // Firefox would otherwise make the video itself a tab stop.
          tabIndex={-1}
          // Off its turn the poster shows through, so a resting clip shows its poster frame.
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 motion-reduce:transition-none ${myTurn ? '' : 'opacity-0'}`}
        >
          {started && (
            <>
              <source src={tour.webm} type="video/webm" />
              <source src={tour.mp4} type="video/mp4" />
            </>
          )}
        </video>
        {/* Off its turn: a play button in the middle gives it the turn (a tap on a phone). */}
        {hydrated && !reduced && !myTurn && (
          <button
            type="button"
            onFocus={() => (focusPause.current = true)}
            onBlur={() => (focusPause.current = false)}
            // Picked as the finger or the mouse goes down, not on the click: pressing it
            // focuses it first, which hands its clip the turn and swaps this button for
            // the pause button, so the click that follows lands elsewhere and a tap
            // never kept the turn. The click still picks for Enter and Space.
            onPointerDown={() => turns?.pick(slot ?? 0)}
            onClick={() => turns?.pick(slot ?? 0)}
            aria-label={`Play the ${title} ${noun}`}
            data-clip-play
            className="group/play absolute inset-0 flex items-center justify-center bg-[#07101d]/15 transition-colors hover:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-300"
          >
            <span
              aria-hidden="true"
              className="flex size-14 items-center justify-center rounded-full border border-white/20 bg-[#07101d]/70 text-white shadow-xl shadow-black/40 backdrop-blur-sm transition-transform duration-200 group-hover/play:scale-110 motion-reduce:transition-none"
            >
              <FiPlay className="size-6 translate-x-0.5 fill-current" />
            </span>
          </button>
        )}
        {hydrated && !reduced && myTurn && (
          <button
            ref={pauseButton}
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={`${paused ? 'Play' : 'Pause'} the ${title} ${noun}`}
            aria-pressed={paused}
            className="absolute right-2.5 bottom-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#07101d]/75 text-slate-100 shadow-lg shadow-black/40 backdrop-blur-sm transition-colors hover:bg-[#07101d]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            {paused ? <FiPlay aria-hidden="true" className="h-3.5 w-3.5 translate-x-px" /> : <FiPause aria-hidden="true" className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}
