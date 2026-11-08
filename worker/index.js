// The Worker's entry point (wrangler.jsonc "main"): the OpenNext build of the
// site (.open-next/worker.js, written by `opennextjs-cloudflare build`),
// wrapped by Sentry, plus byte-range answers for the videos. See DEPLOY.md.
import * as Sentry from '@sentry/nextjs/cloudflare'
import { WorkerEntrypoint } from 'cloudflare:workers'
import openNext from '../.open-next/worker.js'
import { dataCollection } from '../lib/sentry-data-collection'
import { scrubContactBody } from '../lib/sentry-scrub'
import { MEDIA, fetchWithRanges } from './range.js'
import { purgeExpired } from '../lib/retention'
import { WaitlistStore } from '../lib/waitlist/store'

// The Durable Objects (wrangler.jsonc durable_objects): the ISR revalidation
// queue, the tag cache (on-demand revalidation), and the rate-limit counters.
export { DOQueueHandler, DOShardedTagCache } from '../.open-next/worker.js'
export { RateLimitCounter } from './rate-limit-counter.js'

const DRAFT_MODE_COOKIE = /(?:^|;\s*)__prerender_bypass=/

/**
 * Next marks prerendered pages `s-maxage=<revalidate>, stale-while-revalidate`
 * for a CDN in front of it. There is none here (OpenNext's own cache in R2
 * plays that part), and Firefox applies stale-while-revalidate itself, so a
 * second visit would show the old page first. Browsers get what Vercel sent
 * them instead: revalidate every time.
 * @param {Request} request
 * @param {Response} response
 */
function forBrowsers(request, response) {
  // A draft preview (Next's draft-mode cookie, docs/SANITY.md) is for the one
  // browser that asked: never stored anywhere, never indexed.
  if (DRAFT_MODE_COOKIE.test(request.headers.get('Cookie') ?? '')) {
    const draft = new Response(response.body, response)
    draft.headers.set('Cache-Control', 'private, no-store')
    draft.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return draft
  }
  if (!response.headers.get('Cache-Control')?.includes('s-maxage')) return response
  const fresh = new Response(response.body, response)
  fresh.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  return fresh
}

/**
 * @typedef {{
 *   ASSETS: { fetch: (request: Request) => Promise<Response> },
 *   CONTACT_RATE_LIMITER: { limit: (options: { key: string }) => Promise<{ success: boolean }> },
 *   WAITLIST_DB: import('../lib/db').D1Database,
 *   ANALYTICS_DB: import('../lib/db').D1Database,
 * }} Env
 */

/**
 * The one write n8builds-admin needs: deleting a waitlist address on request.
 * A named entrypoint, reachable only through the admin's service binding
 * (wrangler.jsonc there), never from the internet, so this Worker stays the
 * only writer of n8builds-waitlist (docs/DATABASE.md).
 * @extends {WorkerEntrypoint<Env>}
 */
export class WaitlistAdmin extends WorkerEntrypoint {
  /**
   * @param {string} id the entry's id (32 hex characters)
   * @returns {Promise<boolean>} whether there was an entry to delete
   */
  async deleteSubscriber(id) {
    if (typeof id !== 'string' || !/^[a-f0-9]{32}$/.test(id)) throw new Error('invalid waitlist id')
    return new WaitlistStore(this.env.WAITLIST_DB).remove(id)
  }
}

const worker = {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} ctx
   */
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url)
    // A flood of contact posts is turned away here, before any of it reaches
    // Turnstile, the rate-limit counters or Next. The form shows its own message for a bare 429.
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
    return forBrowsers(request, await openNext.fetch(request, env, ctx))
  },

  /**
   * The daily cleanup (wrangler.jsonc triggers): deletes what has expired in
   * both databases (lib/retention.ts). Counts only in the log.
   * @param {ScheduledController} _controller
   * @param {Env} env
   */
  async scheduled(_controller, env) {
    const deleted = await purgeExpired({ waitlist: env.WAITLIST_DB, analytics: env.ANALYTICS_DB })
    console.log(JSON.stringify({ message: 'retention cleanup', deleted }))
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
