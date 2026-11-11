// The Worker's entry point (wrangler.jsonc "main"): the OpenNext build of the
// site (.open-next/worker.js, written by `opennextjs-cloudflare build`),
// wrapped by Sentry, plus byte-range answers for the videos. See DEPLOY.md.
import * as Sentry from '@sentry/nextjs/cloudflare'
import { WorkerEntrypoint } from 'cloudflare:workers'
import openNext from '../.open-next/worker.js'
import { dataCollection } from '../lib/sentry-data-collection'
import { scrubContactBody } from '../lib/sentry-scrub'
import { MEDIA, fetchWithRanges } from './range.js'
import { forEdge, mayUseEdgeCache } from './edge-cache.js'
import { purgeExpired } from '../lib/retention'
import { WaitlistStore } from '../lib/waitlist/store'
import { runDigest } from '../lib/newsletter/digest'
import { newsMailer } from '../lib/newsletter/mail'
import { sanityPosts } from '../lib/newsletter/posts'
import { NewsletterStore } from '../lib/newsletter/store'

/** wrangler.jsonc triggers: the weekly run may start a newsletter digest. */
const WEEKLY_CRON = '0 16 * * 4'

// The Durable Objects (wrangler.jsonc durable_objects): the ISR revalidation
// queue, the tag cache (on-demand revalidation), and the rate-limit counters.
export { DOQueueHandler, DOShardedTagCache } from '../.open-next/worker.js'
export { RateLimitCounter } from './rate-limit-counter.js'

const DRAFT_MODE_COOKIE = /(?:^|;\s*)__prerender_bypass=/

/**
 * What may come from the edge cache (worker/edge-cache.js): the site's own
 * host only, and never the videos, which worker/range.js answers in ranges.
 */
const EDGE_CACHE_SITE = { host: 'n8builds.dev', uncachedPaths: MEDIA }

/**
 * The uptime check's URL (OpenPing, Sentry): answered here, before Next, so a
 * check every minute costs next to no CPU. It proves the Worker is deployed
 * and starts; the pages themselves are checked by the E2E tests and the deploy.
 */
function health() {
  return new Response('ok', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

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
 *   MAILROOM_NEWS?: import('../lib/newsletter/mail').NewsMailroom,
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

/**
 * The pages Cloudflare's cache sits in front of (wrangler.jsonc "exports"):
 * a hit is answered without running this code at all. The default entrypoint
 * below sends only cacheable requests here (worker/edge-cache.js).
 * @extends {WorkerEntrypoint<Env>}
 */
export class CachedPages extends WorkerEntrypoint {
  /** @param {Request} request */
  async fetch(request) {
    return forBrowsers(request, forEdge(await openNext.fetch(request, this.env, this.ctx)))
  }

  /**
   * Empties the edge cache (a purge only reaches the entrypoint that calls
   * it). Called by app/api/sanity/revalidate after a publish.
   */
  async purgeEverything() {
    const ctx = /** @type {ExecutionContext & { cache: { purge(options: { purgeEverything: true }): Promise<unknown> } }} */ (this.ctx)
    return ctx.cache.purge({ purgeEverything: true })
  }
}

/**
 * Everything that never comes from the edge cache: the contact form's flood
 * limit, the videos' byte ranges, and the pages for drafts and revalidations.
 * @param {Request} request
 * @param {Env} env
 * @param {ExecutionContext} ctx
 */
async function uncached(request, env, ctx) {
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
}

const worker = {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext & { exports: { CachedPages: { fetch(request: Request): Promise<Response> } } }} ctx
   */
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/healthz') return health()
    if (mayUseEdgeCache(request, EDGE_CACHE_SITE)) return ctx.exports.CachedPages.fetch(request)
    return uncached(request, env, ctx)
  },

  /**
   * The Cron Triggers (wrangler.jsonc). Daily: deletes what has expired in
   * both databases (lib/retention.ts; counts only in the log), and sends the
   * rest of a newsletter digest a refusal or the per-run limit paused.
   * Weekly: the newsletter digest, when there is a new post
   * (lib/newsletter/digest.ts). A skipped or stopped digest is a warning in
   * the logs and in Sentry, so the owner sees it.
   * @param {ScheduledController} controller
   * @param {Env} env
   */
  async scheduled(controller, env) {
    const weekly = controller.cron === WEEKLY_CRON
    if (!weekly) {
      const deleted = await purgeExpired({ waitlist: env.WAITLIST_DB, analytics: env.ANALYTICS_DB })
      console.log(JSON.stringify({ message: 'retention cleanup', deleted }))
    }
    const report = await runDigest(
      { store: new NewsletterStore(env.WAITLIST_DB), mail: newsMailer(env.MAILROOM_NEWS), posts: sanityPosts },
      { start: weekly }
    )
    console.log(JSON.stringify({ message: 'newsletter digest', ...report }))
    if (report.action === 'skipped' || report.action === 'stopped') {
      Sentry.captureMessage(`Newsletter digest ${report.action}: ${report.action === 'skipped' ? report.note : report.code}`, 'warning')
    }
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
