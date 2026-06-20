# TODO — n8builds-web post-launch

Site is **fully launched** (https://n8builds.dev live, contact form + email
routing verified). Everything below is post-launch hardening and polish — none
of it blocks the site working. All four hardening findings re-confirmed still
open against live prod on **2026-06-19**. Ordered by priority. See `HANDOFF.md`
for full context.

---

## 1. Harden the contact form against spam — do before promoting widely

**Status:** open · **Effort:** ~15 min (browser + env) · **Files:**
`lib/security/recaptcha.ts`, `lib/security/rateLimiter.ts`

**Why:** Two compounding gaps leave the honeypot as the only reliable bot
defense:
- reCAPTCHA keys aren't registered, so captcha verification is skipped (by
  design for launch — `verifyRecaptcha` returns `true` when
  `RECAPTCHA_SECRET_KEY` is unset).
- The rate limiter is an in-memory `Map` (`rateLimitMap = new Map()`). On
  Vercel serverless that's per-instance and wiped on cold start, so the
  "5 requests/hour/IP" limit barely applies in practice.

**Real risk:** each submit sends 2 emails via Gmail SMTP, which caps at
~500/day. A bot could exhaust that quota and silently break the form for real
visitors — not just spam the inbox.

**Fix (pick the first; second is optional):**
- [ ] Register/configure reCAPTCHA v3 keys for n8builds.dev at
      https://www.google.com/recaptcha/admin (verify whether the existing
      n8builds.dev registration already covers the `portfolio.n8builds.dev`
      subdomain — reCAPTCHA site keys can be scoped to a domain + its
      subdomains). Add `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` +
      `RECAPTCHA_SECRET_KEY` to Vercel (Production) and redeploy. This alone
      closes the gap.
- [ ] (Optional) Make the rate limiter fail-safe so it isn't silently relied
      on. Don't bother re-architecting to Redis/Vercel KV for a personal site.

---

## 2. Lock down or remove `/api/health`

**Status:** open · **Effort:** ~5 min · **File:** `app/api/health/route.ts`

**Why:** `HEALTH_CHECK_SECRET` isn't set in Vercel, so the auth guard is
skipped and the endpoint publicly returns env, uptime, memory, and dependency
flags. Low severity (no secrets leak) but shouldn't be public.

**Fix (pick one):**
- [ ] Set `HEALTH_CHECK_SECRET` in Vercel (Production) to a real random value
      and redeploy — the existing guard then requires `Authorization: Bearer
      <secret>`.
- [ ] Or delete the route entirely if you're not monitoring uptime.

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

## 4. Fix version string mismatch (cosmetic)

**Status:** open · **Effort:** ~2 min · **Files:** `.env.local`,
`app/api/health/route.ts`

**Why:** `/api/health` reports a hardcoded fallback "2.0.0" in prod because
`NEXT_PUBLIC_VERSION` isn't in Vercel, while local `.env.local` says "1.0.0".
Purely cosmetic.

**Fix:**
- [ ] Set `NEXT_PUBLIC_VERSION` in Vercel to match, or align the hardcoded
      fallback in `route.ts`. (Moot if finding #2 removes the route.)

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
- [ ] **Work With Me bridge section** — two cards: "Need a developer?" →
      portfolio, "Need a website/business system?" → Appturnity.
