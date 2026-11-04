import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache'
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue'
import queueCache from '@opennextjs/cloudflare/overrides/queue/queue-cache'

// ISR on Workers (https://opennext.js.org/cloudflare/caching): the pages with
// `export const revalidate` and the revalidated fetches (GitHub, Sanity) are
// kept in R2, with the Cache API in front of it in each region, and the
// Durable Object queue renders a stale page again once, however many visitors
// ask for it. No tag cache: nothing calls revalidateTag or revalidatePath, so
// pages only change on a deploy or when their revalidate time runs out.
//
// shouldLazilyUpdateOnCacheHit is off: by default every hit from the regional
// cache also read the entry from R2 again and rewrote the regional copy in the
// background. The homepage's entry is about 3 MB (its HTML, RSC payload and
// segment data), so each visit parsed and serialized it twice more, about
// doubling the Worker's CPU time per cached page (2026-11-04). That refresh
// only matters for on-demand revalidation, which this site doesn't use. A
// regional copy now lives for its page's revalidate time, after which it is
// read from R2 again, so in a region other than the one that re-rendered it a
// page can be up to two revalidate periods old (two hours for hourly pages).
// No page reads D1 when it renders, so no counts are cached this way.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: 'long-lived', shouldLazilyUpdateOnCacheHit: false }),
  queue: queueCache(doQueue),
  // Serves a cached page from the routing layer without starting Next's
  // server for it (no PPR on this site, so it is safe).
  enableCacheInterception: true,
})
