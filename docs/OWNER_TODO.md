# Owner to-do (manual steps)

Things only you can do, because they need an interactive login, a terms acceptance, or a dashboard.
Do them in order.

## 1. Link Upstash Redis to Vercel (done 2026-10-22)

Resource `upstash-kv-fulvous-magnet`, connected to Production, Preview and Development (`KV_REST_API_*` env vars), and production redeployed.
The live API now passes the rate limiter (a fake Turnstile token gets 400, not 503).
Optional: confirm in the Vercel dashboard (Storage, or Integrations → Upstash) that the resource is on the free plan.

## 2. Verify production

Pushed, deployed and redeployed with Upstash. What's left is a real end-to-end send:

- Send yourself a real message from https://n8builds.dev/#contact and confirm both emails arrive (the notification and the auto-reply).
- Optional: in the Upstash console, confirm `contact:ip:*` and `contact:global:*` keys appear.

## 3. Cloudflare Turnstile widget hostnames (verified 2026-10-22)

Both `n8builds.dev` and `www.n8builds.dev` are authorized on the widget: in a browser on either host, Turnstile reports error 600010 (challenge failed for an automated browser), not 110200 (domain not allowed).
If you ever want the form to work on Vercel preview URLs, add those hostnames to the widget **and** set `TURNSTILE_ALLOWED_HOSTNAMES` in Vercel's Preview environment.

## 4. Duplicate hosts (done 2026-10-22)

`www.n8builds.dev` and `n8builds-web.vercel.app` served full, indexable copies of the site.
Both are now Vercel domain redirects (Project `n8builds-web` → Settings → Domains) to `n8builds.dev`, status 308, keeping the path and query.
Deployment-specific URLs are unaffected.

## 4b. Review the rewritten blog posts (2026-10-22)

The four published posts (Welcome, Why I Build in Public, Distribution Is the New Bottleneck, Speed Beats Mastery) have expanded rewrites waiting as **drafts** in Sanity Studio: about 700 words each, two custom graphics each, and a sourced facts list.
Nothing changes on the site until you hit Publish on each one.
"Why I Build in Public" already had an unfinished Studio draft (an empty image block and a topic change); the new draft replaced it and kept the topic change.
Your four other unpublished drafts (Claude Code + MCP, giant list, terminal IDE, 8 agents) were not touched.

## 5. Decisions for you (from the 2026-10-22 review)

- **Orphan build pages:** `/builds/appturnity` and `/builds/portfolio-rank` are in the sitemap but nothing on the site links to them (the homepage cards for both link off-site).
  `/builds/appturnity` also competes with appturnity.com in search.
  Options: link the homepage cards to their build pages, drop the two from the sitemap, or point `/builds/appturnity`'s canonical at appturnity.com.
- **`.local-ops.yaml`:** the tracked file describes "Portfolio 2.0" (name, slug and a local path), not this repo.
  If your local-ops tooling reads it, correct it; otherwise delete it.
- **Optional, Vercel WAF:** a rate-limit rule on `POST /api/contact` (for example 20/minute per IP) would stop request floods before they reach the function.
  Junk requests no longer touch Upstash, so this only saves function invocations.
- **After deploying:** paste a blog post and a build page into a share-card checker (for example opengraph.xyz) to see the new preview images as X, LinkedIn and Facebook will.

## 6. Optional

- **Gmail connector for Claude:** it needs re-authenticating (`/mcp`) if you want Claude to check inboxes during end-to-end email tests.

## Decided (2026-10-22), no action needed

- **Upstash plan:** confirmed Free (500,000 commands/month, no payment method).
- **Daily cap:** stays at the default 50 verified submissions/day (100 emails, well under Gmail's ~500/day). Change with `CONTACT_DAILY_LIMIT` in Vercel if ever needed.
- **HSTS preload:** not adding it. Vercel already sends `max-age=63072000`; preload would force HTTPS on every subdomain and is slow to undo.
- **Branch protection:** not enabling it. Work goes straight to `main`, which required checks would block; CI runs on every push anyway.
- **Indigo accents:** kept. Tailwind 4 kept the original (approved) hue; it is only slightly more saturated.
