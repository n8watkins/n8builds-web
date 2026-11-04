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

## Draft previews

The Studio's **Preview** button (on a post, next to Publish) opens the post at its real URL on n8builds.dev, drafts included.

1. The button (`actions/previewAction.ts` in the Studio) writes a one-hour secret into the dataset with `@sanity/preview-url-secret`.
   It is stored as a draft, so only signed-in project members and tokens can read it.
2. It opens `https://n8builds.dev/api/draft-mode/enable?sanity-preview-secret=...&sanity-preview-pathname=/blog/<slug>`.
3. The site checks the secret with its read token (`SANITY_VIEWER_TOKEN`, a Sanity robot token with the Viewer role, "n8builds-web draft preview" in Manage > API > Tokens).
   A wrong, missing or expired secret gets a 401 and no cookie; without the token, previews are off (404).
4. A valid one switches on Next's draft mode for that browser (the `__prerender_bypass` cookie, signed with a secret that changes on every build) and redirects to the post.

While a preview is on:

- Sanity reads use the `drafts` perspective with the read token, and skip Next's cache (`sanityFetch` in `lib/sanity.ts`), so a draft can't reach a cached public page.
- The Worker sends `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow` (`worker/index.js`), and the page has a robots `noindex` tag.
- A "Preview. Drafts are showing." bar sits at the bottom of /blog and posts, with **Exit preview** (`/api/draft-mode/disable`, which only redirects within the site).
- Drafts that were never published (new posts) open too; everyone else gets a 404 for them.

The preview session ends when the browser closes, or with Exit preview.
