import { useSyncExternalStore } from 'react'
import type { LiveStatus } from '@/lib/live-shared'

/**
 * The browser's copy of /api/live, shared by the corner player and the
 * navbar's live dots. Polling starts once, from <LiveLoader /> in the root
 * layout, after the page has finished loading, so it never competes with it.
 */

export const LIVE_POLL_MS = 60_000

let status: LiveStatus | null = null
let lastChecked = 0
const listeners = new Set<() => void>()

function setStatus(next: LiveStatus) {
  // Same answer (ignoring when it was checked): keep the old object, so
  // nothing re-renders once a minute for no reason.
  const strip = (s: LiveStatus | null) => (s ? JSON.stringify({ ...s, checkedAt: '' }) : '')
  if (strip(next) === strip(status)) return
  status = next
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useLiveStatus(): LiveStatus | null {
  return useSyncExternalStore(subscribe, () => status, () => null)
}

async function check() {
  lastChecked = Date.now()
  try {
    const response = await fetch('/api/live')
    if (!response.ok) return
    const next = (await response.json()) as LiveStatus
    if (next && typeof next.live === 'boolean' && Array.isArray(next.streams)) setStatus(next)
  } catch {
    // Offline or blocked: keep whatever we had; the next poll tries again.
  }
}

let started = false

/** Start checking after load, then once a minute while the tab is visible. */
export function startLivePolling(): () => void {
  if (started) return () => {}
  started = true
  let interval: ReturnType<typeof setInterval> | undefined
  let cancelIdle: (() => void) | undefined

  const begin = () => {
    const run = () => {
      void check()
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') void check()
      }, LIVE_POLL_MS)
    }
    // After the load event and once the main thread is idle, so the check
    // never delays the page itself.
    // Safari has no requestIdleCallback.
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run, { timeout: 2000 })
      cancelIdle = () => window.cancelIdleCallback(id)
    } else {
      const id = setTimeout(run, 200)
      cancelIdle = () => clearTimeout(id)
    }
  }
  const onVisible = () => {
    if (document.visibilityState === 'visible' && interval && Date.now() - lastChecked >= LIVE_POLL_MS) void check()
  }

  if (document.readyState === 'complete') begin()
  else window.addEventListener('load', begin, { once: true })
  document.addEventListener('visibilitychange', onVisible)

  return () => {
    started = false
    window.removeEventListener('load', begin)
    document.removeEventListener('visibilitychange', onVisible)
    if (interval) clearInterval(interval)
    cancelIdle?.()
  }
}
