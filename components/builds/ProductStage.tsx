'use client'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { FiArrowUpRight, FiMonitor, FiPlay, FiSmartphone, FiX } from 'react-icons/fi'
import { ProjectTour } from '@/components/sections/FeaturedProjectIslands'
import type { BuildClip } from '@/data/builds'

export type DemoView = { label: string; url: string }
type Mode = 'clip' | 'live'
type Device = 'desktop' | 'phone'

const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox'
/**
 * A phone's screen in the stage, under its status bar: an iPhone 14's width,
 * so the product lays itself out as it does on one, and the phone take's height.
 */
const PHONE = { width: 390, height: 760 }

/** `openping.n8builds.dev/tools/is-it-down`: the address bar's text. */
const address = (url: string) => url.replace(/^https:\/\//, '').replace(/\/$/, '')

/**
 * The product itself, full width under a build page's header (owner,
 * 2026-11-09): "instead of looking through photos, I want to use the
 * product". Two ways to see it, each on a desktop or a phone:
 *
 * - The clip (the default): a short silent take of the product in real use,
 *   recorded with scripts/product-clips/, playing as soon as it is on screen.
 * - Try it live: the real product's public pages in a sandboxed frame, a tab
 *   each (OpenPing's Is it down? tool, free tools and status page; Solara's
 *   planner as a guest). Only the pages that let this site frame them are
 *   offered (lib/embeddable.ts); with none, the clip is all there is. The
 *   frame loads only when asked for, so the page costs the product nothing
 *   until a visitor wants it.
 *
 * From 1024px a Desktop | Phone switch shows either in a browser window or a
 * phone at a phone's width (the live product lays itself out for a phone, the
 * clip switches to its phone take). Below 1024px there is no switch: a phone
 * gets the phone take and a tablet the desktop one, and Try it live opens the
 * product full screen, which on a phone is the product's own phone layout.
 */
export default function ProductStage({
  name,
  clip,
  views,
  note,
}: {
  name: string
  clip?: BuildClip & { phone?: BuildClip }
  views: DemoView[]
  note?: string
}) {
  const [mode, setMode] = useState<Mode>(clip ? 'clip' : 'live')
  const [device, setDevice] = useState<Device>('desktop')
  const [view, setView] = useState(0)
  // The views opened so far stay loaded, so switching back keeps where you were.
  const [opened, setOpened] = useState<Set<number>>(() => new Set(clip ? [] : [0]))
  const [sheet, setSheet] = useState(false)
  const live = views.length > 0
  const phoneAvailable = live || !!clip?.phone

  const openView = (i: number) => {
    setView(i)
    setOpened((prev) => (prev.has(i) ? prev : new Set(prev).add(i)))
  }
  const goLive = () => {
    setMode('live')
    openView(view)
  }
  const shownDevice: Device = mode === 'clip' && !clip?.phone ? 'desktop' : device
  const phone = shownDevice === 'phone'

  return (
    <section id="demo" aria-label={`${name} in use`} className="scroll-mt-24">
      {/* From 1024px: the stage, with its switches. */}
      <div className="hidden lg:block" data-testid="product-stage">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {live && clip ? (
              <Segmented
                label={`How to see ${name}`}
                value={mode}
                onChange={(m) => (m === 'live' ? goLive() : setMode('clip'))}
                options={[
                  { value: 'clip', label: 'Watch it in use', icon: <FiPlay aria-hidden className="h-3.5 w-3.5" /> },
                  { value: 'live', label: 'Try it live', icon: <LiveDot /> },
                ]}
              />
            ) : (
              <p className="font-mono text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
                {live ? `${name}, live` : `${name} in use`}
              </p>
            )}
            {mode === 'live' && views.length > 1 ? <ViewTabs name={name} views={views} active={view} onChange={openView} /> : null}
          </div>
          {phoneAvailable ? (
            <Segmented
              label="Show it on"
              value={shownDevice}
              onChange={setDevice}
              disabled={mode === 'clip' && !clip?.phone}
              options={[
                { value: 'desktop', label: 'Desktop', icon: <FiMonitor aria-hidden className="h-3.5 w-3.5" /> },
                { value: 'phone', label: 'Phone', icon: <FiSmartphone aria-hidden className="h-3.5 w-3.5" /> },
              ]}
            />
          ) : null}
        </div>

        <div className="mt-4 flex justify-center">
          {/* One frame for both devices, so a live page keeps its place when the
              switch only changes its width: a browser window, or a phone. */}
          <div
            data-device={shownDevice}
            className={`relative overflow-hidden transition-[width,border-radius,padding] duration-300 ease-out motion-reduce:transition-none ${
              phone
                ? 'rounded-[3rem] border border-white/15 bg-[#05080f] p-3 shadow-2xl shadow-black/50 ring-1 ring-black'
                : 'w-full rounded-2xl border border-white/10 bg-[#0b1322] shadow-2xl shadow-black/40'
            }`}
            style={phone ? { width: PHONE.width + 26 } : undefined}
          >
            {phone ? (
              // The phone's status bar, with its camera island: the screen starts under it.
              <span aria-hidden className="flex h-9 items-center justify-center rounded-t-[2.25rem] bg-black">
                <span className="h-[1.35rem] w-24 rounded-full bg-[#111827] ring-1 ring-white/10" />
              </span>
            ) : (
              <WindowBar
                title={mode === 'live' ? address(views[view].url) : `${name} in use`}
                href={mode === 'live' ? views[view].url : undefined}
                name={name}
              />
            )}
            <div
              className={`relative overflow-hidden bg-[#07101d] ${phone ? 'rounded-b-[2.25rem]' : ''}`}
              style={phone ? { height: PHONE.height } : undefined}
            >
              {mode === 'clip' && clip ? (
                phone && clip.phone ? (
                  <ProjectTour title={name} tour={clip.phone} className="h-full w-full" frameClassName="" aspect="h-full" sizes={`${PHONE.width}px`} noun="clip" />
                ) : (
                  <ProjectTour title={name} tour={clip} className="w-full" frameClassName="" sizes="(min-width: 1280px) 1152px, 100vw" noun="clip" />
                )
              ) : (
                <div className={phone ? 'h-full' : 'aspect-16/10'}>
                  {views.map((v, i) =>
                    opened.has(i) ? <LiveFrame key={v.url} name={name} view={v} hidden={i !== view} /> : null,
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {mode === 'live' ? (
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 text-center text-sm text-slate-400">
            {note}
            {phone ? (
              <a href={views[view].url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-slate-300 hover:text-cyan-200">
                {address(views[view].url)}
                <FiArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}
          </p>
        ) : null}
      </div>

      {/* Below 1024px: the clip for this screen, and the live product full screen on request. */}
      <div className="lg:hidden" data-testid="product-stage-compact">
        {clip ? (
          <>
            <div className={clip.phone ? 'hidden sm:block' : ''}>
              <ProjectTour title={name} tour={clip} className="w-full" frameClassName="rounded-2xl border border-white/10 shadow-2xl shadow-black/40" sizes="100vw" noun="clip" />
            </div>
            {clip.phone ? (
              // As tall as most of the screen at most, so the page carries on below it.
              <div className="mx-auto sm:hidden" style={{ maxWidth: `calc(72svh * ${PHONE.width} / ${PHONE.height})` }}>
                <ProjectTour
                  title={name}
                  tour={clip.phone}
                  className="w-full"
                  aspect="aspect-[390/760]"
                  frameClassName="rounded-[1.75rem] border border-white/10 shadow-2xl shadow-black/40"
                  sizes="100vw"
                  noun="clip"
                />
              </div>
            ) : null}
          </>
        ) : null}
        {live ? (
          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <button
              type="button"
              onClick={() => {
                openView(view)
                setSheet(true)
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/15"
            >
              <LiveDot />
              Try it live
            </button>
            {note ? <p className="text-sm text-slate-400">{note}</p> : null}
          </div>
        ) : null}
        {live && sheet ? (
          <LiveSheet name={name} views={views} view={view} opened={opened} onView={openView} onClose={() => setSheet(false)} />
        ) : null}
      </div>
    </section>
  )
}

/** A pulsing green dot: the product, live. Still under reduced motion. */
function LiveDot() {
  return (
    <span aria-hidden className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 motion-reduce:animate-none" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  )
}

/** A two-way switch: buttons in a pill, the chosen one pressed. */
function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; icon: ReactNode }[]
  disabled?: boolean
}) {
  return (
    <div role="group" aria-label={label} className={`inline-flex shrink-0 rounded-full border border-white/10 bg-white/[0.04] p-1 ${disabled ? 'opacity-50' : ''}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed ${
            o.value === value ? 'bg-blue-500/20 text-blue-100 ring-1 ring-blue-400/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** The live pages, a tab each (a tablist: the arrow keys, Home and End move between them). */
function ViewTabs({
  name,
  views,
  active,
  onChange,
  className = 'flex-wrap',
}: {
  name: string
  views: DemoView[]
  active: number
  onChange: (i: number) => void
  className?: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  return (
    <div role="tablist" aria-label={`${name} pages`} className={`flex min-w-0 gap-1 ${className}`}>
      {views.map((v, i) => (
        <button
          key={v.url}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="tab"
          aria-selected={i === active}
          tabIndex={i === active ? 0 : -1}
          onClick={() => onChange(i)}
          onKeyDown={(e) => {
            const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: views.length - 1 }[e.key]
            if (to === undefined) return
            e.preventDefault()
            const next = (to + views.length) % views.length
            onChange(next)
            refs.current[next]?.focus()
          }}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
            i === active ? 'bg-white/10 text-slate-50' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}

/** A browser window's top bar: three dots, the address, and a way out to the real tab. */
function WindowBar({ title, href, name }: { title: string; href?: string; name: string }) {
  return (
    <div className="grid h-11 grid-cols-[4.5rem_minmax(0,1fr)_4.5rem] items-center border-b border-white/[0.07] bg-white/[0.03] px-4">
      <span aria-hidden className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
      </span>
      <span className="mx-auto max-w-full truncate rounded-md bg-black/25 px-4 py-1 font-mono text-xs text-slate-400" data-testid="stage-address">
        {title}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in a new tab"
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-100"
        >
          <FiArrowUpRight aria-hidden className="h-4 w-4" />
          <span className="sr-only">Open {name} in a new tab</span>
        </a>
      ) : null}
    </div>
  )
}

/** One live page in a sandboxed frame, with a quiet spinner until it has loaded. */
function LiveFrame({ name, view, hidden }: { name: string; view: DemoView; hidden: boolean }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={`relative h-full w-full ${hidden ? 'hidden' : ''}`}>
      {!loaded ? (
        <span aria-hidden className="absolute inset-0 flex items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-cyan-300 motion-reduce:animate-none" />
        </span>
      ) : null}
      <iframe
        src={view.url}
        title={`${name}, live: ${view.label}`}
        sandbox={SANDBOX}
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setLoaded(true)}
        className="relative h-full w-full border-0"
      />
    </div>
  )
}

/**
 * Below 1024px, the live product full screen: a modal dialog with a bar (the
 * product's name, its pages, a way out to the real tab, Close) over the frame.
 * Escape or Close returns to the page, where the button that opened it gets
 * focus back.
 */
function LiveSheet({
  name,
  views,
  view,
  opened,
  onView,
  onClose,
}: {
  name: string
  views: DemoView[]
  view: number
  opened: Set<number>
  onView: (i: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const opener = document.activeElement as HTMLElement | null
    dialog.showModal()
    // The page behind stays put.
    const html = document.documentElement
    const overflow = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = overflow
      opener?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-[#07101d] p-0 text-slate-100 backdrop:bg-black/70"
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 bg-[#0b1322] px-3 py-2">
          <div className="flex items-center gap-2">
            <LiveDot />
            <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-bold">
              {name}, live
            </h2>
            <a
              href={views[view].url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/8"
            >
              <FiArrowUpRight aria-hidden className="h-4 w-4" />
              <span className="sr-only">Open {name} in a new tab</span>
            </a>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/8"
            >
              <FiX aria-hidden className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          {views.length > 1 ? (
            <ViewTabs name={name} views={views} active={view} onChange={onView} className="-mx-1 mt-1 overflow-x-auto whitespace-nowrap px-1 pb-0.5" />
          ) : null}
        </div>
        <div className="relative min-h-0 flex-1">
          {views.map((v, i) => (opened.has(i) ? <LiveFrame key={v.url} name={name} view={v} hidden={i !== view} /> : null))}
        </div>
      </div>
    </dialog>
  )
}
