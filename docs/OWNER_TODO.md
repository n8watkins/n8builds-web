# Owner to-do (manual steps)

Things only you can do, because they need an interactive login, a terms acceptance, or a dashboard.
Do them in order: step 1 blocks pushing everything else.

## 1. Link Upstash Redis to Vercel (blocks the next push)

The contact form now refuses submissions in production unless shared rate-limit storage is configured.
Pushing before this step would make the live form return "temporarily unavailable" (503).

Run from this repo:

```bash
vercel link --yes --project n8builds-web
vercel integration add upstash/upstash-kv
```

- Pick the **Free** plan.
- Pick the region closest to the Vercel functions (`iad1` / us-east-1 is Vercel's default).
- Connect it to the `n8builds-web` project for Production, Preview and Development.

It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
Check with `vercel env ls | grep KV_`.

## 2. Push and verify production

```bash
git push origin main
```

After the Vercel deploy finishes:

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
- **Branch protection:** require the `CI` checks to pass before merging into `main` (GitHub → Settings → Branches).
- **Gmail connector for Claude:** it needs re-authenticating (`/mcp`) if you want Claude to check inboxes during end-to-end email tests.
