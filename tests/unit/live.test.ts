import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

const {
  STUDIO_AUTO_OFF_MS,
  getLiveStatus,
  mergeStreams,
  resetLiveCache,
  resolveLiveStatus,
  studioStream,
  testLiveStatus,
  youtubeVideoId,
} = await import('@/lib/live')
type LiveDeps = import('@/lib/live').LiveDeps

const NOW = new Date('2026-10-24T18:00:00.000Z')
const CHANNEL_ID = 'UC1234567890abcdefghijkl'

type Handler = (url: URL, init?: RequestInit) => { status?: number; body?: unknown } | Promise<never>

/** A fake fetch that routes by host and path, and records every call. */
function fakeFetch(handlers: Record<string, Handler>) {
  const calls: string[] = []
  const fn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    const key = `${url.hostname}${url.pathname}`
    calls.push(key)
    const handler = Object.entries(handlers).find(([prefix]) => key.startsWith(prefix))?.[1]
    if (!handler) return new Response('not found', { status: 404 })
    const { status = 200, body = {} } = await handler(url, init)
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  })
  return { fetch: fn as unknown as typeof fetch, calls }
}

const SANITY = 'abgyc32w.apicdn.sanity.io/v2024-07-01/data/query/production'
const TWITCH_TOKEN = 'id.twitch.tv/oauth2/token'
const TWITCH_STREAMS = 'api.twitch.tv/helix/streams'
const YT_PLAYLIST = 'www.googleapis.com/youtube/v3/playlistItems'
const YT_VIDEOS = 'www.googleapis.com/youtube/v3/videos'

const twitchLive = () => ({ body: { data: [{ id: '42', type: 'live', title: 'Live from Twitch', started_at: '2026-10-24T17:30:00Z' }] } })
const twitchOffline = () => ({ body: { data: [] } })
const token = () => ({ body: { access_token: 'tok', expires_in: 3600 } })
const studio = (doc: object | null) => () => ({ body: { result: doc } })
const playlist = (...ids: string[]) => () => ({ body: { items: ids.map((videoId) => ({ contentDetails: { videoId } })) } })
const video = (id: string, broadcast: 'live' | 'upcoming' | 'none', extra: object = {}) => ({
  id,
  snippet: { title: `Video ${id}`, liveBroadcastContent: broadcast },
  liveStreamingDetails: { actualStartTime: '2026-10-24T17:45:00Z', scheduledStartTime: '2026-10-25T18:00:00Z' },
  status: { embeddable: true },
  ...extra,
})
const videos = (...items: object[]) => () => ({ body: { items } })

const ALL_ENV = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: 'abgyc32w',
  TWITCH_CLIENT_ID: 'cid',
  TWITCH_CLIENT_SECRET: 'secret',
  YOUTUBE_API_KEY: 'key',
  YOUTUBE_CHANNEL_ID: CHANNEL_ID,
}

function deps(env: Record<string, string>, fetch: typeof globalThis.fetch, now = NOW): LiveDeps {
  return { env, fetch, now: () => now }
}

beforeEach(() => resetLiveCache())

describe('studioStream (the Sanity switch)', () => {
  it('is off unless live is true', () => {
    expect(studioStream(null, NOW)).toBeNull()
    expect(studioStream({ live: false, platform: 'x', startedAt: NOW.toISOString() }, NOW)).toBeNull()
  })

  it('turns itself off 12 hours after it was switched on', () => {
    const at = (ms: number) => new Date(NOW.getTime() - ms).toISOString()
    expect(studioStream({ live: true, platform: 'x', startedAt: at(STUDIO_AUTO_OFF_MS - 60_000) }, NOW)).not.toBeNull()
    expect(studioStream({ live: true, platform: 'x', startedAt: at(STUDIO_AUTO_OFF_MS + 60_000) }, NOW)).toBeNull()
  })

  it('falls back to _updatedAt when startedAt is missing, and is off with neither', () => {
    const old = new Date(NOW.getTime() - STUDIO_AUTO_OFF_MS - 1).toISOString()
    expect(studioStream({ live: true, platform: 'x', _updatedAt: NOW.toISOString() }, NOW)).not.toBeNull()
    expect(studioStream({ live: true, platform: 'x', _updatedAt: old }, NOW)).toBeNull()
    expect(studioStream({ live: true, platform: 'x' }, NOW)).toBeNull()
  })

  it('makes an X card with no embed, defaulting to the X profile', () => {
    const stream = studioStream({ live: true, platform: 'x', title: '  Q&A  ', startedAt: NOW.toISOString() }, NOW)
    expect(stream).toMatchObject({ platform: 'x', title: 'Q&A', url: 'https://x.com/n8watkins', embed: null, source: 'studio' })
    const post = studioStream({ live: true, platform: 'x', url: 'https://x.com/n8watkins/status/1', startedAt: NOW.toISOString() }, NOW)
    expect(post?.url).toBe('https://x.com/n8watkins/status/1')
  })

  it('embeds Twitch and YouTube from their URLs', () => {
    const startedAt = NOW.toISOString()
    expect(studioStream({ live: true, platform: 'twitch', startedAt }, NOW)?.embed).toEqual({ kind: 'twitch', channel: 'n8watkins' })
    expect(studioStream({ live: true, platform: 'youtube', url: 'https://youtu.be/abcdefghijk', startedAt }, NOW)?.embed).toEqual({ kind: 'youtube', videoId: 'abcdefghijk' })
    // A YouTube switch with no video link and no channel has nowhere to send people.
    expect(studioStream({ live: true, platform: 'youtube', startedAt }, NOW)).toBeNull()
    expect(studioStream({ live: true, platform: 'youtube', startedAt }, NOW, { YOUTUBE_CHANNEL_ID: CHANNEL_ID })).toMatchObject({
      url: `https://www.youtube.com/channel/${CHANNEL_ID}/live`,
      embed: null,
    })
  })

  it('drops unsafe links', () => {
    const startedAt = NOW.toISOString()
    expect(studioStream({ live: true, platform: 'other', url: 'javascript:alert(1)', startedAt }, NOW)).toBeNull()
    expect(studioStream({ live: true, platform: 'other', url: 'http://example.com', startedAt }, NOW)).toBeNull()
    expect(studioStream({ live: true, platform: 'x', url: 'javascript:alert(1)', startedAt }, NOW)?.url).toBe('https://x.com/n8watkins')
    expect(studioStream({ live: true, platform: 'other', url: 'https://example.com/live', startedAt }, NOW)).toMatchObject({ platform: 'other', embed: null })
  })

  it('treats an unknown platform as other', () => {
    expect(studioStream({ live: true, platform: 'kick', url: 'https://kick.com/x', startedAt: NOW.toISOString() }, NOW)?.platform).toBe('other')
  })
})

describe('youtubeVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=abcdefghijk', 'abcdefghijk'],
    ['https://youtu.be/abcdefghijk', 'abcdefghijk'],
    ['https://www.youtube.com/live/abcdefghijk?si=x', 'abcdefghijk'],
    ['https://www.youtube.com/@n8watkins/live', null],
    ['https://evil.example/watch?v=abcdefghijk', null],
  ])('%s', (url, id) => {
    expect(youtubeVideoId(new URL(url))).toBe(id)
  })
})

describe('resolveLiveStatus', () => {
  it('is offline with no credentials and no Studio switch, asking only Sanity', async () => {
    const { fetch, calls } = fakeFetch({ [SANITY]: studio(null) })
    const status = await resolveLiveStatus(deps({ NEXT_PUBLIC_SANITY_PROJECT_ID: 'abgyc32w' }, fetch))
    expect(status).toMatchObject({ live: false, streams: [], preferred: null })
    expect(calls).toEqual([SANITY])
  })

  it('skips Twitch and YouTube until their credentials are set', async () => {
    const { fetch, calls } = fakeFetch({ [SANITY]: studio(null), [TWITCH_TOKEN]: token, [TWITCH_STREAMS]: twitchLive })
    await resolveLiveStatus(deps({ NEXT_PUBLIC_SANITY_PROJECT_ID: 'abgyc32w', TWITCH_CLIENT_ID: 'cid', YOUTUBE_CHANNEL_ID: CHANNEL_ID }, fetch))
    expect(calls).toEqual([SANITY])
  })

  it('sees a live Twitch stream', async () => {
    const { fetch } = fakeFetch({ [SANITY]: studio(null), [TWITCH_TOKEN]: token, [TWITCH_STREAMS]: twitchLive, [YT_PLAYLIST]: playlist('aaaaaaaaaaa'), [YT_VIDEOS]: videos(video('aaaaaaaaaaa', 'none')) })
    const status = await resolveLiveStatus(deps(ALL_ENV, fetch))
    expect(status.live).toBe(true)
    expect(status.preferred).toBe('twitch')
    expect(status.streams).toEqual([
      expect.objectContaining({ id: 'twitch:42', platform: 'twitch', title: 'Live from Twitch', url: 'https://twitch.tv/n8watkins', embed: { kind: 'twitch', channel: 'n8watkins' }, source: 'twitch-api' }),
    ])
  })

  it('sends the Twitch app credentials and token', async () => {
    const { fetch } = fakeFetch({ [SANITY]: studio(null), [TWITCH_TOKEN]: token, [TWITCH_STREAMS]: twitchOffline })
    await resolveLiveStatus(deps({ ...ALL_ENV, YOUTUBE_API_KEY: '' }, fetch))
    const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls
    const tokenCall = calls.find(([url]) => String(url).includes(TWITCH_TOKEN))!
    expect(String(tokenCall[1].body)).toContain('grant_type=client_credentials')
    const streamsCall = calls.find(([url]) => String(url).includes(TWITCH_STREAMS))!
    expect(String(streamsCall[0])).toContain('user_login=n8watkins')
    expect(streamsCall[1].headers).toEqual({ 'Client-Id': 'cid', Authorization: 'Bearer tok' })
  })

  it('gets a new Twitch token once when the old one is rejected', async () => {
    let streamCalls = 0
    const { fetch, calls } = fakeFetch({
      [SANITY]: studio(null),
      [TWITCH_TOKEN]: token,
      [TWITCH_STREAMS]: () => (++streamCalls === 1 ? { status: 401 } : twitchLive()),
    })
    const status = await resolveLiveStatus(deps({ ...ALL_ENV, YOUTUBE_API_KEY: '' }, fetch))
    expect(status.live).toBe(true)
    expect(calls.filter((c) => c === TWITCH_TOKEN)).toHaveLength(2)
  })

  it('reuses the Twitch token until it expires', async () => {
    const { fetch, calls } = fakeFetch({ [SANITY]: studio(null), [TWITCH_TOKEN]: token, [TWITCH_STREAMS]: twitchOffline })
    const env = { ...ALL_ENV, YOUTUBE_API_KEY: '' }
    await resolveLiveStatus(deps(env, fetch))
    await resolveLiveStatus(deps(env, fetch, new Date(NOW.getTime() + 30 * 60_000)))
    expect(calls.filter((c) => c === TWITCH_TOKEN)).toHaveLength(1)
    await resolveLiveStatus(deps(env, fetch, new Date(NOW.getTime() + 61 * 60_000)))
    expect(calls.filter((c) => c === TWITCH_TOKEN)).toHaveLength(2)
  })

  it('sees a live YouTube stream with two API calls (uploads playlist, then videos)', async () => {
    const { fetch, calls } = fakeFetch({ [SANITY]: studio(null), [YT_PLAYLIST]: playlist('aaaaaaaaaaa', 'bbbbbbbbbbb'), [YT_VIDEOS]: videos(video('aaaaaaaaaaa', 'none'), video('bbbbbbbbbbb', 'live')) })
    const status = await resolveLiveStatus(deps({ ...ALL_ENV, TWITCH_CLIENT_ID: '' }, fetch))
    expect(calls).toEqual(expect.arrayContaining([YT_PLAYLIST, YT_VIDEOS]))
    expect(calls.filter((c) => c.startsWith('www.googleapis.com'))).toHaveLength(2)
    const playlistUrl = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map(([u]) => String(u)).find((u) => u.includes(YT_PLAYLIST))!
    expect(playlistUrl).toContain(`playlistId=UU${CHANNEL_ID.slice(2)}`)
    expect(status.streams).toEqual([
      expect.objectContaining({ id: 'youtube:bbbbbbbbbbb', platform: 'youtube', url: 'https://www.youtube.com/watch?v=bbbbbbbbbbb', embed: { kind: 'youtube', videoId: 'bbbbbbbbbbb' }, source: 'youtube-api' }),
    ])
  })

  it.each([
    ['embedding is off', { status: { embeddable: false } }],
    ['it is made for kids', { status: { embeddable: true, madeForKids: true } }],
    ['it is age-restricted', { contentDetails: { contentRating: { ytRating: 'ytAgeRestricted' } } }],
  ])('shows the YouTube card instead of the embed when %s', async (_, extra) => {
    const { fetch } = fakeFetch({ [SANITY]: studio(null), [YT_PLAYLIST]: playlist('bbbbbbbbbbb'), [YT_VIDEOS]: videos(video('bbbbbbbbbbb', 'live', extra)) })
    const status = await resolveLiveStatus(deps({ ...ALL_ENV, TWITCH_CLIENT_ID: '' }, fetch))
    expect(status.streams[0]).toMatchObject({ platform: 'youtube', embed: null })
  })

  it('reports the next scheduled YouTube stream while offline', async () => {
    const { fetch } = fakeFetch({ [SANITY]: studio(null), [YT_PLAYLIST]: playlist('ccccccccccc'), [YT_VIDEOS]: videos(video('ccccccccccc', 'upcoming')) })
    const status = await resolveLiveStatus(deps({ ...ALL_ENV, TWITCH_CLIENT_ID: '' }, fetch))
    expect(status.live).toBe(false)
    expect(status.upcoming).toEqual({ platform: 'youtube', title: 'Video ccccccccccc', url: 'https://www.youtube.com/watch?v=ccccccccccc', scheduledFor: '2026-10-25T18:00:00.000Z' })
  })

  it('checks LIVE_YOUTUBE_VIDEO_ID too (an unlisted test stream)', async () => {
    const { fetch } = fakeFetch({ [SANITY]: studio(null), [YT_VIDEOS]: (url) => ({ body: { items: url.searchParams.get('id') === 'unlisted123' ? [video('unlisted123', 'live')] : [] } }) })
    const status = await resolveLiveStatus(deps({ NEXT_PUBLIC_SANITY_PROJECT_ID: 'abgyc32w', YOUTUBE_API_KEY: 'key', LIVE_YOUTUBE_VIDEO_ID: 'unlisted123' }, fetch))
    expect(status.streams[0]).toMatchObject({ id: 'youtube:unlisted123', source: 'override' })
  })

  it('takes LIVE_YOUTUBE_VIDEO_ID at its word without an API key', async () => {
    const { fetch, calls } = fakeFetch({ [SANITY]: studio(null) })
    const status = await resolveLiveStatus(deps({ NEXT_PUBLIC_SANITY_PROJECT_ID: 'abgyc32w', LIVE_YOUTUBE_VIDEO_ID: 'unlisted123' }, fetch))
    expect(status.streams[0]).toMatchObject({ platform: 'youtube', embed: { kind: 'youtube', videoId: 'unlisted123' }, source: 'override' })
    expect(calls).toEqual([SANITY])
    // Junk is ignored.
    const junk = await resolveLiveStatus(deps({ NEXT_PUBLIC_SANITY_PROJECT_ID: 'abgyc32w', LIVE_YOUTUBE_VIDEO_ID: '<script>' }, fetch))
    expect(junk.live).toBe(false)
  })

  it('lists Twitch first when live on several platforms, unless another is preferred', async () => {
    const handlers = {
      [SANITY]: studio({ live: true, platform: 'x', startedAt: NOW.toISOString() }),
      [TWITCH_TOKEN]: token,
      [TWITCH_STREAMS]: twitchLive,
      [YT_PLAYLIST]: playlist('bbbbbbbbbbb'),
      [YT_VIDEOS]: videos(video('bbbbbbbbbbb', 'live')),
    }
    const status = await resolveLiveStatus(deps(ALL_ENV, fakeFetch(handlers).fetch))
    expect(status.streams.map((s) => s.platform)).toEqual(['twitch', 'youtube', 'x'])
    expect(status.preferred).toBe('twitch')
    resetLiveCache()
    const youtubeFirst = await resolveLiveStatus(deps({ ...ALL_ENV, LIVE_PREFERRED_PLATFORM: 'youtube' }, fakeFetch(handlers).fetch))
    expect(youtubeFirst.preferred).toBe('youtube')
    expect(youtubeFirst.streams[0].platform).toBe('twitch')
  })

  it('lets the Studio switch override a platform check that missed', async () => {
    const { fetch } = fakeFetch({ [SANITY]: studio({ live: true, platform: 'twitch', title: 'Manual', startedAt: NOW.toISOString() }), [TWITCH_TOKEN]: token, [TWITCH_STREAMS]: twitchOffline })
    const status = await resolveLiveStatus(deps({ ...ALL_ENV, YOUTUBE_API_KEY: '' }, fetch))
    expect(status.streams).toEqual([expect.objectContaining({ platform: 'twitch', title: 'Manual', source: 'studio' })])
  })

  it('keeps the platform check, with the Studio title, when both see the stream', async () => {
    const { fetch } = fakeFetch({ [SANITY]: studio({ live: true, platform: 'twitch', title: 'Manual', startedAt: NOW.toISOString() }), [TWITCH_TOKEN]: token, [TWITCH_STREAMS]: twitchLive })
    const status = await resolveLiveStatus(deps({ ...ALL_ENV, YOUTUBE_API_KEY: '' }, fetch))
    expect(status.streams).toEqual([expect.objectContaining({ id: 'twitch:42', title: 'Manual', source: 'twitch-api' })])
  })

  it('counts a failing source as offline and keeps the others', async () => {
    const { fetch } = fakeFetch({
      [SANITY]: () => ({ status: 500 }),
      [TWITCH_TOKEN]: token,
      [TWITCH_STREAMS]: twitchLive,
      [YT_PLAYLIST]: () => Promise.reject(new Error('network down')),
    })
    const status = await resolveLiveStatus(deps(ALL_ENV, fetch))
    expect(status.streams.map((s) => s.platform)).toEqual(['twitch'])
  })

  it('is offline when every source fails', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof globalThis.fetch
    const status = await resolveLiveStatus(deps(ALL_ENV, fetch))
    expect(status).toMatchObject({ live: false, streams: [] })
  })

  it('treats an unusable Twitch token answer as an error, not a crash', async () => {
    const { fetch } = fakeFetch({ [SANITY]: studio(null), [TWITCH_TOKEN]: () => ({ status: 400 }) })
    const status = await resolveLiveStatus(deps({ ...ALL_ENV, YOUTUBE_API_KEY: '' }, fetch))
    expect(status.live).toBe(false)
  })
})

describe('mergeStreams', () => {
  it('has no preferred platform when nothing is live', () => {
    expect(mergeStreams([null, null], null)).toEqual({ streams: [], preferred: null })
  })
})

describe('getLiveStatus (cache)', () => {
  it('caches the answer for 60 seconds', async () => {
    let now = NOW
    const { fetch, calls } = fakeFetch({ [SANITY]: studio({ live: true, platform: 'x', startedAt: NOW.toISOString() }) })
    const d: LiveDeps = { env: { NEXT_PUBLIC_SANITY_PROJECT_ID: 'abgyc32w' }, fetch, now: () => now }
    expect((await getLiveStatus({}, d)).live).toBe(true)
    now = new Date(NOW.getTime() + 59_000)
    await getLiveStatus({}, d)
    expect(calls).toHaveLength(1)
    now = new Date(NOW.getTime() + 61_000)
    await getLiveStatus({}, d)
    expect(calls).toHaveLength(2)
  })

  it('shares one check between concurrent callers', async () => {
    const { fetch, calls } = fakeFetch({ [SANITY]: studio(null) })
    const d = deps({ NEXT_PUBLIC_SANITY_PROJECT_ID: 'abgyc32w' }, fetch)
    await Promise.all([getLiveStatus({}, d), getLiveStatus({}, d), getLiveStatus({}, d)])
    expect(calls).toHaveLength(1)
  })

  it('caches failures too, so an outage is not hammered', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('down')) as unknown as typeof globalThis.fetch
    const d = deps({ NEXT_PUBLIC_SANITY_PROJECT_ID: 'abgyc32w' }, fetch)
    expect((await getLiveStatus({}, d)).live).toBe(false)
    await getLiveStatus({}, d)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('never throws on malformed answers', async () => {
    const fetch = vi.fn(async () => new Response('<html>not json', { status: 200 })) as unknown as typeof globalThis.fetch
    await expect(getLiveStatus({}, deps(ALL_ENV, fetch))).resolves.toMatchObject({ live: false, streams: [] })
  })
})

describe('test mode', () => {
  const testDeps = (env: Record<string, string>) => deps({ LIVE_TEST_MODE: '1', ...env }, vi.fn() as unknown as typeof fetch)

  it('answers from fake data without any network call', async () => {
    const d = testDeps({})
    expect(await getLiveStatus({ testScenario: 'twitch' }, d)).toMatchObject({ live: true, preferred: 'twitch', streams: [expect.objectContaining({ platform: 'twitch' })] })
    expect(d.fetch).not.toHaveBeenCalled()
  })

  it.each([
    ['none', []],
    ['twitch', ['twitch']],
    ['youtube', ['youtube']],
    ['both', ['twitch', 'youtube']],
    ['x', ['x']],
    ['all', ['twitch', 'youtube', 'x']],
    ['nonsense', []],
  ])('scenario %s', (scenario, platforms) => {
    expect(testLiveStatus(scenario, NOW).streams.map((s) => s.platform)).toEqual(platforms)
  })

  it('falls back to LIVE_TEST_SCENARIO, then to offline', async () => {
    expect((await getLiveStatus({}, testDeps({ LIVE_TEST_SCENARIO: 'x' }))).streams[0].platform).toBe('x')
    expect((await getLiveStatus({}, testDeps({}))).live).toBe(false)
  })

  it('is ignored on Vercel', async () => {
    const { fetch } = fakeFetch({ [SANITY]: studio(null) })
    const status = await getLiveStatus({ testScenario: 'twitch' }, deps({ LIVE_TEST_MODE: '1', VERCEL: '1', NEXT_PUBLIC_SANITY_PROJECT_ID: 'abgyc32w' }, fetch))
    expect(status.live).toBe(false)
  })
})
