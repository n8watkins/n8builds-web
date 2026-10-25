'use client'
import React, { useEffect, useId, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { FiArrowDown, FiGithub } from 'react-icons/fi'
import { CiLinkedin } from 'react-icons/ci'
import { FaXTwitter } from 'react-icons/fa6'
import WhoamiTerminal from '@/components/features/WhoamiTerminal'
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

const AnimatedGrid = () => {
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

// Sets --n8wire on the chip chain to the loop-back wire's on-screen length.
// The SVG stretches with preserveAspectRatio="none", so the path is sampled in
// viewBox units and scaled to pixels on each axis; re-measured on every resize.
function useWireLength(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current
    const svg = el?.querySelector<SVGSVGElement>('.n8-loop')
    const path = svg?.querySelector<SVGPathElement>('.n8-loop-base')
    if (!el || !svg || !path || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const { width, height } = svg.getBoundingClientRect()
      const { width: vw, height: vh } = svg.viewBox.baseVal
      const sx = width / vw
      const sy = height / vh
      const total = path.getTotalLength()
      let length = 0
      let prev = path.getPointAtLength(0)
      for (let i = 1; i <= 64; i++) {
        const pt = path.getPointAtLength((total * i) / 64)
        length += Math.hypot((pt.x - prev.x) * sx, (pt.y - prev.y) * sy)
        prev = pt
      }
      el.style.setProperty('--n8wire', `${length.toFixed(1)}px`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(svg)
    return () => ro.disconnect()
  }, [ref])
}

const Hero = () => {
  const chainRef = useRef<HTMLDivElement>(null)
  useWireLength(chainRef)
  return (
    <div
      className="relative flex flex-col min-h-[min(90vh,800px)] md:portrait:min-h-[min(90vh,720px)] items-center bg-linear-to-b from-darkBlue from-70% to-transparent overflow-hidden select-none"
      id="home"
    >
      <AnimatedGrid />

      {/* Top-aligned, not centered: a slow device paints the hero while it is
          still streaming in, and re-centering a growing column shifted it up. */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 w-full flex flex-col items-center pt-28 lg:pt-40 pb-16">


        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-10 md:gap-8">
          {/* Text */}
          <div className="flex-1 flex flex-col items-start gap-5 min-w-0 w-full md:w-auto">

            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-[3.2rem] sm:text-6xl/none lg:text-7xl/none xl:text-[5rem] font-extrabold leading-none tracking-tight text-slate-50"
              >
                n8builds
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.16 }}
                className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight bg-linear-to-r from-cyan-400 via-blue-400 to-blue-600 bg-clip-text text-transparent"
              >
                Spending tokens, shipping features.
              </motion.p>
            </div>

            {/* whoami terminal = the description (blended copy) */}
            <WhoamiTerminal className="w-full max-w-[520px]" />

            {/* Build philosophy - electrified circuit: a comet traces each chip's
                outline left -> right, then runs the loop-back line from repeat under the
                whole chain back into idea, and the loop starts again. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              ref={chainRef}
              className="relative w-fit font-mono text-[0.6rem] min-[360px]:text-[0.72rem] sm:text-[0.85rem] select-none [--n8wire:340px] sm:[--n8wire:410px]"
            >
              <style>{`
                @property --n8ang {
                  syntax: '<angle>';
                  initial-value: 0deg;
                  inherits: false;
                }

                /* Shared 11s loop. Chips fire on a 1.8s stagger (left -> right); each comet
                   sweeps its perimeter, then the loop-back line carries a fast pulse from
                   repeat back under the chain into idea (~3x quicker than the chip sweeps),
                   landing right as idea relights, and it repeats. */
                @keyframes n8cometSweep {
                  0%          { --n8ang: 0deg;   opacity: 0; }
                  3%          { opacity: 1; }
                  11%         { --n8ang: 225deg; opacity: 1; }
                  13.5%, 100% { --n8ang: 225deg; opacity: 0; }
                }
                /* split trace (middle chips): two lights start at 9 o'clock and sweep
                   a half each (one over the top, one under the bottom), meeting at the
                   3 o'clock arrow. --n8ang 0 -> 180; the +/- in the conic from-angle sends
                   ::before clockwise (top) and ::after counter-clockwise (bottom). */
                @keyframes n8splitSweep {
                  0%          { --n8ang: 0deg;   opacity: 0; }
                  3%          { opacity: 1; }
                  11%         { --n8ang: 180deg; opacity: 1; }
                  13.5%, 100% { --n8ang: 180deg; opacity: 0; }
                }
                /* fade in (dim -> lit), hold while the comet traces, fade out, then a
                   gap before the next chip so the hand-off reads as a clear flow. */
                @keyframes n8chipGlow {
                  0%        { border-color: rgba(34,211,238,0.12); background-color: rgba(34,211,238,0); color: rgb(100,116,139); text-shadow: none; }
                  3%        { border-color: rgba(34,211,238,0.55); background-color: rgba(34,211,238,0.06); color: rgb(165,243,252); text-shadow: 0 0 8px rgba(34,211,238,0.6); }
                  11%       { border-color: rgba(34,211,238,0.55); background-color: rgba(34,211,238,0.06); color: rgb(165,243,252); text-shadow: 0 0 8px rgba(34,211,238,0.6); }
                  14%, 100% { border-color: rgba(34,211,238,0.12); background-color: rgba(34,211,238,0); color: rgb(100,116,139); text-shadow: none; }
                }
                @keyframes n8arrowGlow {
                  0%        { color: rgb(100,116,139); text-shadow: none; }
                  3%, 8%    { color: rgb(165,243,252); text-shadow: 0 0 4px rgba(34,211,238,1), 0 0 9px rgba(34,211,238,1), 0 0 16px rgba(34,211,238,0.7); }
                  13%, 100% { color: rgb(100,116,139); text-shadow: none; }
                }
                /* loop-back connector: dim wire + ONE blue pulse (#22d3ee, same as the
                   chips). Tight hand-off both ends: starts ~78%, right as repeat's comet
                   lands on the 4:30 corner (no lead-in gap), travels the WHOLE wire, and
                   reaches the idea corner ~99%, right before the loop restarts and idea
                   lights (no trailing gap). --n8wire is the wire's on-screen pixel
                   length, measured by useWireLength (non-scaling-stroke makes the dash
                   use px, ignoring pathLength); the class values are only the fallback. */
                @keyframes n8loopComet {
                  0%, 75%  { stroke-dashoffset: 0;    opacity: 0; }
                  77%      { stroke-dashoffset: 0;    opacity: 1; }
                  99%      { stroke-dashoffset: calc(var(--n8wire) * -1); opacity: 1; }
                  100%     { stroke-dashoffset: calc(var(--n8wire) * -1 - 20px); opacity: 0; }
                }

                .n8-cnode {
                  position: relative;
                  isolation: isolate;
                  border-color: rgba(34,211,238,0.12);
                  color: rgb(100,116,139);
                  animation: n8chipGlow 11s linear infinite;
                  animation-delay: var(--n8delay, 0s);
                }
                .n8-cnode:not(.n8-split)::before {
                  content: '';
                  position: absolute;
                  inset: 0;
                  border-radius: inherit;
                  padding: 1.5px;
                  opacity: 0;
                  /* idea/ship (single comet): a partial 225deg clockwise arc (up & over).
                     idea 7:30 -> 3:00 (--n8start 135deg); ship 9:00 -> 4:30 (--n8start 180deg).
                     bright head sits 90deg ahead of the from-angle (the 25% cone stop). */
                  background: conic-gradient(
                    from calc(var(--n8ang) + var(--n8start, 0deg)),
                    transparent 0 10%,
                    rgba(103,232,249,0.5) 18%,
                    #67e8f9 23%,
                    #22d3ee 25%,
                    transparent 28%
                  );
                  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                  -webkit-mask-composite: xor;
                          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                          mask-composite: exclude;
                  filter: drop-shadow(0 0 5px rgba(34,211,238,0.7));
                  animation: n8cometSweep 11s linear infinite;
                  animation-delay: var(--n8delay, 0s);
                  z-index: 1;
                  pointer-events: none;
                }
                .n8-split::before,
                .n8-split::after {
                  content: '';
                  position: absolute;
                  inset: 0;
                  border-radius: inherit;
                  padding: 1.5px;
                  opacity: 0;
                  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                  -webkit-mask-composite: xor;
                          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                          mask-composite: exclude;
                  filter: drop-shadow(0 0 5px rgba(34,211,238,0.7));
                  animation: n8splitSweep 11s linear infinite;
                  animation-delay: var(--n8delay, 0s);
                  z-index: 1;
                  pointer-events: none;
                }
                /* top light: 9 o'clock -> over the top -> 3 o'clock (clockwise) */
                .n8-split::before {
                  background: conic-gradient(from calc(270deg + var(--n8ang)),
                    #22d3ee 0deg, rgba(103,232,249,0.4) 13deg, transparent 26deg,
                    transparent 334deg, rgba(103,232,249,0.4) 347deg, #22d3ee 360deg);
                }
                /* bottom light: 9 o'clock -> under the bottom -> 3 o'clock (counter-cw) */
                .n8-split::after {
                  background: conic-gradient(from calc(270deg - var(--n8ang)),
                    #22d3ee 0deg, rgba(103,232,249,0.4) 13deg, transparent 26deg,
                    transparent 334deg, rgba(103,232,249,0.4) 347deg, #22d3ee 360deg);
                }
                .n8-carrow {
                  color: rgb(100,116,139);
                  font-size: 0.85rem;
                  animation: n8arrowGlow 11s linear infinite;
                }
                /* below 360px (iPhone SE 1st gen) the chain shrinks to fit the screen */
                @media (max-width: 359px) {
                  .n8-carrow { font-size: 0.7rem; }
                }
                .n8-loop {
                  position: absolute;
                  left: 0;
                  right: 0;
                  top: 100%;
                  width: 100%;
                  height: 9px;
                  overflow: visible;
                  pointer-events: none;
                }
                .n8-loop-base { stroke: rgba(34,211,238,0.22); }
                .n8-loop-comet {
                  stroke: #22d3ee;
                  filter: drop-shadow(0 0 2px #67e8f9) drop-shadow(0 0 6px #22d3ee) drop-shadow(0 0 9px rgba(34,211,238,0.7));
                  /* -10s phase: page loads mid-loop with the pulse already on the bottom
                     wire (more negative -> closer to idea; less -> closer to ship). */
                  animation: n8loopComet 11s linear -10s infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                  .n8-cnode, .n8-cnode::before, .n8-cnode::after, .n8-carrow, .n8-loop-comet { animation: none; }
                  .n8-cnode::before, .n8-cnode::after, .n8-loop-comet { opacity: 0; }
                  .n8-cnode { border-color: rgba(34,211,238,0.3); }
                }
              `}</style>
              <div className="flex items-center gap-1 min-[360px]:gap-1.5">
                {['idea', 'prompt', 'build', 'ship', 'repeat'].map((w, i, arr) => (
                  <React.Fragment key={w}>
                    <span
                      className={`n8-cnode rounded-md border px-1.5 min-[360px]:px-2 py-1 sm:px-3 sm:py-1.5 lowercase tracking-wide${
                        i > 0 && i < arr.length - 1 ? ' n8-split' : ''
                      }`}
                      style={{
                        // 11s loop, 1.8s chip spacing, phase-shifted -10s so the page loads
                        // pulse-mid-wire; idea fires ~0.45s early so it lights as the wire lands.
                        ['--n8delay' as string]: `${(i === 0 ? -0.45 : i * 1.8) - 10}s`,
                        // idea starts bottom-left (~7:30), repeat at 9 o'clock; the split
                        // chips ignore --n8start (they sweep from 270deg +/- the angle).
                        ['--n8start' as string]:
                          i === 0 ? '135deg' : i === arr.length - 1 ? '172deg' : '0deg',
                      }}
                    >
                      {w}
                    </span>
                    {/* middle chips (prompt/build/ship) carry a second light via
                        ::after, so the two halves meet at the 3 o'clock arrow */}
                    {i < arr.length - 1 && (
                      // arrow lights at the hand-off as the comet leaves chip i
                      <span className="n8-carrow" style={{ animationDelay: `${(i === 0 ? 0.43 : i * 1.8 + 0.88) - 10}s` }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              {/* loop-back circuit line: repeat (right) -> down -> under the chain ->
                  up into idea (left). preserveAspectRatio=none stretches it to the
                  chain width; non-scaling-stroke keeps the line crisp. */}
              <svg className="n8-loop" viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden="true">
                <path
                  className="n8-loop-base"
                  d="M98,0 L98,9 Q98,14 93,14 L7,14 Q2,14 2,9 L2,0"
                  fill="none"
                  strokeWidth="1.25"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  className="n8-loop-comet"
                  d="M98,0 L98,9 Q98,14 93,14 L7,14 Q2,14 2,9 L2,0"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray="16 999"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center gap-3 flex-wrap"
            >
              <a
                href="#now"
                className="group relative inline-flex h-12 overflow-hidden rounded-xl p-px transition-all duration-200 hover:scale-[1.02]"
              >
                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#22d3ee_0%,#2563eb_50%,#22d3ee_100%)]" />
                <span className="inline-flex h-full w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-base font-bold text-slate-100 backdrop-blur-3xl">
                  See what I&apos;m building
                  <FiArrowDown aria-hidden className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                </span>
              </a>
            </motion.div>

            {/* Socials */}
            <motion.nav
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.72 }}
              aria-label="Social links"
              className="flex items-center gap-0.5 -ml-2"
            >
              {[
                { href: 'https://github.com/n8watkins', label: 'GitHub', icon: <FiGithub className="w-[1.6rem] h-[1.6rem]" /> },
                { href: 'https://linkedin.com/in/n8watkins', label: 'LinkedIn', icon: <CiLinkedin className="w-8 h-8" /> },
                { href: 'https://x.com/n8watkins', label: 'X', icon: <FaXTwitter className="w-[1.4rem] h-[1.4rem]" /> },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-12 h-12 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all duration-150">
                  {s.icon}
                </a>
              ))}
            </motion.nav>

            {/* The direct route for someone hiring: the developer portfolio. */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="text-sm text-slate-400"
            >
              Hiring?{' '}
              <a
                href="https://portfolio.n8builds.dev"
                className="font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 transition-colors hover:text-cyan-200 hover:decoration-cyan-200"
              >
                See my developer portfolio
              </a>
            </motion.p>
          </div>

          {/* Portrait */}
          <motion.div
            // No opacity fade: the server-rendered portrait (the page's LCP
            // element) must be visible before hydration, not after it.
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-64 h-64 sm:w-76 sm:h-76 md:w-84 md:h-84 lg:w-96 lg:h-96 relative shrink-0"
          >
            <div className="absolute inset-0 rounded-full bg-linear-to-br from-cyan-500/20 to-blue-600/20 blur-xl scale-110" />
            <div className="relative w-full h-full">
              <div className="absolute inset-0 dark:bg-black/10 rounded-full z-10" />
              <Image
                src="/hero/portrait.jpg"
                className="rounded-full object-cover ring-1 ring-white/10"
                fill
                priority
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                sizes="(max-width: 640px) 16rem, (max-width: 768px) 19rem, (max-width: 1024px) 21rem, 24rem"
                alt="Nathan Watkins - builder based in Los Angeles"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Hero
