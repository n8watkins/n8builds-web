# Prompt: review the 2026-10-22 changes

A ready-to-paste prompt for a fresh Claude Code session in this repo.
It reviews everything shipped on 2026-10-22: the review-and-improve pass, the marquee fix, the content changes, the Vercel host redirects, and the blog rewrites waiting as Sanity drafts.
It is read-only until it reports, and it never publishes Sanity drafts or changes Vercel or Cloudflare settings.

Written 2026-10-22.
The commit range is pinned: `4737d9e` is the last commit before this work, so later commits are out of scope.

## The prompt

````
Read docs/HANDOFF.md, docs/OWNER_TODO.md and README.md for context on n8builds-web (Next.js 16 App Router on Vercel, live at https://n8builds.dev). Then review the work done on 2026-10-22 as described below. Follow the conventions in HANDOFF: no em dashes, one sentence per line in long Markdown, and reproduce every bug before calling it one. This is a review: make no commits, pushes, Sanity writes, or Vercel/Cloudflare changes until I have read your report and said which fixes to make.

## Scope

1. Code: every commit in `git log 4737d9e..49e146d` (run `git diff 4737d9e..49e146d --stat` first). Main areas:
   - SEO: lib/seo.ts (pageMetadata, JSON-LD), lib/og-card.tsx and the og.png routes for blog posts and builds, app/sitemap.ts, not-found metadata, permanent redirects in next.config.mjs.
   - Security: the contact route's check order (all free checks before Upstash), the per-recipient auto-reply limit, IPv6 /64 keys, the 415 for non-JSON, greetingName, the name regex, the image optimizer's exact sources, the custom Sentry tunnel at app/monitoring/route.ts, lib/sentry-scrub.ts.
   - UX: Navbar (lg breakpoint, overlay menu with scroll lock, backdrop, Escape), NowBuilding (stacked cards, pause rules, made the main section), contact form (submit on Enter, aria-invalid/describedby, success focus, focusFirstError), marquee fix in app/globals.css (@theme inline), small touch-target and wrapping fixes.
   - Content: LocalDictate renamed Scribe (/builds/scribe, redirect from /builds/localdictate), four builds removed with redirects, Solara featured, VibeLog spelling, Asset Arsenal out of the carousel.
2. Live site: after confirming the deploy of 49e146d is live, check https://n8builds.dev with read-only GET requests: share cards and og.png images, canonicals, sitemap.xml (every URL returns 200, no redirects), the redirects (www and n8builds-web.vercel.app to apex, /builds/localdictate, removed builds, /lab and friends), security headers, and the homepage on a phone-sized and a tablet-sized viewport.
3. Sanity drafts (read only): drafts.sample-welcome, drafts.sample-build-in-public, drafts.sample-distribution and drafts.sample-speed-beats-mastery in project abgyc32w. Use the Sanity CLI login token from ~/.config/sanity/config.json for read access, and never print it. For each post:
   - verify every factual claim against the linked source (numbers, dates, who said what, what a study actually measured)
   - check that each graphic matches the text and its source, and that alt text describes it
   - check that every link resolves
   - judge voice and quality: does it sound like a person who builds in public, is it interesting, is anything padded, overstated or wrong
   - check that no em dash crept in
   Do not touch the four other drafts (Claude Code + MCP, giant list, terminal IDE, 8 agents).

## How to review

- Run the full verification list first and report the exact results: `npm run lint`; `rm -rf .next/types .next/dev && npm run type-check`; `npm run test:unit`; `npm run test:e2e:all`; `npm audit --omit=dev`; `npm run lighthouse` with CHROME_PATH set to Playwright's Chromium.
  Do not run `npm run build` by hand before Playwright (it inlines the real Turnstile key; see HANDOFF).
- Read the diff adversarially: correctness bugs, regressions to things that worked before, missing or weak tests (a test that would still pass if the fix were reverted), accessibility, performance, and anything that contradicts "Decisions already made" in HANDOFF.
- For UI changes, look at real screenshots on Pixel 7, iPhone 14 (portrait and landscape), an iPad, and 1440px desktop, with and without reduced motion. Be picky about anything misaligned, cramped, clipped or janky.
- Use subagents in parallel if it helps (for example: code, live site, blog drafts), each in its own detached git worktree with its own `npm ci` and ports (3770, 3780, 3790), and only killing processes they started.

## Report

Rank findings by severity. For each: file:line or URL, what is wrong, how you verified it (reproduced, with the command and output, or code read), and the fix you suggest. Separately list:
- what you checked and found sound
- blog fact-check results per post (claim, source, verdict)
- anything that needs me (dashboards, credentials, taste decisions)
Then stop and wait for me to choose which fixes to make.
````
