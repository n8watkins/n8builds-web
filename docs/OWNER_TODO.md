# Owner to-do (manual steps)

Things only you can do, because they need an interactive login, a terms acceptance, or a dashboard.
Do them in order.
For what's left overall, step by step, see [NEXT_STEPS.md](NEXT_STEPS.md).

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

## 5b. Share-card check (done 2026-10-24)

Checked in Discord and opengraph.xyz; its feedback led to titled post cards and 120-character share descriptions (now live).

## Resolved 2026-10-22

- **Orphan build pages:** Portfolio Rank and Solara have "Build log" buttons on the homepage, so every build page in the sitemap is linked (a test enforces it). Appturnity has no build page; `/builds/appturnity` redirects to appturnity.com.
- **`.local-ops.yaml`:** rewritten for this repo; it had been copied from Portfolio 2.0 (including its `local_ops_id`).

## 5c. Build log token (set 2026-10-23)

The build log reads GitHub with a fine-grained token, `n8builds-web build log` (read-only Contents on `scribe`, `solara`, `portfolio-rank`, `tl-dw`, `tube-vault`, `piper-tts`), stored as `GITHUB_TOKEN` in Vercel (Production and Preview) and in `.env.local`.

- **Rotate it before it expires (about 2027-10-23):** on GitHub, Settings, Developer settings, Fine-grained tokens, regenerate `n8builds-web build log` with the same access, then in the project folder run `! vercel env rm GITHUB_TOKEN production`, `! vercel env add GITHUB_TOKEN production` (and the same for `preview`), update `.env.local`, and redeploy.
- **Optional:** add the same token as a repository secret named `BUILD_LOG_GITHUB_TOKEN` (GitHub, n8builds-web, Settings, Secrets and variables, Actions). The nightly "Build log repos" check then fails as soon as that token stops working, instead of when the live page goes stale.
- **A new tracked repo** needs adding to the token's repository list, or the log leaves it out.

## 5d. Roll the release standard out to the build repos (when you're ready)

n8builds-web follows the release standard (https://github.com/n8watkins/release-kit) since 2026-10-25 and shipped v1.1.0 with it.
The build repos don't yet, so the build log still shows filtered commits for most of them instead of "Shipped vX" releases.

- Tell Claude "roll out the release kit". Claude applies it to TL;DW, TubeVault, Piper TTS, Solara and Portfolio Rank (one commit each, a baseline tag, workflows checked on GitHub). Scribe already meets the standard.
- Claude then proposes a few past milestones to backfill as releases (for example TL;DW 1.0.0); you approve the list before anything is tagged.
- About an hour in total; nothing is needed from you beyond the go-ahead and the milestone list.

## 6. Optional

- **Gmail connector for Claude:** it needs re-authenticating (`/mcp`) if you want Claude to check inboxes during end-to-end email tests.

## Decided (2026-10-22), no action needed

- **Upstash plan:** confirmed Free (500,000 commands/month, no payment method).
- **Daily cap:** stays at the default 50 verified submissions/day (100 emails, well under Gmail's ~500/day). Change with `CONTACT_DAILY_LIMIT` in Vercel if ever needed.
- **HSTS preload:** not adding it. Vercel already sends `max-age=63072000`; preload would force HTTPS on every subdomain and is slow to undo.
- **Branch protection:** reversed (with #20): `main` now requires CI through pull requests (see HANDOFF, "Branch protection on `main`"). Docs-only changes skip the browser suite.
- **Indigo accents:** kept. Tailwind 4 kept the original (approved) hue; it is only slightly more saturated.
