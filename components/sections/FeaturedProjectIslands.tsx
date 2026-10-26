'use client'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { FiLayers, FiX } from 'react-icons/fi'
import { useHydrated } from '@/hooks/useHydrated'

/**
 * The interactive parts of a Lab row (components/sections/FeaturedProjects.tsx),
 * which is otherwise rendered on the server.
 */

/** The row's main image, and the thumbnails that switch it. */
export function ProjectGallery({
  title,
  images,
  imageAlt,
  imageClassName,
}: {
  title: string
  images: string[]
  imageAlt: string
  imageClassName: string
}) {
  const [active, setActive] = useState(0)
  const current = images[Math.min(active, images.length - 1)]
  return (
    <div className="w-full md:w-1/2 shrink-0">
      <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#07101d] aspect-16/10 group">
        <Image key={current} src={current} alt={imageAlt} fill className={imageClassName} sizes="(max-width: 768px) 100vw, 50vw" />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-darkBlue/40 to-transparent pointer-events-none" />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              aria-label={`${title} image ${i + 1}`}
              className={`relative aspect-16/10 w-full overflow-hidden rounded-lg border transition-all duration-200 ${
                i === active
                  ? 'border-cyan-400/60 ring-1 ring-cyan-400/40'
                  : 'border-white/10 opacity-60 hover:opacity-100'
              }`}
            >
              <Image src={src} alt="" fill className="object-cover object-top" sizes="120px" />
            </button>
          ))}
        </div>
      )}
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
  children,
}: {
  /** The build's name, so each row's button has its own accessible name. */
  title: string
  labelledBy: string
  header: React.ReactNode
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
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/12 bg-white/4 hover:bg-white/8 text-slate-300 font-semibold text-sm transition-all duration-200 hover:scale-[1.02] disabled:cursor-wait">
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
        className="m-auto w-[min(42rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1220] p-0 text-slate-200 shadow-2xl shadow-black/60 opacity-0 transition-[opacity,translate,display,overlay] duration-200 transition-discrete translate-y-2 open:translate-y-0 open:opacity-100 starting:open:translate-y-2 starting:open:opacity-0 backdrop:bg-black/70 backdrop:backdrop-blur-sm motion-reduce:transition-none"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            {header}
            <button
              type="button"
              onClick={close}
              aria-label="Close details"
              className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-100"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
          {/* Always in the HTML, even closed: it holds the row's link to its
              build page, which crawlers follow from the homepage. */}
          {children}
        </div>
      </dialog>
    </>
  )
}
