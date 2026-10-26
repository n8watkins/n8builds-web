# Prompt: next session (review, then speed)

A ready-to-paste prompt for a fresh Claude Code session in `~/n8builds/n8builds-web`.
It does three things: a shallow, fast review of everything shipped on 2026-10-25 (by one subagent), the homepage speed refactor, and (by a second subagent, in parallel with Part 2) two follow-along plans the owner will act on later, one in Portfolio Rank and one in OpenPing.
Speed is the priority: the review is a quick sweep for real problems, not an audit.

Written 2026-10-25, at main `a218444` (PR #39).

## The prompt

````
Read docs/DECISIONS.md (the owner's standing rules: follow them, never re-ask them), docs/NEXT_STEPS.md and docs/HANDOFF.md for context on n8builds-web (Next.js 16 App Router on Vercel, live at https://n8builds.dev). Conventions: Conventional Commits, never an agent co-author trailer or "Generated with" line, no em dashes anywhere, one sentence per line in long Markdown, branch + PR (squash merge) so GitHub Actions runs the full matrix, reproduce every bug in an E2E test before fixing it, and be pixel-picky with screenshots at 1280 and 375 wide. Memory on this machine is limited: never run more than one Playwright or Lighthouse job at a time, and never the full browser matrix locally (CI runs it). Chrome launched by chrome-launcher under WSL creates `C:\...` profile folders in the working directory; they are git-ignored now, but never `git add -A` without checking `git status` first.

## Part 1: a shallow review (one subagent, read-only, fast)

Spawn ONE subagent (general-purpose) to review what shipped on 2026-10-25, with this brief, and wait for its report before Part 2:

  "Read-only shallow review; spend at most ~30 minutes; report only real problems (bugs a visitor would hit, broken links, wrong claims in copy, accessibility failures, regressions, security issues), most severe first, each with a one-line reproduction. No style nits, no refactor suggestions. Make no commits, pushes, issue comments, Sanity writes or settings changes.
  Scope:
  - n8builds-web: `git log --oneline fbfe367..a218444` (PRs #24 to #39): the release train's deploy key and ruleset (scripts/release-kit, .github/workflows/release-train.yml), OpenPing's build page, the Lab ('Tools I use every day' for Scribe and OpenPing, Featured builds, icons, Star buttons, the Details dialog, the ads with the Scribe download at /download/scribe), the Appturnity ad in 'What I'm working on', the site-wide footer sitemap, Portfolio Rank credits and invitation, 'Use this as a template', N8's Notions (the blog rename, also in Sanity: the welcome post), fade-ins site-wide, the hero portrait fade, the build log hydration fix, the navigation scroll fix (data-scroll-behavior), lazy Sentry (lib/sentry/lazy.ts, instrumentation-client.ts), LazyMotion, the radial glows, and the Lighthouse script (five desktop runs, a mobile pass).
  - Check the live site with read-only GETs and a real browser at 375 and 1280 wide: /, /builds, /builds/scribe, /builds/openping, /builds/portfolio-rank, /blog, a post, /download/scribe (must 307 to the newest Scribe installer on GitHub), /portfolio (307 to the portfolio), /tools (to #my-tools).
  - dev-portfolio (~/n8builds/dev-portfolio, live at https://portfolio.n8builds.dev): PRs #1 to #4 (rename, share cards, CI, OpenPing status pills, More builds strip, the n8builds card, MIT license with the content carve-out).
  - Smaller: portfolio-rank PR #5 (sync job pinned to ubuntu-24.04), release-kit PRs #2 and #3, n8builds-studio PR #2."

When it reports, fix the problems it confirms (each with a test that fails first), in one or a few small PRs.

## Part 2: speed, the homepage on phones

Mobile Lighthouse on the homepage is about 0.83 (LCP ~3.8s, TBT ~330ms on a simulated mid-range phone); /blog and /builds are 0.91-0.98 and desktop is 0.98-1.00. The cause: components/HomePage.tsx is one 'use client' component, so every section's code ships to the phone and hydrates before the page settles (Next's runtime plus every section; Lighthouse's simulated LCP counts all JS requested before the LCP).

Do the refactor:
1. Measure first: a production build (the CI env from .github/workflows/ci.yml's Lighthouse job), then mobile Lighthouse (median of 3) on / and record LCP, TBT, score, JS bytes and the bootup-time breakdown.
2. Make the homepage a server component: app/page.tsx and HomePage render the sections on the server; only the interactive parts stay client components (islands): the hero's animated parts, NowBuilding's carousel, the Lab rows' gallery/Details/ads, ExtensionsShowcase, the Notions topic chips, the contact form, Reveal wrappers. Static copy, headings, cards and images move to server components. Keep every behavior, animation, accessibility and test.
3. Then look at what's left: lazy-load below-the-fold islands (next/dynamic with ssr where needed for SEO), trim unused JS (Lighthouse's unused-javascript), and the hero's continuous non-composited animations (chips, comet: style and paint every frame; consider pausing them when the hero is off screen, not redesigning them).
4. Re-measure the same way; keep CLS 0 and the desktop budgets; raise the mobile budgets in scripts/lighthouse.mjs to just below the new numbers.
5. Commit, PR, CI green, merge; record the numbers in docs/NEXT_STEPS.md's done log.

When done, report the before/after numbers and anything you couldn't fix.

## Part 3: follow-along plans for Portfolio Rank and OpenPing (one subagent, while Part 2 runs)

Spawn ONE more subagent (general-purpose) with this brief. It writes Markdown plans for the owner to follow later; it changes no code, runs nothing destructive, and makes no GitHub issue comments, closes, labels or settings changes.

  "Write two follow-along plans, one per repo, each a single Markdown file the owner (or a later agent) can work through step by step. One sentence per line, no em dashes, numbered steps with checkboxes, each step saying who does it (owner or agent), exactly what to run or click, and how to verify it worked. Commit each file on a new branch in its own repo and push the branch, but do not open a PR or merge (the owner will). Report both branch names and file paths.

  1. Portfolio Rank (~/n8builds/published/portfolio-rank, GitHub n8watkins/portfolio-rank, live at https://portfoliorank.vercel.app). File: docs/FOLLOW_UP_2026-10.md. Cover:
     - Close issue #3 (the 'Scheduled job failed: Sync upstream + ingest' alert): it was fixed by PR #5, which pinned the sync job to ubuntu-24.04 because Playwright 1.60 can't install Chromium on ubuntu-latest (26.04); a manual run (40244406862) captured and graded the backlog.
     - Process the pending submission: issues #2 and #4 are the same person (Shubham Sinha, https://shubhamsinha1010.github.io/, submitted 2026-08-08 and 2026-10-24). Steps to check the site is live and not already listed, add it to data/additions.json (read AUTOMATION.md for the format and the feed rebuild), close #4 as a duplicate of #2, reply on #2, and confirm it appears with a screenshot and grade after the next sync.
     - The broken promise: the homepage and FAQ say a submission 'flows in, gets screenshotted and graded automatically', but nothing turns an issue into data/additions.json. Plan the small bot: a GitHub Actions workflow on issues labeled portfolio-submission that validates the URL (https, responds 200 within a timeout, not a duplicate after URL normalization, not in data/excluded.json), comments the result on the issue, and when the owner adds an 'approved' label, commits the entry to data/additions.json and closes the issue. Include the files to add, the permissions (issues: write, contents: write), tests, and the copy change on the site until the bot exists. Leave the decision (bot vs. updating the copy) to the owner.
     - Unpin later: upgrading Playwright to a version that supports ubuntu 26.04, then removing the ubuntu-24.04 pin.
  2. OpenPing (~/projects/public/open-ping, GitHub n8watkins/open-ping, live at https://openping.n8builds.dev). File: docs/FOLLOW_UP_2026-10.md. Build it from the existing bug report docs/BUG-public-scheduled-off.md on the local branch docs/public-scheduled-off-bug (base your new branch on that branch so the report comes along). Cover:
     - The fix: the public feed, status page and widget report off-hours monitors as 'operational' because mapPublicState hides scheduled_off unless showScheduledOff is on (default off, and the editor has no toggle). Steps to report scheduled_off by default, decide the option's future, handle the all-off banner (all_off), the editor toggle if the option stays, tests in src/worker/routes/public.test.ts, docs (STATUS_PAGES.md, WIDGET.md), and a deploy and verify step (curl /api/public/status on a weekend or off-hours: state scheduled_off).
     - Allow embedding on the bare domain: add https://n8builds.dev to ALLOWED_FRAME_ANCESTORS in src/worker/index.ts, with a test.
     - Adopt release-kit (https://github.com/n8watkins/release-kit): node ~/n8builds/release-kit/apply.mjs ., baseline tag, then the first release.
     - Note that portfolio.n8builds.dev reads this feed and treats a feed older than 30 minutes as Asleep; that workaround keeps working after the fix."

When it reports, add both branch names and file paths to docs/NEXT_STEPS.md (Part 1, B2) so the owner can find them.

## The owner's own list

The owner's to-do list stays in docs/NEXT_STEPS.md Part 1 (decisions, accounts and keys, small cleanups, content): the reCAPTCHA key, the Twitch app and YouTube keys, the GitGuardian false positive, screenshots, streaming links, release-kit for the other repos, and the rest.
Don't remove or tick any of them unless the owner says they're done; when this session finishes, remind the owner of the open ones in one short list.
````
