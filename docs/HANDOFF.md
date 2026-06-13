# HANDOFF — Nate Builds (n8builds-web)

_Last updated: 2026-06-12 (session: FULLY LAUNCHED — Vercel deploy, DNS, HTTPS, Email Routing, appturnity.com sweep all live & verified)_

## Project summary

**Nate Builds** is Nathan Watkins' public builder-lab site — the top-of-funnel
personality brand in a three-brand ecosystem:

| Brand | Job | Where |
|---|---|---|
| **Nate Builds** (this repo) | audience + attention ("building software in public") | n8builds.dev · github.com/n8watkins/n8builds-web |
| Portfolio 2.0 | developer credibility | nathansportfolio.vercel.app · `/home/natkins/portfolio/portfolio2.0` |
| Appturnity | client work / consulting funnel | **appturnity.com** (live; appturnity.web.app is the same site's old URL) |

Nate Builds should *feed* the other two (bridge links), never replace them.
Stack: Next.js 16 (Turbopack dev), TypeScript, Tailwind, framer-motion,
Playwright, Nodemailer + Gmail SMTP contact form. Cloned from Portfolio 2.0,
then rebranded.
Dev runs at **http://localhost:1337** (`npm run dev`). Not yet deployed —
Vercel project + n8builds.dev domain hookup is pending (Nate owns the domain).

## State (this session's commits, all pushed to origin/main)

- `60c8a4b` — **TechStackCycle** (`components/Projects/TechStackCycle.tsx`):
  dock-hover tech icon component ported from Portfolio 2.0's IconCycle,
  restructured into Frontend/Backend/Cloud tabs + synced description bullets +
  auto-cycling icon dock. Used in `components/sections/FeaturedProjects.tsx`
  (data comes from `data/projects.tsx` by title lookup). Site-wide purple→blue
  re-theme (Twitch hover stays purple deliberately). Scrollbar 8px / lighter.
- `f3d9fc3` — N8 neon brand icon (from `/mnt/c/Users/natha/Downloads/n8 brand.png`,
  resized via sharp) as favicon set; `/portfolio` and `/appturnity` redirects in
  `next.config.mjs`; AI-flavored hero/marquee copy ("agent-assisted builds,
  prompt-native workflows, local inference"; chain `idea → prompt → build →
  stream → ship → repeat`).
- `1802ae3` — **Repo separation**: origin moved from Portfolio2.0.git to
  n8builds-web.git; sitemap/robots/siteUrl/contact-CORS fallbacks →
  https://n8builds.dev; `.env.local` cleaned (GA + reCAPTCHA blanked with
  TODOs); GA script renders only when `NEXT_PUBLIC_GA_ID` set; new OG
  `public/tab/preview.png` from the real hero; README rebranded.
- Portfolio repo got one commit `a40a727` (N8 icon as its favicon too) —
  **local only, not pushed** (user hasn't asked to push portfolio).

**Verified working:** type-check + eslint clean; dev server 200; `/portfolio`
→ 307 nathansportfolio.vercel.app; `/appturnity` → 307 appturnity.com;
sitemap emits n8builds.dev; gtag script absent while GA ID blank; `.env.local`
confirmed NOT tracked/in history (only placeholder `.env*.example` files are).

## Done 2026-06-12: build detail pages (`d0f9c70`..`2a41780`, pushed)

- **`data/builds.tsx`** — single source of truth for all 12 lab builds: slug,
  problem/solution, stack-with-reasons, process notes, images, github/liveSite.
  Content grounded in each repo's README (fetched via `gh api`). Appturnity
  derives images/stack from `data/projects.tsx`. Fixed old marquee
  inaccuracies: Solara is a **UV/sun-window** dashboard (not solar energy),
  TL;DW targets **Gemini** (not OpenAI), JobSignal uses **Prisma** (not
  Supabase), "ViBlog" → **VibeLog**.
- **`app/builds/[slug]/page.tsx`** — statically generated detail pages:
  conditional screenshot gallery, problem/solution cards, stack grid, numbered
  process notes, per-page metadata/OG; unknown slugs 404. Blue/cyan only.
- Real screenshots in `public/builds/` for piper-tts + tubevault (pulled from
  their repos) and solara (OG image); Appturnity reuses `/projects/*.webp`.
  Other builds have no screenshot assets yet — gallery is skipped gracefully;
  add images to `data/builds.tsx` when they exist.
- ProjectsMarquee now renders from `data/builds.tsx` and links each card to
  its detail page. **Gotcha:** `id="builds"` was already taken by
  FeaturedProjects, so the marquee section is `id="lab"` and detail pages link
  back to `/#lab`.
- Private repos (asset-arsenal, vibelog, chrome-extension-launch-kit) and
  suggestion-box (no repo found) intentionally have no GitHub link.
- Sitemap includes all `/builds/*`; 404 page re-themed blue/cyan.
- `scripts/shot-builds.mjs` — Playwright screenshot script used for visual
  verification (run with `node scripts/shot-builds.mjs`, dev server up).

## Done 2026-06-12 (planning session): deploy + email architecture

No code changes in this repo. Outcome: the full deploy/email plan is decided
and written up in Nathan's personal docs repo — **`/home/natkins/docs`**
(private, github.com/n8watkins/docs): `faq/email-and-domains.md` and
`faq/deploying-to-vercel.md`. Read those before touching email or deploy work;
the summary below is the short version.

**The Resend situation (why it's being dropped from this repo):**

- Resend free tier = 1 verified domain, **on the first team only**; creating a
  second team requires a paid plan from $20/mo (verified June 2026 against
  resend.com/blog/multiple-teams + pricing). Nathan's one free slot is taken
  by **Appturnity**, so n8builds.dev can't be verified for free.
- The `onboarding@resend.dev` fallback sender only delivers to the account
  owner's email — the contact form's auto-reply to submitters
  (`lib/email/sender.ts` sends TWO emails) would fail in production.
- Decision: **replace Resend with Nodemailer + Gmail SMTP** in this repo.
  Nathan's Resend account stays untouched, serving Appturnity only (including
  Gmail "Send mail as" via smtp.resend.com, which he set up this session).

**Facts established (don't re-research):** n8builds.dev DNS is already on
Cloudflare nameservers (khloe/albert.ns.cloudflare.com), no A/MX records yet.
Vercel CLI installed + logged in (`natkins23`); gh CLI logged in
(`n8watkins`). Google Workspace, if ever bought, is ONE account for ALL his
domains (secondary domains are free; $7/mo Business Starter user) — deferred
until he wants authenticated reply-as for n8builds.dev.

## Done 2026-06-12: email pipeline live + templates polished

Two working sessions. First (`b5e85a9`..`4ee52ed`): the planned Nodemailer
swap shipped — `lib/email/smtp.ts` (Gmail SMTP transport + `EMAIL_CONFIG`)
replaced `resend.ts`; DOMPurify replaced with plain HTML escaping (jsdom broke
Vercel serverless); Sprite Arsenal project card added. Second
(`1c238de`..`921b4c0`): both email templates reworked end-to-end per Nathan's
dictated feedback, and the full account-side identity is **done and verified**
— Cloudflare Email Routing (contact@n8builds.dev → Gmail) and Gmail "Send mail
as" are set up; live test sends show `From: Nathan Watkins
<contact@n8builds.dev>`.

Template state (all of this is deliberate; don't "improve" it back):

- **Auto-reply** (`👋 Got your message`): header sub-line is the inquiry label
  with the emoji trailing ("Networking 🤝"); body = fixed opener ("Appreciate
  you reaching out — I normally reply within 24 hours. Excited to hear more."),
  one per-subject middle line (`getSubjectSpecificLine()` in
  `lib/email/templates.ts` — keeps HTML + plain-text in sync), fixed closer
  "Looking forward to connecting!"; signature = Nathan "n8" Watkins / Full
  Stack AI Developer / contact@n8builds.dev / `appturnity.com · n8builds.dev`
  / LinkedIn-GitHub-X icons. Icons are base64 PNGs (`lib/email/icons.ts`,
  generated by `scripts/gen-email-icons.mjs`) attached as **inline CID
  images** — they render without the site being deployed and survive
  remote-image blocking. Fluid layout, max 600px (was a hard 700px that broke
  phones).
- **Notification** (subject `{label} — {name}`, e.g. "🎯 Consulting — Jane"):
  header is only "🚀 New opportunity" ("🚀 New consulting" for consulting) —
  no sub-line, no Inquiry Type block (type lives in the subject); small
  name/email (click target, not copy); plain "Message:" label; footer is
  emoji-free: "Auto-reply sent (copy in your Sent folder)" / "From the
  n8builds.dev contact form" / compact one-line timestamp. A "view it in
  Gmail" deep link was tried and **removed** — `mail.google.com/#search` URLs
  can't open the Gmail mobile app, they dump into mobile-web Chrome.
- Consulting middle line points clients at **appturnity.com** (discovered live
  this session, serving the real Appturnity site — prefer it over
  appturnity.web.app everywhere going forward). Nathan vetoed "frame
  recommendations" phrasing — keep that line conversational.
- Both headers use the cyan→blue gradient (`#06b6d4`→`#2563eb`); the purple
  one is gone. 404 page also re-themed earlier.

## Done 2026-06-12: Vercel deploy live (`5c0d17b`, `3673cae`)

Nathan created the Vercel project in the browser (n8builds-web under
natkins23s-projects, created 2026-06-12); agent verified/finished the rest:

- Env vars set in Production: `GMAIL_USER`, `GMAIL_APP_PASSWORD`,
  `CONTACT_EMAIL_TO`, `NEXT_PUBLIC_SITE_URL`.
- GitHub repo connected — push to main auto-deploys (verified live).
- Production alias **https://n8builds-web.vercel.app** serves 200; raw
  `*-natkins23s-projects.vercel.app` deployment URLs return 401 (Vercel
  deployment protection — normal, not a bug).
- **Prod bug found+fixed** (`5c0d17b`): `lib/security/recaptcha.ts` returned
  `false` in production when `RECAPTCHA_SECRET_KEY` is unset, 400-ing every
  submission. Now skip==allow (matches client's `dev_bypass_token` behavior;
  honeypot + rate limit still active).
- **Contact form verified in production**: POST to the alias returned 200,
  both emails delivered via Gmail SMTP.
- Domains n8builds.dev + www.n8builds.dev attached to n8builds-web;
  **portfolio.n8builds.dev attached to the portfolio project** (Nathan did
  this in the dashboard — needs its own CNAME too).

## Done 2026-06-12 (evening): n8builds.dev LIVE 🎉

- Nathan added the DNS records in Cloudflare (A @ 76.76.21.21, CNAME www +
  portfolio → cname.vercel-dns.com, all DNS only/grey). First attempt saved
  as **Proxied** → HTTP 525; symptom of proxied-to-Vercel is Cloudflare IPs
  (172.67.x/104.21.x) on the apex instead of 76.76.21.21.
- Cert gotcha: Vercel's automatic domain check never re-ran after the DNS
  fix — `vercel certs ls` showed NO certs 15+ min later. **`vercel certs
  issue n8builds.dev www.n8builds.dev`** forced issuance (13s) and the site
  came up ~1 min later. Remember this nudge for portfolio.n8builds.dev.
- Acceptance verified: https://n8builds.dev → 200 over HTTPS (www too);
  /appturnity → 307 appturnity.com; /portfolio → 307 portfolio; real POST
  to /api/contact on the live domain → 200, both emails delivered.

## Done 2026-06-12 (evening): Email Routing live + portfolio subdomain live

- **Email Routing fixed.** The new Cloudflare "Email Service" UI never
  exposed a working enable button — the `Connect` button is for Email
  Workers (code), and the Status/DNS "↗" links only deep-link to the
  Settings tab (records table, no enable action). Fix that worked:
  created the routing rule (`contact@n8builds.dev` → Gmail) in Routing
  rules, then **added the four DNS records by hand** in DNS → Records,
  copying the exact values from the Settings → DNS records table:
  `MX @ route1.mx.cloudflare.net` (pri 42), `route2` (37), `route3` (59),
  and `TXT @ "v=spf1 include:_spf.mx.cloudflare.net ~all"`. (Skipped the
  DKIM TXT — not needed for receiving.) Verified live via DoH; a Nodemailer
  test send to contact@n8builds.dev forwarded into Gmail. **Gotcha for next
  time:** the destination address needs its Cloudflare verification email
  clicked, and Gmail hides self-sent forwards (check All Mail / Activity
  Log, not just inbox).
- **portfolio.n8builds.dev is live** (HTTP 200) — CNAME + attached to the
  portfolio Vercel project; cert provisioned on its own.

## Launch acceptance — ALL GREEN (verified 2026-06-12 evening)

- DNS: A apex → 76.76.21.21; www + portfolio CNAME → cname.vercel-dns.com;
  MX route1/2/3.mx.cloudflare.net; SPF TXT present.
- https://n8builds.dev and https://www.n8builds.dev → 200 over HTTPS.
- /appturnity → 307 appturnity.com; /portfolio → 307 nathansportfolio.
- portfolio.n8builds.dev → 200.
- Contact form: real POST on the live domain → 200, both emails delivered.
- Inbound: mail to contact@n8builds.dev forwards into Gmail.

## Post-launch review findings (2026-06-12, agent code review)

**Actionable checklist version: `docs/TODO.md`** (keep the two in sync).

Site is fully launched and working; these are **pre-existing** issues
inherited from the Portfolio 2.0 clone (not introduced this session),
ordered by what actually matters. None block the launch. All re-verified
against live prod 2026-06-12 (reCAPTCHA/GA still absent from Vercel,
`/api/health` still public, GA tag absent — only a dead preconnect hint).

1. **Contact form has weak spam protection — do before promoting widely.**
   Two compounding gaps: (a) reCAPTCHA keys aren't registered, so captcha
   verification is skipped (by design for launch, see finding in
   `lib/security/recaptcha.ts`); (b) the rate limiter
   (`lib/security/rateLimiter.ts`) is an **in-memory `Map`** — on Vercel
   serverless that's per-instance and wiped on cold start, so the documented
   "5/hour/IP" limit barely applies. Net: the honeypot is the only reliable
   defense. Real risk isn't just inbox spam — each submit sends 2 emails via
   Gmail SMTP, which **caps at ~500/day**; a bot could exhaust that and
   silently break the form for real visitors. Fix: register reCAPTCHA v3 keys
   for n8builds.dev + add to Vercel (closes it on its own). Optionally make
   the rate limiter fail-safe, but don't rely on it as-is. Don't bother
   re-architecting to Redis/KV for a personal site.
2. **`/api/health` is public in production.** `HEALTH_CHECK_SECRET` isn't set
   in Vercel, so the auth guard in `app/api/health/route.ts` is skipped and
   the endpoint returns env/uptime/memory/dependency flags to anyone. Low
   severity (no secrets), but trivial to close: set `HEALTH_CHECK_SECRET` in
   Vercel, or delete the route if you're not monitoring it.
3. **No analytics.** `NEXT_PUBLIC_GA_ID` blank everywhere → zero traffic data
   on an audience-focused brand site. See account-side list below.
4. **Cosmetic:** `NEXT_PUBLIC_VERSION` not in Vercel, so `/api/health` reports
   a hardcoded "2.0.0" while local `.env.local` says "1.0.0". Harmless.

## Next steps (ordered)

Account-side polish only — site is fully launched, no deploy/DNS work left.
Address review findings 1–2 above before wide promotion; finding 3 (GA4) when
you want traffic data. Then the feature work below.

Code-side feature work (from the brand-architecture analysis, see
"Decisions" below):

1. **N8 Notes** (blog) — name is decided ("N8 Notes", beat out "Nate's
   Notions"). Homepage preview section (3–5 latest cards) + posts. There is a
   separate blog project at `/home/natkins/n8builds/blog` — check whether to
   integrate or link before building from scratch.
2. **Hero upgrades** — "LIVE on VibeLog" badge (corner, conditional) and an
   LA callout ("Base of operations: Los Angeles, CA"). Headshot already there.
3. **AI Loadout section** — tight curated "stack I actually use" card with
   icons (NOT a wall of every tech). `data/techStack.tsx` has icon data.
4. **Work With Me bridge section** — two cards: "Need a developer?" →
   portfolio, "Need a website/business system?" → Appturnity (footer partially
   covers this today).

Account-side, post-launch (needs Nate, not code):

- New GA4 property (do NOT reuse portfolio's `G-JZQGKY9Q37`) → `.env.local`
- New reCAPTCHA v3 keys bound to n8builds.dev (portfolio's are domain-bound;
  form skips verification while blank — that's by design, see
  `lib/security/recaptcha.ts`; note the zod schema still requires a non-empty
  `recaptcha` string in the POST body either way)
- ~~Resend: verify n8builds.dev~~ — obsolete, see the Resend section above
- ~~Cloudflare Email Routing + Gmail "Send mail as"~~ — set up 2026-06-12
  (From shows contact@n8builds.dev), **BUT** the zone's MX/TXT records are
  no longer published (zone is empty as of the deploy session) — inbound
  forwarding is broken until Email Routing's records are re-added; see
  next step 1b.
- Optional Sentry: `instrumentation.ts` / `instrumentation-client.ts` are
  empty placeholders ready for `npx @sentry/wizard -i nextjs`

## Decisions already made (do not re-ask)

- Blue/cyan accents, **no purple** (except Twitch brand hover in Navbar).
- Blog name: **N8 Notes**.
- Marquee stays as browse-entry; drill-in via detail pages.
- Footer/Navbar/redirect links to nathansportfolio.vercel.app and
  appturnity.com are intentional bridges, not leftovers.
- Keep the three brands on separate sites; no mega-site.
- The N8 neon icon (blue→purple gradient square) is the brand mark for
  favicons on BOTH n8builds and the portfolio.
- **No Resend in this repo** — contact form sends via Nodemailer + Gmail SMTP
  (free tier limits make Resend paid-only for a second domain; rationale in
  `~/docs/faq/email-and-domains.md`).
- contact@n8builds.dev is the public-facing address (Cloudflare forwards to
  Gmail); the form's notification email targets the Gmail address directly.
- Email template structure/copy is Nathan-approved as of 2026-06-12 (see the
  email section above) — change only on his request.
- **appturnity.com** is the canonical Appturnity URL (live, verified); use it
  in anything user-facing. No consulting.appturnity.com subdomain.
- Google Workspace: deferred; when bought it's ONE account covering all
  domains — never one account per domain.

## Conventions & gotchas

- Commit after each logical change; trailer
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. lint-staged runs
  eslint --fix on commit. Push n8builds-web freely; portfolio only when asked.
- `npm run dev` = port 1337 (`next dev -p 1337`). If `EADDRINUSE`, a stale
  dev server is holding the port: `ss -ltnp | grep 1337` then kill it.
  Portfolio dev runs on 4829 — both can run simultaneously.
- Env or `next.config.mjs` changes need a dev-server restart.
- Node scripts importing project deps (sharp, playwright) fail from /tmp —
  copy the script into the repo first; import playwright as
  `@playwright/test` (plain `playwright` isn't installed).
- Screenshot trick: Playwright headless against :1337; strip dev overlays
  with `document.querySelectorAll('[class*="z-\\[9999\\]"], nextjs-portal')
  .forEach(el => el.remove())` before capturing (used for OG image).
- `git check-ignore <path>` echoes the path on success — don't mistake it for
  ls-files output when auditing tracked files.
- **Email test recipe** (dev server up, real sends via Gmail SMTP):
  `curl -X POST http://localhost:1337/api/contact -H 'Content-Type:
  application/json' -d '{"name":"Nathan Watkins","email":
  "nathancwatkins23@gmail.com","subject":"consulting","message":"ten chars
  min","honeypot":"","recaptcha":"dev-test"}'` — `recaptcha` must be non-empty
  even though verification is skipped, `honeypot` must be empty. Subjects:
  `project_opportunity` | `consulting` | `networking`. Rate limit clears on
  localhost. Self-tests look "duplicated" in Gmail: you receive both the
  notification AND the auto-reply, plus Gmail threads your own Sent copies —
  a real visitor gets exactly one email.
- Regenerate email signature icons (PNG + `lib/email/icons.ts`) with
  `node scripts/gen-email-icons.mjs` after changing icon color/size.
- Project memory for Claude sessions lives at
  `~/.claude/projects/-home-natkins-n8builds/memory/` — update it for brand
  decisions.

## File map

- `components/Projects/TechStackCycle.tsx` — dock-hover tech stack (tabs/bullets/icons)
- `components/sections/FeaturedProjects.tsx` — sideways featured rows; consumes TechStackCycle
- `components/sections/ProjectsMarquee.tsx` — "Builds from the lab" marquee (`id="lab"`, cards link to `/builds/[slug]`)
- `data/builds.tsx` — all 12 lab builds: problem/solution, stack, process notes, images
- `app/builds/[slug]/page.tsx` — statically generated build detail pages
- `components/sections/Hero.tsx` — hero; next: LIVE badge + LA callout
- `data/projects.tsx` — project data incl. Frontend/Backend/Cloud descriptionParts + techNameMapping
- `data/techStack.tsx` — react-icons tech list (for AI Loadout)
- `app/layout.tsx` — metadata, siteUrl, gated GA scripts, favicon set
- `next.config.mjs` — /portfolio + /appturnity redirects, headers
- `app/sitemap.ts`, `public/robots.txt` — n8builds.dev SEO
- `lib/email/smtp.ts` — Gmail SMTP transport + `EMAIL_CONFIG` (all addresses/URLs, env-overridable)
- `lib/email/sender.ts` — sends notification + auto-reply (subjects, plain-text parts, CID icon attachments)
- `lib/email/templates.ts` — both HTML templates + `getSubjectSpecificLine()` per-subject copy
- `lib/email/icons.ts` — generated base64 icon PNGs (regen via `scripts/gen-email-icons.mjs`)
- `.env.local` — has working `GMAIL_USER`/`GMAIL_APP_PASSWORD`/`CONTACT_EMAIL_TO`; TODOs for GA/reCAPTCHA (untracked; examples are tracked)
- `/home/natkins/docs` — Nathan's personal FAQ repo (private, github.com/n8watkins/docs): email + Vercel deploy rationale
- `public/tab/` — n8-icon*.png, apple-icon.png, preview.png (OG), n8-logo.png (navbar)
- `docs/` — this handoff + older bundle/code-quality notes; `FOLLOW_UP.md`, `PIN_IT.md` at root predate this session
