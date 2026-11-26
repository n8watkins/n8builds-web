'use client'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

/**
 * Links the build log card at the top of /builds to the activity feed under
 * it (owner, 2026-11-25): a day picked on the card (clicked, Enter, or its
 * "See" link after a tap) is shown in the feed, which loads as far as that
 * day, lights its entries and brings the first into view (LogFeed). A day the
 * pointer rests on is previewed: its entries in the feed light softly where
 * they already are, and nothing scrolls.
 */
type DayFocus = {
  /** Asks the feed to show `day` (`YYYY-MM-DD`). */
  show: (day: string) => void
  /** The feed listens for those asks; returns the way to stop. */
  listen: (fn: (day: string) => void) => () => void
  /** The day being previewed, or null. */
  preview: string | null
  setPreview: (day: string | null) => void
  /** How many of the feed's entries fall on each day (only days with any). */
  entriesOn: Record<string, number>
}

const Context = createContext<DayFocus>({
  show: () => {},
  listen: () => () => {},
  preview: null,
  setPreview: () => {},
  entriesOn: {},
})

export function LogDayFocusProvider({
  entriesOn,
  children,
}: {
  entriesOn: Record<string, number>
  children: React.ReactNode
}) {
  const listener = useRef<((day: string) => void) | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const show = useCallback((day: string) => listener.current?.(day), [])
  const listen = useCallback((fn: (day: string) => void) => {
    listener.current = fn
    return () => {
      if (listener.current === fn) listener.current = null
    }
  }, [])
  const value = useMemo(
    () => ({ show, listen, preview, setPreview, entriesOn }),
    [show, listen, preview, entriesOn]
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useLogDayFocus = () => useContext(Context)
