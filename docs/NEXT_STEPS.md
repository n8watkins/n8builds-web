# Next steps

The working checklist for n8builds.dev.
Part 1 is everything only you can do; Part 2 is everything Claude can build, and which of it can start right now.
Tick an item off by changing `[ ]` to `[x]`.

Written 2026-10-23, revised 2026-10-24.
Detailed plans: [BUILDS_LOG_PLAN.md](BUILDS_LOG_PLAN.md), [LIVE_STREAM_PLAN.md](LIVE_STREAM_PLAN.md), [X_ARTICLES_PLAN.md](X_ARTICLES_PLAN.md), and the release standard in `~/n8builds/release-kit` (STANDARD.md).

## Part 1: Your to-do list

### A. Decisions (one-line answers to Claude; about 10 minutes in total)

- [ ] **Appturnity card** ("What I'm working on", the first section under the hero): 2-3 real, current lines about Appturnity, or "make it evergreen".
- [x] **Solara's GitHub link:** back (the repo is public).
- [ ] **One front door:** keep portfolio.n8builds.dev as a separate site, or make n8builds the portfolio and redirect or slim down the old one?
- [ ] **GitHub repo settings for n8builds-web:** OK for Claude to fix the description, homepage URL and topics, and switch off the empty Wiki and Projects tabs? (yes / no)
- [ ] **Dependency updates:** OK for Claude to work through the 6 Dependabot pull requests? (yes / no)
- [ ] **Release standard:** n8builds-web adopted it (#17) and shipped its first release, v1.1.0. OK for Claude to apply it to TL;DW, TubeVault, Piper TTS, Solara and Portfolio Rank? (yes / no)
- [x] **Release-kit on GitHub:** public at https://github.com/n8watkins/release-kit (2026-10-25), released through its own workflow (v1.0.0 to v1.0.3).
- [ ] **Release train** (weekly automatic releases, Mondays 16:00 UTC, only when a feature or fix landed): OK with the day and time? (yes / another day and time)
  It needs `workflow_dispatch:` added to the `on:` of `.github/workflows/ci.yml` (the train starts CI on its release commit; that file is being changed in #20), and kit 1.1.0 released, after which Claude re-applies the kit here.
- [ ] **Articles and X:** write on the site first and share to X (recommended), or write on X first? Automatic posting to X costs about $0.20 a post; the free option is a one-click "Share on X". See [X_ARTICLES_PLAN.md](X_ARTICLES_PLAN.md).
- [ ] **Live player defaults** (or keep these): bottom-right corner, Twitch first when live on several platforms, player on every page.

### B. Accounts and keys (do these yourself; never paste secrets in chat)

- [x] **Solara's live-site link:** now https://solara-uv.web.app (the old address redirects there), and its GitHub link is back since the repo is public (2026-10-24).
- [ ] **Delete the old reCAPTCHA key** at https://www.google.com/recaptcha/admin (the old portfolio site entry). It leaked in git history in 2025; it's unused, and deleting it makes the leak worthless. 1 minute.
- [ ] **Twitch developer app** (for live detection; 2 minutes): dev.twitch.tv, Your Console, Register Your Application. Name `n8builds.dev`, OAuth Redirect URL `http://localhost`, category Website Integration, client type Confidential. In the project folder run `! vercel env add TWITCH_CLIENT_ID production` and `! vercel env add TWITCH_CLIENT_SECRET production` and paste the values at the prompts.
- [ ] **YouTube channel:** tell Claude its handle or URL; in YouTube Studio, enable live streaming (can take 24 hours the first time) and leave embedding on for your streams.
- [ ] **YouTube Data API key** (5 minutes): console.cloud.google.com, new project `n8builds-live`, enable "YouTube Data API v3", Credentials, Create credentials, API key, restrict it to YouTube Data API v3. Then `! vercel env add YOUTUBE_API_KEY production`.
- [ ] **X:** confirm you'll stream from @n8watkins.
- [ ] **X developer account** (only if you choose automatic posting to X): developer.x.com, a small prepaid credit, and its keys added to Vercel the same way.

### C. Content (ongoing)

- [ ] **Screenshots:** TL;DW, Scribe, and the Solara dashboard (to replace its marketing card). Drop them in the Screenshots folder and tell Claude.
- [ ] **One real number per build** where you have one: installs, users, stars, portfolios ranked.
- [ ] **A blog post every quarter or so,** or publish one of the four drafts.
- [ ] **After the build log launches:** look it over; optionally post one hand-written highlight in the Studio.
- [ ] **Before the first public stream:** a short test stream on each platform with Claude.

## Part 2: What Claude builds

Ordered by value.
"Ready now" means nothing from Part 1 is needed to start.

| # | Build | Ready now? | Waits on | Plan |
|---|---|---|---|---|
| 1 | **Done (#14):** **the build log** (`/builds`): builds index sorted by activity, monthly feed from GitHub releases and commits, build-page "Recent activity", navbar "Log" link, nightly check of the tracked repos | Built; in review on `feat/build-log` | Merge; then the Studio's `logEntry` schema for highlights | [BUILDS_LOG_PLAN.md](BUILDS_LOG_PLAN.md) |
| 2 | **Done (#13):** **live streams, part 1:** the floating corner player (tabs, unmute, expand, move, minimize, close, phone pill), "Watch on Twitch / YouTube / X" buttons, the `n8builds.dev/live` share link, navbar live dots, and the Sanity "Live status" switch (works for X and as a manual override) | Yes, against fake live data and the Studio switch | Nothing to build; Twitch and YouTube detection switch on when their keys arrive | [LIVE_STREAM_PLAN.md](LIVE_STREAM_PLAN.md) |
| 3 | **Live streams, part 2:** automatic Twitch and YouTube detection, the YouTube link back in the navbar | No | Twitch app, YouTube channel and API key (B) | [LIVE_STREAM_PLAN.md](LIVE_STREAM_PLAN.md) |
| 4 | **Done (#12):** **a build page for n8builds itself:** tests on five browsers, security headers and CSP, near-perfect Lighthouse scores, the agent-driven workflow, the release standard | Yes | Nothing | - |
| 5 | **Partly done (#11: Share on X and Copy link on posts):** **X sharing:** "Share on X" on every post and in the Studio, "Copy for X", and "On X" entries in N8 Notions | Mostly (the free parts) | Your choice of site-first or X-first; keys only for automatic posting | [X_ARTICLES_PLAN.md](X_ARTICLES_PLAN.md) |
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
- Release schedule: a weekly release train that releases only user-facing work, runs the required checks on its own release commit so it works with branch protection, and needs no secret (kit PR n8watkins/release-kit#1, adopted here in the release-schedule PR).

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
