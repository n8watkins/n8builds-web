# Owner to-do (manual steps)

Things only you can do, because they need an interactive login, a terms acceptance, or a dashboard.
Do them in order.

## 1. Link Upstash Redis to Vercel (URGENT: the live contact form is down until this is done)

Everything was pushed on 2026-10-22.
The live contact form now refuses submissions (503 "temporarily unavailable, email me directly") until shared rate-limit storage is configured.
The rest of the site is unaffected.

Run from this repo:

```bash
vercel link --yes --project n8builds-web
vercel integration add upstash/upstash-kv
```

- Pick the **Free** plan.
- Pick the region closest to the Vercel functions (`iad1` / us-east-1 is Vercel's default).
- Connect it to the `n8builds-web` project for Production, Preview and Development.
  One database is fine for all three: only Vercel production uses the `contact:ip` / `contact:global` keys.
  Previews use `contact:preview:*`, and local runs `contact:development:*` (after `vercel env pull`) or `contact:local:*`, so none of them can touch production's counters.
  `CONTACT_TEST_MODE` never uses Redis at all.

It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
Check with `vercel env ls | grep KV_`.

## 2. Verify production

The code is already pushed and deployed. After linking Upstash, redeploy so the new env vars apply (`vercel --prod`, or Redeploy the latest deployment in the Vercel dashboard), then:

- Send yourself a real message from https://n8builds.dev/#contact and confirm both emails arrive (the notification and the auto-reply).
- Optional: in the Upstash console, confirm `contact:ip:*` and `contact:global:*` keys appear.
- Check the first GitHub Actions run passes: https://github.com/n8watkins/n8builds-web/actions

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
