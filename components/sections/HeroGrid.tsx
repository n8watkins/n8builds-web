'use client'
import { useEffect, useId, useRef } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const CELL = 52
const COLS = 40 // 2080px: covers the widest common screens
const ROWS = 20

/** Small deterministic PRNG (mulberry32), so the lit cells match on server and client. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Deep blues for the lit cells: dim enough to stay a backdrop.
const TONES = ['#0c1836', '#13234d', '#0f1f52', '#16285a']
// How many cells are lit at once. Each one wanders: it fades out, jumps to a
// random free cell, and fades back in, all on its own random clock.
const LIT = 34
// Where lit cells may appear: a band below the navbar, narrower than the full
// grid, so the effect sits low and central rather than filling the screen.
const SPAWN = { minX: 9, maxX: 31, minY: 3, maxY: 13 }
const spawnX = (r: number) => SPAWN.minX + Math.floor(r * (SPAWN.maxX - SPAWN.minX + 1))
const spawnY = (r: number) => SPAWN.minY + Math.floor(r * (SPAWN.maxY - SPAWN.minY + 1))

type Cell = { x: number; y: number; fill: string; peak: number }

/**
 * Starting spots for the lit cells (a fixed seed, so server and client match).
 * They render unlit; once the page is running they warm up one by one, then
 * wander at random.
 */
const initialCells: Cell[] = (() => {
  const rand = random(8)
  const used = new Set<string>()
  const cells: Cell[] = []
  while (cells.length < LIT) {
    const x = spawnX(rand())
    const y = spawnY(rand())
    if (used.has(`${x},${y}`)) continue
    used.add(`${x},${y}`)
    cells.push({ x, y, fill: TONES[Math.floor(rand() * TONES.length)], peak: 0.45 + rand() * 0.4 })
  }
  return cells
})()

/** The hero's backdrop: a dim grid whose lit cells warm up, then wander. */
export default function HeroGrid() {
  const id = useId()
  const rects = useRef<(SVGRectElement | null)[]>([])
  const reduceMotion = usePrefersReducedMotion()

  // Warm-up, then wander. The grid starts dark; each cell first fades in at a
  // random moment over the first few seconds, then loops (fade out, move, fade
  // in, hold) with random durations, so the pattern never repeats. Only
  // opacity transitions (cheap to composite), and the DOM is touched a few
  // times per second. Reduced motion shows the full set, still.
  useEffect(() => {
    if (reduceMotion) {
      initialCells.forEach((cell, i) => {
        const rect = rects.current[i]
        if (rect) rect.style.opacity = String(cell.peak)
      })
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    const occupied = new Set(initialCells.map((c) => `${c.x},${c.y}`))
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms))
    const between = (min: number, max: number) => min + Math.random() * (max - min)

    const cycle = (i: number, current: { x: number; y: number }) => {
      const rect = rects.current[i]
      if (!rect) return
      const fadeOut = between(1800, 3200)
      rect.style.transition = `opacity ${fadeOut}ms ease-in-out`
      rect.style.opacity = '0'
      later(() => {
        occupied.delete(`${current.x},${current.y}`)
        let next = current
        for (let tries = 0; tries < 20; tries++) {
          const candidate = { x: spawnX(Math.random()), y: spawnY(Math.random()) }
          if (!occupied.has(`${candidate.x},${candidate.y}`)) {
            next = candidate
            break
          }
        }
        occupied.add(`${next.x},${next.y}`)
        rect.setAttribute('x', String(next.x * CELL + 1))
        rect.setAttribute('y', String(next.y * CELL + 1))
        rect.setAttribute('fill', TONES[Math.floor(Math.random() * TONES.length)])
        const fadeIn = between(1800, 3600)
        rect.style.transition = `opacity ${fadeIn}ms ease-in-out`
        rect.style.opacity = String(between(0.45, 0.85).toFixed(2))
        later(() => cycle(i, next), fadeIn + between(1500, 7000))
      }, fadeOut + between(200, 1500))
    }

    initialCells.forEach((cell, i) =>
      later(() => {
        const rect = rects.current[i]
        if (!rect) return
        const fadeIn = between(1600, 3000)
        rect.style.transition = `opacity ${fadeIn}ms ease-in-out`
        rect.style.opacity = String(cell.peak)
        later(() => cycle(i, cell), fadeIn + between(1500, 6000))
      }, between(300, 7000))
    )
    return () => timers.forEach(clearTimeout)
  }, [reduceMotion])

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none mask-[linear-gradient(to_bottom,transparent,black_120px,black_62%,transparent)]"
      aria-hidden="true"
    >
      <svg className="absolute left-1/2 top-0 h-full -translate-x-1/2" width={COLS * CELL} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={id} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <path
              d={`M.5 ${CELL}V.5H${CELL}`}
              fill="none"
              stroke="rgba(255,255,255,0.055)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill={`url(#${id})`} />

        {initialCells.map(({ x, y, fill }, i) => (
          <rect
            key={i}
            ref={(el) => {
              rects.current[i] = el
            }}
            fill={fill}
            style={{ opacity: 0 }}
            x={x * CELL + 1}
            y={y * CELL + 1}
            width={CELL - 1}
            height={CELL - 1}
          />
        ))}
      </svg>

      {/* Fade the grid out toward the far edges so it stays a quiet backdrop. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_75%_at_50%_45%,transparent_40%,#050812_100%)]" />
    </div>
  )
}
