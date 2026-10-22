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

## 3. Cloudflare Turnstile widget hostnames

The server now rejects tokens issued on any hostname other than `n8builds.dev` and `www.n8builds.dev`.
In the Cloudflare dashboard (Turnstile → your widget → Hostnames), make sure those two are listed.
If you ever want the form to work on Vercel preview URLs, add those hostnames to the widget **and** set `TURNSTILE_ALLOWED_HOSTNAMES` in Vercel's Preview environment.

## 4. Optional

- **Daily cap:** the site-wide limit defaults to 50 verified submissions per day.
  To change it, set `CONTACT_DAILY_LIMIT` in Vercel.
- **HSTS preload:** Vercel already sends `Strict-Transport-Security: max-age=63072000`.
  Adding `includeSubDomains; preload` would force HTTPS on every `*.n8builds.dev` subdomain permanently (preload lists are slow to undo).
  Only do it if every subdomain will always be HTTPS; tell Claude and it will add the header.
- **Branch protection:** require the `CI` checks to pass before merging into `main` (GitHub → Settings → Branches).
- **Indigo accents:** decide whether the indigo accents (Loadout "indigo" group, "Browser tools" label) stay or switch to blue/sky (see HANDOFF backlog).
- **Gmail connector for Claude:** it needs re-authenticating (`/mcp`) if you want Claude to check inboxes during end-to-end email tests.
