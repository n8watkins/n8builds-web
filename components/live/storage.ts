/**
 * The visitor's player choices, kept in localStorage. Every access is wrapped:
 * storage can be missing, full or blocked (private windows, strict privacy
 * settings), and then the player simply forgets.
 */

export type Corner = 'bottom-right' | 'bottom-left' | 'top-left' | 'top-right'
export const CORNERS: Corner[] = ['bottom-right', 'bottom-left', 'top-left', 'top-right']

export interface PlayerPrefs {
  corner: Corner
  minimized: boolean
}

const PREFS_KEY = 'n8-live:prefs'
const CLOSED_KEY = 'n8-live:closed'
const MAX_CLOSED = 20

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: the choice lasts until the page is left.
  }
}

export function readPrefs(): PlayerPrefs {
  const saved = read(PREFS_KEY) as Partial<PlayerPrefs> | null
  return {
    corner: saved && CORNERS.includes(saved.corner as Corner) ? (saved.corner as Corner) : 'bottom-right',
    minimized: saved?.minimized === true,
  }
}

export function writePrefs(prefs: PlayerPrefs) {
  write(PREFS_KEY, prefs)
}

/** Streams the visitor closed. Closing hides that stream, not every future one. */
export function readClosed(): string[] {
  const saved = read(CLOSED_KEY)
  return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []
}

export function addClosed(ids: string[]) {
  const next = [...readClosed().filter((id) => !ids.includes(id)), ...ids].slice(-MAX_CLOSED)
  write(CLOSED_KEY, next)
}
