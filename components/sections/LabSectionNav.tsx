'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { IconType } from 'react-icons'
import { LuStar, LuWrench } from 'react-icons/lu'
import BubblingFlask from '@/components/ui/BubblingFlask'
import { SiGooglechrome } from 'react-icons/si'

/**
 * The Lab's parts: the nav lists the ones found on the page, in document
 * order. To add a part, add a row here. Anything between two parts that is not
 * listed (the "Use mine as a template" offer, #template, after Featured) counts
 * as the part above it: a part stays current until the next one's top passes
 * 40% of the window.
 */
const SECTIONS: readonly LabPart[] = [
  { id: 'my-tools', label: 'My tools', icon: LuWrench },
  { id: 'featured', label: 'Featured', icon: LuStar },
  // Shortened to "Extensions" on screen where the gutter is too narrow for
  // the full label on one line (1440-1535px); its accessible name stays whole.
  {
    id: 'extensions',
    label: 'Chrome Extensions',
    short: 'Extensions',
    icon: SiGooglechrome,
    iconSize: 'size-3 min-[110rem]:size-3.5',
  },
]

// iconSize: a filled brand glyph reads heavier than the outline icons, so it runs a size smaller.
type LabPart = { id: string; label: string; short?: string; icon: IconType; iconSize?: string }

/**
 * The Lab's floating side nav: a heading ("In the Lab", with the Lab's flask)
 * over one row per part (a small icon and its label). The part on screen is
 * marked by a soft halo that slides between rows and a lit icon with a slow,
 * dim comet circling it, like the hero chain's chips. A hairline wire through
 * the icons fills cyan to blue as you scroll through the Lab, reaching each
 * icon as its part starts. No box around it, and only the current icon has a
 * ring: the owner asked for it light (2026-10-26). Desktop only (from 1280px),
 * in the left gutter beside the Lab's content column.
 *
 * Layout is mostly CSS: an absolute column from the first part's heading to
 * the Lab's foot holds a sticky rail, held at the viewport's middle (the
 * owner's call, 2026-10-26, so no one looks up for it). It starts level with
 * that heading, never leaves the Lab, and being absolute it can't shift the
 * layout. The links are plain
 * anchors (server-rendered, so they work without JS); the page's own
 * scroll-padding-top and reduced-motion-aware smooth scrolling handle the jump.
 *
 * Two shapes: from 1440px icons and labels (a long label shows its short form
 * where it must, so nothing wraps); between 1280px and 1440px icons only, the
 * label showing as a tooltip on hover or keyboard focus.
 *
 * Script: one scroll listener, attached only while the Lab is on screen, that
 * finds the current part (the one whose top has passed the middle of the viewport)
 * and snaps the wire's fill to its row through a CSS variable (no re-render per
 * frame). Animation is CSS transitions plus Tailwind's spin; under reduced
 * motion nothing moves (the halo jumps, the comet is a still arc).
 */
export default function LabSectionNav() {
  const [parts, setParts] = useState<readonly LabPart[]>(SECTIONS)
  const [active, setActive] = useState(-1)
  const [shown, setShown] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const columnRef = useRef<HTMLDivElement>(null)

  // The rail sticks at the viewport's middle: its own height (which changes
  // with the breakpoint) goes to --nav-h so it can centre itself.
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const observer = new ResizeObserver(() =>
      nav.style.setProperty('--nav-h', `${nav.offsetHeight}px`)
    )
    observer.observe(nav)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const found = SECTIONS.map((s) => ({ s, el: document.getElementById(s.id) })).filter(
      (x): x is { s: LabPart; el: HTMLElement } => !!x.el
    )
    found.sort((a, b) =>
      a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    )
    const present = found.map((x) => x.s)
    const els = found.map((x) => x.el)
    const lab = document.getElementById('lab')
    const column = columnRef.current
    if (!lab || !column || !els.length) return

    // The rail's column starts level with the first part's heading, so the
    // rail never sits beside the Lab's intro (whose pills already list the
    // parts) and starts out lined up with that heading before it sticks.
    const anchor = els[0].querySelector<HTMLElement>('h2, h3') ?? els[0]
    // Layout offsets, not on-screen boxes: the scroll reveals shift content
    // with transforms while they play, which must not move the anchor.
    const place = () => {
      let top = 0
      for (
        let el: HTMLElement | null = anchor;
        el && el !== lab;
        el = el.offsetParent as HTMLElement | null
      ) {
        top += el.offsetTop
      }
      column.style.top = `${top}px`
    }
    place()
    const resize = new ResizeObserver(place)
    resize.observe(lab)

    let frame = 0
    const update = () => {
      frame = 0
      // A part becomes current once its top reaches the rail's level, the
      // viewport's middle, and stays current until the next one gets there.
      const line = window.innerHeight * 0.5
      let index = -1
      for (let i = 0; i < els.length; i++) {
        if (els[i].getBoundingClientRect().top > line) break
        index = i
      }
      setActive(index)
      // The light locks onto the current part's row (the owner's ask,
      // 2026-10-27): it moves only when the part changes, never between rows
      // and never past the last one.
      listRef.current?.style.setProperty('--fill', String(Math.max(index, 0)))
      // Shown from the moment the first part's heading reaches the rail's
      // centred spot: the rail fades in level with it, after the Lab's intro
      // (whose pills already list the parts) has mostly gone by, and holds there.
      const centre = (window.innerHeight - (navRef.current?.offsetHeight ?? 0)) / 2
      setShown(anchor.getBoundingClientRect().top <= centre + 1)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    // The scroll listener runs only while the Lab is on screen.
    const observer = new IntersectionObserver(([entry]) => {
      // Drops any part missing from the page, on the first callback.
      setParts((prev) =>
        prev.map((p) => p.id).join() === present.map((p) => p.id).join() ? prev : present
      )
      if (entry.isIntersecting) {
        update()
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onScroll, { passive: true })
      } else {
        setShown(false)
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
      }
    })
    observer.observe(lab)
    // Hydrated and measuring: the rail can show from here on (tests wait for this).
    column.dataset.ready = ''
    return () => {
      observer.disconnect()
      resize.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={columnRef}
      className="pointer-events-none absolute top-0 bottom-0 left-0 hidden w-[calc((100%-72rem)/2+2rem)] xl:block"
      data-testid="lab-section-nav"
      data-lab-rail=""
    >
      {/* Without JavaScript nothing reveals the rail, so it simply shows: plain links to each part. */}
      <noscript>
        <style>{'[data-lab-rail] :is(nav,li){visibility:visible;opacity:1;translate:none}'}</style>
      </noscript>
      {/* --row is one row's height and --chip an icon's square: the halo and the wire are measured in them. */}
      <nav
        ref={navRef}
        aria-label="Lab contents"
        className={`pointer-events-auto sticky top-[calc(50vh-var(--nav-h,9rem)/2)] ml-auto mr-3 w-fit [--chip:1.625rem] [--row:3.75rem] transition-[opacity,translate,visibility] duration-700 ease-out motion-reduce:translate-none motion-reduce:transition-[opacity,visibility] 2xl:mr-6 min-[110rem]:[--chip:1.75rem] min-[110rem]:[--row:4rem] ${
          shown ? 'visible translate-x-0 opacity-100' : 'invisible -translate-x-3 opacity-0'
        }`}
      >
        {/* Heading, wide shape only: the Lab's flask (centred over the icons) and its name in the tagline's gradient. */}
        <p className="mb-3 hidden items-center gap-2.5 pl-[calc(0.375rem+var(--chip)/2-0.875rem)] text-xl font-bold tracking-tight min-[90rem]:flex min-[110rem]:text-2xl">
          <BubblingFlask className="size-7 text-cyan-300" />
          <span className="bg-linear-to-r from-cyan-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
            The Lab
          </span>
        </p>
        <ul ref={listRef} className="relative" style={{ '--fill': 0 } as CSSProperties}>
          {/* The wire: a hairline through the icons' centres, filling cyan to blue as you scroll. */}
          <span
            aria-hidden="true"
            className="absolute top-[calc(var(--row)/2)] left-[calc(0.375rem+var(--chip)/2)] w-px -translate-x-1/2 bg-cyan-400/15"
            // From the first icon's centre to the last one's: nothing past Chrome Extensions.
            style={{ height: `calc(var(--row) * ${parts.length - 1})` }}
          >
            <span
              className="absolute inset-x-0 top-0 bg-linear-to-b from-cyan-300/80 to-blue-500/80 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ height: 'calc(var(--row) * var(--fill))' }}
            />
            {/* A small light riding the end of the fill. */}
            <span
              className={`absolute left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100 shadow-[0_0_8px_2px_rgba(34,211,238,0.7)] transition-[top,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                active < 0 ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ top: 'calc(var(--row) * var(--fill))' }}
            />
          </span>

          {/* The current row's halo, sliding between rows. */}
          <span
            aria-hidden="true"
            className={`absolute top-0 left-0 h-(--row) w-[calc(var(--chip)+0.75rem)] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.16),transparent)] transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              active < 0 ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ translate: `0 calc(var(--row) * ${Math.max(active, 0)})` }}
          />

          {parts.map((s, i) => {
            const current = active === i
            const Icon = s.icon
            return (
              <li
                key={s.id}
                className={`transition-[opacity,translate] duration-500 ease-out motion-reduce:translate-none motion-reduce:transition-opacity ${
                  shown ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                }`}
                style={{ transitionDelay: shown ? `${150 + i * 80}ms` : '0ms' }}
              >
                <a
                  href={`#${s.id}`}
                  aria-current={current ? 'location' : undefined}
                  className="group relative flex h-(--row) items-center gap-2 rounded-lg px-1.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-300 min-[110rem]:gap-2.5"
                >
                  <span
                    className={`relative flex size-(--chip) shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                      current
                        ? 'bg-[#0b1a2b] text-cyan-300 ring-1 ring-cyan-300/20'
                        : 'bg-[#070d1a] text-slate-450'
                    }`}
                  >
                    <Icon
                      className={s.iconSize ?? 'size-3.5 min-[110rem]:size-4'}
                      aria-hidden="true"
                    />
                    {current && shown && <Comet />}
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
      className="pointer-events-none absolute -inset-px overflow-hidden rounded-[0.5625rem] p-px [mask:linear-gradient(#fff_0_0)_content-box_exclude,linear-gradient(#fff_0_0)] drop-shadow-[0_0_3px_rgba(34,211,238,0.45)]"
    >
      <span
        className="absolute -inset-1/2 animate-spin bg-[conic-gradient(from_0deg,transparent_0_55%,rgba(34,211,238,0.2)_78%,rgba(103,232,249,0.65)_96%,transparent_100%)] motion-reduce:animate-none"
        style={{ animationDuration: '5s' }}
      />
    </span>
  )
}

// The label: inline from 1440px; below that, a tooltip beside the chip on hover or focus.
const TOOLTIP =
  'pointer-events-none absolute top-1/2 left-full ml-1 -translate-y-1/2 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-100 opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100'
const INLINE =
  'min-[90rem]:pointer-events-auto min-[90rem]:static min-[90rem]:ml-0 min-[90rem]:translate-none min-[90rem]:rounded-none min-[90rem]:bg-transparent min-[90rem]:p-0 min-[90rem]:text-[0.8125rem] min-[90rem]:opacity-100 min-[110rem]:text-sm min-[90rem]:shadow-none min-[90rem]:ring-0 min-[90rem]:transition-colors'

function Label({ part, current }: { part: LabPart; current: boolean }) {
  const tone = current
    ? 'min-[90rem]:text-cyan-200'
    : 'min-[90rem]:text-slate-400 min-[90rem]:group-hover:text-slate-300'
  if (!part.short) return <span className={`${TOOLTIP} ${INLINE} ${tone}`}>{part.label}</span>
  return (
    <>
      <span className={`${TOOLTIP} ${INLINE} ${tone} min-[90rem]:max-2xl:sr-only`}>
        {part.label}
      </span>
      <span
        aria-hidden="true"
        className={`hidden font-medium min-[90rem]:max-2xl:inline ${INLINE} ${tone}`}
      >
        {part.short}
      </span>
    </>
  )
}
