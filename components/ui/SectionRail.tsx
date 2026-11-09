'use client'

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import type { IconType } from 'react-icons'

/**
 * One part a rail lists. `short` is shown on screen where the gutter is too
 * narrow for the full label on one line (1440-1535px); the link's accessible
 * name stays whole. `iconSize`: a filled brand glyph reads heavier than the
 * outline icons, so it can run a size smaller.
 */
export type RailPart = {
  id: string
  label: string
  short?: string
  icon: IconType
  iconSize?: string
}

type SectionRailProps = {
  /** The parts, in any order: the rail lists the ones found on the page, in document order. */
  parts: readonly RailPart[]
  /**
   * The id of the element the rail lives in and tracks: positioned, as wide
   * as the page, and centring the site's content column (max-w-site) with 2rem
   * side padding. The rail shows only while it is on screen and rides out
   * with its foot.
   */
  containerId: string
  /** The rail's accessible name, e.g. "Lab contents". */
  label: string
  /** The heading over the rows (wide shape only): an icon and the page or section's name. */
  heading: { icon: ReactNode; title: string }
  testId: string
}

/**
 * A floating side nav for a long page or section (the homepage Lab, the
 * Loadout): a heading (an icon and a name) over one row per part (a small icon
 * and its label). The part on screen is marked by a soft halo that slides
 * between rows and a lit icon with a slow, dim comet circling it, like the
 * hero chain's chips. A hairline wire through the icons fills cyan to blue as
 * you scroll, reaching each icon as its part starts. No box around it, and
 * only the current icon has a ring: the owner asked for it light (2026-10-26).
 * Desktop only (from 1280px), in the left gutter beside the content column;
 * on phones and tablets the pill links under the page or section heading do
 * the job.
 *
 * Layout is mostly CSS: an absolute column from the first part's heading to
 * the container's foot holds a sticky rail, held at the viewport's middle (the
 * owner's call, 2026-10-26, so no one looks up for it). It starts level with
 * that heading, never leaves the container, and being absolute it can't shift
 * the layout. The container must not clip with overflow: hidden (a scroll
 * container, which stops the rail sticking); overflow: clip is fine. The links
 * are plain anchors (server-rendered, so they work without JS); once hydrated
 * a click drives the scroll itself (see `jump`), landing where the anchor would.
 *
 * Two shapes: from 1440px icons and labels (a long label shows its short form
 * where it must, so nothing wraps); between 1280px and 1440px icons only, the
 * label showing as a tooltip on hover or keyboard focus.
 *
 * Script: one scroll listener, throttled to a frame and idle while the
 * container is off screen, that finds the current part (the one whose heading
 * icon, or else its top, has passed the middle of the viewport) and snaps the wire's fill to its row
 * through a CSS variable (no re-render per frame). Animation is CSS
 * transitions plus Tailwind's spin; under reduced motion nothing moves (the
 * halo jumps, the comet is a still arc).
 */
export default function SectionRail({
  parts: allParts,
  containerId,
  label,
  heading,
  testId,
}: SectionRailProps) {
  const [parts, setParts] = useState<readonly RailPart[]>(allParts)
  const [active, setActive] = useState(-1)
  const [shown, setShown] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const columnRef = useRef<HTMLDivElement>(null)
  // A rail click's jump: while it scrolls, the clicked row stays the current
  // one (no row it passes lights up) and the scroll-spy waits.
  // `landed`: where a first-row jump came to rest; the row stays lit there until the page moves.
  const jumpRef = useRef<{ index: number; stop: () => void; landed?: number } | null>(null)
  // The scroll-spy's update, for a jump to hand back to when it settles.
  const updateRef = useRef<() => void>(() => {})

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
    const found = allParts
      .map((s) => ({ s, el: document.getElementById(s.id) }))
      .filter((x): x is { s: RailPart; el: HTMLElement } => !!x.el)
    found.sort((a, b) =>
      a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    )
    const present = found.map((x) => x.s)
    const els = found.map((x) => x.el)
    // Each part's heading icon, where it has one (LoadoutPartHeading, LabSubheader).
    const marks = els.map((el) => el.querySelector<HTMLElement>('[data-part-icon]'))
    const container = document.getElementById(containerId)
    const column = columnRef.current
    if (!container || !column || !els.length) return

    // The rail's column starts level with the first part's heading, so the
    // rail never sits beside the intro (whose pills already list the parts)
    // and starts out lined up with that heading before it sticks.
    const anchor = els[0].querySelector<HTMLElement>('h2, h3') ?? els[0]
    // Layout offsets, not on-screen boxes: the scroll reveals shift content
    // with transforms while they play, which must not move the anchor.
    const place = () => {
      let top = 0
      for (
        let el: HTMLElement | null = anchor;
        el && el !== container;
        el = el.offsetParent as HTMLElement | null
      ) {
        top += el.offsetTop
      }
      column.style.top = `${top}px`
    }
    place()
    const resize = new ResizeObserver(place)
    resize.observe(container)

    // Where a jump to the part puts its top: the page's scroll-padding-top
    // plus the part's own scroll-margin-top.
    const landing = (el: HTMLElement) =>
      (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0) +
      (parseFloat(getComputedStyle(el).scrollMarginTop) || 0)

    let frame = 0
    const update = () => {
      frame = 0
      // A rail click's jump is under way: its row stays lit until it lands. A jump
      // to the band's top (the first row) holds there until the visitor scrolls.
      const held = jumpRef.current
      if (held) {
        if (held.landed === undefined || Math.abs(window.scrollY - held.landed) <= 4) return
        held.stop()
        return
      }
      // Nothing to do while the container is off screen (the rail is hidden then).
      const box = container.getBoundingClientRect()
      if (box.bottom <= 0 || box.top >= window.innerHeight) {
        setShown(false)
        return
      }
      // A part becomes current once it reaches the rail's level, the viewport's
      // middle, and stays current until the next one gets there. Where its
      // heading has an icon (data-part-icon), that is once the icon's middle is
      // halfway up the window (owner, round 10 of 2026-11-09), so the rail's
      // icon lights as the heading's own plays beside it; otherwise its top.
      const line = window.innerHeight * 0.5
      let index = -1
      for (let i = 0; i < els.length; i++) {
        const mark = marks[i]
        const box = mark?.getBoundingClientRect()
        const y = box ? box.top + box.height / 2 : els[i].getBoundingClientRect().top
        if (y > line) break
        index = i
      }
      // A jump (a rail link, a pill, a #hash) lands a part's top at its landing
      // spot, under the navbar; when the part is short, the next one can pass
      // the middle at once (the Loadout's last two). So a part only takes over
      // once the one before it has also gone up past its landing spot: the part
      // just jumped to stays current, and scrolling on hands over smoothly.
      while (index > 0 && els[index - 1].getBoundingClientRect().top >= landing(els[index - 1]) - 2)
        index--
      setActive(index)
      // The light locks onto the current part's row (the owner's ask,
      // 2026-10-27): it moves only when the part changes, never between rows
      // and never past the last one.
      listRef.current?.style.setProperty('--fill', String(Math.max(index, 0)))
      // Shown from the moment the first part's heading reaches the middle of
      // the window (the owner's ask, 2026-11-02; it waited for the rail's own
      // higher centred spot before): the rail fades in level with that
      // heading, after the intro (whose pills already list the parts) has
      // mostly gone by, rides up with it and holds at its centred spot.
      setShown(anchor.getBoundingClientRect().top <= window.innerHeight / 2 + 1)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    // Drops any part missing from the page.
    setParts((prev) =>
      prev.map((p) => p.id).join() === present.map((p) => p.id).join() ? prev : present
    )
    // One scroll listener for the page's life, throttled to a frame. It isn't
    // gated on an IntersectionObserver: WebKit could report the container late
    // after an instant jump, leaving the rail hidden until the next scroll.
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    updateRef.current = update
    update()
    // Hydrated and measuring: the rail can show from here on (tests wait for this).
    column.dataset.ready = ''
    return () => {
      resize.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
      jumpRef.current?.stop()
    }
  }, [allParts, containerId])

  /**
   * A rail click (round 5 of 2026-11-02). The browser's own smooth scroll
   * eased in slowly, so a jump seemed to wait before it moved, and the
   * scroll-spy lit every part it passed on the way. Instead the jump is driven
   * here: it moves on the very next frame, eases out over about the time the
   * browser's took, and aims at the part's landing spot every frame (so a part
   * that shifts on the way is still hit). The clicked row lights at once and
   * stays lit until the scroll settles; then the scroll-spy takes over again.
   * A wheel, touch or key stops it where it is. Under reduced motion it jumps.
   *
   * The first row lands on the band's top instead of its own part (round 5 of
   * 2026-11-02, the owner: a rail's first item reveals its band's title, as
   * the navbar's Lab menu does), so the intro is in view. The rail stays shown
   * there, the first row lit, until the visitor scrolls on.
   */
  const jump = (e: ReactMouseEvent<HTMLAnchorElement>, index: number, id: string) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const part = document.getElementById(id)
    if (!part) return
    const first = index === 0
    const el = (first && document.getElementById(containerId)) || part
    e.preventDefault()
    jumpRef.current?.stop()
    window.history.replaceState(null, '', `#${id}`)
    setActive(index)
    listRef.current?.style.setProperty('--fill', String(index))

    const root = document.documentElement
    // Whole pixels, as an anchor jump lands (WebKit otherwise settles a pixel off).
    const target = () =>
      Math.round(Math.min(
        root.scrollHeight - window.innerHeight,
        Math.max(
          0,
          window.scrollY +
            el.getBoundingClientRect().top -
            (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) -
            (parseFloat(getComputedStyle(el).scrollMarginTop) || 0)
        )
      ))
    const from = window.scrollY
    const distance = Math.abs(target() - from)
    const cancelEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
    let raf = 0
    const stop = () => {
      cancelAnimationFrame(raf)
      cancelEvents.forEach((type) => window.removeEventListener(type, stop))
      if (jumpRef.current?.stop === stop) jumpRef.current = null
      updateRef.current()
    }
    // Landed: the first row holds (until the visitor scrolls); any other hands back at once.
    const land = () => {
      cancelAnimationFrame(raf)
      if (!first) return stop()
      if (jumpRef.current?.stop === stop) jumpRef.current.landed = window.scrollY
    }
    cancelEvents.forEach((type) => window.addEventListener(type, stop, { passive: true }))
    jumpRef.current = { index, stop }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || distance < 2) {
      window.scrollTo({ top: target(), behavior: 'instant' })
      requestAnimationFrame(land)
      return
    }
    // About the browser's own pace: 0.4s for a short hop, up to 0.9s across the page.
    const duration = Math.min(900, 380 + Math.sqrt(distance) * 9)
    // The clock starts with the first frame's own timestamp.
    let start = -1
    const step = (now: number) => {
      // The first frame already moves a frame's worth (16ms), so the scroll starts at once.
      if (start < 0) start = now - 16
      const t = Math.min(1, (now - start) / duration)
      // Ease out (cubic): moving from the first frame, settling gently.
      const eased = 1 - (1 - t) ** 3
      window.scrollTo({ top: from + (target() - from) * eased, behavior: 'instant' })
      if (t < 1) raf = requestAnimationFrame(step)
      else land()
    }
    raf = requestAnimationFrame(step)
  }

  return (
    <div
      ref={columnRef}
      className="pointer-events-none absolute top-0 bottom-0 left-0 z-20 hidden w-[calc((100%-var(--container-site))/2+2rem)] xl:block"
      data-testid={testId}
      data-section-rail=""
    >
      {/* Without JavaScript nothing reveals the rail, so it simply shows: plain links to each part. */}
      <noscript>
        <style>
          {'[data-section-rail] :is(nav,li){visibility:visible;opacity:1;translate:none}'}
        </style>
      </noscript>
      {/* --row is one row's height and --chip an icon's square: the halo and the wire are measured in them. */}
      <nav
        ref={navRef}
        aria-label={label}
        // Visibility flips at once when the rail shows (a transition would keep
        // it hidden, unclickable and unnamed until its first frame), and waits
        // out the fade when it hides.
        className={`pointer-events-auto sticky top-[calc(50vh-var(--nav-h,9rem)/2)] ml-auto mr-3 w-fit [--chip:1.625rem] [--row:3.75rem] duration-700 ease-out motion-reduce:translate-none 2xl:mr-6 min-[110rem]:[--chip:1.75rem] min-[110rem]:[--row:4rem] ${
          shown
            ? 'visible translate-x-0 opacity-100 transition-[opacity,translate] motion-reduce:transition-opacity'
            : 'invisible -translate-x-3 opacity-0 transition-[opacity,translate,visibility] motion-reduce:transition-[opacity,visibility]'
        }`}
      >
        {/* Heading, wide shape only: the icon (centred over the row icons) and the name in the tagline's gradient. */}
        <p className="mb-3 hidden items-center gap-2.5 pl-[calc(0.375rem+var(--chip)/2-0.875rem)] text-xl font-bold tracking-tight min-[90rem]:flex min-[110rem]:text-2xl">
          {heading.icon}
          <span className="bg-linear-to-r from-cyan-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
            {heading.title}
          </span>
        </p>
        <ul ref={listRef} className="relative" style={{ '--fill': 0 } as CSSProperties}>
          {/* The wire: a hairline through the icons' centres, filling cyan to blue as you scroll. */}
          <span
            aria-hidden="true"
            className="absolute top-[calc(var(--row)/2)] left-[calc(0.375rem+var(--chip)/2)] w-px -translate-x-1/2 bg-cyan-400/15"
            // From the first icon's centre to the last one's: nothing past the last part.
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
                  onClick={(e) => jump(e, i, s.id)}
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

function Label({ part, current }: { part: RailPart; current: boolean }) {
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
