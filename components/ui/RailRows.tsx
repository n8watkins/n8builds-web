'use client'

import type { CSSProperties, MouseEvent as ReactMouseEvent, Ref } from 'react'
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

/**
 * A rail's rows (the homepage's side rails, components/ui/SectionRail.tsx, and
 * a build page's sidebar, components/builds/BuildSidebar.tsx; owner, round 12
 * of 2026-11-09: the same pattern on both): one row per part, a small icon and
 * its label, a hairline wire through the icons that fills to the current part,
 * a soft halo that slides between rows and a slow comet circling the current
 * icon. Give the list's container `--chip` (an icon's square) and `--row` (a
 * row's height). `labels`: "responsive" shows them inline from 1440px and as
 * a tooltip below; "inline" always shows them.
 */
export default function RailRows({
  parts,
  active,
  shown = true,
  onJump,
  labels = 'responsive',
  listRef,
}: {
  parts: readonly RailPart[]
  /** The current part's index, -1 for none. */
  active: number
  /** Whether the rows are showing (they slide in, one after another). */
  shown?: boolean
  onJump?: (e: ReactMouseEvent<HTMLAnchorElement>, index: number, id: string) => void
  labels?: 'responsive' | 'inline'
  listRef?: Ref<HTMLUListElement>
}) {
  return (
    <ul ref={listRef} className="relative" style={{ '--fill': Math.max(active, 0) } as CSSProperties}>
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
              onClick={onJump ? (e) => onJump(e, i, s.id) : undefined}
              aria-current={current ? 'location' : undefined}
              className="group relative flex h-(--row) items-center gap-2 rounded-lg px-1.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-300 min-[110rem]:gap-2.5"
            >
              <span
                className={`relative flex size-(--chip) shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                  current ? 'bg-[#0b1a2b] text-cyan-300 ring-1 ring-cyan-300/20' : 'bg-[#070d1a] text-slate-450'
                }`}
              >
                <Icon className={s.iconSize ?? 'size-3.5 min-[110rem]:size-4'} aria-hidden="true" />
                {current && shown && <Comet />}
              </span>
              {labels === 'inline' ? (
                <span
                  className={`text-sm transition-colors ${current ? 'font-semibold text-cyan-200' : 'text-slate-400 group-hover:text-slate-200'}`}
                >
                  {s.label}
                </span>
              ) : (
                <Label part={s} current={current} />
              )}
            </a>
          </li>
        )
      })}
    </ul>
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
  const tone = current ? 'min-[90rem]:text-cyan-200' : 'min-[90rem]:text-slate-400 min-[90rem]:group-hover:text-slate-300'
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
