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

## 4. Optional

- **Gmail connector for Claude:** it needs re-authenticating (`/mcp`) if you want Claude to check inboxes during end-to-end email tests.

## Decided (2026-10-22), no action needed

- **Upstash plan:** confirmed Free (500,000 commands/month, no payment method).
- **Daily cap:** stays at the default 50 verified submissions/day (100 emails, well under Gmail's ~500/day). Change with `CONTACT_DAILY_LIMIT` in Vercel if ever needed.
- **HSTS preload:** not adding it. Vercel already sends `max-age=63072000`; preload would force HTTPS on every subdomain and is slow to undo.
- **Branch protection:** not enabling it. Work goes straight to `main`, which required checks would block; CI runs on every push anyway.
- **Indigo accents:** kept. Tailwind 4 kept the original (approved) hue; it is only slightly more saturated.
