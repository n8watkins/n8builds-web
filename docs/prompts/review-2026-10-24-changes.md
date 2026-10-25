# Prompt: review the 2026-10-23/24 changes

A ready-to-paste prompt for a fresh Claude Code session in this repo.
It reviews everything shipped after the previous review (which ended at `752bc88`): the review fixes, share cards, scroll reveals, the layout-shift fix, repo hygiene, and PRs #10 to #15 (CI matrix, Share on X, the n8builds case study, the build log, the live player).
It is read-only until it reports.

Written 2026-10-24.
The commit range starts after `752bc88` and ends at the commit that last edited this prompt, so later commits are out of scope.

## The prompt

````
Read docs/HANDOFF.md, docs/NEXT_STEPS.md, docs/BUILD_PLAN.md and README.md for context on n8builds-web (Next.js 16 App Router on Vercel, live at https://n8builds.dev). Then review the work described below. Follow the conventions in HANDOFF: no em dashes, one sentence per line in long Markdown, reproduce every bug before calling it one. This is a review: make no commits, pushes, Sanity writes, or Vercel/Cloudflare/GitHub changes until I have read your report and said which fixes to make.

## Scope

1. Code: every commit after `752bc88` up to the commit that last edited this prompt. Find it with `END=$(git log -1 --format=%h -- docs/prompts/review-2026-10-24-changes.md)`, then run `git log 752bc88..$END` and `git diff 752bc88..$END --stat` first. Main areas:
   - The build log (PR #14): lib/build-log.ts (fetching, commit filtering, collapsing, releases, Sanity highlights, failure safety), app/builds/page.tsx, build-page "Recent activity", scripts/check-build-repos.mjs and the nightly job, the recorded GitHub fixture.
   - Live streams part 1 (PR #13): lib/live.ts and /api/live (Sanity switch, Twitch Helix, YouTube Data API, caching, test mode), components/live/ (the corner player), /live, the navbar live dot, the CSP frame-src change, the Studio's liveStatus schema (repo n8builds-studio).
   - The n8builds case study (PR #12): data/builds.tsx entry, the featured row, every claim on the page checked against the repo.
   - Share on X and Copy link (PR #11), CI matrix (PR #10).
   - Earlier the same days: titled share cards and shareSummary(), scroll reveals (components/ui/Reveal.tsx, hooks/useReveal.ts), the hero top-alignment and post-hydration glows (the CLS fix), the stack-card overflow fix, the modal mobile menu, repo hygiene (LICENSE, pinned actions, Dependabot), YouTube removed, the Launch Kit on hold.
   - Outside the repo: the Studio schemas (liveStatus, logEntry) at https://n8builds.sanity.studio, and the release standard in ~/n8builds/release-kit (read STANDARD.md and run its tests with `npm test`).
2. Live site: confirm the deploy of $END is live, then check with read-only GET requests: /builds (entries match GitHub activity, nothing internal or embarrassing in the feed), /builds/n8builds, /api/live and /live (offline), share cards for posts and builds, the sitemap, security headers, and the homepage, /builds and a build page on phone, tablet and desktop widths.

## How to review

- GitHub Actions is the CI. Read the CI results of PRs #10 to #15 and the latest nightly run (`gh run list`), rather than running the full browser suite locally. Locally, run only `npm run lint`, `rm -rf .next/types .next/dev && npm run type-check`, `npm run test:unit`, and `next dev` for screenshots.
- Read the diff adversarially: correctness bugs, regressions, missing or weak tests (a test that would still pass if the feature were removed), accessibility, performance (the live player must add nothing to offline page loads), security (the CSP, server-side keys, the GitHub token's scope), and anything that contradicts "Decisions already made" in HANDOFF.
- Be picky about UI: misaligned, cramped, clipped or janky at 320px, 390px, 810px and 1440px, with and without reduced motion.

## Report

Rank findings by severity. For each: file:line or URL, what is wrong, how you verified it, and the fix you suggest. Separately list what you checked and found sound, and anything that needs me. Then stop and wait for me to choose which fixes to make.
````
