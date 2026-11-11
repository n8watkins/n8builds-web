// The Worker's own edge cache (Workers Cache, https://developers.cloudflare.com/workers/cache/).
//
// The default entrypoint (worker/index.js) runs on every request and is cheap:
// it decides here whether a request may be answered from the cache, and if so
// passes it to the CachedPages entrypoint, which Cloudflare's cache sits in
// front of (wrangler.jsonc "cache" and "exports"). A cache hit returns the
// stored page without running Next, so it costs no CPU time; only a miss runs
// OpenNext, and its answer is kept for the next visitor.
//
// What may be cached is decided twice, on the request and on the response:
// - The request: a GET or HEAD for the site's own host, from a visitor with no
//   draft-mode cookie, that is not one of OpenNext's own revalidations or a
//   video (worker/range.js answers byte ranges itself).
// - The response: only what Next itself marks as the same for everyone, an
//   ISR or static page (`s-maxage`) or a `public` answer with a max-age (the
//   image optimizer). Anything else is marked no-store for the edge, so a
//   response without Cache-Control is never kept by the cache's default rules.
//   A page OpenNext served stale (its revalidation is still running) is not
//   kept either, so the cache never holds an old copy after a publish.
//
// Sanity's publish webhook empties this cache (purgeEverything below, called by
// app/api/sanity/revalidate), and every deploy starts with an empty one (the
// Worker version is part of the cache key).

/** The longest an edge copy stays fresh before Cloudflare asks the Worker again. */
export const MAX_EDGE_TTL_SECONDS = 86_400

/** After that, the old copy is still served while one request refreshes it. */
export const EDGE_STALE_SECONDS = 86_400

const DRAFT_MODE_COOKIE = /(?:^|;\s*)__prerender_bypass=/

/**
 * Whether this request may be answered from the edge cache.
 * @param {Request} request
 * @param {{ host: string, uncachedPaths: RegExp }} site
 */
export function mayUseEdgeCache(request, site) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  const url = new URL(request.url)
  // The cache key has no host in it, so www (redirected by next.config.mjs)
  // and workers.dev never read or write it.
  if (url.hostname !== site.host) return false
  if (site.uncachedPaths.test(url.pathname)) return false
  if (request.headers.has('authorization')) return false
  // OpenNext's background revalidation must reach Next, not the cached copy.
  if (request.headers.has('x-prerender-revalidate')) return false
  // A draft preview is for the one browser that asked.
  if (DRAFT_MODE_COOKIE.test(request.headers.get('cookie') ?? '')) return false
  return true
}

/**
 * Seconds of `name=<seconds>` in a Cache-Control value, or null.
 * @param {string} cacheControl
 * @param {string} name
 */
function directive(cacheControl, name) {
  const match = new RegExp(`(?:^|,)\\s*${name}=(\\d+)`, 'i').exec(cacheControl)
  return match ? Number(match[1]) : null
}

/**
 * How long the edge may keep this response: seconds, or 0 for not at all.
 * Reads the Cache-Control Next sent, before worker/index.js rewrites it for browsers.
 * @param {Response} response
 */
export function edgeTtl(response) {
  if (response.status !== 200) return 0
  if (response.headers.has('set-cookie')) return 0
  for (const name of ['x-nextjs-cache', 'x-opennext-cache']) {
    if (response.headers.get(name)?.toUpperCase() === 'STALE') return 0
  }
  const cacheControl = response.headers.get('cache-control') ?? ''
  if (/\b(private|no-store|no-cache)\b/i.test(cacheControl)) return 0
  const shared = directive(cacheControl, 's-maxage')
  if (shared !== null) return Math.min(shared, MAX_EDGE_TTL_SECONDS)
  if (/\bpublic\b/i.test(cacheControl)) return Math.min(directive(cacheControl, 'max-age') ?? 0, MAX_EDGE_TTL_SECONDS)
  return 0
}

/**
 * The response with the edge's own Cache-Control (Cloudflare reads it and
 * strips it, so browsers never see it).
 * @param {Response} response
 */
export function forEdge(response) {
  const ttl = edgeTtl(response)
  const marked = new Response(response.body, response)
  marked.headers.set(
    'Cloudflare-CDN-Cache-Control',
    ttl > 0 ? `public, max-age=${ttl}, stale-while-revalidate=${EDGE_STALE_SECONDS}` : 'no-store'
  )
  return marked
}
