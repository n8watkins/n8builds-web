'use client'
import { useEffect } from 'react'

/**
 * The entrance of My dev setup's tiles (`.setup-tile` in app/globals.css).
 * The tiles rise in from the server HTML with CSS alone, one by one and then
 * their chips, like FadeIn: without JavaScript they still play and end fully
 * shown. This script only makes the tiles still below the window wait for
 * it: once hydrated, each tile entirely off screen is held hidden (it can't
 * be seen, so nothing flashes), and plays when it scrolls into view, the
 * tiles arriving together staggered from the first of them. Reduced motion
 * plays nothing and holds nothing.
 */
export default function SetupTilesMotion({ gridId }: { gridId: string }) {
  useEffect(() => {
    const grid = document.getElementById(gridId)
    if (!grid || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const tiles = [...grid.querySelectorAll<HTMLElement>(':scope > .setup-tile')]

    // Plays the tiles a scroll brings in, staggered among themselves.
    const play = new IntersectionObserver(
      (entries) => {
        const arriving = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement)
        arriving.sort((a, b) => tiles.indexOf(a) - tiles.indexOf(b))
        arriving.forEach((tile, i) => {
          tile.style.setProperty('--d', String(i))
          tile.removeAttribute('data-wait')
          play.unobserve(tile)
        })
      },
      { rootMargin: '0px 0px -60px 0px' }
    )

    // First look: a tile wholly below the window waits; the rest play on as they are.
    const first = new IntersectionObserver((entries) => {
      first.disconnect()
      for (const entry of entries) {
        const tile = entry.target as HTMLElement
        if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) continue
        tile.setAttribute('data-wait', '')
        play.observe(tile)
      }
    })
    tiles.forEach((tile) => first.observe(tile))
    return () => {
      first.disconnect()
      play.disconnect()
    }
  }, [gridId])

  return null
}
