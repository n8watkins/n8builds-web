# Deploying n8builds.dev

The site runs on Cloudflare Workers as the `n8builds-web` Worker in the owner's Cloudflare account, built by the OpenNext adapter (`@opennextjs/cloudflare`).
Until the custom domain is attached, it is served at https://n8builds-web.nathancwatkins23.workers.dev, and n8builds.dev still points at the last Vercel deployment.

## How it fits together

- `npm run build:worker` runs `next build` (Turbopack) and turns its output into `.open-next/`: the server bundle (`.open-next/worker.js`) and the static assets (`.open-next/assets`).
- `worker/index.js` is the Worker's entry point (`main` in `wrangler.jsonc`).
  It wraps the OpenNext handler with Sentry (`withSentry`), answers byte-range requests for the videos (`worker/range.js`, which Safari needs to play them), and sends browsers `max-age=0, must-revalidate` for pages instead of Next's CDN `s-maxage`.
- Files in `public/` and `/_next/static` are served straight from Workers static assets, without the worker.
  `public/_headers` gives them HSTS and the basic security headers, and makes `/_next/static` immutable.
  Pages and API routes get the full set (CSP included) from `lib/security/headers.mjs`.
- `next/image` resizes through the Cloudflare Images binding (`IMAGES`).
- ISR (`export const revalidate`, revalidated fetches) is kept in the R2 bucket `n8builds-web-opennext-cache`, with a regional Cache API layer and a Durable Object queue (`DOQueueHandler`) for background revalidation (`open-next.config.ts`).
  There is no tag cache, because nothing calls `revalidateTag` or `revalidatePath`.
- Email (contact form, quote requests, waitlist links) goes through Cloudflare Email Service's `send_email` binding (`EMAIL`), from contact@n8builds.dev (`lib/email/send.ts`).
  n8builds.dev is onboarded for sending; Cloudflare added its records on `cf-bounce.n8builds.dev` and the DKIM key itself.
- Cloudflare Web Analytics replaces Vercel Analytics and Speed Insights (`components/WebAnalytics.tsx`), once `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN` is set at build time.
- `APP_ENV=production` (a `wrangler.jsonc` var) replaces `VERCEL_ENV`: it keeps production's Redis key names and switches off the test modes.
- The contact form's and waitlist's rate limits are sliding windows in Durable Objects (`RATE_LIMIT_COUNTERS`, `worker/rate-limit-counter.js`), one per limit and key; a Workers rate limit binding (`CONTACT_RATE_LIMITER`) also turns away floods of contact posts before Next runs.
- The analytics database (dino stats, short-link counts, the waitlist) stays in the owner's own Upstash Redis account, reached over HTTPS.

## Configuration

Plain values live in `wrangler.jsonc` (`vars`).
Secrets are set once with `npx wrangler secret put <NAME>` (it reads the value from stdin) and listed with `npx wrangler secret list`:

| Secret | Used for |
| --- | --- |
| `ANALYTICS_REDIS_REST_URL`, `ANALYTICS_REDIS_REST_TOKEN` | the analytics database: dino stats, short-link counts, the waitlist |
| `TURNSTILE_SECRET_KEY` | Turnstile on the contact, quote and waitlist forms |
| `GITHUB_TOKEN` | the build log, stars and downloads when pages revalidate |

Build-time values (inlined into the pages) are public and set in the deploy workflow (`.github/workflows/deploy.yml`): the site URL, the Sanity project, the GA ID, the Turnstile site key and the Sentry DSN, plus `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN` from a repository variable.
`/upcoming` is prerendered and shows its waitlist form only when the analytics database is configured at build time, so the workflow also reads the `ANALYTICS_REDIS_REST_*` repository secrets.
For a deploy by hand, export the same values in the shell first.

After changing bindings in `wrangler.jsonc`, run `npm run cf-typegen` to update `cloudflare-env.d.ts`.

## Automatic deploys

`.github/workflows/deploy.yml` builds and deploys on every push to `main`, and on demand from the Actions tab.
It needs a `CLOUDFLARE_API_TOKEN` repository secret: a Cloudflare API token made from the "Edit Cloudflare Workers" template, limited to the owner's account.
Until that secret exists, the workflow builds and then skips the deploy with a notice.

## Deploy by hand

Log in once with `npx wrangler login` (check with `npx wrangler whoami`).
Export the build-time values, then run `npm run deploy`, which builds and runs `opennextjs-cloudflare deploy` (it uploads the prerendered pages to R2, then runs `wrangler deploy`).
To check the Worker locally first, run `npm run preview` and open http://localhost:8787.
CI runs `npm run check:deploy` (`wrangler deploy --dry-run`) after an OpenNext build.

## Testing a deployment

`E2E_REMOTE_URL=https://n8builds-web.nathancwatkins23.workers.dev npx playwright test --project=api --project=chromium` runs the suite against a deployed Worker instead of a local build.
The deployed site is in production mode, so the specs that need the test modes (contact sends, live-stream scenarios, the waitlist) fail there by design; everything else must pass.

## Roll back

Run `npx wrangler deployments list` to see recent deployments, or `npx wrangler versions list` to see versions.
Run `npx wrangler rollback` to return to the previous version, or `npx wrangler rollback <version-id>` for a specific one.
Static assets are versioned with the Worker, so a rollback restores the old pages too.
Fix forward afterwards by reverting the commit and deploying again, so the repository matches what is live.

## Moving n8builds.dev over

The Vercel project stops deploying with this change (`vercel.json`), so n8builds.dev keeps serving the last Vercel deployment until the domain moves.
The custom domains are attached in a separate pull request: it adds `n8builds.dev` and `www.n8builds.dev` as Workers custom domains in `wrangler.jsonc`.
Before that deploy, the owner deletes the Vercel records in the Cloudflare dashboard (DNS for n8builds.dev): the apex `A 76.76.21.21` and `www CNAME cname.vercel-dns.com`.
Keep the Vercel project for a week as a rollback (re-adding the two records points the domain back at it), then delete it.

## Taking it down

Run `npx wrangler delete n8builds-web`, which also removes any custom domain and its DNS record.
The R2 bucket stays until `npx wrangler r2 bucket delete n8builds-web-opennext-cache`.
