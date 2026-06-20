# HANDOFF — Nate Builds (n8builds-web)

_Last updated: 2026-06-20 — docs-staleness refresh: GA live (`G-JZQGKY9Q37`,
domain-wide — portfolio is a subdomain), blog shipped as N8 Notions (Sanity
`abgyc32w`), homepage now ends NotionsStrip → … → HomeStack, free-tool repos
live under `published/<slug>`, Resend→Nodemailer/Gmail + DOMPurify→sanitizeHtml
marked DONE, commit trailer corrected. Previous: 2026-06-19 — reconciliation
pass: re-verified against live prod that n8builds.dev IS deployed and serving,
and corrected the stale/false "MX records dropped → inbound broken" note.
Previous: 2026-06-13 (HOMEPAGE REDESIGN — extensions showcase, Projects+Lab
merge, free-tools section, Currently-Building carousel, image galleries,
tech-stack bento. Pushed to prod.)_

> **⚡ NEWEST WORK FIRST:** read the "Homepage redesign (2026-06-13)" section
> directly below — it's the current state of the site. The "IA overhaul" and
> launch/email sections after it are older but still accurate context.
> Strategy doc: `docs/NATE_BUILDS_PLAN.md`.

> **🧰 Free Tools Trio (CanIHost · FreeStack · APIScout):** three OSS tools built
> 2026-06-13, now in the homepage Free Tools section. They live in their own
> repos under `/home/natkins/n8builds/published/<slug>/`. Cross-cutting state +
> the one open step (add Cloudflare CNAMEs for the subdomains, then flip the
> homepage `liveSite` links) → **`docs/FREE_TOOLS_TRIO_HANDOFF.md`**.

## Session status — 2026-06-20

**Done (recent):**
- Contact form migrated Resend → Nodemailer + Gmail SMTP (live); DOMPurify →
  hand-rolled `sanitizeHtml` in `lib/email/templates.ts`.
- Homepage redesign (HomeStack / NotionsStrip / etc.) shipped.
- Free Tools Trio (CanIHost / FreeStack / APIScout) added.
- Portfolio moved to the `portfolio.n8builds.dev` subdomain;
  `nathansportfolio.vercel.app` removed everywhere (Navbar/Footer/next.config
  redirect).
- Google Analytics wired: `NEXT_PUBLIC_GA_ID=G-JZQGKY9Q37` set in Vercel
  Production (non-sensitive), redeployed, gtag confirmed live on n8builds.dev.
  (Reuse is correct — portfolio is a subdomain, so one domain-wide GA4 property
  covers the whole site.)
- Docs staleness audit run; this refresh applies its fixes.

**To do (open):**
- Hero "electrified circuit" animation — finalize on `feat/hero-terminal-circuit`
  per review, then merge to main.
- Set `NEXT_PUBLIC_SITE_URL=https://n8builds.dev` in Vercel Production (currently
  EMPTY — weakens canonical/OG/sitemap).
- Ensure the `portfolio.n8builds.dev` deployment fires the same `G-JZQGKY9Q37`
  tag (cross-subdomain tracking); optionally rename the GA property/stream to
  n8builds.dev.
- Free-tool subdomains (`canihost`/`freestack`/`apiscout.n8builds.dev`): DNS
  CNAMEs not yet added (Cloudflare token read-only) → `liveSite` still on
  `*.vercel.app` in `data/builds.tsx`; flip once DNS resolves.
- reCAPTCHA: register/configure keys + env vars; close the skip-when-unset gap
  in `lib/security/recaptcha.ts`.
- Remove the dead `app/api/sentry-example-api/route.ts` + `SENTRY_ORG` health
  flag (or actually wire Sentry).
- Add `NEXT_PUBLIC_SANITY_PROJECT_ID` to `.env.example` (a fresh clone currently
  crashes without it).
- Pre-existing: Portfolio Rank real backend stack; Appturnity "Currently
  building" copy; confirm VibeLoge spelling/slug.

## Project summary

**Nate Builds** is Nathan Watkins' public builder-lab site — the top-of-funnel
personality brand in a three-brand ecosystem:

| Brand | Job | Where |
|---|---|---|
| **Nate Builds** (this repo) | audience + attention ("building software in public") | n8builds.dev · github.com/n8watkins/n8builds-web |
| Portfolio 2.0 | developer credibility | portfolio.n8builds.dev · `/home/natkins/portfolio/portfolio2.0` |
| Appturnity | client work / consulting funnel | **appturnity.com** (live; appturnity.web.app is the same site's old URL) |

Nate Builds should *feed* the other two (bridge links), never replace them.
Stack: Next.js 16 (Turbopack dev), TypeScript, Tailwind, framer-motion,
Playwright, Nodemailer + Gmail SMTP contact form. Cloned from Portfolio 2.0,
then rebranded.
Dev runs at **http://localhost:1337** (`npm run dev`). **LIVE in production at
https://n8builds.dev** — Vercel project `n8builds-web` (team natkins23s-projects),
auto-deploys on push to `main`. Re-verified serving HTTP 200 over HTTPS on
2026-06-19; details in the launch sections below. (The old "not yet deployed"
line here was a fossil from before the 2026-06-12 launch and was just removed.)

## Done 2026-06-13: Homepage redesign — showcases, lab merge, carousel (PUSHED ✅)

Big iterative session driven by Nate's feedback. All committed AND **pushed to
origin/main** (`ccace9c..e68569d`, ~16 commits) → Vercel auto-deployed to
n8builds.dev. Build passes; visually verified via Playwright.

**Current homepage order** (`app/page.tsx`):
Hero → NowBuilding (carousel) → FeaturedProjects (galleries) → The Lab (shelf) →
NotionsStrip → ExtensionsShowcase → ToolsSection → HomeStack → Footer (contact
card). _(HomeStack — "My Stack", from `data/buildStacks` — replaced TechStackBento
on the homepage; TechStackBento is now Loadout-only.)_
**Nav** (`Navbar.tsx`): Lab · Notions · Extensions · Tools · Loadout
(+ Portfolio/Appturnity).

What shipped:

- **Assets via 5 sub-agents** (Nate authorized): real icons + screenshots copied
  into `public/builds/{piper-tts,tubevault,tldw,localdictate,sprite-arsenal,portfolio-rank}`.
  TL;DW + LocalDictate had NO screenshots in-repo → they show their icon (TODO:
  real captures). Sprite Arsenal/Portfolio Rank icons are the generic N8 mark.
- **ExtensionsShowcase** (`components/sections/ExtensionsShowcase.tsx`): 3 exts
  (Piper/TubeVault/TL;DW) side-by-side, auto-cycle (5s, progress bar), hover →
  active + others blur, carousel detail panel, **Star-on-GitHub** CTA (OSS push),
  Launch-Kit banner. Mobile = stacked detail (no hover/cycle). Replaced the
  extensions on the homepage AND the extensions in FeaturedProjects.
- **Projects + Lab MERGED** (`data/shelves.ts`): dropped the `project` shelf —
  web apps/experiments all land in **`lab`**. `/projects` page deleted. Appturnity
  excluded from the lab list (`featuredElsewhere`) since it's featured + its own
  business. Added **'Web tool'** category → tool shelf.
- **Portfolio Rank** and **Sprite Arsenal** added to `data/builds.tsx` (both OSS).
- **ToolsSection** (`components/sections/ToolsSection.tsx`): curated "Free tools I
  made" — LocalDictate, Sprite Arsenal, CanIHost, FreeStack, APIScout, Free badge,
  Try-it/Star CTAs. Homepage uses this; `/tools` page still the full shelf (VibeLog,
  LocalDictate, Repo Steward, Sprite Arsenal).
- **Loadout page restructured** (`components/sections/Loadout.tsx`): AI & Agents
  is now a **hover-reveal marquee** (`components/features/AITechStack.tsx` +
  `data/aiStack.tsx`) instead of text cards; Build/Ship replaced by **named
  stacks** (`components/sections/BuildStacks.tsx` + `data/buildStacks.tsx` — Turso
  / Firebase / Local-First / Extension; note: **prefer Firebase, avoid Supabase**).
  Stream/Rig/Desk still render as cards from `data/loadout.tsx` (filtered by id).
- **HomeStack** (`components/sections/HomeStack.tsx`): "My Stack", sourced from
  `data/buildStacks`, now the homepage tech-stack section. It replaced the old
  `TechStackBento` on the homepage — `TechStackBento`
  (`components/sections/TechStackBento.tsx`, the re-themed portfolio bento item
  from `data/techStack.tsx`) now lives only on the Loadout page.
- **NowBuilding → carousel** (`data/now.tsx` is now `nowItems[]`): Asset Arsenal /
  VibeLog / Portfolio Rank, auto-advance + dots + arrows + pause-on-hover, "Check
  out the lab" link.
- **FeaturedProjects galleries**: Appturnity + Quizmatic get a clickable thumbnail
  strip (4 images each from `public/projects/`). Solara moved out → into the Lab.
- **Contact section redesigned** (`Footer.tsx`): two-column card (branded panel w/
  portrait + socials | form), glows + grid texture + gradient accent (no longer
  flat black).
- **Page color shifts** (`app/page.tsx`): ambient cyan/blue/teal/indigo glow layer
  + vertical gradient so it's not one flat tone.

**Gotchas this session:** (1) `cd` in a Bash command persists across calls — a
stray `cd` into a project dir made later `rm`/`npm` run from the wrong cwd (a
delete silently no-op'd, tsc kept seeing a "deleted" file). Use absolute paths.
(2) Dev server port 1337 conflicts: old `next dev` instances don't always die;
`lsof -ti tcp:1337 | xargs -r kill -9` then start ONE. (3) Homepage sections are
`next/dynamic` → not in SSR HTML, so `curl | grep` can't see them; screenshot
instead. (4) framer `whileInView` needs a scroll-through before full-page shots.

## Done 2026-06-12: IA overhaul — Loadout + shelves + homepage sections (NOT pushed → now pushed)

This session reframed Nate Builds from "portfolio-ish" to a **public workshop /
build-in-public hub**. Four commits, **local only on `main` (ahead of
origin/main by 4) — NOT pushed** (pushing auto-deploys to prod; user hasn't
asked). Strategy + full roadmap: **`docs/NATE_BUILDS_PLAN.md`** (read it).

- `4f273b0` — `docs/NATE_BUILDS_PLAN.md`: positioning (the public workshop),
  3 pillars (Build / Stream / Signal), the **Loadout** concept, unified content
  schema, phased roadmap. Derived from a 3-agent analysis (content/IA/brand).
- `b61b96c` — **/loadout** page. `data/loadout.tsx` = 6 groups (AI & Agents,
  Build Stack, Ship & Infra, Stream Kit, The Rig, The Desk); each item = what
  it is + what I use it for + a `//` take + optional tag badge. `whoami`
  terminal block. `components/sections/Loadout.tsx` (note `accentMap` holds full
  static Tailwind class strings — dynamic `text-${x}` would be purged).
  **Content is representative/made-up — Nate to replace Rig specs etc. with real
  values.**
- `61e6674` — homepage reorder: added **NowBuilding** (`data/now.tsx` =
  "Currently Building", the live in-public hook — keep this fresh) + a Loadout
  teaser; **deleted testimonials** (Clients.tsx + data/testimonials.tsx + barrel
  export).
- `08b3a71` — **the shelves**: `/projects`, `/extensions`, `/tools`, `/lab`.
  `data/shelves.ts` derives each shelf from the single `data/builds.tsx` source
  via `getShelf()` (by `category`; `status:'in the lab'` → /lab). `Shelf.tsx` =
  full filterable page (tag chips). Sitemap + build-detail back-links updated
  (back-link now returns to the build's actual shelf, was a dead `/#lab`).
- `d42976b` — **homepage surfaces shelf content inline** (Nate's explicit ask:
  "have the content on the page, not just navbar links"). Extracted shared
  `components/sections/BuildCard.tsx`; new `ShelfSection.tsx` previews ≤3 cards
  per shelf + "See all N →". **Deleted** the stale `FeaturedProjects.tsx` (had a
  hardcoded **Quizmatic** not in the data) and `ProjectsMarquee.tsx`. Hero's
  "Explore Builds" now scrolls to `#projects`.

**Homepage order now** (`app/page.tsx`): Hero → NowBuilding → Projects →
Extensions → Tools → Lab → LoadoutTeaser → Footer.
**Nav now** (`components/layout/Navbar.tsx`): Projects · Extensions · Tools ·
Loadout · Lab (+ Portfolio/Appturnity cross-links).

**Verified:** `npm run type-check` clean, `npm run build` passes (all routes
prerender: /loadout, /projects, /extensions, /tools, /lab), eslint clean
(lint-staged auto-runs on commit). Visually verified all pages via Playwright
against :1337. **Shelf counts:** projects 4, extensions 4, tools 3, lab 1.

**Gotcha (animations):** sections use framer `whileInView` — full-page
Playwright screenshots show below-fold sections as empty unless you scroll the
page first (scroll in steps, `waitFor`, then capture). Real browsers are fine.

## State (FIRST session's commits, all pushed to origin/main)

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
→ 307 portfolio.n8builds.dev; `/appturnity` → 307 appturnity.com;
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

**The Resend situation (why it was dropped from this repo) — DONE:** the swap
shipped — contact form now sends via Nodemailer + Gmail SMTP (`smtp.gmail.com`),
and DOMPurify was replaced by a hand-rolled `sanitizeHtml` in
`lib/email/templates.ts`. The rationale below is kept for context.

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
replaced `resend.ts`; DOMPurify/isomorphic-dompurify replaced with a hand-rolled
`sanitizeHtml` in `lib/email/templates.ts` (jsdom broke Vercel serverless);
Sprite Arsenal project card added. Second
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
- /appturnity → 307 appturnity.com; /portfolio → 307 portfolio.n8builds.dev
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
3. **Analytics — DONE (2026-06-20).** `NEXT_PUBLIC_GA_ID=G-JZQGKY9Q37` is now set
   in Vercel Production and the gtag is confirmed live on n8builds.dev. Because
   portfolio is a SUBDOMAIN, reusing the single domain-wide GA4 property
   (`G-JZQGKY9Q37`) is correct — no separate property needed. Open follow-up:
   make sure the `portfolio.n8builds.dev` deploy fires the same tag for
   cross-subdomain tracking.
4. **Cosmetic:** `NEXT_PUBLIC_VERSION` not in Vercel, so `/api/health` reports
   a hardcoded "2.0.0" while local `.env.local` says "1.0.0". Harmless.

## Next steps (ordered)

Account-side polish only — site is fully launched, no deploy/DNS work left.
Address review findings 1–2 above before wide promotion; finding 3 (GA4) when
you want traffic data. Then the feature work below.

Code-side feature work (updated 2026-06-13 after the homepage redesign):

0. **Verify the prod deploy.** Everything is PUSHED (origin/main, auto-deploys to
   n8builds.dev). Load the site and click Lab/Extensions/Tools/Loadout. If the
   cert/build stalls, see the cert nudge in the launch notes below.
1. **Real screenshots for TL;DW + LocalDictate** (and ideally Asset Arsenal /
   VibeLog). They had none in-repo → currently show their icon. Drop captures in
   `public/builds/<slug>/` and wire into ExtensionsShowcase / ToolsSection /
   FeaturedProjects. Sprite Arsenal + Portfolio Rank icons are the generic N8
   mark — swap for real marks if they exist.
2. **`/builds` Log index page** — top structural piece still unbuilt (journal
   "heartbeat"). Detail pages exist at `app/builds/[slug]/page.tsx`; no
   `app/builds/page.tsx`. Decide journal-of-posts (~weekly) vs index; add "Log"
   to nav. **Blog is DONE:** shipped as **N8 Notions** (Sanity-backed,
   `NEXT_PUBLIC_SANITY_PROJECT_ID`, project id `abgyc32w`), live at `/blog` with a
   "Notions" nav item and a homepage `NotionsStrip` (fetches `/api/notions/recent`,
   a server route). The `/home/natkins/n8builds/blog` folder is source/legacy.
3. **Replace made-up content with real values** — `data/loadout.tsx` (The Rig
   specs, The Desk), `data/now.tsx` (keep the carousel fresh), `data/aiStack.tsx`
   / `data/buildStacks.tsx` if anything's off.
4. **Live status** — the Hero "Live" pill is manual; wire to Twitch/YouTube later.
5. **Hero upgrades** — "LIVE on VibeLog" badge + LA callout (still open).

**DONE 2026-06-13 (was on the list):** AI loadout (now a hover marquee), shelves,
homepage inline sections, extensions showcase, Projects+Lab merge, free-tools
section, Currently-Building carousel, featured-project galleries, tech-stack
bento, contact redesign, page color shifts, Portfolio Rank + Sprite Arsenal added.

Account-side, post-launch (needs Nate, not code):

- ~~GA4~~ — **DONE (2026-06-20):** reuse the single domain-wide property
  `G-JZQGKY9Q37` (portfolio is a subdomain, so one property covers the whole
  domain — do NOT create a separate property). `NEXT_PUBLIC_GA_ID=G-JZQGKY9Q37`
  is set in Vercel Production and confirmed live on n8builds.dev. Remaining:
  fire the same tag from the `portfolio.n8builds.dev` deploy for cross-subdomain
  tracking.
- reCAPTCHA v3 keys for n8builds.dev (a registration scoped to the domain can
  cover subdomains like `portfolio.n8builds.dev`; verify whether one already
  covers it). Form skips verification while blank — that's by design, see
  `lib/security/recaptcha.ts`; note the zod schema still requires a non-empty
  `recaptcha` string in the POST body either way.
- ~~Resend: verify n8builds.dev~~ — obsolete, see the Resend section above
- ~~Cloudflare Email Routing + Gmail "Send mail as"~~ — set up 2026-06-12.
  **Correction 2026-06-19:** the earlier "MX/TXT records dropped / zone is
  empty / inbound broken" note was STALE and WRONG. A live DNS check confirms
  the records ARE published — MX `route1/2/3.mx.cloudflare.net` (pri 42/37/59)
  and SPF TXT `v=spf1 include:_spf.mx.cloudflare.net ~all` — and Nathan
  re-confirmed (2026-06-19) that mail to contact@n8builds.dev forwards into
  Gmail. **Inbound is fully working.** The one open item is OUTBOUND identity:
  whether Gmail honors `contact@n8builds.dev` as a verified "Send mail as"
  alias (showing that as the From) or silently rewrites it to the personal
  Gmail address — being re-verified 2026-06-19. The 06-12 note that live sends
  showed `From: contact@n8builds.dev` suggests it works, pending a fresh check.
- Sentry was deliberately removed (no `@sentry/nextjs` dep, no config). All that
  remains is a dead `app/api/sentry-example-api/route.ts` and a `SENTRY_ORG`
  boolean health-check flag in `/api/health`. Either delete those two artifacts
  or actually re-wire Sentry (`npx @sentry/wizard -i nextjs`).

## Decisions already made (do not re-ask)

- Blue/cyan accents, **no purple** (except Twitch brand hover in Navbar).
- Blog name: **N8 Notions** (Sanity-backed, live at `/blog`, nav label "Notions").
- **Projects and Lab are ONE** ("the lab is everything"). No separate Projects
  page/shelf. Extensions and Tools keep their own shelves.
- **Don't list the same build twice.** Chrome extensions live only in the
  Extensions showcase (not the alternating featured rows). Appturnity is featured
  + excluded from the Lab list.
- **Stack preference: Firebase over Supabase** (avoid Supabase) — reflected in
  `data/buildStacks.tsx`.
- **Open-source push:** Piper, TubeVault, TL;DW, Sprite Arsenal, Portfolio Rank,
  LocalDictate are OSS — surface **Star-on-GitHub** CTAs, don't bury them.
- Chrome Extension Launch Kit is a **banner** under the extensions, not a main card.
- Extensions/featured use **auto-cycle + hover-to-expand** (desktop) / tap or
  stacked (mobile) — Nate explicitly does NOT want click-only or the alternating
  back-and-forth for the extensions.
- **(superseded 2026-06-12)** ~~Marquee stays as browse-entry~~ — the marquee
  was REMOVED; the homepage now shows real shelf sections (Projects/Extensions/
  Tools/Lab) inline, each "See all →" linking to its full filterable page.
- **The site is a build-in-public workshop, not a portfolio** (the polished
  hire-me lane is portfolio.n8builds.dev; client work is appturnity.com).
- **`data/builds.tsx` is the single source of truth** for all shelves +
  homepage sections — add a build there with a `category` and it auto-routes to
  the right shelf via `data/shelves.ts`. Never make a parallel dataset.
- The **Loadout** ("who I am without a resume") is the chosen identity device;
  PC/hardware builds live there as "The Rig", not as a top-level lane.
- Stream platform assumed **Twitch** (twitch.tv/n8watkins, already linked in
  Hero); live status is a manual pill for now. Not finalized by Nate.
- Footer/Navbar/redirect links to portfolio.n8builds.dev and
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
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
  lint-staged runs
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
  `~/.claude/projects/-home-natkins-n8builds-n8builds-web/memory/` — update it
  for brand decisions.

## File map

- `docs/NATE_BUILDS_PLAN.md` — **read first**: IA strategy, pillars, Loadout concept, roadmap
- `data/builds.tsx` — single source of truth: all builds (category, status, stack, links, images); incl. Portfolio Rank + Sprite Arsenal
- `data/shelves.ts` — `getShelf()` classifier (extension/tool/lab; NO 'project' — merged into lab) + `buildsForShelf()` (excludes `featuredElsewhere`)
- `app/{extensions,tools,lab}/page.tsx` — thin shelf pages → `<Shelf>` (NO /projects — deleted)
- `components/sections/Shelf.tsx` — full filterable shelf page (tag chips)
- `components/sections/ShelfSection.tsx` — homepage inline shelf preview (≤3 cards + See all) — used for The Lab
- `components/sections/BuildCard.tsx` — shared card (stretched-link → /builds/[slug])
- `app/builds/[slug]/page.tsx` — build detail pages (back-link returns to the build's shelf)
- **HOMEPAGE sections** (`app/page.tsx`, all `next/dynamic`):
  - `components/sections/NowBuilding.tsx` + `data/now.tsx` (`nowItems[]`) — Currently-Building CAROUSEL
  - `components/sections/FeaturedProjects.tsx` — Appturnity + Quizmatic, alternating rows w/ image GALLERIES (images from `public/projects/`)
  - `components/sections/ExtensionsShowcase.tsx` — Piper/TubeVault/TL;DW auto-cycle + hover detail + Star CTA + Launch-Kit banner
  - `components/sections/ToolsSection.tsx` — curated free tools (LocalDictate, Sprite Arsenal, CanIHost, FreeStack, APIScout)
  - `components/sections/NotionsStrip.tsx` — homepage blog strip (fetches `/api/notions/recent`, a server route — keeps `@sanity/client` out of the homepage bundle)
  - `components/sections/HomeStack.tsx` — "My Stack" homepage tech-stack section (from `data/buildStacks`); replaced TechStackBento on the homepage
- **LOADOUT page** (`components/sections/Loadout.tsx`):
  - `components/features/AITechStack.tsx` + `data/aiStack.tsx` — AI hover-reveal marquee
  - `components/sections/BuildStacks.tsx` + `data/buildStacks.tsx` — named stacks (prefer Firebase, avoid Supabase)
  - `data/loadout.tsx` — Stream/Rig/Desk groups (ai/build/ship groups still in data but filtered out of the page render)
  - `components/sections/TechStackBento.tsx` — bento tech-stack hover-marquee from `data/techStack.tsx` (Loadout-only now; was on the homepage)
- `components/layout/Navbar.tsx` — nav (Lab/Notions/Extensions/Tools/Loadout + Portfolio/Appturnity cross-links)
- `components/layout/Footer.tsx` — redesigned contact card (branded panel + form, glows)
- `public/builds/<slug>/` — gathered icons + screenshots (piper-tts, tubevault, tldw, localdictate, sprite-arsenal, portfolio-rank, solara)
- `components/Projects/TechStackCycle.tsx` — dock-hover tech stack; used by `components/sections/FeaturedProjects.tsx` (per-project tech stack on hover)
- `components/sections/Hero.tsx` — hero; "Explore Builds" → #projects (now scrolls toward Lab)
- _(deleted across sessions: `ProjectsMarquee.tsx`, `Clients.tsx`, `data/testimonials.tsx`, `LoadoutTeaser.tsx`, `app/projects/`)_
- `data/projects.tsx` — project data incl. Frontend/Backend/Cloud descriptionParts + techNameMapping
- `data/techStack.tsx` — react-icons tech list (powers TechStackBento)
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
