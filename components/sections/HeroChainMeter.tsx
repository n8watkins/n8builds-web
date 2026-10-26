'use client'
import { useEffect, useRef } from 'react'

/**
 * The hero chain's two bits of script, as a small island inside the
 * server-rendered chain (components/sections/Hero.tsx).
 *
 * It sets --n8wire on the chain to the loop-back wire's on-screen length. The
 * SVG stretches with preserveAspectRatio="none", so the path is sampled in
 * viewBox units and scaled to pixels on each axis; re-measured on every resize.
 * From the same measure it aims the first chip's comet at the wire's landing point.
 *
 * And it pauses the hero's endless animations (the chain's comets and the
 * background grid's wandering cells) while the hero is off screen: they restyle and
 * repaint every frame, which costs a phone something even where no one sees it.
 */
export default function HeroChainMeter() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current?.parentElement
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

      // The first chip's comet starts exactly where the wire lands on it
      // (the path's end, on the chip's bottom edge near its left corner) and
      // still finishes at 3 o'clock, by the arrow. The conic gradient's rays
      // come from the chip's centre, so the start is the angle from there to
      // the landing point (clockwise from 12 o'clock); the sweep is scaled to
      // end at 90deg (450deg). See .n8-cnode in app/globals.css.
      const chip = el.querySelector<HTMLElement>('.n8-cnode')
      if (!chip) return
      const box = chip.getBoundingClientRect()
      const svgBox = svg.getBoundingClientRect()
      const end = path.getPointAtLength(total)
      const dx = svgBox.left + end.x * sx - (box.left + box.width / 2)
      const dy = svgBox.top + end.y * sy - (box.top + box.height / 2)
      const angle = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360
      // The comet's bright head sits 90deg ahead of the gradient's from-angle.
      chip.style.setProperty('--n8start', `${(angle - 90).toFixed(1)}deg`)
      chip.style.setProperty('--n8k', ((450 - angle) / 225).toFixed(3))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(svg)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const hero = ref.current?.closest<HTMLElement>('#home')
    if (!hero || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      hero.toggleAttribute('data-offscreen', !entry.isIntersecting)
    })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return <span ref={ref} hidden />
}
