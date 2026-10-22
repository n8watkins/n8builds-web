# HANDOFF - n8builds (n8builds-web)

_Last updated: 2026-10-22._
This file describes the current state only.
Session-by-session history up to 2026-06-25 lives in `docs/archive/HANDOFF-2026-06.md`.
Manual steps that need the owner (logins, dashboards) live in `docs/OWNER_TODO.md`.

## What this is

**n8builds** is Nathan Watkins' public builder-lab site, the top-of-funnel brand in a three-brand ecosystem:

| Brand | Job | Where |
|---|---|---|
| **n8builds** (this repo) | audience and attention ("building software in public") | https://n8builds.dev, github.com/n8watkins/n8builds-web (public) |
| Portfolio 2.0 | developer credibility | portfolio.n8builds.dev, `/home/natkins/portfolio/portfolio2.0` |
| Appturnity | client work and consulting | https://appturnity.com |

n8builds feeds the other two through bridge links and never replaces them.
Strategy and IA: `docs/N8BUILDS_PLAN.md`.

## Current state

- Live at https://n8builds.dev on Vercel (project `n8builds-web`, team natkins23s-projects), auto-deploying from `main`.
- Stack: Next.js 16 (App Router, webpack build), React 19, TypeScript, Tailwind 4 (configured in `app/globals.css`; there is no `tailwind.config`), Motion (`motion/react`; not framer-motion), Sanity (blog), Nodemailer + Gmail SMTP, Cloudflare Turnstile, Upstash Redis (rate limits), Sentry, GA4, Vercel Speed Insights.
- Pages: `/` (hero, lab sections, work-with-me, contact), `/blog` + `/blog/[slug]` (N8 Notions, ISR hourly), `/builds/[slug]`, `/loadout`, `/privacy`.
- **Pending push (2026-10-21/22):** the contact-form hardening and everything after it (the Tailwind 4 upgrade and the review fixes included) is committed locally but not pushed, because production now requires Upstash.
  See `docs/OWNER_TODO.md` step 1.

## Running and testing

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3737 |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run test:unit` | Vitest unit tests (`tests/unit/`) |
| `npm run test:e2e` | Playwright: contact API + Chromium browser tests against a production build |
| `npm run test:e2e:all` | Playwright on every browser project (Chromium, Firefox, WebKit, mobile) |
| `npm test` | Unit + E2E |

E2E details:

- Playwright builds and starts the app itself (`next build && next start`) on port 3747, or `E2E_PORT`.
  Set `E2E_SKIP_BUILD=1` to reuse an existing build.
- The test server runs in `CONTACT_TEST_MODE` with Cloudflare's always-pass Turnstile test keys.
  No email is sent (Nodemailer JSON transport), and GA, Sentry and Upstash are forced off.
- A running server on the port is reused locally; if it serves an old build, kill it first (`ss -ltnp | grep 3747`).
- After upgrading `@playwright/test`, run `npx playwright install` or every browser test fails instantly.
- Tests do not retry. A flaky test is a bug to fix.

CI (`.github/workflows/`):

- `ci.yml` on every push to `main` and every PR: lint, type-check, unit tests, then E2E (API + Chromium).
- `nightly.yml` at 09:00 UTC and on demand: E2E on every browser project.

## Contact form

Flow (`app/api/contact/route.ts`): size check (10KB), per-IP rate limit, JSON + Zod validation, honeypot, Turnstile, site-wide daily limit, then the notification email and the auto-reply.

- **Rate limits** (`lib/security/rateLimiter.ts`): 5/hour per IP and `CONTACT_DAILY_LIMIT` (default 50) verified submissions per day, stored in Upstash Redis via `KV_REST_API_*` (or `UPSTASH_REDIS_REST_*`).
  Keys outside Vercel production are namespaced by `VERCEL_ENV` (`contact:preview:*`, `contact:development:*` with a pulled env, `contact:local:*` otherwise), so one database serves every environment without previews or local runs touching production's counters.
  `CONTACT_TEST_MODE` always uses an in-memory store, as does `next dev` without Upstash configured.
- **Fail closed:** in production, a missing Turnstile secret, a Turnstile error, missing Upstash config, or an Upstash outage or timeout all reject the submission, with a message telling the visitor to email directly.
- **Turnstile** (`lib/security/turnstile.ts`): tokens must be issued on `n8builds.dev` or `www.n8builds.dev` (`TURNSTILE_ALLOWED_HOSTNAMES` overrides).
  Verification is skipped only under `next dev`.
- **Client** (`components/ContactForm/`): Send is disabled until the form hydrates (`hooks/useHydrated.ts`), so an early click is never silently lost.
  If Turnstile has not issued a token when Send is clicked, the button shows "Verifying..." and submits once it arrives.
  After 15s it explains the failure (often an ad or privacy blocker).
  Server error messages are shown to the visitor.
  The success confetti is lazily loaded and has its own error boundary: if its chunk fails, the confetti is dropped and the success message stays.
- **Emails** (`lib/email/`): Gmail SMTP with an app password.
  Notifications go straight to the Gmail inbox (`CONTACT_EMAIL_TO`), never to contact@n8builds.dev, which forwards back to the same Gmail and gets deduped.
  All user input is HTML-escaped exactly once at template time.
  Regenerate the signature icons with `node scripts/gen-email-icons.mjs`.
- **Testing by hand:** `CONTACT_TEST_MODE=1` with the test secret `1x0000000000000000000000000000000AA` exercises the real API on a production build without sending email.
  Test mode is ignored whenever `VERCEL` is set, including from a `.env.local` made by `vercel env pull`; run with `VERCEL= VERCEL_ENV=` in that case (Playwright already blanks them).
  To send real email locally, use `npm run dev` and submit the form (Turnstile is skipped in dev, and Upstash too unless configured).

## Decisions already made (do not re-ask)

- Blue/cyan accents, **no purple** (except the Twitch brand hover in the navbar).
- The site is a **build-in-public workshop, not a portfolio**.
  The hire-me lane is portfolio.n8builds.dev; client work is appturnity.com.
- **Projects and Lab are one.**
  The Lab is one homepage section with anchored sub-sections: web apps and experiments (`#lab`), Chrome extensions (`#extensions`), tools (`#tools`).
  There are no standalone shelf pages; `/lab`, `/extensions` and `/tools` redirect to the anchors, and the retired `/resources` redirects to `#lab` (`next.config.mjs`).
  The navbar "Lab" dropdown scrolls to them.
- **`data/builds.tsx` is the single source of truth** for every build; `data/shelves.ts` routes each one to its section by `category`.
  Never create a parallel dataset.
- **Don't list the same build twice.**
  Chrome extensions appear only in the extensions showcase; Appturnity is featured and excluded from the Lab list.
- Extensions and featured projects **auto-cycle with hover-to-expand** on desktop, tap or stacked on mobile.
  Not click-only.
- The Chrome Extension Launch Kit is a banner under the extensions, not a main card.
- Open-source builds (Piper, TubeVault, TL;DW, Sprite Arsenal, Portfolio Rank, LocalDictate) get prominent Star-on-GitHub CTAs.
- CanIHost, FreeStack and APIScout (the "free tools trio") were dropped from the site on 2026-10-21.
  Their repos and Vercel projects still exist; do not re-add them unless asked.
- The **Loadout** is the identity device ("who I am without a resume"); PC hardware lives there as "The Rig".
- Blog name: **N8 Notions** (Sanity project `abgyc32w`, dataset `production`, nav label "Notions").
- Stack preference: **Firebase over Supabase** (reflected in `data/buildStacks.tsx`).
- **No Resend**: Nodemailer + Gmail SMTP (rationale in `~/docs/faq/email-and-domains.md`).
- contact@n8builds.dev is the public address (Cloudflare Email Routing forwards it to Gmail).
- Email template structure and copy are owner-approved; change only on request.
- **appturnity.com** is the canonical Appturnity URL.
- Keep the three brands on separate sites.
  Footer, navbar and redirect links to the portfolio and Appturnity are intentional bridges.
- The N8 neon icon is the brand mark and favicon for both n8builds and the portfolio.
- One GA4 property (`G-JZQGKY9Q37`) covers the whole n8builds.dev domain, subdomains included.
- The site is dark-only (`defaultTheme="dark"`, no theme toggle).
  Muted text uses `text-slate-450` / `text-slate-475`, not stock slate-500/600, which fail WCAG AA contrast on the dark backgrounds.
- react-icons are decorative by default (`aria-hidden` via `IconContext` in `app/provider.tsx`).
  An icon-only control needs its own `aria-label`.

## Conventions and gotchas

- Commit after each logical change, with no agent co-author trailer.
  lint-staged runs `eslint --fix` on commit.
- Dev port is **3737**, not 1337: on this Windows box the Razer Chroma SDK service permanently holds `127.0.0.1:1337`, and WSL2 forwards localhost to Windows.
  The holder only shows up via `netstat.exe -ano | grep :1337`.
- Env or `next.config.mjs` changes need a server restart.
- Node scripts that import project dependencies must run from inside the repo; import Playwright as `@playwright/test`.
- `npm run type-check` can report errors from stale generated types after deleting a route; `rm -rf .next/types .next/dev` and rerun.
- Don't use Next's generated global type helpers (`RouteContext`, `PageProps`): they exist only after a build or `next dev`, and CI type-checks before building. Type `params` explicitly.
  To type-check like CI: `rm -rf .next/types .next/dev && npm run type-check`.
- `npm run lint` fails on any warning (CI too).
- Reduced motion is honored everywhere: CSS animations stop globally, smooth scrolling is enabled only under `prefers-reduced-motion: no-preference`, Motion uses `MotionConfig reducedMotion="user"`, and timer-driven cycles check `usePrefersReducedMotion` (`hooks/`).
  `Marquee` requires a `label` prop (its reduced-motion fallback is a labelled, keyboard-reachable list).
  With motion on, its loop copies are `aria-hidden`; focusable children read `MarqueeCopyContext` to leave the tab order there (see `components/ui/StackTile.tsx`).
- Tailwind 4 applies `hover:` only on devices that can hover, so anything revealed on hover also needs a focus/tap path (`StackTile` reveals on `focus:` too).
  `tests/e2e/reduced-motion.spec.ts` covers this.
- Known dev-only noise: `next dev` (Turbopack) logs a 404 for a stale preload hint of the lazily loaded confetti chunk (`ConfettiPlayer`).
  The chunk itself loads and the confetti renders; production (webpack) is unaffected.
- Lighthouse: `npm run build && npm run lighthouse` runs `scripts/lighthouse.mjs` (Lighthouse 13 directly; `@lhci/cli` was dropped as unmaintained and the source of most `npm audit` findings).
  Budgets live in that script; reports go to `.lighthouse/` (a CI artifact in the nightly run), not to public storage.
  Under WSL set `CHROME_PATH` to a Linux Chrome (Playwright's works: `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome`).
- `npm audit` (all deps) has one known, unfixable finding: `braces` (GHSA-vfj7-8cjw-p6xm), via `eslint-config-next` → `fast-glob` → `micromatch`.
  No patched `braces` exists; it only expands the lint plugin's own glob patterns, never untrusted input. `npm audit --omit=dev` is 0.
- One build or Playwright run per checkout at a time: they share `.next/` and `test-results/`, and a second one breaks the first (a running `next start` serves mismatched chunks; Playwright wipes `test-results/` mid-run).
  For parallel work, use a second `git worktree` with its own `npm ci` and `E2E_PORT`.
- Tailwind 4 notes:
  - Theme tokens (`darkBlue`, `slate-450` / `slate-475`, `border` / `background` / `foreground`, the marquee keyframes) live in the `@theme` block in `app/globals.css`.
  - An explicit `leading-*` now wins over a responsive `text-*` size at every breakpoint (in v3 the size reset it).
    Pair a responsive size with its line height instead, for example `sm:text-5xl/none`.
  - `space-y-*` now puts the margin on the bottom of each child except the last, and counts hidden children.
    The contact form's `pt-4 md:pt-6` replaces spacing v3 used to add because of the hidden honeypot.
  - Any opacity step works (`bg-white/7`); in v3, steps outside the scale silently produced no CSS.
  - `tailwind-merge` must stay on v3+ to understand v4 class names.
- Project memory for Claude sessions: `~/.claude/projects/-home-natkins-n8builds-n8builds-web/memory/`.

## File map

- `app/page.tsx`: homepage; sections load via `next/dynamic` and are wrapped in `SectionErrorBoundary`.
- `app/layout.tsx`: metadata, GA (gated on `NEXT_PUBLIC_GA_ID`), Speed Insights (Vercel only), providers.
- `app/api/contact/route.ts`, `app/api/health/route.ts` (liveness ping), `app/api/notions/recent/route.ts` (homepage blog strip; keeps `@sanity/client` out of the client bundle).
- `components/sections/`: `Hero`, `NowBuilding` (+ `data/now.tsx`), `FeaturedProjects`, `ShelfSection`, `ExtensionsShowcase`, `HomeStack`, `NotionsStrip`, `WorkWithMe`, `Loadout`, `BuildStacks`, `TechStackBento`, `BuildCard`.
- `components/layout/`: `Navbar` (`labMenu[]` drives the Lab dropdown), `Footer` (contact card and form).
- `components/ContactForm/`: form UI and `useContactFormSubmit` (submission and Turnstile handling).
- `components/blog/`, `lib/sanity.ts`, `lib/blog-utils.ts`: N8 Notions.
  Posts without a cover image get a generated "signal" cover: `lib/blog-cover.ts` (art and topic colours), served as cached SVG files by `app/notions-cover/[version]/[topic]/[file]/route.ts`.
  The files are cached forever, so bump `COVER_VERSION` whenever the drawing changes.
- `data/`: `builds.tsx` (source of truth), `shelves.ts`, `loadout.tsx`, `aiStack.tsx`, `buildStacks.tsx`, `techStack.tsx`, `projects.tsx`, `now.tsx`.
- `lib/security/`: `rateLimiter.ts`, `turnstile.ts`, `validation.ts`, `testMode.ts`.
- `lib/email/`: `smtp.ts` (transport + `EMAIL_CONFIG`), `sender.ts`, `templates.ts`, `icons.ts` (generated).
- `next.config.mjs`: redirects, Sentry wrapper (tunnel at `/monitoring`); headers come from `lib/security/headers.mjs` (enforced CSP: add any new third-party origin there).
- `instrumentation*.ts`, `sentry.*.config.ts`: Sentry (inert without a DSN).
- `tests/unit/`, `tests/e2e/`, `playwright.config.ts`, `vitest.config.mts`.
- `public/builds/<slug>/`: build icons and screenshots; `public/tab/`: favicons and OG image.
- `docs/`: this file, `OWNER_TODO.md`, `N8BUILDS_PLAN.md`, `N8_NOTIONS_BLOG_IMPLEMENTATION.md`, `CLOUDFLARE_SECURITY.md`, `archive/`.

## Backlog

Owner decision pending: indigo accents (the Loadout "indigo" group, the "Browser tools" eyebrow, a few gradients) sit between blue and violet.
Tailwind 4 kept their hue but made them about 15% more saturated, so they read slightly more purple than before; switch them to blue/sky if they now feel off-palette.

Feature work, roughly in priority order:

1. Real screenshots for TL;DW and LocalDictate (ideally Asset Arsenal and VibeLog too) in `public/builds/<slug>/`; real marks for Sprite Arsenal and Portfolio Rank.
2. A `/builds` log index page (journal "heartbeat") and a "Log" nav item; detail pages already exist.
3. Keep `data/now.tsx` and the loadout data current.
4. Wire the Hero "Live" pill to real Twitch/YouTube status (manual today).
5. Hero: "LIVE on VibeLog" badge.
6. Fire the GA tag from the portfolio subdomain deploy for cross-subdomain tracking.
