/**
 * Live-stream types and constants shared by the server resolver (lib/live.ts),
 * the /api/live route, the /live page and the browser player. Nothing here
 * touches the network or the environment, so client code can import it.
 */

export const LIVE_PLATFORMS = ['twitch', 'youtube', 'x', 'other'] as const
export type LivePlatform = (typeof LIVE_PLATFORMS)[number]

/** How the player can embed a stream; null means "show the Watch on card". */
export type LiveEmbed = { kind: 'twitch'; channel: string } | { kind: 'youtube'; videoId: string }

export interface LiveStream {
  /** Stable per broadcast, so closing the player hides only this stream. */
  id: string
  platform: LivePlatform
  title: string | null
  /** The stream on the real platform (opened by the "Watch on" buttons and /live). */
  url: string
  embed: LiveEmbed | null
  startedAt: string | null
  /** Where the answer came from. */
  source: 'twitch-api' | 'youtube-api' | 'studio' | 'override' | 'test'
}

export interface UpcomingStream {
  platform: 'youtube'
  title: string | null
  url: string
  scheduledFor: string
}

export interface LiveStatus {
  live: boolean
  /** Live streams in display order: Twitch, YouTube, X, other. */
  streams: LiveStream[]
  /** The platform /live sends people to and the player opens on. */
  preferred: LivePlatform | null
  /** The next scheduled YouTube stream, when the YouTube check sees one. */
  upcoming: UpcomingStream | null
  checkedAt: string
}

export const TWITCH_CHANNEL = 'n8watkins'
export const X_HANDLE = 'n8watkins'

export const CHANNELS = {
  twitch: { label: 'Twitch', url: `https://twitch.tv/${TWITCH_CHANNEL}` },
  x: { label: 'X', url: `https://x.com/${X_HANDLE}` },
} as const

export const PLATFORM_LABEL: Record<LivePlatform, string> = {
  twitch: 'Twitch',
  youtube: 'YouTube',
  x: 'X',
  other: 'the stream',
}

/** The answer whenever anything goes wrong: never an error, just offline. */
export function offlineStatus(now: Date = new Date()): LiveStatus {
  return { live: false, streams: [], preferred: null, upcoming: null, checkedAt: now.toISOString() }
}

/**
 * Fake answers for end-to-end tests (LIVE_TEST_MODE=1). Each name is a
 * scenario a test can pick with the `n8-live-test` cookie.
 */
export const LIVE_TEST_SCENARIOS = ['none', 'twitch', 'youtube', 'both', 'x', 'all', 'youtube-no-embed', 'other'] as const
export type LiveTestScenario = (typeof LIVE_TEST_SCENARIOS)[number]
export const LIVE_TEST_COOKIE = 'n8-live-test'
export const LIVE_TEST_YOUTUBE_ID = 'n8LiveTest1'
