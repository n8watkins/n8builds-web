'use client'
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import HeroChainMeter from '@/components/sections/HeroChainMeter'

/**
 * The hero's build loop, prompt -> build -> ship -> repeat, as an electrified
 * circuit: a comet traces each chip's outline left -> right, then runs the
 * loop-back line from repeat under the whole chain back into prompt (all CSS,
 * `.n8-cnode` and friends in app/globals.css; HeroChainMeter measures the wire).
 *
 * Each chip is a button that explains its step (owner, 2026-11-08: "elaborate
 * what's in each one of these chains"): hovering, focusing or tapping it opens
 * a short popover under the chain, one at a time. Escape or a tap elsewhere
 * closes it. The popover floats over the page (no layout shift) and is kept
 * inside the screen, down to 320px. Its fade is skipped under reduced motion.
 */
const STEPS = [
  { word: 'prompt', what: 'I turn the idea into a clear spec the AI can build from.' },
  { word: 'build', what: 'AI writes the code; I review it, run it and test it.' },
  { word: 'ship', what: 'It ships tested, release-kit writes the notes, and it lands in the build log.' },
  { word: 'repeat', what: 'What users and the build log teach me becomes the next prompt.' },
] as const

/** The page's side gutter, which the popover keeps clear of. */
const GUTTER = 16

export default function HeroChain() {
  // The open step, and whether a click or tap pinned it (then the pointer leaving doesn't close it).
  const [open, setOpen] = useState<number | null>(null)
  const pinned = useRef(false)
  const root = useRef<HTMLDivElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const chips = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId().replace(/:/g, '')

  const close = () => {
    pinned.current = false
    setOpen(null)
  }

  // Escape closes; so does a tap or click anywhere outside the chain.
  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  // Place the popover under its chip, nudged so it never leaves the screen.
  useLayoutEffect(() => {
    const box = pop.current
    const chip = open === null ? null : chips.current[open]
    const wrap = root.current
    if (!box || !chip || !wrap) return
    const base = wrap.getBoundingClientRect().left
    const c = chip.getBoundingClientRect()
    const width = box.offsetWidth
    const ideal = c.left + c.width / 2 - width / 2
    // Not left of the chain itself (the hero's column), nor past the screen's right gutter.
    const min = Math.max(GUTTER, base)
    const max = document.documentElement.clientWidth - GUTTER - width
    const left = Math.max(Math.min(min, max), Math.min(ideal, max))
    box.style.left = `${left - base}px`
    // The little pointer stays on the chip's centre.
    box.style.setProperty('--n8tip', `${c.left + c.width / 2 - left}px`)
  }, [open])

  const step = open === null ? null : STEPS[open]

  return (
    <div ref={root} className="relative">
      <HeroChainMeter />
      <div className="flex items-center gap-1 min-[360px]:gap-1.5">
        {STEPS.map(({ word }, i, arr) => (
          <React.Fragment key={word}>
            <button
              ref={(el) => {
                chips.current[i] = el
              }}
              type="button"
              aria-expanded={open === i}
              aria-controls={`${id}-step`}
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse' && !pinned.current) setOpen(i)
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === 'mouse' && !pinned.current) setOpen(null)
              }}
              onFocus={() => {
                if (!pinned.current) setOpen(i)
              }}
              onBlur={(e) => {
                if (!root.current?.contains(e.relatedTarget as Node | null)) close()
              }}
              onClick={() => {
                if (pinned.current && open === i) return close()
                pinned.current = true
                setOpen(i)
              }}
              className={`n8-cnode cursor-pointer rounded-md border px-1.5 min-[360px]:px-2 py-1 sm:px-3 sm:py-1.5 lowercase tracking-wide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300${
                i === 0 ? ' n8-first' : i < arr.length - 1 ? ' n8-split' : ''
              }`}
              style={{
                // 9.2s loop, 1.8s chip spacing, phase-shifted -8.2s so the page loads
                // pulse-mid-wire; the first chip (prompt) fires ~0.53s early so it
                // lights as the wire lands.
                ['--n8delay' as string]: `${(i === 0 ? -0.53 : i * 1.8) - 8.2}s`,
                // prompt starts bottom-left (~8 o'clock), where the wire lands, and repeat
                // at 9 o'clock; the split chips ignore --n8start (they sweep from
                // 270deg +/- the angle).
                ['--n8start' as string]: i === 0 ? '153deg' : i === arr.length - 1 ? '172deg' : '0deg',
                // prompt: sweep 207deg (ends at 3 o'clock) and a short tail;
                // HeroChainMeter refines the start and sweep to the measured wire.
                ...(i === 0 ? { ['--n8k' as string]: 0.92, ['--n8tail' as string]: '21.5%', ['--n8mid' as string]: '23.5%' } : {}),
              }}
            >
              {word}
            </button>
            {/* middle chips (build/ship) carry a second light via
                ::after, so the two halves meet at the 3 o'clock arrow */}
            {i < arr.length - 1 && (
              // arrow lights at the hand-off as the comet leaves chip i
              <span aria-hidden="true" className="n8-carrow" style={{ animationDelay: `${(i === 0 ? 0.43 : i * 1.8 + 0.88) - 8.2}s` }}>
                →
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* loop-back circuit line: repeat (right) -> down -> under the chain ->
          up into prompt (left). preserveAspectRatio=none stretches it to the
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

      {/* The open step's popover: one sentence on what the step means. It floats
          over what comes next, so opening it moves nothing. */}
      <div
        ref={pop}
        id={`${id}-step`}
        role="status"
        data-step={step?.word}
        className={`absolute top-full z-30 mt-3 w-[min(17rem,calc(100vw-2rem))] rounded-xl border border-cyan-300/25 bg-[#081426] px-3.5 py-2.5 font-sans text-[13px] leading-snug tracking-normal normal-case text-slate-200 shadow-xl shadow-black/50 backdrop-blur-sm transition-[opacity,translate] duration-150 select-text motion-reduce:transition-none ${
          step ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
        }`}
      >
        {/* The pointer up to the chip. */}
        <span
          aria-hidden="true"
          className="absolute -top-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-t border-l border-cyan-300/25 bg-[#081426]"
          style={{ left: 'var(--n8tip, 50%)' }}
        />
        {step && (
          <>
            <span className="mb-0.5 block font-mono text-[11px] font-semibold tracking-wide text-cyan-300">{step.word}</span>
            {step.what}
          </>
        )}
      </div>
    </div>
  )
}
