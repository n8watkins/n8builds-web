'use client'
import { createContext, useCallback, useContext, useMemo, useRef } from 'react'

/**
 * Links the build log card at the top of /builds to the activity feed under
 * it (owner, 2026-11-25): a day picked on the card (clicked, Enter, or its
 * "See" link after a tap) is shown in the feed, which loads as far as that
 * day, lights its entries and brings the first into view (LogFeed).
 */
type DayFocus = {
  /** Asks the feed to show `day` (`YYYY-MM-DD`). */
  show: (day: string) => void
  /** The feed listens for those asks; returns the way to stop. */
  listen: (fn: (day: string) => void) => () => void
  /** How many of the feed's entries fall on each day (only days with any). */
  entriesOn: Record<string, number>
}

const Context = createContext<DayFocus>({ show: () => {}, listen: () => () => {}, entriesOn: {} })

export function LogDayFocusProvider({
  entriesOn,
  children,
}: {
  entriesOn: Record<string, number>
  children: React.ReactNode
}) {
  const listener = useRef<((day: string) => void) | null>(null)
  const show = useCallback((day: string) => listener.current?.(day), [])
  const listen = useCallback((fn: (day: string) => void) => {
    listener.current = fn
    return () => {
      if (listener.current === fn) listener.current = null
    }
  }, [])
  const value = useMemo(() => ({ show, listen, entriesOn }), [show, listen, entriesOn])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useLogDayFocus = () => useContext(Context)
