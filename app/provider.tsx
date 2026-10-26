'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'
import { IconContext } from 'react-icons'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'

// react-icons are decorative here (always paired with visible text or an
// aria-label on the control), so hide them from assistive tech by default.
// Simple Icons ship role="img" with no name, which otherwise fails WCAG.
const iconDefaults = { attr: { 'aria-hidden': true } } as const

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <IconContext.Provider value={iconDefaults}>
        {/* Animations follow the OS reduced-motion setting. LazyMotion with
            domAnimation ships only the features the site uses (animate, exit,
            variants, gestures, in-view) to every page; components use the
            light `m.*` elements. The live player, which needs layout
            animations, keeps full `motion` in its own lazily loaded chunk. */}
        <LazyMotion features={domAnimation}>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </LazyMotion>
      </IconContext.Provider>
    </NextThemesProvider>
  )
}
