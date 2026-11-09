'use client'
import { useSyncExternalStore } from 'react'

/** The visitor's desktop OS, or `other` (a phone, a tablet, ChromeOS, anything else). */
export type Platform = 'windows' | 'mac' | 'linux' | 'other'

/** Nothing to listen to: the platform doesn't change while the page is open. */
function subscribe() {
  return () => {}
}

/**
 * The client hint where there is one (Chromium: "Windows", "macOS", "Linux",
 * "Android", "Chrome OS"...), else the user agent string. An iPad asks for
 * the desktop site with a Mac's user agent, so a Mac with a touch screen
 * counts as a tablet.
 */
export function detectPlatform(
  nav: Pick<Navigator, 'userAgent' | 'maxTouchPoints'> & { userAgentData?: { platform?: string; mobile?: boolean } },
): Platform {
  const hint = nav.userAgentData
  if (hint?.platform) {
    if (hint.mobile) return 'other'
    if (/^windows$/i.test(hint.platform)) return 'windows'
    if (/^macos$/i.test(hint.platform)) return 'mac'
    if (/^linux$/i.test(hint.platform)) return 'linux'
    return 'other'
  }
  const ua = nav.userAgent
  if (/Android|iPhone|iPad|iPod|CrOS|Mobile/i.test(ua)) return 'other'
  if (/Windows NT/i.test(ua)) return 'windows'
  if (/Macintosh|Mac OS X/i.test(ua)) return nav.maxTouchPoints > 1 ? 'other' : 'mac'
  if (/Linux|X11/i.test(ua)) return 'linux'
  return 'other'
}

const current = () => detectPlatform(navigator as Parameters<typeof detectPlatform>[0])

/**
 * The visitor's platform, for a desktop app's download to offer the right
 * file there (Scribe: Windows, and macOS and Linux in beta since 2026-11-09)
 * and to lead with its full story anywhere else. The server and the first
 * render say Windows, so the server's HTML is the Windows version; the
 * browser checks its platform once hydrated.
 */
export function usePlatform(): Platform {
  return useSyncExternalStore(subscribe, current, () => 'windows')
}
