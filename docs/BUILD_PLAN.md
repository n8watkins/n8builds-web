# Build plan: parallel workstreams

How the "Ready now" builds from [NEXT_STEPS.md](NEXT_STEPS.md) get built in parallel without stepping on each other.
Written 2026-10-24.

## How work flows (GitHub Actions is the CI)

- Every workstream is its own branch and pull request against `main`; nothing in this plan is pushed straight to `main`.
- GitHub Actions runs the full CI on every pull request: lint, types and unit tests, then the E2E suite on all six Playwright projects (API, Chromium, Firefox, WebKit, Pixel 7, iPhone 14) as parallel jobs, and the Lighthouse budgets. The repo is public, so Actions minutes are free.
- Local runs are for quick feedback only: lint, type-check, unit tests, and at most one targeted E2E spec. Full browser runs happen in Actions. (Running several production builds and browser suites at once on the dev machine ran it out of memory on 2026-10-23.)
- A pull request merges when CI is green and Claude has reviewed the diff and screenshots; merging deploys to production through Vercel.
- The nightly workflow keeps running the full suite against `main` once a day, since blog content in Sanity can change without a commit.

## Workstreams

| ID | Branch | What | Owns (only this stream edits these) | Shares (small, expected merge conflicts) |
|---|---|---|---|---|
| WS0 | `ci/full-matrix-on-prs` | CI: all browsers and Lighthouse on every PR | `.github/workflows/ci.yml` | - |
| WS1 | `feat/build-log` | The `/builds` log ([BUILDS_LOG_PLAN.md](BUILDS_LOG_PLAN.md)) | `lib/build-log.ts`, `app/builds/page.tsx`, `app/builds/og.png/`, `scripts/check-build-repos.mjs`, `components/log/`, `tests/**/build-log*` | `data/builds.tsx` (adds `repo`), `components/layout/Navbar.tsx` (adds the "Log" link), `app/builds/[slug]/page.tsx` (activity section), `app/sitemap.ts`, `.github/workflows/nightly.yml`, docs |
| WS2 | `feat/live-player` | Live streams, part 1 ([LIVE_STREAM_PLAN.md](LIVE_STREAM_PLAN.md)): corner player, "Watch on" buttons, `/live`, navbar live dots, the Sanity "Live status" switch, fake live data for tests | `app/api/live/`, `app/live/`, `components/live/`, `lib/live.ts`, `tests/**/live*`, the Studio's `schemas/liveStatus.ts` | `components/layout/Navbar.tsx` (social links only), `app/layout.tsx` (mounts the player), `lib/security/headers.mjs` (frame-src), `app/privacy/page.tsx`, the Studio's `schemas/index.ts`, docs |
| WS3 | `feat/n8builds-case-study` | A build page for n8builds itself | its entry in `data/builds.tsx`, `public/builds/n8builds/` | `components/sections/FeaturedProjects.tsx` or the Lab (where it's linked), docs |
| WS4 | `feat/share-on-x` | "Share on X" and "Copy link" on every post | `components/blog/ShareBar.tsx`, `tests/**/share*` | `app/blog/[slug]/page.tsx` |

Not started until you answer (see NEXT_STEPS Part 1): dependency updates, release-kit rollout, the Appturnity card, the Solara link, GitHub settings, the front door, "On X" entries, automatic X posting, Twitch and YouTube detection.

## Order and merging

1. **WS0 first** (small): once it's merged, every other pull request gets the full matrix.
2. **WS1, WS2, WS3 and WS4 in parallel**, each in its own git worktree, each opening its pull request when its local checks pass.
3. **Merge order: WS4, WS3, WS2, WS1** (smallest first). Each later branch rebases on `main` before merging; the shared files above are where the conflicts will be, and each is a few lines.
4. **After WS2 merges:** deploy the Studio once (`npx sanity deploy` in `n8builds-studio`) for the "Live status" schema.
5. **After each merge:** check the production deploy and the live page; update HANDOFF in the same pull request as the feature.

## Rules for every workstream

- Follow `docs/HANDOFF.md` conventions: no em dashes, one sentence per line in long Markdown, Conventional Commit messages, commit after each logical step.
- Reproduce a bug in E2E before fixing it; every feature ships with tests that would fail without it.
- New third-party origins go in `lib/security/headers.mjs` (the CSP), or the browser blocks them.
- Pages below the fold use `components/ui/Reveal.tsx`; nothing above the fold fades in.
- Screenshots of new UI at phone, tablet and desktop widths are attached to the pull request.
