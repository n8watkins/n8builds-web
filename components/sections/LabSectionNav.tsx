'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { IconType } from 'react-icons'
import { LuFlaskConical, LuGitFork, LuPuzzle, LuStar, LuWrench } from 'react-icons/lu'

/**
 * The Lab's parts, in no particular order: the nav lists the ones on the page
 * in document order. To add a part, add a row here. `optional` parts render
 * only once their element is found (after hydration), so a part another
 * branch adds later can be listed before it ships.
 */
const SECTIONS: readonly LabPart[] = [
  { id: 'my-tools', label: 'My tools', icon: LuWrench },
  { id: 'featured', label: 'Featured', icon: LuStar },
  // Shortened to "Extensions" on screen where the gutter is too narrow for
  // the full label on one line (1440-1535px); its accessible name stays whole.
  { id: 'extensions', label: 'Chrome extensions', short: 'Extensions', icon: LuPuzzle },
  { id: 'open-source', label: 'Open source', icon: LuGitFork, optional: true },
]

type LabPart = { id: string; label: string; short?: string; icon: IconType; optional?: boolean }


// PREVIEW ONLY: ?navVariant=b shows the "circuit" look; removed once the owner picks.
type Variant = 'a' | 'b'

/**
 * The Lab's floating side nav: one row per Lab part (icon chip and label), the
 * part on screen marked by an indicator that slides between rows and a lit
 * chip with a comet circling it, like the hero chain's chips. A wire beside
 * the chips fills cyan to blue as you scroll through the Lab, reaching each
 * chip as its part starts. Desktop only (from 1280px), in the left gutter
 * beside the Lab's content column.
 *
 * Layout is pure CSS: an absolute column spanning the whole Lab band holds a
 * sticky rail, so the rail only shows while the Lab is on screen and never
 * leaves it, and being absolute it can't shift the layout. The links are plain
 * anchors (server-rendered, so they work without JS); the page's own
 * scroll-padding-top and reduced-motion-aware smooth scrolling handle the jump.
 *
 * Two shapes: from 1440px icons and labels (a long label shows its short form
 * where it must, so nothing wraps); between 1280px and 1440px icons only, the
 * label showing as a tooltip on hover or keyboard focus.
 *
 * Script: one scroll listener, attached only while the Lab is on screen, that
 * finds the current part (the one whose top has passed 40% of the viewport)
 * and writes the wire's fill straight to a CSS variable (no re-render per
 * frame). Animation is CSS transitions plus Tailwind's spin; under reduced
 * motion nothing moves (the indicator jumps, the comet is a still ring).
 */
export default function LabSectionNav() {
  const [parts, setParts] = useState<readonly LabPart[]>(() => SECTIONS.filter((s) => !s.optional))
  const [active, setActive] = useState(-1)
  const [inView, setInView] = useState(false)
  const [variant, setVariant] = useState<Variant>('a')
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('navVariant') === 'b') setVariant('b')
  }, [])

  useEffect(() => {
    const found = SECTIONS.map((s) => ({ s, el: document.getElementById(s.id) })).filter(
      (x): x is { s: LabPart; el: HTMLElement } => !!x.el,
    )
    found.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    const present = found.map((x) => x.s)
    const els = found.map((x) => x.el)
    const lab = document.getElementById('lab')
    if (!lab || !els.length) return

    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.4
      let index = -1
      let fraction = 0
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect()
        if (r.top > line) break
        index = i
        const end = i + 1 < els.length ? els[i + 1].getBoundingClientRect().top : r.bottom
        fraction = Math.min(1, Math.max(0, (line - r.top) / Math.max(1, end - r.top)))
      }
      setActive(index)
      // In rows from the first chip's centre; the wire ends at the list's foot.
      const fill = index < 0 ? 0 : Math.min(index + fraction, els.length - 0.5)
      listRef.current?.style.setProperty('--fill', String(fill))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const observer = new IntersectionObserver(([entry]) => {
      // Optional parts join the list here, on the first callback.
      setParts((prev) => (prev.map((p) => p.id).join() === present.map((p) => p.id).join() ? prev : present))
      setInView(entry.isIntersecting)
      if (entry.isIntersecting) {
        update()
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onScroll, { passive: true })
      } else {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
      }
    })
    observer.observe(lab)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const circuit = variant === 'b'

  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 hidden w-[calc((100%-72rem)/2+2rem)] xl:block"
      data-testid="lab-section-nav"
      data-variant={variant}
    >
      <nav
        aria-label="Lab contents"
        className={`pointer-events-auto sticky top-28 mt-8 ml-auto mr-3 w-fit transition-[opacity,translate] duration-700 ease-out motion-reduce:translate-none 2xl:mr-6 ${
          inView ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'
        } ${
          circuit
            ? ''
            : 'rounded-2xl border border-white/10 bg-[#0a1424]/85 p-1 shadow-[0_10px_40px_-12px_rgba(34,211,238,0.25)] min-[90rem]:pr-1.5 2xl:p-2 2xl:pr-3'
        }`}
      >
        {/* Heading, wide shape only: the Lab's flask chip in miniature and its name in the tagline's gradient. */}
        <p
          className={`mb-2 hidden items-center gap-2 text-[0.9375rem] font-bold tracking-tight min-[90rem]:flex min-[110rem]:text-base ${circuit ? 'pl-0.5' : 'px-1.5 pt-1'}`}
        >
          <LuFlaskConical className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          <span className="bg-linear-to-r from-cyan-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
            In the Lab
          </span>
        </p>
        {/* --row is one row's height and --chip an icon chip's size: the indicator and the wire are measured in them. */}
        <ul
          ref={listRef}
          className="relative [--chip:2.25rem] [--row:3rem] min-[110rem]:[--chip:2.75rem] min-[110rem]:[--row:3.5rem]"
          style={{ '--fill': 0 } as CSSProperties}
        >
          {/* The wire: a dim track through the chips' centres, filling cyan to blue as you scroll. */}
          <span
            aria-hidden="true"
            className={`absolute top-[calc(var(--row)/2)] w-0.5 -translate-x-1/2 rounded-full ${
              circuit ? 'bg-cyan-400/20' : 'bg-white/8'
            } left-[calc(0.375rem+var(--chip)/2)]`}
            style={{ height: `calc(var(--row) * ${parts.length - 0.5})` }}
          >
            <span
              className="absolute inset-x-0 top-0 origin-top rounded-full bg-linear-to-b from-cyan-300 via-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.7)] transition-[height] duration-150 ease-out motion-reduce:transition-none"
              style={{ height: 'calc(var(--row) * var(--fill))' }}
            />
            {circuit && (
              // The comet head riding the wire's fill.
              <span
                className={`absolute left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100 shadow-[0_0_4px_#67e8f9,0_0_10px_#22d3ee,0_0_16px_rgba(34,211,238,0.7)] transition-[top,opacity] duration-150 ease-out motion-reduce:transition-none ${
                  active < 0 ? 'opacity-0' : 'opacity-100'
                }`}
                style={{ top: 'calc(var(--row) * var(--fill))' }}
              />
            )}
          </span>

          {/* The sliding indicator behind the current row (a halo round the chip in the circuit look). */}
          <span
            aria-hidden="true"
            className={`absolute left-0 top-0 h-(--row) transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              active < 0 ? 'opacity-0' : 'opacity-100'
            } ${
              circuit
                ? 'w-[calc(var(--chip)+0.75rem)] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.35),rgba(34,211,238,0.08)_70%,transparent)]'
                : 'w-full rounded-xl bg-linear-to-r from-cyan-400/15 via-blue-500/8 to-transparent ring-1 ring-cyan-300/20'
            }`}
            style={{ translate: `0 calc(var(--row) * ${Math.max(active, 0)})` }}
          />

          {parts.map((s, i) => {
            const current = active === i
            const Icon = s.icon
            return (
              <li
                key={s.id}
                className={`transition-[opacity,translate] duration-500 ease-out motion-reduce:translate-none ${
                  inView ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                }`}
                style={{ transitionDelay: inView ? `${150 + i * 80}ms` : '0ms' }}
              >
                <a
                  href={`#${s.id}`}
                  aria-current={current ? 'location' : undefined}
                  className="group relative flex h-(--row) items-center gap-2 rounded-xl px-1.5 2xl:gap-2.5 min-[110rem]:gap-3 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-300"
                >
                  <span
                    className={`relative flex size-(--chip) shrink-0 items-center justify-center rounded-[0.625rem] ring-1 min-[110rem]:rounded-xl transition-[color,background-color,box-shadow,scale] duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100 ${
                      current
                        ? 'bg-[#0b1d2e] text-cyan-300 ring-cyan-300/30 shadow-[0_0_16px_-2px_rgba(34,211,238,0.6)]'
                        : 'bg-[#0b1524] text-slate-450 ring-white/10 group-hover:text-slate-200 group-hover:ring-white/25'
                    }`}
                  >
                    <Icon className="size-[1.125rem] min-[110rem]:size-[1.375rem]" aria-hidden="true" />
                    {current && inView && <Comet />}
                  </span>
                  <Label part={s} current={current} />
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

/**
 * A light circling the current chip's outline, like the hero chain's comets: a
 * conic gradient spinning under a ring-shaped mask. Still under reduced motion.
 */
function Comet() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -inset-px overflow-hidden rounded-[0.6875rem] p-[2px] [mask:linear-gradient(#fff_0_0)_content-box_exclude,linear-gradient(#fff_0_0)] drop-shadow-[0_0_5px_rgba(34,211,238,0.9)] min-[110rem]:rounded-[0.8125rem]"
    >
      <span
        className="absolute -inset-1/2 animate-spin bg-[conic-gradient(from_0deg,transparent_0_45%,rgba(34,211,238,0.35)_72%,#67e8f9_92%,#cffafe_98%,transparent_100%)] motion-reduce:animate-none"
        style={{ animationDuration: '3.2s' }}
      />
    </span>
  )
}

// The label: inline from 1440px; below that, a tooltip beside the chip on hover or focus.
const TOOLTIP =
  'pointer-events-none absolute top-1/2 left-full ml-1 -translate-y-1/2 -translate-x-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-100 opacity-0 shadow-lg ring-1 ring-cyan-300/25 transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:translate-x-0'
const INLINE =
  'min-[90rem]:pointer-events-auto min-[90rem]:static min-[90rem]:ml-0 min-[90rem]:translate-none min-[90rem]:rounded-none min-[90rem]:bg-transparent min-[90rem]:p-0 min-[90rem]:text-[0.9375rem] min-[90rem]:opacity-100 min-[110rem]:text-base min-[90rem]:shadow-none min-[90rem]:ring-0 min-[90rem]:transition-colors'

function Label({ part, current }: { part: LabPart; current: boolean }) {
  const tone = current
    ? 'min-[90rem]:bg-linear-to-r min-[90rem]:from-cyan-200 min-[90rem]:to-blue-400 min-[90rem]:bg-clip-text min-[90rem]:text-transparent'
    : 'min-[90rem]:text-slate-400 min-[90rem]:group-hover:text-slate-100'
  if (!part.short) return <span className={`${TOOLTIP} ${INLINE} ${tone}`}>{part.label}</span>
  return (
    <>
      <span className={`${TOOLTIP} ${INLINE} ${tone} min-[90rem]:max-2xl:sr-only`}>{part.label}</span>
      <span aria-hidden="true" className={`hidden font-medium min-[90rem]:max-2xl:inline ${INLINE} ${tone}`}>
        {part.short}
      </span>
    </>
  )
}
