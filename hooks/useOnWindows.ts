'use client'
import { useSyncExternalStore } from 'react'

/** Nothing to listen to: the platform doesn't change while the page is open. */
function subscribe() {
  return () => {}
}

/**
 * Whether this browser runs on Windows: the client hint where there is one
 * (Chromium), else the user agent string. Phones and tablets are never Windows.
 */
function onWindows(): boolean {
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform
  if (platform) return /^windows$/i.test(platform)
  return /Windows NT/i.test(navigator.userAgent)
}

/**
 * Whether the visitor is on Windows, for Scribe (a Windows-only app) to lead
 * with its download there and with its full story anywhere else (owner,
 * 2026-11-08). The server and the first render say yes, so the server's HTML
 * is the Windows version; the browser checks its platform once hydrated. The
 * one place this is decided: the homepage's Scribe row (ScribeActions) and
 * /loadout's (PlatformGroup in FeaturedProjectIslands) both use it.
 */
export function useOnWindows(): boolean {
  return useSyncExternalStore(subscribe, onWindows, () => true)
}
