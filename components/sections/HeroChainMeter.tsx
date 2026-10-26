'use client'
import { useEffect, useRef } from 'react'

/**
 * The hero chain's two bits of script, as a small island inside the
 * server-rendered chain (components/sections/Hero.tsx).
 *
 * It sets --n8wire on the chain to the loop-back wire's on-screen length. The
 * SVG stretches with preserveAspectRatio="none", so the path is sampled in
 * viewBox units and scaled to pixels on each axis; re-measured on every resize.
 *
 * And it pauses the hero's endless CSS animations (the chain's comets and the
 * CTA's spinning border) while the hero is off screen: they restyle and
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
