# Plan: the `/builds` log (auto-fed from GitHub)

Written 2026-10-23.
Status: planned, not started.

## Goal

A `/builds` page that shows the work is alive without the owner having to post.
The owner will post rarely, so the page fills itself from GitHub activity, and hand-written highlights in Sanity are an occasional extra.

## What the repos look like today (checked 2026-10-23)

| Build | Repo | Visibility | Last push | Releases | Commit style |
|---|---|---|---|---|---|
| Scribe | `scribe` | public | 2026-10-13 | 29 (v0.8.0 on 2026-07-15) | n/a, releases are the signal |
| Solara | `solara` | public | 2026-10-23 | 0 | mixed, about 40% conventional |
| Portfolio Rank | `portfolio-rank` | public | 2026-10-23 | 0 | recent commits are bot syncs (`chore: sync portfolios from upstream`) |
| TL;DW | `tl-dw` | public | 2026-07-21 | 0 | about 95% conventional (`feat:`, `fix:`, `docs:`) |
| TubeVault | `tube-vault` | public | 2026-07-22 | 0 | about 98% conventional; versions are commits like `build(tube-vault): v0.3.80` |
| Piper TTS | `piper-tts` | public | 2026-06-07 | 0 | plain sentences ("Lower first-sentence latency: ...") |
| Chrome Extension Launch Kit | `chrome-extension-launch-kit` | private | 2026-06-06 | 0 | plain sentences; **on hold** (see below) |

What this means for the design:

- Raw commits are too noisy to show as they are: docs, chores, bot syncs and HANDOFF edits would bury the real changes.
- Only Scribe has GitHub releases (TubeVault marks versions in commits), so releases alone would leave five builds empty.
- Four of the seven builds were last touched in June or July, so the page must not shout "updated 4 months ago".

## Releases: the standard the log relies on

The tracked repos adopt the n8 release standard (`~/n8builds/release-kit`, see its STANDARD.md): Conventional Commits enforced by a hook and CI, `vX.Y.Z` tags cut with `npm run release`, and GitHub Releases published by a workflow with notes generated from the commits.
Once a repo adopts it, its GitHub Releases are the log's primary signal, and its commits are clean enough to show between releases.
Until then the commit filters below carry the load.

Monitoring the tracked repos (part of this work):

- `data/builds.tsx` gets a `repo` per build; that list is the single list of tracked repos.
- `scripts/check-build-repos.mjs` reports, per tracked repo: its latest release and date, whether it has adopted release-kit (and which kit version, from `scripts/release-kit/VERSION`), and whether its newest commits pass the commit check.
- The nightly workflow runs it and prints the report; it fails only when a repo can't be read (a revoked or expired token), so a token problem is caught before the log goes stale.

## Design

### Data

1. **GitHub (automatic).** At build and on hourly revalidation, for each build in `data/builds.tsx`, fetch:
   - releases (name, tag, date, URL);
   - the last 100 commits on the default branch;
   - the repo's `pushed_at`.
2. **Filtering commits into entries:**
   - Drop bot authors (`github-actions[bot]`, any `[bot]`), merge commits, and messages starting with `docs`, `chore`, `test`, `ci`, `build`, `style`, `refactor`, `wip`, or mentioning HANDOFF / README.
   - Keep `feat:` and `fix:` (and `perf:`), and plain-sentence commits that start with a verb such as Add, Ship, Launch, Support, Fix or Make.
   - Strip the `feat:` / `fix(scope):` prefix and capitalise, so entries read like sentences.
   - Collapse a day's commits on one build into one entry: the strongest message, plus "and N more changes".
3. **Releases** become "Shipped vX.Y" entries and always outrank commits.
   Version-bump commits (`build: v0.3.80`, as TubeVault uses) count as releases too, collapsed to one entry per day.
4. **Sanity highlights (optional, rare).** A new `logEntry` type: date, build (a slug picked from a list), title (max 90 characters), optional note, optional link and image, kind (shipped / fixed / learned / next).
   Highlights are pinned above the automatic entries of the same month and styled as featured.
5. **Per-build overrides in `data/builds.tsx`:** `repo` (owner/name) and an optional `log: 'releases' | 'commits' | 'off'` for repos whose commits don't read well.
6. **Failure handling:** if GitHub is down or rate-limited, the page renders from the last cached data (ISR keeps the previous version) and never errors; a missing token falls back to anonymous requests in development only.

### Page (`/builds`)

1. **Header:** "The build log" plus one line on what it is.
2. **Builds index (leads the page):** a card per build, sorted by most recent activity.
   Each card shows the name, the tagline, a "last shipped" line as a month and year ("Last shipped Oct 2026"), and the newest one or two entries.
   No "N months ago" wording, so quiet builds read as finished rather than abandoned.
3. **Activity feed:** entries grouped by month, newest first, with a filter by build (chips, the same style as the blog topic filter), capped at the last 12 months with "show more".
4. **Build pages:** a "Recent activity" section with that build's newest five entries and a link to the filtered log.

### Site wiring

- Navbar "Log" item (desktop and mobile menu).
- `/builds` in the sitemap, its own metadata via `pageMetadata()`, and a share card (`/builds/og.png`).
- JSON-LD: an `ItemList` of the builds.
- The scroll reveals from `components/ui/Reveal.tsx` on everything below the fold.

### Tests

- Unit: the commit filter and collapsing rules, against a fixture of real messages from these repos (bot syncs, docs commits, conventional and plain-sentence styles).
- Unit: sorting builds by activity, and merging highlights with automatic entries.
- E2E: `/builds` renders the index and the feed, the build filter works, the navbar link reaches it, build pages show "Recent activity", the sitemap lists `/builds`.
  E2E runs against a fixed GitHub fixture (an env flag swaps the fetcher), so tests never depend on live activity or rate limits.
- Lighthouse: `/builds` joins the audited pages.

### Docs

- HANDOFF: how the log is fed, the filter rules, how to post a highlight, how to switch a repo to releases-only.
- OWNER_TODO: the token step and how to rotate it.

## Steps, in order

1. Add `repo` and `log` fields to the builds in `data/builds.tsx`.
2. `lib/build-log.ts`: GitHub fetcher (token-aware), filter, collapse, merge with highlights, plus the fixture fetcher for tests.
3. Unit tests for step 2.
4. Studio: the `logEntry` schema, then `sanity deploy` (as done for the share description).
5. `app/builds/page.tsx`, `app/builds/og.png/route.tsx`, the "Recent activity" section on build pages.
6. Navbar, sitemap, JSON-LD.
7. E2E tests, full suite, Lighthouse, screenshots on phone, tablet and desktop.
8. Docs; commit and push; confirm live once the token is set.

Estimated effort: one working session.

## What the owner needs to do

1. **GitHub token: done 2026-10-23.**
   A fine-grained token (`n8builds-web build log`, read-only Contents on `scribe`, `solara`, `portfolio-rank`, `tl-dw`, `tube-vault`, `piper-tts`) is set as `GITHUB_TOKEN` in Vercel (Production and Preview) and in the local `.env.local`.
   It expires in a year; regenerate it then (same name and access) and update both places.
2. **Decide:** Solara's repo is public again (it was private on 2026-10-22, which is why its GitHub link was removed). Should the link come back?
3. **On hold (2026-10-23):** the Chrome Extension Launch Kit is off the site and out of the log while the owner decides what to do with it.
4. **Optional:** post one highlight in the Studio after launch, so the feed has a hand-written entry to show the style.
