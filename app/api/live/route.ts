import { connection, type NextRequest } from 'next/server'
import { LIVE_CACHE_SECONDS, LIVE_TEST_COOKIE, getLiveStatus, isLiveTestMode, offlineStatus } from '@/lib/live'

/**
 * Which platforms are live right now (Twitch, YouTube, X), for the corner
 * player and the navbar dots. See lib/live.ts for the sources.
 *
 * The answer is cached for 60 seconds on the server and by the CDN
 * (s-maxage), so visitors never reach Twitch, YouTube or Sanity themselves and
 * the platform checks run about once a minute however busy the site is.
 * It always answers 200: any failure is "offline".
 */
export async function GET(request: NextRequest) {
  await connection()
  const testMode = isLiveTestMode()
  try {
    const status = await getLiveStatus({ testScenario: testMode ? request.cookies.get(LIVE_TEST_COOKIE)?.value : null })
    return Response.json(status, {
      headers: {
        'Cache-Control': testMode
          ? 'no-store'
          : `public, max-age=0, s-maxage=${LIVE_CACHE_SECONDS}, stale-while-revalidate=${LIVE_CACHE_SECONDS}`,
      },
    })
  } catch {
    return Response.json(offlineStatus(), { headers: { 'Cache-Control': 'no-store' } })
  }
}
