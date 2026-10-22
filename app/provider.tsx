'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'
import { IconContext } from 'react-icons'

// react-icons are decorative here (always paired with visible text or an
// aria-label on the control), so hide them from assistive tech by default.
// Simple Icons ship role="img" with no name, which otherwise fails WCAG.
const iconDefaults = { attr: { 'aria-hidden': true } } as const

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <IconContext.Provider value={iconDefaults}>{children}</IconContext.Provider>
    </NextThemesProvider>
  )
}
