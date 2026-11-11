// The dino game's stats endpoint (app/api/game) answers only the sites in
// lib/game/origins.ts. In production a post or preflight from anywhere else is
// refused here, before Next, with the same 403 the route would send: other
// sites' test runs (portfolio.n8builds.dev's E2E suite plays the game from
// localhost) cost no Next.js CPU time. Outside production the route itself
// decides, since local and preview builds accept localhost.
import { ORIGINS } from '../lib/game/origins'

/**
 * The route's 403 for a refused origin, or null to let the request through.
 * @param {Request} request
 * @param {string | undefined} appEnv the APP_ENV var (wrangler.jsonc)
 */
export function refuseGameOrigin(request, appEnv) {
  if (appEnv !== 'production') return null
  if (new URL(request.url).pathname !== '/api/game') return null
  if (request.method !== 'POST' && request.method !== 'OPTIONS') return null
  const origin = request.headers.get('origin')
  if (origin && Object.hasOwn(ORIGINS, origin)) return null
  if (request.method === 'OPTIONS') return new Response(null, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  return Response.json({ error: 'origin' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
}
