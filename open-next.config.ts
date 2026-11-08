import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache'
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue'
import queueCache from '@opennextjs/cloudflare/overrides/queue/queue-cache'
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache'
import { softTagFilter, withFilter } from '@opennextjs/cloudflare/overrides/tag-cache/tag-cache-filter'

// ISR on Workers (https://opennext.js.org/cloudflare/caching): the pages with
// `export const revalidate` and the revalidated fetches (GitHub, Sanity) are
// kept in R2, with the Cache API in front of it in each region, and the
// Durable Object queue renders a stale page again once, however many visitors
// ask for it.
//
// The tag cache makes on-demand revalidation work: publishing in Sanity calls
// /api/sanity/revalidate, which expires a tag (`sanity:post`...), and every
// page built from that tag's reads renders afresh on its next visit.
// - Only the site's own tags are tracked (softTagFilter drops Next's
//   per-path `_N_T_` tags; nothing calls revalidatePath), so a page with no
//   Sanity reads never asks the tag cache anything.
// - One Durable Object shard is plenty for a handful of tags, and each region
//   keeps the tags' times in its Cache API for a few seconds, so a busy page
//   doesn't call the Durable Object on every view.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: 'long-lived' }),
  queue: queueCache(doQueue),
  tagCache: withFilter({
    tagCache: doShardedTagCache({ baseShardSize: 1, regionalCache: true, regionalCacheTtlSec: 5 }),
    filterFn: softTagFilter,
  }),
  // Serves a cached page from the routing layer without starting Next's
  // server for it (no PPR on this site, so it is safe). It checks the tag
  // cache too, so a revalidated page is never served from here.
  enableCacheInterception: true,
})
