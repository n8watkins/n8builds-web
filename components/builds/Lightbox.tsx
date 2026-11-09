'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Image from 'next/image'
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiX } from 'react-icons/fi'
import { useHydrated } from '@/hooks/useHydrated'

/**
 * A build page's screenshots, each opening large in a lightbox (owner,
 * 2026-11-08): a native modal <dialog>, so focus stays inside it and Escape
 * closes it; the arrow keys, the side buttons and a swipe step between the
 * images; closing hands focus back to the screenshot that opened it.
 * `LightboxGallery` holds the dialog and the images; each `LightboxThumb`
 * inside it is a button that opens its image.
 */

export interface LightboxImage {
  src: string
  alt: string
}

const Open = createContext<((index: number, from: HTMLElement) => void) | null>(null)

/** How far a finger must travel sideways to count as a swipe, in pixels. */
const SWIPE = 40

export function LightboxGallery({
  images,
  title,
  children,
}: {
  images: LightboxImage[]
  title: string
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const touchX = useRef<number | null>(null)
  const [index, setIndex] = useState<number | null>(null)
  const count = images.length

  const open = useCallback((i: number, from: HTMLElement) => {
    opener.current = from
    setIndex(i)
  }, [])
  const close = () => setIndex(null)
  const step = (by: number) => setIndex((i) => (i === null ? i : (i + by + count) % count))

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (index !== null && !el.open) el.showModal()
    if (index === null && el.open) el.close()
  }, [index])

  const image = index === null ? null : images[index]
  return (
    <Open.Provider value={open}>
      {children}
      <dialog
        ref={dialog}
        aria-label={`${title} screenshots`}
        onClose={() => {
          setIndex(null)
          // Back to the screenshot that opened it.
          opener.current?.focus()
        }}
        onClick={(e) => {
          // A click on the backdrop (the dialog itself, outside the picture) closes it.
          if (e.target === e.currentTarget) close()
        }}
        onKeyDown={(e) => {
          if (count < 2) return
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            step(e.key === 'ArrowLeft' ? -1 : 1)
          }
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null || count < 2) return
          const dx = e.changedTouches[0].clientX - touchX.current
          touchX.current = null
          if (Math.abs(dx) >= SWIPE) step(dx < 0 ? 1 : -1)
        }}
        className="m-auto h-[100dvh] max-h-none w-screen max-w-none touch-pan-y bg-transparent p-0 text-slate-100 opacity-0 transition-[opacity,display,overlay] duration-200 transition-discrete open:opacity-100 starting:open:opacity-0 backdrop:bg-[#02050c]/90 backdrop:backdrop-blur-sm motion-reduce:transition-none"
      >
        {image && (
          <div className="pointer-events-none flex h-full flex-col items-center justify-center gap-3 px-3 py-14 sm:px-16">
            <figure className="pointer-events-auto relative h-full max-h-[min(80dvh,56rem)] w-full max-w-6xl">
              <Image
                key={image.src}
                src={image.src}
                alt={image.alt}
                fill
                sizes="100vw"
                className="lightbox-in object-contain"
              />
            </figure>
            <p className="pointer-events-auto max-w-3xl text-center text-sm text-slate-300">
              {image.alt}
              {count > 1 && (
                <span className="ml-2 font-mono text-xs text-slate-450">
                  {index! + 1} / {count}
                </span>
              )}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={close}
          aria-label="Close screenshots"
          className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#07101d]/80 text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          <FiX className="h-5 w-5" aria-hidden="true" />
        </button>
        {count > 1 &&
          (['prev', 'next'] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => step(side === 'prev' ? -1 : 1)}
              aria-label={side === 'prev' ? 'Previous screenshot' : 'Next screenshot'}
              className={`absolute top-1/2 ${side === 'prev' ? 'left-2 sm:left-4' : 'right-2 sm:right-4'} flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#07101d]/80 text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-cyan-300`}
            >
              {side === 'prev' ? (
                <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
              ) : (
                <FiChevronRight className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          ))}
      </dialog>
    </Open.Provider>
  )
}

/** A screenshot that opens large: a button around the picture, with a quiet zoom mark on hover and focus. */
export function LightboxThumb({
  index,
  label,
  className = '',
  children,
}: {
  index: number
  label: string
  className?: string
  children: ReactNode
}) {
  const open = useContext(Open)
  const hydrated = useHydrated()
  return (
    <button
      type="button"
      // Server-rendered: disabled until its handler exists, so an early click isn't lost.
      disabled={!hydrated}
      onClick={(e) => open?.(index, e.currentTarget)}
      aria-label={`Open screenshot: ${label}`}
      aria-haspopup="dialog"
      className={`group/shot relative block w-full cursor-zoom-in overflow-hidden text-left transition-[border-color,box-shadow,translate] duration-300 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:shadow-lg hover:shadow-cyan-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-default motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className="absolute right-2.5 bottom-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#07101d]/80 text-slate-100 opacity-0 transition-opacity duration-200 group-hover/shot:opacity-100 group-focus-visible/shot:opacity-100"
      >
        <FiMaximize2 className="h-3.5 w-3.5" />
      </span>
    </button>
  )
}
