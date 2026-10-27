# Next session: 2026-10-27 (afternoon) handoff

Paste this file's path into a fresh Claude Code session started in `/home/natkins/n8builds`.
It continues the 2026-10-27 session, which cleared its context to start fresh.

## Read first

1. This file.
2. `n8builds-web/docs/DECISIONS.md` (standing rules; round 10's calls are at the end of "Brand and content").
3. Memory: `~/.claude/projects/-home-natkins/memory/MEMORY.md` (merge authority, the 100-character commit header limit, the admin token expiry).

## Working rules (unchanged)

- Conventional Commits, headers at most 100 characters (n8builds-web's commit check fails on any longer header in the PR, and force pushes are blocked, so a long header costs a fresh branch and a full CI run).
- No Co-Authored-By trailer, no em dashes, one sentence per line in long Markdown.
- Branch + PR per change; Claude may squash-merge its own PRs once every check is green.
- Preview first for taste work (1440 then 375), then the finish phase.
- Before a local Playwright run, kill any server already on the E2E port (`ss -ltnp`); `reuseExistingServer` otherwise tests a stale build.
- Wrap builds and Playwright in `~/scripts/browser-slot`; kill servers by the pid from `ss -ltnp` (lsof misses them).
- The owner has authorized deploys (2026-10-27). Pasted secrets: the owner said to add them to Vercel directly and not treat them as exposed.

## Shipped today (all live)

- n8builds.dev round 10 (PR #61), dino walk-in fixes (#62, #63): Loadout rebuilt, the dino game, build log, brand and contact.
- Portfolio refresh (dev-portfolio PR #7): rounds 8 to 12, consent banner, the same dino.
- open-ping security fixes deployed (Worker version 93621752; D1 backup in `~/projects/public/open-ping-backups/`).
- Vercel AI Bots ruleset in Log mode on n8builds-web and portfolio.
- Admin dashboard live at https://admin.n8builds.dev (domain attached, Next.js preset set).
  Vercel env set: `ADMIN_SESSION_SECRET`, `CRON_SECRET`, `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `GITHUB_TOKEN` (expires 2027-10-27), `GA4_PROPERTY_ID` (455472471), `GOOGLE_SA_CLIENT_EMAIL`, `GOOGLE_SA_PRIVATE_KEY` (Google Cloud project `n8builds-admin`, service account `n8builds-admin-ga`, Viewer on the n8builds GA4 property; a live report returned 200).

## In flight (check first)

1. **v1.2.0 release train**: run https://github.com/n8watkins/n8builds-web/actions/runs/40531112451 (started after #63 merged).
   If it failed, read why (`gh run view <id> --log-failed`); the last two failures were the release commit's CI.
   `gh release list` should show v1.2.0 when it worked.
2. **Portfolio follow-up (uncommitted)** in `~/n8builds/dev-portfolio-v2` (branch `feat/portfolio-refresh` was merged as PR #7):
   `tests/dino.spec.ts` has the roaming tests' fixed order and Chromium-only guards from n8builds-web #63, and `DinoGame.tsx` still needs #63's change synced.
   Make a fresh branch from dev-portfolio `main`, copy `components/features/dino/DinoGame.tsx` from n8builds-web `main`, bring the spec change, run `npm run check:sync`, open a PR, merge when green.
3. **Scribe site, round 3**: an agent was working on branch `feat/landing-level-up` in `~/projects/tools/scribe/scribe-web-lvl` (preview on port 3841, commit `67a27a3` was round 2).
   Round 3 asks: smoother typing and step transitions in "How it works", features inline with their icons, a clearer "never leaves your PC" section, a plain tone ("Free speech-to-text for Windows"), n8builds branding in the header linking to n8builds.dev, Ko-fi (its own colours), GitHub profile and repo links, and its own anti-generic pass.
   It writes its report to `docs/landing-review.md` on that branch; read it, show the owner the preview, iterate, then PR to scribe-web when approved.
4. **OpenPing**: landing level-up preview on port 3840 (branch `feat/landing-level-up`, worktree `~/projects/public/open-ping-landing`, awaiting owner approval) and security fixes on `fix/security-hardening` (worktree `~/projects/public/open-ping-sec`: static-page security headers via `public/_headers`, a per-hostname limit on "Is it down?", a draft CI and deploy workflow).
   PR both once the owner approves the landing; the security branch can go as its own PR anytime.

## To investigate (Claude)

- portfolio.n8builds.dev showed no GA visits in the last 7 days, while `nathansportfolio.vercel.app` (the old address) showed one.
  Check the portfolio actually sends GA4 data after consent (and outside consent regions), and redirect the old `nathansportfolio.vercel.app` to portfolio.n8builds.dev if it still serves.
- Update `docs/NEXT_STEPS.md`'s done log with today's PRs (#59 to #63 on n8builds-web, #7 on dev-portfolio).
- Many merged worktrees remain under `~/n8builds` (`n8builds-web-*`, `dev-portfolio-v2`, `dev-portfolio-consent`, `n8builds-web-r10`, `n8builds-web-buildlog`, `n8builds-web-dinoroam`); ask the owner before bulk removal (the classifier may block it).

## Owner's list (remind in one short block)

- Admin: sign in once at admin.n8builds.dev; Sentry read token (`org:read`, `project:read`, `event:read`; org `nathan-watkins`, projects `n8builds,javascript-nextjs`); optional second Upstash Redis.
- OpenPing auto-deploy: repo secrets `CLOUDFLARE_API_TOKEN` (Workers and D1 edit), `CLOUDFLARE_ACCOUNT_ID`, repo variable `D1_DATABASE_ID`; decide branch protection and Dependabot security updates.
- Approve the OpenPing (:3840) and Scribe (:3841) landing previews.
- Scribe app: OK to cut its next release (13 commits since v0.8.0, including dependency fixes)? Push a `v*` tag.
- TubeVault: OK to review and merge `review/tube-vault-v0.3.81` (the v0.3.106 actually installed) into `master`?
- `@lhci/cli` in the portfolio: drop it and run through `npx` (clears its last 5 dev-only alerts)?
- Piper TTS: pull `master`, `npm install` in `local-piper-server`, reload the extension. Check TubeVault shows v0.3.106 in Chrome.
- Optional: rename Sentry's portfolio project from `javascript-nextjs` (then update `next.config.mjs` and `SENTRY_PROJECTS`).
- Content: Chrome extension screenshots (TL;DW has none), the YouTube URL, exact demo hours, re-record Scribe's demo video (its caption has an em dash), Scribe code signing (a certificate).
- Older: `docs/NEXT_STEPS.md` Part 1 (reCAPTCHA key, GitGuardian incident, Twitch app, YouTube key, Portfolio Rank's Gemini key).
