# TODO — n8builds-web post-launch

Site is **fully launched** (https://n8builds.dev live, contact form + email
routing verified). Everything below is post-launch hardening and polish — none
of it blocks the site working. Last reviewed **2026-06-21** (Turnstile + GA now
live; remaining open items below). Ordered by priority. See `HANDOFF.md`
for full context.

---

## 1. Harden the contact form against spam — bot protection DONE

**Status:** bot protection done (2026-06-21); rate-limiter robustness optional ·
**Files:** `lib/security/turnstile.ts`, `lib/security/rateLimiter.ts`

**What shipped:** invisible **Cloudflare Turnstile** now gates the contact form
(`lib/security/turnstile.ts → verifyTurnstile()`, `@marsidev/react-turnstile` on
the client). `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` are set in
Vercel (Production) and live on n8builds.dev. This replaced reCAPTCHA v3 entirely
(reCAPTCHA is fully gone — no `recaptcha.ts`, no `RECAPTCHA_*` env vars). The
honeypot + Turnstile are the active bot defenses.

**Remaining (optional):** the rate limiter is still an in-memory `Map` — on
Vercel serverless that's per-instance and wiped on cold start, so the
"5 requests/hour/IP" limit is best-effort. Each submit sends 2 emails via Gmail
SMTP (caps ~500/day), so a determined bot could still spike usage even past
Turnstile.
- [ ] (Optional) Make the rate limiter fail-safe so it isn't silently relied
      on. Don't bother re-architecting to Redis/Vercel KV for a personal site.

---

## 2. Lock down or remove `/api/health` — DONE

**Status:** done (2026-06-25) · **File:** `app/api/health/route.ts`

**What shipped:** the route is now a **plain liveness ping** — `GET` returns just
`{ "status": "ok" }`. The inherited verbose diagnostics (env/uptime/memory/dep
flags/version) and the `HEALTH_CHECK_SECRET` bearer gate were **removed entirely**,
not just gated. On a public, no-auth site there's nothing to expose and nothing
to authenticate, so the secret machinery was dead weight (no monitor consumes it,
the var was never set in Vercel). `HEALTH_CHECK_SECRET` is gone from `.env.example`.
`/api/health/error` (POST, used by the error boundaries) is untouched.

---

## 3. Set up analytics (GA4)

**Status:** done (2026-06-20) · **Effort:** ~10 min · **File:** `app/layout.tsx`
(already gated on the env var)

**Why:** `NEXT_PUBLIC_GA_ID` was blank, so there was no traffic data on an
audience-focused brand site. The HTML has a `preconnect` hint to
googletagmanager.com; the gtag script is gated on the env var.

**Fix:**
- [x] Reuse the domain-wide `G-JZQGKY9Q37` GA4 property. Because the portfolio
      is now the `portfolio.n8builds.dev` subdomain, a single property covers
      the whole `n8builds.dev` domain (subdomains included) — there's no traffic
      mixing to worry about. `NEXT_PUBLIC_GA_ID=G-JZQGKY9Q37` is set in Vercel
      (Production) and the gtag is confirmed live on https://n8builds.dev.

---

## 4. Fix version string mismatch (cosmetic) — MOOT

**Status:** resolved by #2 (2026-06-25) · **File:** `app/api/health/route.ts`

`/api/health` no longer reports a version (or any diagnostics) — it's a plain
`{ "status": "ok" }` liveness ping now, so there's no "2.0.0" string to mismatch.
`NEXT_PUBLIC_VERSION` is unused by the app.

---

## Feature backlog (build work, not fixes)

Brand-architecture features from `HANDOFF.md`, not yet started:

- [x] **N8 Notions** (blog) — shipped, integrated into this repo (Sanity-backed,
      project `abgyc32w`). Live at `/blog` with a "Notions" nav item and a
      homepage `NotionsStrip` (fetches `/api/notions/recent`). The separate
      `/home/natkins/n8builds/blog` folder is source/legacy.
- [x] **Hero upgrades** — the "Live on GitHub" live pill (`components/sections/Hero.tsx`,
      linking to github.com/n8watkins with "Currently Building: …") and an LA
      reference in the portrait `alt` text ("builder based in Los Angeles") are
      done. The *visible* LA callout also shipped: "Los Angeles, CA" renders
      on-screen via the LA bento components (`LACard.tsx`, `MapDetails.tsx`).
- [x] ~~**AI Loadout section** — tight curated "stack I actually use" card with
      icons (NOT a wall of every tech).~~ Shipped 2026-06-13 as the
      `AITechStack` hover marquee (`components/features/AITechStack.tsx`), data in
      `data/aiStack` (two rows: agents + tools).
- [x] **Work With Me bridge section** — shipped 2026-06-25
      (`components/sections/WorkWithMe.tsx`, on the homepage before the contact
      footer). Two cards: "Need a developer?" → portfolio (cyan), "Need a
      website or business system?" → Appturnity (emerald).
