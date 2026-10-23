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

## 4b. Rewritten blog posts (published 2026-10-22)

The four posts (Welcome, Why I Build in Public, Distribution Is the New Bottleneck, Speed Beats Mastery) were rewritten (about 700 words, two graphics and sources each) and published.
Your four other unpublished drafts (Claude Code + MCP, giant list, terminal IDE, 8 agents) were not touched.
Fact-check fixes from the review were applied on 2026-10-23: VibeLog out of the Welcome post (it is on hiatus), the Gollwitzer wording and an unsourced line in Why I Build in Public, the 448K figure and "through early December" in Distribution (chart redrawn), and the METR wording in Speed Beats Mastery.
Blog pages refresh hourly; after publishing in Studio, expect up to an hour before the live page changes (or redeploy).

## 5. Contact-form firewall rule (done 2026-10-22)

Vercel WAF rule "Contact form flood limit": `POST /api/contact`, 10 requests per 60 seconds per IP, then 429 at the edge, before the function runs.
It is free on Hobby (1 rate-limit rule per project, 1M allowed requests, hard cap with no overage billing) and was verified live: the 11th request in a minute got 429 with `x-vercel-mitigated: deny`.
Change or remove it in Vercel → Project `n8builds-web` → Firewall.

## 5b. Share-card check (the review is done, so this is next)

Paste a blog post and a build page into a share-card checker (for example opengraph.xyz) to see the preview images as X, LinkedIn and Facebook will.

## Resolved 2026-10-22

- **Orphan build pages:** Portfolio Rank and Solara have "Build log" buttons on the homepage, so every build page in the sitemap is linked (a test enforces it). Appturnity has no build page; `/builds/appturnity` redirects to appturnity.com.
- **`.local-ops.yaml`:** rewritten for this repo; it had been copied from Portfolio 2.0 (including its `local_ops_id`).

## 6. Optional

- **Gmail connector for Claude:** it needs re-authenticating (`/mcp`) if you want Claude to check inboxes during end-to-end email tests.

## Decided (2026-10-22), no action needed

- **Upstash plan:** confirmed Free (500,000 commands/month, no payment method).
- **Daily cap:** stays at the default 50 verified submissions/day (100 emails, well under Gmail's ~500/day). Change with `CONTACT_DAILY_LIMIT` in Vercel if ever needed.
- **HSTS preload:** not adding it. Vercel already sends `max-age=63072000`; preload would force HTTPS on every subdomain and is slow to undo.
- **Branch protection:** not enabling it. Work goes straight to `main`, which required checks would block; CI runs on every push anyway.
- **Indigo accents:** kept. Tailwind 4 kept the original (approved) hue; it is only slightly more saturated.
