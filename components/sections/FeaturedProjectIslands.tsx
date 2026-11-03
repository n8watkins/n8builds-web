'use client'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { FiChevronLeft, FiChevronRight, FiLayers, FiPause, FiPlay, FiX } from 'react-icons/fi'
import { useHydrated } from '@/hooks/useHydrated'
import { usePageVisible } from '@/hooks/usePageVisible'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

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
 * The Details dialog uses it too, at its own width (`className`, `sizes`).
 */
export function ProjectGallery({
  title,
  images,
  imageClassName,
  className = 'w-full shrink-0 md:w-1/2',
  sizes = '(max-width: 768px) 100vw, 50vw',
}: {
  title: string
  images: GalleryImage[]
  imageClassName: string
  /** The gallery's own box: half the row by default. */
  className?: string
  /** The images' `sizes`, for that box. */
  sizes?: string
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
        className={`touch-pan-y ${className}`}
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
              sizes={sizes}
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
}: {
  title: string
  tour: ProjectTourVideo
  /** The tour's own box: half the row by default. */
  className?: string
  /** The video's frame: rounded and bordered by default; none inside a browser window. */
  frameClassName?: string
  /** The poster's rendered width, for its image sizes (half the row by default). */
  sizes?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(false)
  const [paused, setPaused] = useState(false)
  const reduced = usePrefersReducedMotion()
  const visible = usePageVisible()
  const hydrated = useHydrated()

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  const playing = inView && visible && !reduced && !paused
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
    <div data-tour className={className}>
      <div className={`relative aspect-16/10 overflow-hidden bg-[#07101d] ${frameClassName}`}>
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
          className="absolute inset-0 h-full w-full object-cover"
        >
          {started && (
            <>
              <source src={tour.webm} type="video/webm" />
              <source src={tour.mp4} type="video/mp4" />
            </>
          )}
        </video>
        {hydrated && !reduced && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={`${paused ? 'Play' : 'Pause'} the ${title} tour`}
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

/**
 * The Details button and its native <dialog>. The dialog's content (`header`,
 * beside the close button, and `children`) arrives rendered on the server.
 */
export function ProjectDetails({
  title,
  labelledBy,
  header,
  media,
  buttonClassName = '',
  children,
}: {
  /** The build's name, so each row's button has its own accessible name. */
  title: string
  /** Added to the Details button's classes (the Lab row's tightening). */
  buttonClassName?: string
  labelledBy: string
  header: React.ReactNode
  /** The project's picture, on the dialog's left from md up (hidden on phones, to keep it short). */
  media?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const hydrated = useHydrated()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  const close = () => setOpen(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        // Server-rendered: a click before hydration would be lost, so it stays
        // disabled until its handler exists (as Copy link and the contact form's Send).
        disabled={!hydrated}
        className={`flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl border border-white/12 bg-white/4 hover:bg-white/8 text-slate-300 font-semibold text-sm transition-colors duration-200 disabled:cursor-wait ${buttonClassName}`}>
        <FiLayers className="w-3.5 h-3.5" />
        Details<span className="sr-only"> about {title}</span>
      </button>
      <dialog
        ref={ref}
        aria-labelledby={labelledBy}
        onClose={close}
        // A click on the backdrop (the dialog element itself) closes it.
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
        className="m-auto w-[min(42rem,calc(100vw-2rem))] md:w-[min(66rem,calc(100vw-4rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1220] p-0 text-slate-200 shadow-2xl shadow-black/60 opacity-0 transition-[opacity,translate,display,overlay] duration-200 transition-discrete translate-y-2 open:translate-y-0 open:opacity-100 starting:open:translate-y-2 starting:open:opacity-0 backdrop:bg-black/70 backdrop:backdrop-blur-sm motion-reduce:transition-none"
      >
        <div className={media ? 'md:grid md:grid-cols-[minmax(0,10fr)_minmax(0,11fr)]' : undefined}>
          {media ? (
            <div className="hidden items-center border-r border-white/8 bg-[#07101d] p-6 md:flex lg:p-8">{media}</div>
          ) : null}
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-4">
            {header}
            <button
              type="button"
              onClick={close}
              aria-label="Close details"
              className="-mr-2 flex h-10 w-10 shrink-0 self-start items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-100"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
          {/* Always in the HTML, even closed: it holds the row's link to its
              build page, which crawlers follow from the homepage. */}
          {children}
        </div>
        </div>
      </dialog>
    </>
  )
}
