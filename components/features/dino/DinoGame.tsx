'use client'

import { useEffect, useRef } from 'react'
import { DINO_COLS, DINO_FRAMES, DINO_ROWS, framePaths, type DinoFrame } from './sprite'

/**
 * The easter egg itself (loaded lazily by DinoEasterEgg.tsx). A pixel dino
 * walks along the top of the first marquee row, hopping each gap between the
 * tiles as they scroll by. When the visitor pauses the marquee (hovering it,
 * or focusing a tile), the dino mistimes its next jump and falls through a gap
 * to the next row, the next level, where it walks the other way. Falling off
 * the last row, it drops back in at the top left and starts over. A panel with
 * a single row gets a solid ground line under it as its second level.
 *
 * It runs on requestAnimationFrame with direct DOM writes (no React renders
 * per frame, no motion library), and stops while the panel is off screen or
 * the tab is hidden.
 */

const PX = 2 // screen pixels per sprite pixel
const W = DINO_COLS * PX
const H = DINO_ROWS * PX
const SPEED = 110 // walking speed, px/s on screen
const GRAVITY = 1500 // px/s²
const STEP_EVERY = 9 // px walked per leg swap
const STILL = 2 // px/s: a row moving slower than this is paused

type Mode = 'walk' | 'hop' | 'miss' | 'fall'

interface Row {
  el: HTMLElement
  /** The loop copies of the row's items, each moving with the marquee. */
  tracks: HTMLElement[]
  /** Each tile's [left, right], relative to its track. */
  tiles: [number, number][]
  /** The tiles' top edge, relative to the panel: the level's floor. */
  top: number
  /** Last frame's position of the first track (to measure the row's speed). */
  lastLeft: number | null
  velocity: number
  paused: boolean
}

interface Level {
  y: number
  /** The row the level is the top of; none for the solid ground line. */
  row: Row | null
}

const COLORS = { body: '#cfdbe9', eye: '#081427', shine: '#ffffff' } as const
// Only the current frame shows (the root's data-frame); spelled out in full so
// Tailwind's scanner sees each class.
const FRAME_CLASS: Record<DinoFrame, string> = {
  stepA: 'hidden group-data-[frame=stepA]/dino:inline',
  stepB: 'hidden group-data-[frame=stepB]/dino:inline',
  hop: 'hidden group-data-[frame=hop]/dino:inline',
  fall: 'hidden group-data-[frame=fall]/dino:inline',
}
const FRAMES = (Object.keys(DINO_FRAMES) as DinoFrame[]).map((name) => ({
  name,
  paths: framePaths(DINO_FRAMES[name]),
}))

export default function DinoGame() {
  const dinoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dino = dinoRef.current
    const panel = dino?.closest<HTMLElement>('[data-dino-panel]')
    if (!dino || !panel) return

    let rows: Row[] = []
    let levels: Level[] = []
    let panelW = 0
    let panelH = 0

    const measure = () => {
      const box = panel.getBoundingClientRect()
      panelW = box.width
      panelH = box.height
      rows = [...panel.querySelectorAll<HTMLElement>('[data-marquee-row]')].flatMap((el): Row[] => {
        const tracks = [...el.children] as HTMLElement[]
        const first = tracks[0]
        const figures = first ? ([...first.children] as HTMLElement[]) : []
        if (!first || figures.length === 0) return []
        const trackLeft = first.getBoundingClientRect().left
        const tiles = figures.map((f): [number, number] => {
          const r = f.getBoundingClientRect()
          return [r.left - trackLeft, r.right - trackLeft]
        })
        const top = figures[0].getBoundingClientRect().top - box.top
        return [{ el, tracks, tiles, top, lastLeft: null, velocity: 0, paused: false }]
      })
      levels = rows.map((row) => ({ y: row.top, row }))
      // One row: a ground line under it is the second level.
      if (rows.length === 1) {
        const bottom = rows[0].el.getBoundingClientRect().bottom - box.top
        levels.push({ y: Math.min(bottom + 4, panelH - 6), row: null })
      }
    }

    // Tile intervals of a row right now, in panel coordinates.
    const intervals = (row: Row, panelLeft: number) => {
      const out: [number, number][] = []
      for (const track of row.tracks) {
        const left = track.getBoundingClientRect().left - panelLeft
        for (const [a, b] of row.tiles) out.push([left + a, left + b])
      }
      return out
    }

    // State
    let level = -1 // -1: dropping in from above the first level
    let dir: 1 | -1 = 1
    let mode: Mode = 'fall'
    let x = 0
    let y = -H
    let vy = 0
    let carry = 0 // horizontal speed while falling (the row it fell from)
    let hop = { t: 0, T: 0, h: 0, floor: 0, vx: 0 }
    let walked = 0
    let missPending = false
    let frame: DinoFrame = 'fall'
    let settled = 0 // frames measured so far (pauses count once rows are known)
    // Just came back in at the other end of a level: walk on (in the edge
    // fade) until there is a tile underfoot, rather than dropping straight in.
    let reentering = false

    const respawn = () => {
      level = -1
      dir = 1
      mode = 'fall'
      x = Math.max(16, panelW * 0.15)
      y = -H
      vy = 0
      carry = 0
    }

    const support = (foot: number, spans: [number, number][]) =>
      spans.find(([a, b]) => foot >= a && foot <= b)

    const land = (target: Level, spans: [number, number][] | null) => {
      // Nudge onto the nearest tile if the dino would land in a gap.
      if (spans && !support(x + W / 2, spans)) {
        let best = Infinity
        for (const [a, b] of spans) {
          const foot = x + W / 2
          const delta = foot < a ? a + 2 - foot : foot > b ? b - 2 - foot : 0
          if (Math.abs(delta) < Math.abs(best)) best = delta
        }
        if (Math.abs(best) < 40) x += best
      }
      y = target.y
      vy = 0
      mode = 'walk'
    }

    let raf = 0
    let last = 0
    let running = false
    let onScreen = false
    let lastDataset = ''

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      if (!dt) return
      const panelLeft = panel.getBoundingClientRect().left

      // Row speeds, and whether the visitor just paused one.
      for (const row of rows) {
        const left = row.tracks[0].getBoundingClientRect().left
        if (row.lastLeft !== null) {
          row.velocity = (left - row.lastLeft) / dt
          const paused = Math.abs(row.velocity) < STILL
          if (paused && !row.paused && settled > 10) missPending = true
          row.paused = paused
        }
        row.lastLeft = left
      }
      settled++

      const current = levels[level]
      const spans = current?.row ? intervals(current.row, panelLeft) : null
      const foot = x + W / 2

      if (mode === 'walk' && current) {
        x += dir * SPEED * dt
        walked += SPEED * dt
        if (walked >= STEP_EVERY) {
          walked = 0
          frame = frame === 'stepA' ? 'stepB' : 'stepA'
        }
        if (frame !== 'stepA' && frame !== 'stepB') frame = 'stepA'
        if (spans) {
          const under = support(foot, spans)
          if (under) reentering = false
          if (!under && reentering) {
            // Still off the edge: keep walking.
          } else if (!under) {
            mode = 'fall'
            carry = current.row?.velocity ?? 0
          } else {
            const edge = dir > 0 ? under[1] : under[0]
            const ahead = (edge - foot) * dir
            // Within one frame's step of the edge (relative to the tile).
            if (ahead >= 0 && ahead < Math.max(5, (SPEED + 40) * dt + 1)) {
              // The next tile's near edge, to size the jump.
              const next = spans
                .map(([a, b]) => (dir > 0 ? a : b))
                .filter((e) => (e - edge) * dir > 0)
                .sort((p, q) => (p - edge) * dir - (q - edge) * dir)[0]
              const gap = next === undefined ? 16 : Math.abs(next - edge)
              if (missPending) {
                // Mistimed: a late little hop that comes down in the gap.
                const v = current.row?.velocity ?? 0
                const T = 0.24
                const target = edge + dir * gap * 0.5 + v * T
                hop = { t: 0, T, h: 6, floor: current.y, vx: (target - foot) / T }
                mode = 'miss'
                carry = v
                missPending = false
              } else {
                const rel = Math.max(SPEED - dir * (current.row?.velocity ?? 0), 30)
                const T = Math.min(Math.max((gap + 14) / rel, 0.28), 0.6)
                hop = { t: 0, T, h: 8 + 14 * T, floor: current.y, vx: dir * SPEED }
                mode = 'hop'
              }
            }
          }
        }
      } else if (mode === 'hop' || mode === 'miss') {
        hop.t += dt
        const p = Math.min(hop.t / hop.T, 1)
        x += hop.vx * dt
        y = hop.floor - hop.h * 4 * p * (1 - p)
        frame = mode === 'miss' ? 'fall' : 'hop'
        if (p >= 1) {
          y = hop.floor
          if (mode === 'hop' && spans && support(x + W / 2, spans)) {
            mode = 'walk'
            frame = 'stepA'
          } else {
            // A miss already carries the row's speed; a hop that came up
            // short drifts with the row it left.
            if (mode === 'hop') carry = current?.row?.velocity ?? 0
            mode = 'fall'
            vy = 0
          }
        }
      } else if (mode === 'fall') {
        frame = 'fall'
        vy += GRAVITY * dt
        y += vy * dt
        x += carry * dt
        const target = levels[level + 1]
        if (target && y >= target.y) {
          level += 1
          // Every level after the first walks the other way.
          if (level > 0) dir = dir > 0 ? -1 : 1
          land(target, target.row ? intervals(target.row, panelLeft) : null)
          frame = 'stepA'
        } else if (!target && y > panelH + H) {
          respawn()
        }
      }

      // Off one end of a level: come back in at the other.
      if (mode === 'walk') {
        if (dir > 0 && x > panelW) {
          x = -W
          reentering = true
        } else if (dir < 0 && x < -W) {
          x = panelW
          reentering = true
        }
        // Ground lines have no gaps to fall through: leaving one ends the run.
        if (current && !current.row && (x <= -W || x >= panelW)) respawn()
      }

      dino.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - H).toFixed(1)}px, 0) scaleX(${dir})`
      const dataset = `${frame}|${level}|${dir}|${mode}`
      if (dataset !== lastDataset) {
        lastDataset = dataset
        dino.dataset.frame = frame
        dino.dataset.level = String(level)
        dino.dataset.dir = dir > 0 ? 'right' : 'left'
        dino.dataset.mode = mode
      }
    }

    const update = () => {
      const shouldRun = onScreen && !document.hidden
      if (shouldRun === running) return
      running = shouldRun
      if (running) {
        last = 0
        for (const row of rows) row.lastLeft = null
        raf = requestAnimationFrame(tick)
      } else {
        cancelAnimationFrame(raf)
      }
    }

    measure()
    respawn()
    const resize = new ResizeObserver(() => {
      measure()
      if (x > panelW) respawn()
    })
    resize.observe(panel)
    const visibility = new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting)
      update()
    })
    visibility.observe(panel)
    document.addEventListener('visibilitychange', update)

    return () => {
      cancelAnimationFrame(raf)
      resize.disconnect()
      visibility.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  return (
    <div
      ref={dinoRef}
      data-dino
      data-frame="fall"
      className="group/dino absolute top-0 left-0 will-change-transform"
      style={{ width: W, height: H, transform: `translate3d(-${W * 2}px, -${H * 2}px, 0)` }}
    >
      <svg
        viewBox={`0 0 ${DINO_COLS} ${DINO_ROWS}`}
        width={W}
        height={H}
        shapeRendering="crispEdges"
        className="block overflow-visible"
      >
        {FRAMES.map(({ name, paths }) => (
          <g key={name} className={FRAME_CLASS[name]}>
            <path d={paths.body} fill={COLORS.body} />
            <path d={paths.eye} fill={COLORS.eye} />
            <path d={paths.shine} fill={COLORS.shine} />
          </g>
        ))}
      </svg>
    </div>
  )
}
