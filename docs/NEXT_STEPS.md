# Next steps

The working checklist for n8builds.dev.
Part 1 is everything only you can do; Part 2 is everything Claude can build, and which of it can start right now.
Tick an item off by changing `[ ]` to `[x]`.

Written 2026-10-23, revised 2026-10-25 (evening).
The owner's standing decisions are in [DECISIONS.md](DECISIONS.md).
Detailed plans: [BUILDS_LOG_PLAN.md](BUILDS_LOG_PLAN.md), [LIVE_STREAM_PLAN.md](LIVE_STREAM_PLAN.md), [X_ARTICLES_PLAN.md](X_ARTICLES_PLAN.md), and the release standard in `~/n8builds/release-kit` (STANDARD.md).

## Part 1: Your to-do list

### A. Decisions (one-line answers to Claude; about 10 minutes in total)

- [x] **Appturnity card:** "What I'm working on" is now the Appturnity ad, written from Appturnity's own repo (2026-10-25); keep its "right now" lines current as Appturnity ships.
- [x] **Solara's GitHub link:** back (the repo is public).
- [x] **One front door:** portfolio.n8builds.dev stays separate, as the dev-portfolio segment (2026-10-25). Was: keep portfolio.n8builds.dev as a separate site, or make n8builds the portfolio and redirect or slim down the old one?
- [x] **GitHub repo settings for n8builds-web:** done 2026-10-25 (description, homepage, topics, Wiki and Projects off, branches deleted on merge). Was: OK for Claude to fix the description, homepage URL and topics, and switch off the empty Wiki and Projects tabs? (yes / no)
- [x] **Dependency updates:** yes (2026-10-25); Claude is working through them. Was: OK for Claude to work through the 6 Dependabot pull requests? (yes / no)
- [x] **Release standard for the other projects:** the owner will apply release-kit to TL;DW, TubeVault, Piper TTS, Solara and Portfolio Rank themselves, later (2026-10-25). Claude doesn't.
- [x] **Release-kit on GitHub:** public at https://github.com/n8watkins/release-kit (2026-10-25), released through its own workflow (v1.0.0 to v1.0.3).
- [x] **Release train:** Mondays 16:00 UTC confirmed (2026-10-25).
- [x] **Articles and X:** always site first; reposting to X is separate (2026-10-25, in [DECISIONS.md](DECISIONS.md)).
- [ ] **Live player defaults** (or keep these): bottom-right corner, Twitch first when live on several platforms, player on every page.

### B. Accounts and keys (do these yourself; never paste secrets in chat)

- [x] **Solara's live-site link:** now https://solara-uv.web.app (the old address redirects there), and its GitHub link is back since the repo is public (2026-10-24).
- [ ] **Delete the old reCAPTCHA key** at https://www.google.com/recaptcha/admin (the old portfolio site entry). It leaked in git history in 2025; it's unused, and deleting it makes the leak worthless. 1 minute.
  Only the owner can do it (it's in their Google account). No replacement is needed: the contact form uses Cloudflare Turnstile, not reCAPTCHA.
- [ ] **Twitch developer app** (for live detection; 2 minutes): dev.twitch.tv, Your Console, Register Your Application. Name `n8builds.dev`, OAuth Redirect URL `http://localhost`, category Website Integration, client type Confidential. In the project folder run `! vercel env add TWITCH_CLIENT_ID production` and `! vercel env add TWITCH_CLIENT_SECRET production` and paste the values at the prompts.
- [ ] **YouTube channel:** tell Claude its handle or URL; in YouTube Studio, enable live streaming (can take 24 hours the first time) and leave embedding on for your streams.
- [ ] **YouTube Data API key** (5 minutes): console.cloud.google.com, new project `n8builds-live`, enable "YouTube Data API v3", Credentials, Create credentials, API key, restrict it to YouTube Data API v3. Then `! vercel env add YOUTUBE_API_KEY production`.
- [ ] **X:** confirm you'll stream from @n8watkins.
- [ ] **X developer account** (only if you choose automatic posting to X): developer.x.com, a small prepaid credit, and its keys added to Vercel the same way.

### B2. Small cleanups only you can do (2026-10-25)

- [ ] **GitGuardian incident 39011681:** mark it a false positive. A local Lighthouse run left a throwaway headless-Chrome profile in a PR #39 commit (its Preferences hold a random value); the files were removed before the squash merge, so main never had them.

Portfolio Rank and OpenPing keep their own to-do lists, in their repos: `docs/FOLLOW_UP_2026-10.md` on branch `docs/follow-up-2026-10` in each (not merged yet).
Portfolio Rank's starts with rotating its invalid Gemini API key (nothing has been graded since late July 2026); OpenPing's covers the off-hours status bug.

### C. Content (ongoing)

- [ ] **Screenshots:** TL;DW, Scribe, and the Solara dashboard (to replace its marketing card). Drop them in the Screenshots folder and tell Claude.
- [ ] **One real number per build** where you have one: installs, users, stars, portfolios ranked.
- [ ] **A blog post every quarter or so,** or publish one of the four drafts.
- [ ] **After the build log launches:** look it over; optionally post one hand-written highlight in the Studio.
- [ ] **Before the first public stream:** a short test stream on each platform with Claude.
- [ ] **Release-kit for OpenPing and dev-portfolio** (along with the other build repos, when you roll it out): `node ~/n8builds/release-kit/apply.mjs <repo>`.
- [ ] **Streaming links on the portfolio:** it links `twitch.tv/n8builds` and `youtube.com/@n8builds` (that channel is titled "flipbits"), n8builds.dev links `twitch.tv/n8watkins`; settle them when streaming starts.

## Part 2: What Claude builds

**Done 2026-10-26:** the review of the 2026-10-25 work and the homepage speed refactor (see the done log).
What is left on phone speed: the homepage's simulated LCP (~3.5s) is now mostly the download of React and Next themselves (about 150 KB compressed of the ~270 KB the page loads first), which a page can't drop; the next gains would come from fewer client islands on the page, not from any one of them.


Ordered by value.
"Ready now" means nothing from Part 1 is needed to start.

| # | Build | Ready now? | Waits on | Plan |
|---|---|---|---|---|
| 1 | **Done (#14):** **the build log** (`/builds`): builds index sorted by activity, monthly feed from GitHub releases and commits, build-page "Recent activity", navbar "Log" link, nightly check of the tracked repos | Built; in review on `feat/build-log` | Merge; then the Studio's `logEntry` schema for highlights | [BUILDS_LOG_PLAN.md](BUILDS_LOG_PLAN.md) |
| 2 | **Done (#13):** **live streams, part 1:** the floating corner player (tabs, unmute, expand, move, minimize, close, phone pill), "Watch on Twitch / YouTube / X" buttons, the `n8builds.dev/live` share link, navbar live dots, and the Sanity "Live status" switch (works for X and as a manual override) | Yes, against fake live data and the Studio switch | Nothing to build; Twitch and YouTube detection switch on when their keys arrive | [LIVE_STREAM_PLAN.md](LIVE_STREAM_PLAN.md) |
| 3 | **Live streams, part 2:** automatic Twitch and YouTube detection, the YouTube link back in the navbar | No | Twitch app, YouTube channel and API key (B) | [LIVE_STREAM_PLAN.md](LIVE_STREAM_PLAN.md) |
| 4 | **Done (#12):** **a build page for n8builds itself:** tests on five browsers, security headers and CSP, near-perfect Lighthouse scores, the agent-driven workflow, the release standard | Yes | Nothing | - |
| 5 | **Partly done (#11: Share on X and Copy link on posts):** **X sharing:** "Share on X" on every post and in the Studio, "Copy for X", and "On X" entries in N8's Notions | Mostly (the free parts) | Your choice of site-first or X-first; keys only for automatic posting | [X_ARTICLES_PLAN.md](X_ARTICLES_PLAN.md) |
| 6 | **Dependency updates:** review and merge the Dependabot PRs; the four major upgrades one at a time with the full test suite | No | Your OK (A) | - |
| 7 | **Started (n8builds-web adopted it, #17; v1.1.0 released):** **release standard rollout:** apply release-kit to five repos, baseline tags, propose milestone backfills for your approval | No | Your OK (A) | `~/n8builds/release-kit` |
| 8 | **Quick fixes from your decisions:** Appturnity card, Solara link, GitHub settings, front-door redirect | No | Your answers (A) | - |
| 9 | **Proof updates:** add your screenshots and numbers to the build pages | No | Your content (C) | - |

Suggested order: 1 and 2 now (they need nothing), 4 next, then 6-9 as your answers come in, and 3 a week before your first stream.

## How to use what's live now

- **Going live on X (or anywhere the site can't detect):** open the Sanity Studio (the app works on a phone), tap "Live status", switch "Live now" on, pick the platform, paste the stream or post link, add a title, Publish. The corner player, the navbar dot and n8builds.dev/live switch on within a minute. Switch it off and Publish when you're done; it also turns itself off after 12 hours.
- **A build log highlight:** in the Studio, "Build log highlight", pick the build, write one line, Publish. It's pinned at the top of its month on n8builds.dev/builds within the hour.
- **Twitch and YouTube** are detected automatically once their keys are in Vercel (Part 1 B); until then, use the switch for them too.

## On hold

- **Chrome Extension Launch Kit:** off the site (2026-10-23) while you decide what to do with it; its URL redirects to the extensions.
- **VibeLog:** hidden, record kept; comes back when it's ready.
- **YouTube link:** removed until the channel is live; returns with build 3.

## Done recently (2026-10-22 to 2026-10-24)

Everything here is merged and live.
To review it later, paste [prompts/review-2026-10-24-changes.md](prompts/review-2026-10-24-changes.md) into a fresh session.

**Pull requests (2026-10-24), each with the full CI green before merging:**

| PR | What | Where to look |
|---|---|---|
| #10 | CI runs all six browser projects in parallel, plus Lighthouse, on every pull request | `.github/workflows/ci.yml` |
| #11 | "Share on X" and "Copy link" at the end of every post | any post, `components/blog/ShareBar.tsx` |
| #12 | A case-study build page for the site itself, featured in the Lab | https://n8builds.dev/builds/n8builds |
| #14 | The build log, fed hourly from GitHub; "Recent activity" on build pages; "Log" in the navbar; nightly repo check | https://n8builds.dev/builds, `lib/build-log.ts` |
| #13 | Live streams part 1: corner player, `/live`, navbar live dot, the Studio "Live status" switch | `/api/live`, `components/live/`, `lib/live.ts` |
| #15 | Checklist and HANDOFF updated | `docs/` |

**2026-10-25:**

- release-kit published (public, v1.0.0 to v1.0.3), with fixes found while dogfooding it: notes through a symlinked folder, atomic branch-and-tag push, husky repos, npm 12's `--allow-git`.
- n8builds-web adopted it (#17): commit messages checked on every push and PR; first release v1.1.0 (https://github.com/n8watkins/n8builds-web/releases/tag/v1.1.0) covers the 2026-10-23/24 work; `CHANGELOG.md` is generated.
- Release schedule: a weekly release train that releases only user-facing work and runs the required checks on its own release commit (kit 1.1.0, n8watkins/release-kit#1; adopted here in #21).
- Review fixes (#22): case-study numbers, Solara's GitHub link and live URL, internal work kept out of the build log, bundled Inter font, no flash on a filtered log link, closed live streams stay closed, honest "Copy link". CI skips the browser suite for docs-only changes (#20), and branch protection requires "CI result" and "check".
- v1.1.1 released (https://github.com/n8watkins/n8builds-web/releases/tag/v1.1.1), cut by hand after the first train run was rejected by branch protection.
- Dependabot updates #4-#9 applied together (#26); repo settings tidied (description, homepage, topics, Wiki and Projects off).
- One home for owner decisions: [DECISIONS.md](DECISIONS.md) (#25).
- dev-portfolio (renamed from Portfolio2.0): generated share card and one title, Scribe in place of LocalDictate, no em dashes, the Sentry wizard's example routes removed, GitHub Actions CI, honest README and a current HANDOFF (dev-portfolio#1); live-demo status from OpenPing and a "More builds" strip linking here (dev-portfolio#2).
- OpenPing added as a Tools build, with its build page and build log (this repo), and to the Studio's highlight build list (n8builds-studio#2).
- The Lab and the homepage, reworked (#27 to #33): OpenPing joins as a build; Scribe and OpenPing lead as "Tools I use every day", then Solara and Portfolio Rank; app icons, Star buttons, a Details dialog for the stack, an ad on every row (Scribe's downloads through n8builds.dev/download/scribe, always the newest installer), Portfolio Rank's credits and invitation, "What I'm working on" as the Appturnity ad, a portfolio ad after the Lab, "Use this as a template", a site-wide footer sitemap (the build log moved there and to the Lab menu), contact@n8builds.dev everywhere, broken Gemini/Turso/Cloudflare icons fixed.
- Polish (#34 to #38, three agents in parallel for #35 to #37): a new page opens at its top (no more gliding up), N8's Notions (also in Sanity), consistent fade-ins, the hero portrait fades in, the build log hydrates in place (feed visible at ~0.25s instead of ~1.7s, no layout shift), sturdier Lighthouse checks, Details waits for hydration.
- Speed (#39): lazy Sentry (SDK and Replay load when the page is idle; early errors are queued), LazyMotion, gradient glows instead of blur filters, the first blog cover loads eagerly, and a mobile Lighthouse pass in CI. Mobile: / 0.77 to ~0.83, /blog 0.86 to ~0.95-0.98, /builds 0.87 to ~0.91-0.96; desktop LCP down too.
- Elsewhere: dev-portfolio#3 (n8builds card, MIT license with a content carve-out) and #4 (Portfolio Rank's real icon); portfolio-rank#5 (the daily sync captures screenshots again); release-kit#3 (merged, unreleased: "1 commit"); n8builds-studio#2 (OpenPing in the highlight list).
- Train fix (#24, kit 1.2.0, n8watkins/release-kit#2): GitHub doesn't count checks from `workflow_dispatch` runs, so `main` moved to a ruleset that the train's deploy key (secret `RELEASE_TRAIN_KEY`) may bypass; the train still pushes only after CI passes on the release commit.

**2026-10-26:**

- Shallow review of the 2026-10-25 work (one subagent): no high-severity problems; six medium and low findings, all fixed: the contact card's Appturnity line and the case study's Lighthouse claim (#43), the portfolio's "Building in public" card now links builds to their n8builds.dev pages and drops Scribe (dev-portfolio#5), and the Lab rows' Details, Live Site and GitHub controls name their build for screen readers (#44).
  Two findings are the owner's: the portfolio's Lifeline Clinical Lab link fails TLS (the client's certificate), and Portfolio Rank's "Add your portfolio" button goes to the leaderboard by decision.
- Hero chain: now prompt -> build -> ship -> repeat ("idea" dropped, by the owner's request). The first chip keeps idea's box, comet and wire landing; the loop is 9.2s instead of 11s so every sweep, hand-off and the wire pulse keep their old speed. The case study's homepage screenshot was recaptured.
- Hero touch-ups: the "See what I'm building" button is gone and "Hiring? See my developer portfolio" sits above the social icons.
  From tablet width up the hero is sized to the screen, so the "What I'm working on" heading peeks in at the bottom of the first screen (1280x800, 1366x768, 1440x900, 1536x864, 1920x1080) while its card stays below the fold; phones are an open question for the owner.
  The background grid's cells never touch, never sit behind the portrait, keep a steady number lit (the old one could go nearly empty on phones), fade softly and hold still off screen, under a darker wash.
- Hero, second pass: on phones the portrait sits above the heading and the tagline stays on one line down to 320px; the whoami terminal's title bar names "Nathan 'N8' Watkins" and its body is "AI-first software developer. I build apps and tools I wish existed."; the portrait cross-fades with its watercolor version (from the dev portfolio) after the page is idle; on laptops the content is centred and the "What I'm working on" heading plus the top of its card peek in.
- Homepage speed (#44): the homepage is server components with client islands only for its interactive parts; animations are CSS, so no page loads motion up front (it loads only with the form's sending and success screens and the live player); zod and those screens load when the form scrolls into view, with plain fallbacks if a deploy removed their chunks; the hero's endless animations pause off screen; the marquee server-renders one copy of its items; the three newest posts render on the server (`/api/notions/recent` is gone).
  Mobile Lighthouse on `/` (local, CI env): score 0.85 to 0.87-0.90, TBT 255ms to 80-200ms, first-load JavaScript 405 KB to 270 KB (transferred), HTML 469 KB to 348 KB before compression, LCP ~3.6s to ~3.55s, CLS 0.
  Desktop stays 1.00 on all five pages; the mobile budgets in `scripts/lighthouse.mjs` rose to 0.8 and 4.2s.
  Tried and reverted: inlining the CSS (`experimental.inlineCss`) made the first HTML task longer and TBT worse, with no LCP gain.
- Follow-along plans, in their own repos (branch `docs/follow-up-2026-10`, file `docs/FOLLOW_UP_2026-10.md`): Portfolio Rank (its Gemini key has been invalid since late July, so nothing has been graded since) and OpenPing (the off-hours status bug). Portfolio Rank's issue #3 is closed with a comment linking its plan.

**Outside this repo:**

- Sanity Studio (`n8builds-studio`): "Live status" (merged as its PR #1) and "Build log highlight" schemas, deployed to https://n8builds.sanity.studio; the "Live status" document created, switched off.
- Vercel: `GITHUB_TOKEN` for the build log (Production and Preview).
- `~/n8builds/release-kit` is now public at https://github.com/n8watkins/release-kit.

**Earlier (2026-10-22/23, commits on `main` before the PR workflow):**

- Review of the 2026-10-22/23 work, with all its fixes; blog fact-checks applied in Sanity.
- Share cards: titled post cards and 120-character share descriptions (new Sanity field, Studio redeployed).
- Scroll fade-ins; reduced motion shows content without a fade or a jump.
- Homepage layout-shift fix (nightly Lighthouse back to 0.99-1.00).
- YouTube link removed until the channel is live; the Chrome Extension Launch Kit put on hold.
- Repo hygiene: LICENSE, package metadata, pinned workflow actions, Dependabot.
- Plans: build log, live streams, X articles, build plan, this checklist.
