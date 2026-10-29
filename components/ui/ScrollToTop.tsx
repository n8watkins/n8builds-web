'use client'

import React, { useSyncExternalStore } from 'react'
import { FaArrowUp } from 'react-icons/fa6'

function subscribe(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  window.addEventListener('resize', onChange, { passive: true })
  return () => {
    window.removeEventListener('scroll', onChange)
    window.removeEventListener('resize', onChange)
  }
}

// The button's spot, from the window's bottom-right corner (bottom-6, right-6,
// 44px across), before the live player and consent banner offsets move it up.
const INSET = 24
const SIZE = 44

/** Read in the browser: the offset the live player or consent banner adds below the button. */
function liftedBy(): number {
  const style = getComputedStyle(document.documentElement)
  const px = (name: string) => parseFloat(style.getPropertyValue(name)) || 0
  return Math.max(px('--live-dock-br'), px('--consent-banner-h'))
}

/**
 * True while an element marked `data-scroll-top-avoid` (the contact form) is
 * under the button's spot, so the button never covers its fields, Send or the
 * email line on a phone.
 */
function covering(): boolean {
  const right = window.innerWidth - INSET
  const bottom = window.innerHeight - INSET - liftedBy()
  const spot = { left: right - SIZE, right, top: bottom - SIZE, bottom }
  return Array.from(document.querySelectorAll('[data-scroll-top-avoid]')).some((el) => {
    const r = el.getBoundingClientRect()
    return r.right > spot.left && r.left < spot.right && r.bottom > spot.top && r.top < spot.bottom
  })
}

const ScrollToTop = () => {
  // Shown once the page is scrolled past 300px, including when it loads
  // already scrolled (a reload mid-page, or a /#section link); steps aside
  // while it would cover the contact form.
  const state = useSyncExternalStore(
    subscribe,
    () => (window.scrollY <= 300 ? 'hidden' : covering() ? 'aside' : 'shown'),
    () => 'hidden'
  )

  const scrollToTop = () => {
    // 'auto' follows the CSS scroll-behavior: smooth, unless the visitor
    // prefers reduced motion (app/globals.css).
    window.scrollTo({
      top: 0,
      behavior: 'auto'
    })
  }

  if (state === 'hidden') {
    return null
  }

  // --live-dock-br: set by the live corner player while it covers the
  // bottom-right corner, so this button sits above it; --consent-banner-h:
  // set by the consent banner while it spans the bottom of a phone screen.
  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top of page"
      aria-hidden={state === 'aside' || undefined}
      tabIndex={state === 'aside' ? -1 : undefined}
      data-state={state}
      className="fixed bottom-[calc(1.5rem+max(var(--live-dock-br,0px),var(--consent-banner-h,0px)))] right-6 z-50 p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 data-[state=aside]:pointer-events-none data-[state=aside]:scale-75 data-[state=aside]:opacity-0 motion-reduce:transition-none"
    >
      <FaArrowUp className="w-4 h-4" aria-hidden="true" />
    </button>
  )
}

export default ScrollToTop
