import { logger } from '@/lib/logger'
import {
  CHANNELS,
  LIVE_PLATFORMS,
  LIVE_TEST_SCENARIOS,
  LIVE_TEST_YOUTUBE_ID,
  TWITCH_CHANNEL,
  offlineStatus,
  type LivePlatform,
  type LiveStatus,
  type LiveStream,
  type LiveTestScenario,
  type UpcomingStream,
} from '@/lib/live-shared'

export * from '@/lib/live-shared'

/**
 * Server-side live detection: "am I live right now, and where?"
 *
 * Three sources, asked in parallel, merged per platform:
 * - The Sanity "Live status" document: a manual switch flipped in the Studio.
 *   It is the only source for X, and an override for any other platform. It
 *   switches itself off 12 hours after it was switched on.
 * - Twitch Helix (`GET /streams`), when TWITCH_CLIENT_ID and
 *   TWITCH_CLIENT_SECRET are set.
 * - The YouTube Data API (the channel's newest uploads, then whether one is
 *   live: 2 quota units), when YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID are set.
 *   LIVE_YOUTUBE_VIDEO_ID adds one specific video (an unlisted test stream).
 *
 * Answers are cached for 60 seconds per server instance (and by the CDN, see
 * app/api/live/route.ts). Any failure counts as offline: a source that errors
 * is skipped, and the visitor never sees an error.
 */

export const LIVE_CACHE_SECONDS = 60
/** The Studio switch turns itself off this long after it was switched on. */
export const STUDIO_AUTO_OFF_MS = 12 * 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 4000

type Env = Record<string, string | undefined>

export interface LiveDeps {
  env: Env
  fetch: typeof fetch
  now: () => Date
}

const defaultDeps = (): LiveDeps => ({ env: process.env, fetch: globalThis.fetch, now: () => new Date() })

// --- helpers ---------------------------------------------------------------

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function cleanTitle(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const title = value.replace(/\s+/g, ' ').trim()
  if (!title) return null
  return title.length > 140 ? `${title.slice(0, 139).trimEnd()}…` : title
}

/** An https URL, or null. Anything else (javascript:, http:, junk) is dropped. */
function safeUrl(value: unknown): URL | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'])
const TWITCH_HOSTS = new Set(['twitch.tv', 'www.twitch.tv', 'm.twitch.tv'])
const TWITCH_LOGIN = /^[A-Za-z0-9_]{3,25}$/

export function youtubeVideoId(url: URL): string | null {
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null
  const [first, second] = url.pathname.split('/').filter(Boolean)
  const id = url.hostname === 'youtu.be' ? first : first === 'watch' ? url.searchParams.get('v') : ['live', 'embed', 'shorts'].includes(first) ? second : null
  return id && YOUTUBE_ID.test(id) ? id : null
}

function twitchLogin(url: URL): string | null {
  if (!TWITCH_HOSTS.has(url.hostname)) return null
  const [login] = url.pathname.split('/').filter(Boolean)
  return login && TWITCH_LOGIN.test(login) ? login.toLowerCase() : null
}

async function getJson(deps: LiveDeps, url: string, init: RequestInit = {}): Promise<{ status: number; body: unknown }> {
  const response = await deps.fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  const body = response.ok ? await response.json() : null
  return { status: response.status, body }
}

const youtubeWatchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`

// --- source: the Sanity "Live status" switch --------------------------------

export interface StudioLiveStatus {
  live?: boolean
  platform?: string
  url?: string
  title?: string
  startedAt?: string
  _updatedAt?: string
}

/** The stream the Studio switch describes, or null when it's off, expired or unusable. */
export function studioStream(doc: StudioLiveStatus | null | undefined, now: Date, env: Env = {}): LiveStream | null {
  if (!doc || doc.live !== true) return null
  // startedAt is set by the Studio when the switch goes on; _updatedAt covers
  // a document edited outside it.
  const started = parseDate(doc.startedAt) ?? parseDate(doc._updatedAt)
  if (!started || now.getTime() - started.getTime() > STUDIO_AUTO_OFF_MS) return null

  const platform: LivePlatform = (LIVE_PLATFORMS as readonly string[]).includes(doc.platform ?? '') ? (doc.platform as LivePlatform) : 'other'
  const given = safeUrl(doc.url)
  const base = { id: `studio:${platform}:${started.toISOString()}`, platform, title: cleanTitle(doc.title), startedAt: started.toISOString(), source: 'studio' as const }

  switch (platform) {
    case 'twitch': {
      const channel = (given && twitchLogin(given)) || TWITCH_CHANNEL
      return { ...base, url: given?.href ?? CHANNELS.twitch.url, embed: { kind: 'twitch', channel } }
    }
    case 'youtube': {
      const videoId = given ? youtubeVideoId(given) : null
      const channelId = env.YOUTUBE_CHANNEL_ID?.trim()
      const url = given?.href ?? (channelId ? `https://www.youtube.com/channel/${channelId}/live` : null)
      if (!url) return null
      return { ...base, url, embed: videoId ? { kind: 'youtube', videoId } : null }
    }
    case 'x':
      // X has no live player embed; the player shows a card with "Watch on X".
      return { ...base, url: given?.href ?? CHANNELS.x.url, embed: null }
    default:
      return given ? { ...base, url: given.href, embed: null } : null
  }
}

async function fetchStudioStatus(deps: LiveDeps): Promise<StudioLiveStatus | null> {
  const projectId = deps.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  if (!projectId) return null
  const query = '*[_id == "liveStatus"][0]{live, platform, url, title, startedAt, _updatedAt}'
  // The public CDN serves only published documents; no token is involved.
  const url = `https://${projectId}.apicdn.sanity.io/v2024-07-01/data/query/production?query=${encodeURIComponent(query)}`
  const { status, body } = await getJson(deps, url)
  if (status !== 200) throw new Error(`Sanity live status: HTTP ${status}`)
  return ((body as { result?: StudioLiveStatus | null })?.result ?? null) || null
}

// --- source: Twitch Helix --------------------------------------------------

let twitchToken: { value: string; expiresAt: number } | null = null

async function getTwitchToken(deps: LiveDeps, clientId: string, secret: string): Promise<string> {
  if (twitchToken && twitchToken.expiresAt > deps.now().getTime()) return twitchToken.value
  const params = new URLSearchParams({ client_id: clientId, client_secret: secret, grant_type: 'client_credentials' })
  const { status, body } = await getJson(deps, 'https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const token = body as { access_token?: string; expires_in?: number } | null
  if (status !== 200 || !token?.access_token) throw new Error(`Twitch token: HTTP ${status}`)
  // Renew a minute early so a request never goes out with an expiring token.
  const lifetime = Math.max(0, ((token.expires_in ?? 3600) - 60) * 1000)
  twitchToken = { value: token.access_token, expiresAt: deps.now().getTime() + lifetime }
  return token.access_token
}

export async function twitchStream(deps: LiveDeps): Promise<LiveStream | null> {
  const clientId = deps.env.TWITCH_CLIENT_ID?.trim()
  const secret = deps.env.TWITCH_CLIENT_SECRET?.trim()
  if (!clientId || !secret) return null
  const channel = TWITCH_CHANNEL

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getTwitchToken(deps, clientId, secret)
    const { status, body } = await getJson(deps, `https://api.twitch.tv/helix/streams?user_login=${channel}`, {
      headers: { 'Client-Id': clientId, Authorization: `Bearer ${token}` },
    })
    if (status === 401 && attempt === 0) {
      // Revoked or expired early: get a fresh token once.
      twitchToken = null
      continue
    }
    if (status !== 200) throw new Error(`Twitch streams: HTTP ${status}`)
    const stream = (body as { data?: { id?: string; type?: string; title?: string; started_at?: string }[] })?.data?.[0]
    if (!stream || stream.type !== 'live') return null
    return {
      id: `twitch:${stream.id ?? stream.started_at ?? 'live'}`,
      platform: 'twitch',
      title: cleanTitle(stream.title),
      url: CHANNELS.twitch.url,
      embed: { kind: 'twitch', channel },
      startedAt: parseDate(stream.started_at)?.toISOString() ?? null,
      source: 'twitch-api',
    }
  }
  return null
}

// --- source: YouTube Data API ----------------------------------------------

interface YouTubeVideo {
  id?: string
  snippet?: { title?: string; liveBroadcastContent?: string }
  liveStreamingDetails?: { actualStartTime?: string; scheduledStartTime?: string }
  status?: { embeddable?: boolean; madeForKids?: boolean; privacyStatus?: string }
  contentDetails?: { contentRating?: { ytRating?: string } }
}

/** YouTube refuses to play these on other sites, so the player shows the card instead. */
function youtubeEmbeddable(video: YouTubeVideo): boolean {
  return video.status?.embeddable !== false && video.status?.madeForKids !== true && video.contentDetails?.contentRating?.ytRating !== 'ytAgeRestricted'
}

export async function youtubeCheck(deps: LiveDeps): Promise<{ live: LiveStream | null; upcoming: UpcomingStream | null }> {
  const key = deps.env.YOUTUBE_API_KEY?.trim()
  const channelId = deps.env.YOUTUBE_CHANNEL_ID?.trim()
  const overrideRaw = deps.env.LIVE_YOUTUBE_VIDEO_ID?.trim()
  const override = overrideRaw && YOUTUBE_ID.test(overrideRaw) ? overrideRaw : null
  const none = { live: null, upcoming: null }

  if (!key) {
    // Without an API key the override can't be verified, so it is taken at its word.
    if (!override) return none
    return {
      live: { id: `youtube:${override}`, platform: 'youtube', title: null, url: youtubeWatchUrl(override), embed: { kind: 'youtube', videoId: override }, startedAt: null, source: 'override' },
      upcoming: null,
    }
  }

  const ids: string[] = override ? [override] : []
  // A channel ID is "UC" plus 22 characters; its uploads playlist is "UU" plus the same 22.
  if (channelId && /^UC[A-Za-z0-9_-]{22}$/.test(channelId)) {
    const playlist = `UU${channelId.slice(2)}`
    const { status, body } = await getJson(
      deps,
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=10&playlistId=${playlist}&key=${encodeURIComponent(key)}`
    )
    if (status !== 200) throw new Error(`YouTube playlistItems: HTTP ${status}`)
    for (const item of (body as { items?: { contentDetails?: { videoId?: string } }[] })?.items ?? []) {
      const id = item.contentDetails?.videoId
      if (id && YOUTUBE_ID.test(id) && !ids.includes(id)) ids.push(id)
    }
  }
  if (ids.length === 0) return none

  const { status, body } = await getJson(
    deps,
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,status,contentDetails&id=${ids.join(',')}&key=${encodeURIComponent(key)}`
  )
  if (status !== 200) throw new Error(`YouTube videos: HTTP ${status}`)
  const videos = ((body as { items?: YouTubeVideo[] })?.items ?? []).filter((v) => v.id && YOUTUBE_ID.test(v.id))

  const liveVideo = videos.find((v) => v.snippet?.liveBroadcastContent === 'live')
  const live: LiveStream | null = liveVideo
    ? {
        id: `youtube:${liveVideo.id}`,
        platform: 'youtube',
        title: cleanTitle(liveVideo.snippet?.title),
        url: youtubeWatchUrl(liveVideo.id!),
        embed: youtubeEmbeddable(liveVideo) ? { kind: 'youtube', videoId: liveVideo.id! } : null,
        startedAt: parseDate(liveVideo.liveStreamingDetails?.actualStartTime)?.toISOString() ?? null,
        source: liveVideo.id === override ? 'override' : 'youtube-api',
      }
    : null

  const now = deps.now().getTime()
  const upcoming =
    videos
      .filter((v) => v.snippet?.liveBroadcastContent === 'upcoming')
      .map((v) => ({ video: v, at: parseDate(v.liveStreamingDetails?.scheduledStartTime) }))
      .filter((u): u is { video: YouTubeVideo; at: Date } => u.at !== null && u.at.getTime() > now)
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .map(({ video, at }) => ({ platform: 'youtube' as const, title: cleanTitle(video.snippet?.title), url: youtubeWatchUrl(video.id!), scheduledFor: at.toISOString() }))[0] ?? null

  return { live, upcoming }
}

// --- merging ---------------------------------------------------------------

/**
 * One stream per platform, in display order. A platform check that sees the
 * stream wins (it has the real title and embed); the Studio switch fills in
 * any platform the checks missed, and its title, when set, replaces theirs.
 */
export function mergeStreams(auto: (LiveStream | null)[], studio: LiveStream | null, preferredEnv?: string): Pick<LiveStatus, 'streams' | 'preferred'> {
  const byPlatform = new Map<LivePlatform, LiveStream>()
  for (const stream of auto) if (stream) byPlatform.set(stream.platform, stream)
  if (studio) {
    const found = byPlatform.get(studio.platform)
    byPlatform.set(studio.platform, found ? { ...found, title: studio.title ?? found.title } : studio)
  }
  const streams = LIVE_PLATFORMS.map((p) => byPlatform.get(p)).filter((s): s is LiveStream => Boolean(s))
  const preferred = streams.find((s) => s.platform === preferredEnv)?.platform ?? streams[0]?.platform ?? null
  return { streams, preferred }
}

/** Ask every configured source once, with no caching. Never throws. */
export async function resolveLiveStatus(deps: LiveDeps = defaultDeps()): Promise<LiveStatus> {
  const now = deps.now()
  const [studio, twitch, youtube] = await Promise.allSettled([fetchStudioStatus(deps), twitchStream(deps), youtubeCheck(deps)])
  for (const [name, result] of [['studio', studio], ['twitch', twitch], ['youtube', youtube]] as const) {
    if (result.status === 'rejected') logger.warn(`Live check (${name}) failed; counting it as offline:`, result.reason instanceof Error ? result.reason.message : 'unknown error')
  }

  const studioLive = studio.status === 'fulfilled' ? studioStream(studio.value, now, deps.env) : null
  const twitchLive = twitch.status === 'fulfilled' ? twitch.value : null
  const yt = youtube.status === 'fulfilled' ? youtube.value : { live: null, upcoming: null }
  const { streams, preferred } = mergeStreams([twitchLive, yt.live], studioLive, deps.env.LIVE_PREFERRED_PLATFORM?.trim())

  return { live: streams.length > 0, streams, preferred, upcoming: streams.length ? null : yt.upcoming, checkedAt: now.toISOString() }
}

// --- test mode -------------------------------------------------------------

/**
 * LIVE_TEST_MODE=1 swaps every source for fixed fake answers, so end-to-end
 * tests can cover each case without credentials or a real stream. The
 * scenario comes from the `n8-live-test` cookie, else LIVE_TEST_SCENARIO,
 * else "none". Ignored whenever VERCEL is set, so it can never reach a deploy.
 */
export function isLiveTestMode(env: Env = process.env): boolean {
  if (env.LIVE_TEST_MODE !== '1') return false
  if (env.VERCEL) {
    logger.error('LIVE_TEST_MODE is set on Vercel - ignoring it')
    return false
  }
  return true
}

const TEST_STARTED = '2026-10-24T17:00:00.000Z'

const testStreams: Record<'twitch' | 'youtube' | 'youtube-no-embed' | 'x' | 'other', LiveStream> = {
  twitch: { id: 'test:twitch', platform: 'twitch', title: 'Building the live player, live', url: CHANNELS.twitch.url, embed: { kind: 'twitch', channel: TWITCH_CHANNEL }, startedAt: TEST_STARTED, source: 'test' },
  youtube: { id: 'test:youtube', platform: 'youtube', title: 'Shipping features with AI agents', url: youtubeWatchUrl(LIVE_TEST_YOUTUBE_ID), embed: { kind: 'youtube', videoId: LIVE_TEST_YOUTUBE_ID }, startedAt: TEST_STARTED, source: 'test' },
  'youtube-no-embed': { id: 'test:youtube-no-embed', platform: 'youtube', title: 'A stream YouTube won’t embed', url: youtubeWatchUrl(LIVE_TEST_YOUTUBE_ID), embed: null, startedAt: TEST_STARTED, source: 'test' },
  x: { id: 'test:x', platform: 'x', title: 'Live on X: Q&A', url: 'https://x.com/n8watkins/status/1850000000000000000', embed: null, startedAt: TEST_STARTED, source: 'test' },
  other: { id: 'test:other', platform: 'other', title: 'Guest stream', url: 'https://example.com/stream', embed: null, startedAt: TEST_STARTED, source: 'test' },
}

const testScenarioStreams: Record<LiveTestScenario, (keyof typeof testStreams)[]> = {
  none: [],
  twitch: ['twitch'],
  youtube: ['youtube'],
  both: ['twitch', 'youtube'],
  x: ['x'],
  all: ['twitch', 'youtube', 'x'],
  'youtube-no-embed': ['youtube-no-embed'],
  other: ['other'],
}

export function testLiveStatus(scenario: string | null | undefined, now: Date = new Date()): LiveStatus {
  const name: LiveTestScenario = (LIVE_TEST_SCENARIOS as readonly string[]).includes(scenario ?? '') ? (scenario as LiveTestScenario) : 'none'
  const streams = testScenarioStreams[name].map((key) => testStreams[key])
  const upcoming: UpcomingStream | null = streams.length
    ? null
    : { platform: 'youtube', title: 'Next build stream', url: youtubeWatchUrl(LIVE_TEST_YOUTUBE_ID), scheduledFor: '2099-01-01T18:00:00.000Z' }
  return { live: streams.length > 0, streams, preferred: streams[0]?.platform ?? null, upcoming, checkedAt: now.toISOString() }
}

// --- cached entry point ----------------------------------------------------

let cached: { status: LiveStatus; expiresAt: number } | null = null
let inflight: Promise<LiveStatus> | null = null

/**
 * The live status, cached for 60 seconds per server instance; concurrent
 * callers share one check. Never throws: any failure is "offline".
 */
export async function getLiveStatus(options: { testScenario?: string | null } = {}, deps: LiveDeps = defaultDeps()): Promise<LiveStatus> {
  if (isLiveTestMode(deps.env)) return testLiveStatus(options.testScenario ?? deps.env.LIVE_TEST_SCENARIO, deps.now())

  const now = deps.now()
  if (cached && cached.expiresAt > now.getTime()) return cached.status
  if (inflight) return inflight

  inflight = resolveLiveStatus(deps)
    .catch((error: unknown) => {
      logger.warn('Live check failed; answering offline:', error instanceof Error ? error.message : 'unknown error')
      return offlineStatus(now)
    })
    .then((status) => {
      cached = { status, expiresAt: deps.now().getTime() + LIVE_CACHE_SECONDS * 1000 }
      return status
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** Tests only: forget the cached answer and the Twitch token. */
export function resetLiveCache(): void {
  cached = null
  inflight = null
  twitchToken = null
}
