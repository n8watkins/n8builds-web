'use client'

import React, { useSyncExternalStore } from 'react'
import { FaArrowUp } from 'react-icons/fa6'

function subscribe(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

const ScrollToTop = () => {
  // Shown once the page is scrolled past 300px, including when it loads
  // already scrolled (a reload mid-page, or a /#section link).
  const isVisible = useSyncExternalStore(
    subscribe,
    () => window.scrollY > 300,
    () => false
  )

  const scrollToTop = () => {
    // 'auto' follows the CSS scroll-behavior: smooth, unless the visitor
    // prefers reduced motion (app/globals.css).
    window.scrollTo({
      top: 0,
      behavior: 'auto'
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top of page"
      className="fixed bottom-6 right-6 z-50 p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <FaArrowUp className="w-4 h-4" aria-hidden="true" />
    </button>
  )
}

export default ScrollToTop