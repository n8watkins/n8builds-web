// The Worker's entry point (wrangler.jsonc "main"): the OpenNext build of the
// site (.open-next/worker.js, written by `opennextjs-cloudflare build`),
// wrapped by Sentry, plus byte-range answers for the videos. See DEPLOY.md.
import * as Sentry from '@sentry/nextjs/cloudflare'
import openNext from '../.open-next/worker.js'
import { dataCollection } from '../lib/sentry-data-collection'
import { scrubContactBody } from '../lib/sentry-scrub'
import { MEDIA, fetchWithRanges } from './range.js'

// The Durable Objects (wrangler.jsonc durable_objects): the ISR revalidation
// queue, and the rate-limit counters.
export { DOQueueHandler } from '../.open-next/worker.js'
export { RateLimitCounter } from './rate-limit-counter.js'

/**
 * Next marks prerendered pages `s-maxage=<revalidate>, stale-while-revalidate`
 * for a CDN in front of it. There is none here (OpenNext's own cache in R2
 * plays that part), and Firefox applies stale-while-revalidate itself, so a
 * second visit would show the old page first. Browsers get what Vercel sent
 * them instead: revalidate every time.
 * @param {Response} response
 */
function forBrowsers(response) {
  if (!response.headers.get('Cache-Control')?.includes('s-maxage')) return response
  const fresh = new Response(response.body, response)
  fresh.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  return fresh
}

/**
 * @typedef {{
 *   ASSETS: { fetch: (request: Request) => Promise<Response> },
 *   CONTACT_RATE_LIMITER: { limit: (options: { key: string }) => Promise<{ success: boolean }> },
 * }} Env
 */

const worker = {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} ctx
   */
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url)
    // A flood of contact posts is turned away here, before any of it reaches
    // Turnstile, Upstash or Next. The form shows its own message for a bare 429.
    if (request.method === 'POST' && pathname === '/api/contact') {
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
      const { success } = await env.CONTACT_RATE_LIMITER.limit({ key: ip })
      if (!success) return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '60' } })
    }
    if (MEDIA.test(pathname)) {
      const response = await fetchWithRanges(request, env.ASSETS)
      // A missing video gets the site's own 404 page.
      if (response.status !== 404) return response
    }
    return forBrowsers(await openNext.fetch(request, env, ctx))
  },
}

// Server errors and traces, as sentry.server.config.ts sets them up under
// `next start` (on Workers that file only passes on the release). Inert until
// SENTRY_DSN is set (wrangler.jsonc vars).
export default Sentry.withSentry(
  (/** @type {{ SENTRY_DSN?: string }} */ env) => ({
    dsn: env.SENTRY_DSN,
    enabled: !!env.SENTRY_DSN,
    dataCollection: dataCollection({ httpBodies: ['incomingRequest'] }),
    tracesSampleRate: 0.1,
    beforeSend: scrubContactBody,
  }),
  worker,
)
