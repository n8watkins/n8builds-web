# Next steps

The working checklist for n8builds.dev, in order.
Each step says what's needed from you (**You**) and what Claude does (**Claude**).
Tick a step off by changing `[ ]` to `[x]`.

Written 2026-10-23.
Detailed plans: [BUILDS_LOG_PLAN.md](BUILDS_LOG_PLAN.md), [LIVE_STREAM_PLAN.md](LIVE_STREAM_PLAN.md), and the release standard in `~/n8builds/release-kit` (STANDARD.md).

## Step 1: Quick decisions (about 10 minutes, all you)

These unblock the rest; each one is a one-line answer.

- [ ] **Appturnity card** ("What I'm working on", the first section under the hero): send 2-3 real, current lines about Appturnity, or say "make it evergreen" and Claude drops the dated updates.
- [ ] **Solara's GitHub link:** its repo is public again. Bring the link back? (yes / no)
- [ ] **One front door:** you share n8builds as your portfolio, but the navbar's "Portfolio" button sends people to portfolio.n8builds.dev (last updated June 20). Keep both, or make n8builds the portfolio and redirect or slim down the old one?
- [ ] **GitHub repo settings for n8builds-web:** OK for Claude to fix the description (old name, em dash), the homepage URL (the old vercel.app address), add topics, and switch off the empty Wiki and Projects tabs? (yes / no)
- [ ] **reCAPTCHA key:** delete the old key at https://www.google.com/recaptcha/admin (the old portfolio site entry). It leaked in git history in 2025; it's unused, and deleting it makes the leak worthless.

## Step 2: Dependency updates

Dependabot opened 6 pull requests on 2026-10-24, all passing CI.
Several are major versions (ESLint 10, `@sanity/client` 8, `@vercel/speed-insights` 2, `@portabletext/react` 8), which can change behavior CI doesn't fully cover.

- [ ] **You:** say "go".
- [ ] **Claude:** reviews each changelog, merges the safe ones, upgrades the majors one at a time with the full test suite on every browser, and closes any that aren't worth it yet, with a note why.

## Step 3: Release standard across the build repos

The kit is built and tested in `~/n8builds/release-kit` (Conventional Commits, `npm run release`, GitHub Releases with generated notes).

- [ ] **You:** OK to apply it to TL;DW, TubeVault, Piper TTS, Solara and Portfolio Rank. Scribe already meets the standard and is left as is.
- [ ] **Claude:** applies it repo by repo, commits, tags each repo's current version as a baseline, and checks the workflows on GitHub.
- [ ] **Claude:** proposes a short list of past milestones to backfill as releases (for example TL;DW 1.0.0, notable TubeVault versions); **You** approve the list before anything is tagged.
- [ ] **You (optional):** publish the kit as a public repo (`n8watkins/release-kit`). It's a good portfolio piece, and repos could then share one copy of the workflow.

## Step 4: The build log (`/builds`)

Plan: [BUILDS_LOG_PLAN.md](BUILDS_LOG_PLAN.md).
The GitHub token is already set up.

- [ ] **Claude:** builds it: the page, build-page activity, navbar "Log" link, the nightly check of the tracked repos, tests.
- [ ] **You:** look it over on the live site; optionally post one hand-written highlight in the Studio.

## Step 5: Live streams (a week or so before your first stream)

Plan: [LIVE_STREAM_PLAN.md](LIVE_STREAM_PLAN.md).
A floating corner player for Twitch and YouTube that appears only while you're live; all free.

- [ ] **You:** create the Twitch developer app and add its ID and secret to Vercel (2 minutes, steps in the plan).
- [ ] **You:** tell Claude your YouTube channel, and make sure live streaming is enabled on it (can take 24 hours the first time).
- [ ] **You + Claude:** set up YouTube API access together (10 minutes, one Google sign-in).
- [ ] **Claude:** builds the player, the live checks, the navbar live dots, and brings the YouTube link back.
- [ ] **You + Claude:** a test with a real unlisted stream on each platform.

## Step 6: Proof on the build pages (ongoing, mostly you)

What makes the site persuasive as a portfolio.

- [ ] **You:** real screenshots of TL;DW and Scribe, and of the Solara dashboard (to replace its marketing card). Drop them in the Screenshots folder; Claude crops and adds them.
- [ ] **You:** one real number per build where you have one (installs, users, stars, portfolios ranked).
- [ ] **Claude:** a build page for n8builds itself: tests on five browsers, security, near-perfect Lighthouse scores, the agent workflow. Your strongest engineering evidence is currently invisible on the site.
- [ ] **You:** a blog post every quarter or so, or publish one of the four drafts.

## On hold

- **Chrome Extension Launch Kit:** off the site (2026-10-23) while you decide what to do with it; its URL redirects to the extensions.
- **VibeLog:** hidden, record kept; comes back when it's ready.
- **YouTube link:** removed until the channel is live; returns in Step 5.

## Done recently (2026-10-22 to 2026-10-24)

- Review of the 2026-10-22/23 work, with all its fixes; blog fact-checks applied in Sanity.
- Share cards: titled post cards and 120-character share descriptions (new Sanity field, Studio redeployed).
- Scroll fade-ins; reduced motion shows content without a fade or a jump.
- Homepage layout-shift fix (nightly Lighthouse back to 0.99-1.00).
- Repo hygiene: LICENSE, package metadata, pinned workflow actions, Dependabot.
- GitHub token for the build log, set in Vercel.
