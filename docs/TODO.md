# TODO — n8builds-web post-launch

Site is **fully launched** (https://n8builds.dev live, contact form + email
routing verified). Everything below is post-launch hardening and polish — none
of it blocks the site working. All findings re-verified against live prod on
**2026-06-12**. Ordered by priority. See `HANDOFF.md` for full context.

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
- [ ] Register reCAPTCHA v3 keys for n8builds.dev at
      https://www.google.com/recaptcha/admin (the portfolio's keys are
      domain-bound and won't work). Add `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` +
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

**Status:** open · **Effort:** ~10 min · **File:** `app/layout.tsx` (already
gated on the env var)

**Why:** `NEXT_PUBLIC_GA_ID` is blank, so no traffic data on an
audience-focused brand site. The HTML has a `preconnect` hint to
googletagmanager.com but no actual tag (the gtag script is gated on the env
var). The preconnect is currently wasted.

**Fix:**
- [ ] Create a NEW GA4 property for n8builds.dev (do NOT reuse the portfolio's
      `G-JZQGKY9Q37` — traffic would mix). Add `NEXT_PUBLIC_GA_ID=G-XXXX` to
      Vercel (Production) and redeploy. The gtag script renders automatically
      once the var is set.

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

- [ ] **N8 Notes** (blog) — homepage preview (3–5 latest cards) + posts. Check
      the separate blog project at `/home/natkins/n8builds/blog` first — decide
      integrate vs. link before building from scratch.
- [ ] **Hero upgrades** — "LIVE on VibeLog" badge (corner, conditional) + LA
      callout ("Base of operations: Los Angeles, CA").
- [ ] **AI Loadout section** — tight curated "stack I actually use" card with
      icons (NOT a wall of every tech). `data/techStack.tsx` has the data.
- [ ] **Work With Me bridge section** — two cards: "Need a developer?" →
      portfolio, "Need a website/business system?" → Appturnity.
