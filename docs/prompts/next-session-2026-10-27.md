# Next session: 2026-10-27 kickoff and handoff

Paste this file's path into a fresh Claude Code session started in `/home/natkins/n8builds`.
It continues the long 2026-10-26 session, which ran out of room.

## Read first

1. This file, all of it.
2. `n8builds-web/docs/DECISIONS.md` (the owner's standing rules; follow them, never re-ask them).
3. `n8builds-web/docs/HANDOFF.md` (architecture and file map of n8builds.dev).
4. `n8builds-web/docs/NEXT_STEPS.md` (the owner's to-do list and the done log).
5. `n8builds-web/PROJECT_BACKLOG.md` (cross-project backlog, including the security and CI follow-ups).
6. For the portfolio: `dev-portfolio/docs/HANDOFF.md` on branch `feat/portfolio-refresh`.

## Working rules (owner's, all still in force)

- Conventional Commits; never a Co-Authored-By trailer or a "Generated with" line; never an em dash; one sentence per line in long Markdown.
- Branch + PR per change; Claude may squash-merge its own PRs once every CI check is green (owner, 2026-10-26).
- The auto-mode classifier blocks some actions (bulk branch deletes, force pushes, `git reset`, publishing a release). When blocked, ask the owner; never work around it.
- Preview first for taste work: build the look at desktop (1440) then phone (375), serve a production preview (`next build` then `next start`), report the link and screenshots, and stop until the owner approves. Then the finish phase: other widths, tests, accessibility, CI.
- Reproduce bugs in an E2E test before fixing; be pixel-picky; fix flaky tests you meet.
- Machine limits: WSL has 8 cores and ~19.5 GB. Wrap every build, Playwright and Lighthouse job in `~/scripts/browser-slot <cmd>` (at most 4 at once). Previews run on `next start` (~170 MB), never a long-lived `next dev`. `dev-watch status` lists servers; the `dev-watch.timer` stops dev servers over 5 GB and any server whose branch is merged.
- Worktrees: symlink `node_modules` from the main checkout; Turbopack fails there, so use `next dev --webpack` and `next build --webpack`; link `.env.local` only while a server needs it.
- Never `git add -A` without checking `git status`; never paste secrets.
- Images replaced in place must get a NEW filename (the image optimizer and CDN cache by URL).

## State at handoff (2026-10-26, about 21:00 PT)

### n8builds-web (live at https://n8builds.dev, main is green except #51)

Merged today, each with full CI green:

- #47 `fix(marquee)`: WebKit tab-stop test race, and the marquee pauses for a tile focused before hydration.
- #48 `feat(home)`: the whole homepage refresh (hero, Appturnity ad, build log strip, the Lab with side nav and template cards, Chrome Extensions, AI kit with the dino, Work with me, contact, footer, case study at /builds/n8builds, region-aware cookie banner, full-year build log).
- #49 `feat(consent)`: wider cookie bar, larger Accept, exit animation.
- #50 `docs(backlog)`: security and CI follow-ups in `PROJECT_BACKLOG.md`.

Open:

- **#51 `fix/dino-flaky`** (worktree `n8builds-web-dinoflake`): makes two dino E2E tests reliable (the dino now rides along with its row so a slow frame can't drop it). At handoff it had 2 failing checks; check `gh pr checks 51`, fix, merge when green.
- **Case study follow-up** (worktree `n8builds-web-ci-shot`, branch unknown at handoff): retake the GitHub Actions screenshot under a new filename and re-enable the case study keyboard test on WebKit. Check `git -C ../n8builds-web-ci-shot log` and `gh pr list`; finish, PR, merge when green.
- **Release v1.2.0 not cut.** The Monday release train failed (main moved under it at 20:57 UTC when #47 merged). Starting it publishes a release, which the classifier blocks; the owner runs `gh workflow run release-train.yml -f bump=auto -f dry-run=false`, or next Monday's run does it.

### dev-portfolio (live at https://portfolio.n8builds.dev)

- **Merged:** PR #6 `fix(deps)`: 82 of 87 Dependabot alerts fixed (all 7 critical). 5 dev-only alerts remain in `@lhci/cli` (needs a new upstream release, or drop it from devDependencies and run `npx @lhci/cli`; recommended, awaiting the owner).
- **`feat/portfolio-refresh`** (worktree `dev-portfolio-v2`, preview on port 3829): the big portfolio refresh, in PREVIEW, not approved yet. Round 8 finished after the handoff was first written (commit `e95e590`): 15 of 17 items done; item 6 shows weekdays and the timezone only (exact hours need the owner or the OpenPing admin token; one constant, `DEMO_HOURS` in `lib/status.ts`); item 12 found GeminiGPT on `gemini-3.1-flash-lite` (noted in `PROJECT_BACKLOG.md`). The owner has not reviewed round 8 yet; its brief is reproduced below. 23 chromium tests passed at round 7.
- **`feat/consent-banner`** (worktree `dev-portfolio-consent`): the cookie banner ported from n8builds-web (shared `.n8builds.dev` cookie). Ships together with the refresh.
- When the owner approves the refresh: merge `feat/consent-banner` into it, finish tests at 1280/375/320, open one PR in dev-portfolio, full CI, squash-merge when green.

Round 8 brief (the owner's latest asks; verify each against the 3829 preview):

1. No hover effect on the "Ready to relocate" and "My tech stack" bento cards (keep hovers on projects and the resume card).
2. Slightly smaller gradient area on those two cards; tech stack card: less space above the tiles, more between the two rows, more at the bottom.
3. First load at 1440x900, 1920x1080 and 2560x1440: more hero, only the start of About visible (heading, at most the first paragraph, maybe no photo).
4. Project screenshots: no zoom-and-crop on hover; at most the whole image grows slightly.
5. Project descriptions truncated to at most 4-5 lines, tighter.
6. Show each demo's live hours (Echo, GeminiGPT, Scout) from OpenPing's real schedule, with the timezone.
7. OpenPing credit with two links: OpenPing's landing page and https://n8builds.dev/builds/openping.
8. No blinking cursor on the "Building for the AI-native web" heading.
9. Project pages: bring back the animated Frontend / Backend / Cloud stack (like n8builds-web's `components/Projects/TechStackCycle.tsx`); wider page on large screens.
10. Project pages: "n8builds" top-left, a larger "Back to projects" button, consider a footer.
11. Going back scrolls to projects without leaving `#projects` in the URL.
12. Check which Gemini model GeminiGPT uses; the owner wants Gemini 3.5 Flash Lite. If it differs, add a note to `n8builds-web/PROJECT_BACKLOG.md` and make the portfolio copy match reality.
13. The n8builds.dev teaser's description sits on the right and looks broken above "Where I've built": fix the layout.
14. Workshop card: keep the phone scroll; add a GitHub link for n8builds.dev.
15. Experience hover: darker overlay on the hover image (Appturnity is too bright).
16. Experience hover glow: a dimmer white glow around the image side, a light blue glow around the other side, on every card (owner screenshots of the problem were `images/30.png` and `31.png` in the old session's scratchpad).
17. Contact: center "Reach me directly" and "Open the contact form", tighter "Have a longer message?" copy, nicer block.

The marquee and dino in dev-portfolio are byte-identical copies of n8builds-web's (8 files); `npm run check:sync` compares them. Keep them identical.

### n8builds-admin (local only, not on GitHub)

- Repo `/home/natkins/n8builds/n8builds-admin`, branch `main`, latest local commit `dd21840`, not pushed; no GitHub repo or Vercel project exists (the owner creates them).
- Owner approved the design after several rounds; the finish phase is done (local commit `dd21840`): 61 Playwright tests (a sign-in gate project on the normal build, an app project on the E2E build, axe on every page), 30 unit tests, Lighthouse budgets, and a README section on running them. Only the owner's setup steps remain before deploying.
- Preview on port 3831 (production build with a test-only sign-in stub; see its README). Lighthouse: desktop 1.00 on all pages, mobile 0.95-0.99.
- Setup steps the owner still has to do are in its Setup page and `docs/SETUP.md` (generated from `lib/setup.ts`).

### Other repos

- **tl-dw:** quality gate failing since 2026-07-20; diagnosis on branch `docs/ci-failure-report` (`docs/CI_QUALITY_GATE_FAILURE.md`). The owner hasn't said yes to the fix yet.
- **Security round** for scribe (68 alerts), open-ping (39), portfolio-rank (31, 6 critical), tl-dw (17), piper-tts (6, 1 critical), tube-vault (1): recorded in `PROJECT_BACKLOG.md`, not started.
- Dependabot alerts were switched on for all 9 build repos on 2026-10-26.

### Machine

- Tools added today: `~/scripts/dev-watch` (+ `dev-watch.timer`), `~/scripts/browser-slot`.
- Many finished worktrees remain under `/home/natkins/n8builds/` (`n8builds-web-*`, `dev-portfolio-sec`); their branches are merged. Removing them (`git worktree remove`) is safe once their PRs are merged; keep `dev-portfolio-v2`, `dev-portfolio-consent`, `n8builds-web-dinoflake` and `n8builds-web-ci-shot` until their work lands.
- Preview servers that may still be running: 3829 (portfolio), 3830 (n8builds main), 3831 (admin).

## Next steps, in order

1. Check what finished after the handoff: `gh pr list -R n8watkins/n8builds-web --state all --limit 5`, `gh pr checks 51`, the two portfolio branches' latest commits, and the admin repo's log.
2. Get #51 and the case study follow-up green and merged (acceptance: main's CI and the nightly green).
3. Portfolio: finish round 8 (the brief above), show the owner the 3829 preview with a done/not-done list, iterate until approved, then ship as described.
4. Admin: done locally; hand the owner the setup checklist; deploy only after the owner creates the GitHub repo and Vercel project.
5. Ask the owner: run the v1.2.0 release, the `@lhci/cli` choice, the tl-dw fix, the security round for the other repos, and the Experience hover image overlapping text on the portfolio.

## Owner's open items (remind them in one short list at the end)

- Run the v1.2.0 release (command above) or wait for Monday.
- Admin setup steps (Setup page / `docs/SETUP.md`).
- Appturnity's Actions minutes are used up until Nov 1 (set a budget at https://github.com/organizations/Appturnity/settings/billing if needed).
- Content: more screenshots for the Chrome extensions; review the "Coming soon" list on the Appturnity card; real YouTube channel URL before streaming (Twitch and YouTube links are hidden until then).
- Earlier items still open in `docs/NEXT_STEPS.md` Part 1 (reCAPTCHA key, GitGuardian incident, Twitch app, YouTube key, Portfolio Rank's Gemini key).
