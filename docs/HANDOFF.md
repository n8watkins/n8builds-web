# HANDOFF - n8builds (n8builds-web)

_Last updated: 2026-10-24._
## Current state and open work (2026-10-27): start here

This section is current; the sections below it date from 2026-10-24 and are kept for detail.
This repo also covers the admin dashboard's context (its own repo `n8watkins/n8builds-admin` has a matching handoff).

### Read first

1. `docs/DECISIONS.md` (rounds 10 to 13 and the dino entries are the newest calls).
2. `PROJECT_BACKLOG.md`: the one backlog for every project, including other repos' security findings (outdated Next.js on four live sites, GeminiGPT's keys, Render problems).
3. `docs/OWNER_TODO.md`, "Pending as of 2026-10-27": what only the owner can do.
4. Gotchas: rebuild from a clean `.next` before previews or E2E (stale Tailwind CSS from `.next/cache`); kill stale servers on the E2E port; commit headers at most 100 characters; `npm run test` also runs E2E, use `npm run test:unit` for unit tests.

### State

- Live on `main`: homepage rounds 11 to 13 (#69), My Loadout, levelled-up build pages and /builds with patch notes, dino fixes (#68, #71), release-kit 2 (#67; the `main` rule requires "check / check" and "CI result"), test stabilisation (#74), dino game stats (`POST /api/game`, #73), the Lab rail fix for Safari (#75).
- Docs-only and Dependabot changes skip Vercel builds (#77).
- Backlog updates #72, #78, #79, #80 (merged).
- Vercel's free plan allows 100 deployments per rolling 24 hours across the account; it was exhausted on 2026-10-27, so a PR's Vercel check can fail with "Deployment rate limited". Vercel isn't a required check.
- Vercel Web Analytics is switched on in the dashboard, but the site doesn't load it yet.

### Next

1. Add `@vercel/analytics` (`<Analytics />` in `app/layout.tsx`, next to Speed Insights), keep GA4; record the decision in `docs/DECISIONS.md`.
2. Intermittent E2E failures in CI's WebKit and mobile Safari shards: the Lab rail tests and `navigation-scroll.spec.ts` ("a post opened from the homepage starts at its top"). Reproduce, then fix the cause, not with retries.
3. When the owner sets up subdomains (rank, trailers, echo), update the links (list: https://claude.ai/artifact/8noJtJsWvWBefJ9jBE2qwu).
4. The Lab says Solara needs "no sign-up" while Solara has a Pro plan; change it to "free to start".
5. Once GeminiGPT moves to Gemini 3.5 Flash Lite (GeminiGPT #3), update any copy here that names its model.
6. Local housekeeping: about 48 stale local branches; before deleting `fix/ci-*` and `preview/all`, confirm their changes reached `main` (the rest were squash-merged).
7. Content: the audit's article ideas and stale-source fixes (https://claude.ai/artifact/2YNW1cpd8uvMzGwmuHUTH1); the blog's last post was 19 June.

### Blocked on the owner

- A second Upstash Redis database; `ANALYTICS_REDIS_REST_URL` and `ANALYTICS_REDIS_REST_TOKEN` on both the n8builds-web and n8builds-admin Vercel projects (dino stats are dropped until then).
- The Sentry read token for the admin dashboard; one sign-in at admin.n8builds.dev.
- Vercel retention (previews 7 days) for n8builds-web, portfolio and portfolio-rank.
- Subdomain DNS for rank, trailers and echo.

This file describes the current state only.
Session-by-session history up to 2026-06-25 lives in `docs/archive/HANDOFF-2026-06.md`.
Manual steps that need the owner (logins, dashboards) live in `docs/OWNER_TODO.md`.

## What this is

**n8builds** is Nathan Watkins' public builder-lab site, the top-of-funnel brand in a three-brand ecosystem:

| Brand | Job | Where |
|---|---|---|
| **n8builds** (this repo) | audience and attention ("building software in public") | https://n8builds.dev, github.com/n8watkins/n8builds-web (public) |
| dev-portfolio | developer credibility | https://portfolio.n8builds.dev, github.com/n8watkins/dev-portfolio (public), `~/n8builds/dev-portfolio` |
| Appturnity | client work and consulting | https://appturnity.com |

n8builds feeds the other two through bridge links and never replaces them.
Strategy and IA: `docs/N8BUILDS_PLAN.md`.

## Current state

- Live at https://n8builds.dev on Vercel (project `n8builds-web`, team natkins23s-projects), auto-deploying from `main`.
- Stack: Next.js 16 (App Router, webpack build), React 19, TypeScript, Tailwind 4 (configured in `app/globals.css`; there is no `tailwind.config`), Motion (`motion/react`; not framer-motion), Sanity (blog), Nodemailer + Gmail SMTP, Cloudflare Turnstile, Upstash Redis (rate limits), Sentry, GA4, Vercel Speed Insights.
- Pages: `/` (hero, "What I'm working on", the Lab, notions, stack, work-with-me, contact, each in its own full-width band), `/blog` + `/blog/[slug]` (N8's Notions, ISR hourly), `/builds` (the build log, ISR hourly), `/builds/[slug]`, `/loadout`, `/privacy`, `/live` (redirects to the live stream, else lists the channels).
- **Status (2026-10-24):** everything is merged and live, including the build log, the live player and the n8builds case study (PRs #10 to #15). Work now goes through pull requests (`docs/BUILD_PLAN.md`); what's left and what's needed from the owner is in `docs/NEXT_STEPS.md`.
  The review of the 2026-10-22/23 work (`docs/prompts/review-2026-10-22-changes.md`) ran on 2026-10-23; its fixes (Solara's private-repo link, 320px hero, modal mobile menu, em-dash sweep, blog fact fixes) are shipped.
- **Next session:** work through `docs/NEXT_STEPS.md`, the step-by-step checklist of what's left and what's needed from the owner.
- **Sharing posts:** every post ends with "Share this note": "Share on X" opens X compose with the title, the canonical link and `via=n8watkins` (free; no X API), and "Copy link" copies the canonical URL (`components/blog/ShareBar.tsx`).
  Automatic posting to X is a separate, paid option (`docs/X_ARTICLES_PLAN.md`).
- **Scroll reveals:** sections below the fold fade up once as they scroll in (`components/ui/Reveal.tsx`: a CSS transition, `.reveal` in `app/globals.css`, started by an IntersectionObserver; homepage bands, Lab parts, build-page sections, blog cards past the first row, related posts, loadout sections, the contact card, the site footer, and /privacy past its first screen).
  Never wrap the hero or anything above the fold in Reveal: it starts at opacity 0 until its script runs, which holds back the LCP.
  Above the fold, use the CSS load fade instead (`components/ui/FadeIn.tsx`, the `fade-up` utility in `app/globals.css`): it plays from the server HTML without JavaScript, with no delay on the LCP element (the /blog header and first card row, the post header and cover, the /loadout header, /live, the top of /privacy).
  Reduced motion skips both: no fade, no rise. `tests/e2e/reveal.spec.ts` and `tests/e2e/blog-motion.spec.ts` guard them.
- **Hero layout:** the hero content is top-aligned, not vertically centered, and the ambient glows mount after hydration: both caused layout shift on slow devices (Nightly Lighthouse CLS 0.29). Keep it that way.
- SEO: every page builds its metadata with `pageMetadata()` (`lib/seo.ts`), which sets the canonical URL, og:url and both share cards with a preview image.
  Next.js merges metadata shallowly, so a page that sets its own `openGraph` without the helper loses the image.
  Blog posts and builds get generated 1200x630 PNG cards (`/blog/<slug>/og.png`, `/builds/<slug>/og.png`, drawn by `lib/og-card.tsx` with `next/og` over the blog-cover art, Inter from `assets/fonts/`).
  A post's card draws its uploaded SEO image or cover (dimmed) behind the title, falling back to the generated art; posts always share their og.png, because a bare illustration in a feed doesn't say what the post is.
  The share description is the post's Sanity "Share description" (`seo.shareDescription`, max 120 characters), else whole sentences of the excerpt that fit in 120 (`shareSummary()`).
  JSON-LD: WebSite and Person on the homepage, BlogPosting on posts (`components/JsonLd.tsx`).
  The sitemap revalidates hourly.

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
- It is built with a made-up GA ID (`G-E2ETEST000`) so the consent banner and GA loader exist, and browsers run in the America/Los_Angeles time zone so the banner stays away unless a spec asks for it (`tests/e2e/consent.spec.ts` picks Europe/Berlin or America/Toronto and answers gtag.js itself).
  No email is sent (Nodemailer JSON transport), and GA, Sentry and Upstash are forced off.
- A running server on the port is reused locally; if it serves an old build, kill it first (`ss -ltnp | grep 3747`).
- After upgrading `@playwright/test`, run `npx playwright install` or every browser test fails instantly.
- Tests do not retry. A flaky test is a bug to fix.

CI (`.github/workflows/`):

- `ci.yml` on every push to `main` and every PR: lint, type-check, unit tests; E2E on all six Playwright projects as parallel jobs (each builds the app in test mode; WebKit and mobile Safari, the slowest, run as two shards each); Lighthouse budgets. About 6 minutes end to end.
- **Docs-only changes skip the browser suite and Lighthouse** (only Markdown, `docs/` or `LICENSE` changed; the "What changed" job decides). Lint, types, unit tests and the commit check still run. `vercel.json`'s `ignoreCommand` skips Vercel builds for the same changes, so a docs-only merge doesn't redeploy.
- **Branch protection on `main`** is the ruleset "release-kit: protect main" (Settings, Rules; made by the kit's protect command, now `npx release-kit protect`, replacing classic protection on 2026-10-25).
  It requires two checks: "CI result" (a summary job that passes when every CI job passed or was skipped on purpose) and "check" (commit messages), and blocks deletion and force pushes.
  Docs-only PRs pass in about a minute.
  Two actors may bypass it: repository admins (so `npm run release -- --push` works by hand) and the deploy key "release-kit train", whose private half is only in the Actions secret `RELEASE_TRAIN_KEY`.
  Rotate the key by running `npx release-kit protect` again.
- Work goes through pull requests (see `docs/BUILD_PLAN.md`); full browser runs happen in Actions, not on the dev machine.
- `nightly.yml` at 09:00 UTC and on demand: E2E on every browser project, Lighthouse budgets (`npm run lighthouse`), and the build log's repo check (`scripts/check-build-repos.mjs`, see "Build log").

## Build log (`/builds`)

The page shows what shipped across the builds without anyone posting: it fills itself from GitHub, and hand-written Sanity highlights are an occasional extra.
Plan and rationale: `docs/BUILDS_LOG_PLAN.md`.

- **Where it comes from:** every build in `data/builds.tsx` with a `repo` (`owner/name`) is tracked; that list is the single list of tracked repos.
  `lib/build-log.ts` fetches each repo's releases and the owner's last 100 commits on the default branch (asking for the owner's commits keeps Portfolio Rank visible: its newest 100 commits are all daily bot syncs).
  It uses `GITHUB_TOKEN` (a fine-grained read-only token, set in Vercel and `.env.local`); without one it makes anonymous requests under `next dev` only.
- **Freshness and failures:** `/builds`, the build pages and the sitemap revalidate hourly, and the GitHub fetches sit in Next's fetch cache for an hour.
  Only successful responses are cached, so a GitHub error never replaces good data.
  A repo that fails with nothing cached is left out; if every repo fails on a revalidation, the render throws and ISR keeps serving the last good page.
  A build never fails because of GitHub (it renders what it has).
- **Filter rules** (`classifyCommit` in `lib/build-log.ts`):
  - Dropped: bot authors (`[bot]`), merge commits, Conventional Commit types other than `feat`, `fix`, `perf` and `security` (so `docs`, `chore`, `test`, `ci`, `build`, `style`, `refactor`, `release`...), and anything mentioning repo upkeep (HANDOFF, README, CHANGELOG, LICENSE, docs, tests, e2e, lint, CI, code-review findings, the privacy policy).
  - Kept: `feat`, `fix`, `perf` and `security` commits, plain sentences that start with a verb from the `VERBS` list (Add, Ship, Launch, Support, Make, Fix...; upkeep verbs like Update, Upgrade, Bump, Remove are not on it), and "Feature area: what changed" headers with a capitalised area.
  - Cleaned: the type prefix, trailing PR numbers and work-item codes (`(#69)`, `(W4-E)`) are stripped, the first letter is capitalised, em dashes become plain dashes, and long messages are cut at 110 characters.
  - Collapsed: one entry per build per day (Los Angeles time), showing the strongest message (feat and plain "Add"-style verbs beat fixes; the newest wins a tie) plus "and N more changes".
  - Releases: GitHub Releases (not drafts or prereleases) and version-bump commits (`build(tube-vault): v0.3.80`, `chore(release): v1.2.0`, `v1.0.6: notes`) become "Shipped vX.Y.Z", one per day (the highest version), detailed by the version's notes or the day's strongest change.
    A release always outranks that day's commits, and a GitHub Release and its release commit count once.
- **Per-build switch:** `log: 'releases'` on a build shows only its releases (Scribe uses it: its GitHub Releases tell the story); `log: 'off'` hides it from the log; the default is `'commits'`.
  To switch a repo to releases-only, set `log: 'releases'` on its entry in `data/builds.tsx`.
- **Internal work stays out:** commits about sprints, audits, batches, coverage, compliance or phase codes (P7a), and number-heavy operations logs, are dropped (`INTERNAL` and `NUMBER_HEAVY` in `lib/build-log.ts`).
- **Hiding one entry:** add a phrase from its title to `logHide` on the build in `data/builds.tsx`; any commit-based entry containing it (case-insensitive) disappears on the next hourly refresh.
- **Filtered links:** `/builds?build=x` hides the prerendered, unfiltered feed until the filter applies (an inline script in `components/log/LogFeed.tsx`), so a slow phone never flashes every build.
  A build without a `repo` (n8builds itself) or with `log: 'off'` is left out of the log entirely, index and feed, rather than shown as "nothing logged".
  Builds without a public `github` link (Solara today) get no links into their repo.
- **Highlights:** a Sanity `logEntry` document (date, build slug, title up to 90 characters, optional note, link and image, kind: shipped / fixed / learned / next) is pinned above the automatic entries of its month and styled as featured.
  The Studio has the `logEntry` schema ("Build log highlight", deployed 2026-10-24); with none posted, the log simply has no highlights.
  To post one once the schema exists: Studio, Log entry, fill it in, publish; it appears within the hour.
- **Page:** a builds index (most recently active first; "Last shipped Oct 2026", never "N months ago", so quiet builds read as finished) and a month-by-month feed with a build filter kept in the URL (`/builds?build=scribe#activity`), opening on the 12 months up to the newest entry with "Show older entries" for the rest.
  Each build page has "Recent activity" (its newest five entries) linking to its filtered log.
  The feed (`components/log/LogFeed.tsx`) is a client component that is prerendered unfiltered and hydrated in place, with no entrance animation, so it is readable before any JavaScript runs.
  Only its small URL reader (`useSearchParams`) sits under `Suspense`: a boundary around the whole feed made every visit throw the prerendered feed away on hydration, render it again hidden and fade it back in (the "laggy" load, fixed 2026-10-25; guarded by the "hydrated in place" test in `tests/e2e/build-log.spec.ts`).
  The filter applies right after hydration.
- **Tests:** `BUILD_LOG_FIXTURE=1` swaps both fetchers for `tests/fixtures/build-log-github.json`, real commits and releases recorded from the six repos plus one sample highlight; Playwright and the Lighthouse jobs set it, so tests never call GitHub.
  Refresh the fixture with `GITHUB_TOKEN=... node scripts/build-log-fixture.mjs` (then update the expectations in `tests/unit/build-log.test.ts` and `tests/e2e/build-log.spec.ts`).
- **Monitoring:** the nightly `Build log repos` job runs `scripts/check-build-repos.mjs`: per repo, the latest release, release-kit adoption (the `release-kit` dev dependency's tag, or `scripts/release-kit/VERSION` in a repo that copies the scripts) and how many of the newest 20 commits pass the release-kit commit check.
  It fails only when a repo can't be read.
  It uses the `BUILD_LOG_GITHUB_TOKEN` repo secret if set (to also catch the site's token expiring), else the workflow's own token.

## Live streams

While Nathan is live, every page shows a floating corner player, the navbar's Twitch link gets a live dot, and `n8builds.dev/live` redirects to the stream (plan: `docs/LIVE_STREAM_PLAN.md`).

- **Detection** (`lib/live.ts`, served by `app/api/live/route.ts`): three sources, asked in parallel and merged per platform.
  - The Sanity **Live status** switch (document id `liveStatus`, read from the public CDN, published changes only): the only source for X, and a manual override for Twitch and YouTube.
    It counts as off 12 hours after its `startedAt` (stamped by the Studio when switched on; `_updatedAt` is the fallback).
  - Twitch Helix `GET /streams?user_login=n8watkins` with an app token, only when `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are set.
  - YouTube Data API, only when `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID` (the `UC...` ID) are set: the newest 10 uploads (`playlistItems.list`), then `videos.list` for `liveBroadcastContent` (2 quota units a check).
    A stream with embedding off, made for kids or age-restricted gets the "Watch on YouTube" card instead of the embed.
  - `LIVE_YOUTUBE_VIDEO_ID` adds one video (an unlisted test stream); without an API key it is taken as live unchecked, so remove it after testing.
  - When live on several platforms the order is Twitch, YouTube, X, other; `LIVE_PREFERRED_PLATFORM` (default Twitch) picks where `/live` goes and which tab opens.
- **Caching:** 60 seconds per server instance (concurrent requests share one check), and `s-maxage=60` on `/api/live` for the CDN.
  Any failure counts as offline; a source that errors is skipped and logged, and `/api/live` always answers 200.
- **Player** (`components/live/`): `LiveLoader` (mounted in `app/layout.tsx`) checks `/api/live` after the load event, then once a minute while the tab is visible, into a small store the navbar reads too.
  `LivePlayer` and the platform iframes load only while live (`next/dynamic`), so offline page loads fetch one small JSON answer and nothing else.
  Twitch embeds need a listed `parent` host: n8builds.dev and localhost play, Vercel previews show the "Watch on Twitch" card.
  YouTube uses `www.youtube-nocookie.com` and unmutes over postMessage; Twitch reloads its player with `muted=false`.
  X has no live player embed (and X's post embed would need its script in the CSP), so X streams get a card with "Watch on X".
  The corner and minimized choices and closed streams are kept in localStorage (`n8-live:prefs`, `n8-live:closed`), each access in try/catch.
  Phones (below 640px) always start as the pill at the bottom left.
  While the player covers the bottom-right corner it sets `--live-dock-br`, which lifts the homepage scroll-to-top button above it.
- **Going live on X (or overriding a check):** in the Studio, open **Live status** (first item), switch **Live now** on, pick the platform, optionally add the link and a title, and **Publish**; switch it off and publish when done.
  The site shows it within a minute or two: the server caches each check for 60 seconds, the CDN for 30, and open pages poll every 30.
  The Studio must be deployed (`npx sanity deploy` in `n8builds-studio`) before the switch exists there.
- **Tests:** `LIVE_TEST_MODE=1` (set in `playwright.config.ts`, ignored when `VERCEL` is set) swaps every source for fake answers.
  The scenario comes from the `n8-live-test` cookie (`none`, `twitch`, `youtube`, `both`, `x`, `all`, `youtube-no-embed`, `other`), else `LIVE_TEST_SCENARIO`, else offline, so the rest of the suite sees no player.
  `tests/e2e/live.spec.ts` stubs the Twitch and YouTube players with `context.route` (after the browser's CSP check); `tests/e2e/api/live.spec.ts` covers `/api/live` and the `/live` redirects; `tests/unit/live.test.ts` covers the resolver.
  To look at the player locally: `LIVE_TEST_MODE=1 npm run dev`, then set the `n8-live-test` cookie to a scenario in the browser's devtools.

## Releases

This repo follows the n8 release standard (`RELEASING.md`; the kit is public at https://github.com/n8watkins/release-kit, adopted 2026-10-25; installed as a dev dependency pinned to a release tag, now v2.0.0; Dependabot opens the update PR when the kit releases, and `npm run release:check` warns if it falls behind).
- Commit messages are Conventional Commits, checked by `.husky/commit-msg` and the "Commit messages" workflow on every push and PR.
- Every merge to `main` deploys; a release is a milestone on top of that, and the **release train** cuts it so nobody has to remember.
- **Release train** (`.github/workflows/release-train.yml`, settings in `.release.json` `train`): every Monday at 16:00 UTC (9:00 in Los Angeles in summer, 8:00 in winter) it looks at the commits since the last tag.
  With no `feat`, `fix`, `perf` or `security` commit (or revert or breaking change) it releases nothing.
  Otherwise it runs `release:check` on that commit, makes the `chore(release): vX.Y.Z` commit and tag (bump from the commits), pushes that commit to a temporary `release-train/vX.Y.Z` branch, runs `ci.yml` and `commits.yml` there (the workflows behind the required "CI result" and "check"), and only when both pass pushes `main` and the tag together and starts the Release workflow on the tag.
  The push uses the deploy key: GitHub doesn't count checks from runs the train starts with `workflow_dispatch`, so the workflow's own token is rejected by the ruleset (the first train run, 40182908803, failed exactly that way).
  The tag pushed with the key starts the Release workflow by itself, and the push to `main` runs CI there as usual.
  If `main` moves while it runs or a check fails, nothing is released and the temporary branch is deleted.
- "Run workflow" on the Release train releases now; pick a bump to force one, or tick "dry run" to see the plan and notes only. `npm run release -- --plan` shows the same plan locally (on `main`).
- By hand: `npm run release -- --push` from a clean, up-to-date `main` still works (admin bypass of the protection); it runs `release:check` first and undoes the commit and tag if the push is rejected.
- A failed Release run: fix the cause, then run the Release workflow on the tag (Run workflow, "Use workflow from" the tag). Never move or re-push a pushed tag.
- `release:check` is lint, types and unit tests; the browser suite already gates every PR, and the train runs all of CI on the release commit.
- Changelog dates are in Los Angeles (`.release.json` `timeZone`); the workflows use Node 24 (`.release.json` `node`), like CI.
- Don't edit `CHANGELOG.md` or versions by hand.

## Contact form

Flow (`app/api/contact/route.ts`): size check (10KB) and a JSON content type (else 415), JSON + Zod validation, honeypot, Turnstile, per-IP rate limit, site-wide daily limit, per-recipient auto-reply limit, then the notification email and the auto-reply.
Every free check runs before the first Upstash call, so requests without a solved Turnstile challenge never spend the Redis quota.

- **Rate limits** (`lib/security/rateLimiter.ts`): 5/hour per IP (IPv6 per /64), `CONTACT_DAILY_LIMIT` (default 50) verified submissions per day, and 1 auto-reply per recipient address per day (keyed by a hash), stored in Upstash Redis via `KV_REST_API_*` (or `UPSTASH_REDIS_REST_*`).
  Past the recipient limit the owner notification still goes out; only the auto-reply is skipped.
  The auto-reply greets by first name only when it is a plain word, otherwise "Hey there", so the form can't carry a linked domain to a third party.
  Keys outside Vercel production are namespaced by `VERCEL_ENV` (`contact:preview:*`, `contact:development:*` with a pulled env, `contact:local:*` otherwise), so one database serves every environment without previews or local runs touching production's counters.
  `CONTACT_TEST_MODE` always uses an in-memory store, as does `next dev` without Upstash configured.
- **Edge rate limit:** a Vercel WAF rule (Firewall tab, not code) allows 10 `POST /api/contact` per minute per IP and answers 429 itself; the client shows its own message for a 429 without our JSON.
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

The owner's standing decisions live in [DECISIONS.md](DECISIONS.md), the one place they are kept. Read it before changing content, design or workflow, and add new decisions there.

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
- Reduced motion is honored everywhere: CSS animations stop globally, smooth scrolling is enabled only under `prefers-reduced-motion: no-preference`, the few motion animations left use `MotionConfig reducedMotion="user"` (`components/MotionProvider.tsx`), and timer-driven cycles check `usePrefersReducedMotion` (`hooks/`).
  `Marquee` requires a `label` prop (its reduced-motion fallback is a labelled, keyboard-reachable list).
  With motion on, its loop copies are `aria-hidden`; focusable children read `MarqueeCopyContext` to leave the tab order there (see `components/ui/StackTile.tsx`).
  The copies join after hydration, so `Marquee` sets their animation clocks to the first copy's; without that they drift over each other.
  `StackTile` centres its name and description as one block (the description's row opens from `grid-rows-[0fr]` to `1fr`), so hovered content stays centred at any length; `tests/e2e/stack-tiles.spec.ts` measures it.
- The homepage AI kit has an easter egg: a pixel dino that walks the marquee rows and falls a row each time the visitor pauses the marquee (`components/features/dino/`, on `AITechStack` with `dino`, homepage only).
  Only an empty layer ships up front; the game is a lazy chunk loaded when the panel nears the viewport, runs on requestAnimationFrame, stops off screen and in hidden tabs, and doesn't exist under reduced motion. `tests/e2e/ai-kit.spec.ts` covers it.
- Tailwind 4 applies `hover:` only on devices that can hover, so anything revealed on hover also needs a focus/tap path (`StackTile` reveals on `focus:` too).
  `tests/e2e/reduced-motion.spec.ts` covers this.
- Known dev-only noise: `next dev` (Turbopack) logs a 404 for a stale preload hint of the lazily loaded confetti chunk (`ConfettiPlayer`).
  The chunk itself loads and the confetti renders; production (webpack) is unaffected.
- Lighthouse: `npm run build && npm run lighthouse` runs `scripts/lighthouse.mjs` (Lighthouse 13 directly; `@lhci/cli` was dropped as unmaintained and the source of most `npm audit` findings).
  Budgets live in that script; reports go to `.lighthouse/` (a CI artifact in the nightly run), not to public storage.
  Under WSL set `CHROME_PATH` to a Linux Chrome (Playwright's works: `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome`).
- `npm audit` (all deps) has one known, unfixable finding: `braces` (GHSA-vfj7-8cjw-p6xm), via `eslint-config-next` → `fast-glob` → `micromatch`.
  No patched `braces` exists; it only expands the lint plugin's own glob patterns, never untrusted input. `npm audit --omit=dev` is 0.
- Don't `npm run build` by hand and then run Playwright with `E2E_SKIP_BUILD=1`: a hand build inlines the real Turnstile site key from `.env.local`, which Cloudflare rejects on localhost, so every contact-form test fails.
  Let Playwright build (it sets the test keys), or set `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA` for the build.
- The image optimizer accepts exact sources only (`images` in `next.config.mjs`): local files and our Sanity project, without query strings.
  Add any new remote image host there.
- Unknown `/blog/<slug>` URLs return a 404 status with `noindex`, but Next 16 renders the 404 body client-side (it does this for any `notFound()` thrown from a page).
  `/builds/<slug>` uses `dynamicParams = false`, so its 404 is fully server-rendered; the blog can't, since new posts must work without a deploy.
- `www.n8builds.dev` and `n8builds-web.vercel.app` redirect (308) to `n8builds.dev` through Vercel domain settings, not code.
- The navbar shows the desktop links from `lg` (1024px) up; below that, the menu button and overlay menu (scroll lock, backdrop, Escape).
  Between 768px and ~1000px the desktop row didn't fit and pushed the Appturnity CTA off-screen.
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

- `app/page.tsx`: homepage metadata, JSON-LD, and the three newest posts (fetched from Sanity on the server; the page is static and revalidates hourly).
  `components/HomePage.tsx` is a server component: every section renders on the server, each wrapped in `SectionErrorBoundary`, and only the interactive parts are client components (islands): the navbar, the hero's grid and wire meter (`HeroGrid`, `HeroChainMeter`), the carousels (`NowCarousel`, `ExtensionsCarousel`), the Lab rows' gallery and Details dialog (`FeaturedProjectIslands`), the scroll reveals, the contact form, and `HomeEffects` (analytics and the ambient glows).
  Keep it that way: a section that turns into a client component ships all its code to every phone ("Speed first" in DECISIONS.md).
- `app/layout.tsx`: site-wide metadata defaults, GA (gated on `NEXT_PUBLIC_GA_ID`), Speed Insights (Vercel only), providers.
- `app/api/contact/route.ts`, `app/api/health/route.ts` (liveness ping), `app/api/live/route.ts` (live status).
- `lib/live.ts`, `lib/live-shared.ts`, `components/live/`, `app/live/page.tsx`: live streams (see "Live streams").
- `components/sections/`: `Hero`, `NowBuilding`, `FeaturedProjects`, `ShelfSection`, `LabSubheader`, `ExtensionsShowcase`, `HomeStack`, `NotionsStrip`, `WorkWithMe`, `Loadout`, `BuildStacks`, `TechStackBento`, `BuildCard`.
- `components/layout/`: `Navbar` (`labMenu[]` drives the Lab dropdown), `Footer` (contact card and form).
- `components/ContactForm/`: form UI and `useContactFormSubmit` (submission and Turnstile handling).
- `components/blog/`, `lib/sanity.ts`, `lib/blog-utils.ts`: N8's Notions.
  Posts without a cover image get a generated "signal" cover: `lib/blog-cover.ts` (art and topic colours), served as cached SVG files by `app/notions-cover/[version]/[topic]/[file]/route.ts`.
  The files are cached forever, so bump `COVER_VERSION` whenever the drawing changes.
- `data/`: `builds.tsx` (source of truth), `shelves.ts`, `loadout.tsx`, `aiStack.tsx`, `buildStacks.tsx`, `techStack.tsx`, `projects.tsx`.
- `lib/security/`: `rateLimiter.ts`, `turnstile.ts`, `validation.ts`, `testMode.ts`.
- `lib/email/`: `smtp.ts` (transport + `EMAIL_CONFIG`), `sender.ts`, `templates.ts`, `icons.ts` (generated).
- `lib/seo.ts`: `pageMetadata()`, `summarize()`, JSON-LD builders; `lib/og-card.tsx`: share-card renderer.
- `lib/build-log.ts`, `components/log/`, `app/builds/page.tsx`, `app/builds/og.png/`: the build log; `scripts/check-build-repos.mjs` (nightly repo check) and `scripts/build-log-fixture.mjs` (records the test fixture).
- `next.config.mjs`: redirects (permanent 308s for retired routes), image sources, Sentry wrapper; headers come from `lib/security/headers.mjs` (enforced CSP: add any new third-party origin there).
- `instrumentation*.ts`, `sentry.*.config.ts`: Sentry (inert without a DSN).
  The browser SDK posts to `/monitoring` (`app/monitoring/route.ts`), which forwards only envelopes for our own DSN; the SDK's `tunnelRoute` rewrite was an open relay to any Sentry project.
  The server SDK sends no stack-frame locals and drops contact-route request bodies (`lib/sentry-scrub.ts`).
- `tests/unit/`, `tests/e2e/`, `playwright.config.ts`, `vitest.config.mts`.
- `public/builds/<slug>/`: build icons and screenshots (`n8builds/` holds this site's own); `public/tab/`: favicons and OG image.
- `docs/`: this file, `OWNER_TODO.md`, `prompts/review-and-improve.md` (ready-to-paste prompt for the next review pass), `prompts/review-2026-10-22-changes.md` (the 2026-10-22/23 review prompt, already run), `prompts/review-2026-10-24-changes.md` (the next review, not yet run), `N8BUILDS_PLAN.md` (vision, IA and content inventory), `NEXT_STEPS.md` (the checklist), `BUILDS_LOG_PLAN.md`, `LIVE_STREAM_PLAN.md`, `X_ARTICLES_PLAN.md`, `CLOUDFLARE_SECURITY.md`, `archive/` (old handoffs, the blog implementation record).
- `docs/WEB_VITALS.md`: Web Vitals reporting, the dev HUD and GA events.

## Backlog

Feature work, roughly in priority order:

1. Real screenshots for TL;DW and Scribe in `public/builds/<slug>/`; a real mark for Portfolio Rank.
2. Keep the loadout data current.
3. Bring VibeLog back from `hiddenBuilds` when it comes off hiatus (see "Hidden builds" above), and mention it again in the Welcome post if it fits.
4. Live streams, part 2: add the Twitch and YouTube credentials in Vercel, test with a real stream on each platform, then re-add YouTube to the navbar and `sameAs` once its channel is live (part 1 is built; see "Live streams").
5. Fire the GA tag from the portfolio subdomain deploy for cross-subdomain tracking.
