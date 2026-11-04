# Sanity: how the blog's content reaches the site

N8's Notions, the build log highlights and the live switch are written in the Sanity Studio (`n8watkins/n8builds-studio`, hosted at https://n8builds.sanity.studio).
The content lives in Sanity project `abgyc32w`, dataset `production`.
This site only reads it (`lib/sanity.ts`).

## Instant publish

Publishing, changing or unpublishing a post, page or build log highlight shows on the site within seconds, without a deploy.

1. Sanity's webhook **"Revalidate n8builds.dev"** (project `abgyc32w`, Manage > API > Webhooks) posts to `https://n8builds.dev/api/sanity/revalidate`.
   - Filter: `_type in ["post", "page", "logEntry"]`, on create, update and delete, published documents only (no drafts).
   - Projection: `{_id, _type, "slug": slug.current, build}`.
   - It is signed with the secret that the Worker holds as `SANITY_WEBHOOK_SECRET`.
2. The endpoint (`app/api/sanity/revalidate/route.ts`) refuses anything without a valid signature, or signed more than five minutes ago (`lib/sanity-revalidate.ts`).
3. It marks the document type's cache tag stale (`sanity:post`, `sanity:page`, `sanity:logEntry`).
   Every Sanity read goes through `sanityFetch()`, which tags the read with its type, so the tag reaches every page and route built from it: the blog index, every post and its share card, the feed, the sitemap, the homepage strip, `/builds`.
4. It then asks the Worker for the pages that show the document (`pathsForPayload`), which renders them again in the background, so the next visitor already gets the new version.
   Stale-while-revalidate, not a hard expiry: if a render fails (Sanity or GitHub down), the page keeps its last good version instead of showing an error.

The tag cache is a Durable Object (`DOShardedTagCache`, `open-next.config.ts`).
Only the site's own tags are tracked (`softTagFilter`), so pages without Sanity reads never ask it anything, and each region caches the tags' times for 5 seconds.
Every page still revalidates hourly on its own (`SANITY_REVALIDATE`), in case a webhook is ever missed.
The reads use Sanity's live API, not its CDN: Next caches every answer, and a webhook's re-render must see the version that was just published.

### Rotating the webhook secret

Generate a new secret and set it in both places, without it ever being printed:

```bash
secret=$(openssl rand -base64 32)
printf %s "$secret" | npx wrangler secret put SANITY_WEBHOOK_SECRET
# then paste it into the webhook's Secret field in Sanity Manage (or PATCH it with the API)
unset secret
```

Sanity's webhook log (Manage > API > Webhooks > the webhook > Attempts) shows each delivery and its status.
