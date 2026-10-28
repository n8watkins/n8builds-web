# AI Agent Project Review Backlog
Updated: October 27, 2026

This is the one backlog for general work across every project (the owner's call, 2026-10-27).
Each project keeps its own detailed plans in its repo; this file points to them.
The owner's manual steps live in `docs/OWNER_TODO.md`.

## Priority: code reviews and known bugs
- [ ] **Portfolio projects (3–4)** — Audit all code featured on the portfolio, including architecture, security, bugs, tests, dependencies, and modernization. Identify each project and create an action plan.
- [ ] **Tube Vault + TLDW** — Reproduce the YouTube Shorts bug where comments fail to update when scrolling between Shorts. Isolate which extension causes it; fix and regression-test.
- [ ] **Portfolio Rank** — Verify Gemini API key configuration without exposing secrets; restore reliable continuous portfolio ELO scoring, automatic refresh, persistence, and error handling.
  - Blocked on the owner's new Gemini key (grading has been off since July). The "AI reviews" claim stays on n8builds.dev and the portfolio until then, by the owner's call (2026-10-27).
- [ ] **Dino game stats** - In progress: plays, unique players (cookie-free), attempts and high scores per site and overall, by country, in the admin dashboard.
- [ ] **Vercel Analytics** - Switched on in Vercel (2026-10-27); n8builds-web still needs `@vercel/analytics` added to load it. Runs alongside GA4 (cookie-free, so it also counts visitors who decline cookies).
- [ ] **Projects audit follow-ups** - Report: https://claude.ai/artifact/8noJtJsWvWBefJ9jBE2qwu. Em dashes in the live titles of Portfolio Rank, Echo and Scout; Scribe has had no release since v0.8.0; Solara isn't on release-kit yet.

## Security and CI follow-ups (added October 26, 2026)
- [x] **Dependency security round per repo** (done October 27) - Dependabot alerts were switched on for every build repo on October 26; 161 of the 162 open alerts are now closed. The admin dashboard's Security page shows the live counts.
  - portfolio-rank 31 to 0 (6 critical): PR #6, next 15.5.28, next-auth beta.32, and a same-major postcss override. Verified live after the deploy.
  - piper-tts 6 to 0 (1 critical): PR #1, lockfile refresh (express, body-parser, qs, proxy-addr, esbuild).
  - tube-vault 1 to 0: PR #2, esbuild 0.28. Its `npm run build` bumps the version, commits, and syncs to the Windows extension folder, so test builds call esbuild directly. Open PR #1 (v0.3.106) has its own lockfile.
  - open-ping 39 to 0: PR #6. zod 3 to 4.6.7, because zod 3 has no fix. Some validation message wording changes, but the `issues` shape is unchanged. Same-major overrides cover the undici, sharp and zod copies that miniflare pins. The runtime fixes reach openping.n8builds.dev only after `npm run deploy`, which the owner runs.
  - scribe 68 to 1: PR #40, npm lockfiles plus `cargo update` for new RustSec advisories (quinn-proto, rustls, rustls-webpki, webpki-roots). Its Rust CI jobs had been red since July and are green again.
  - tl-dw 17 to 0: cleared by its quality-gate PR #3.
- [ ] **Scribe zip advisories** - `.cargo/audit.toml` ignores RUSTSEC-2026-0367, 0368 and 0369 (zip 4.x extract), whose only user is tauri-plugin-updater 2.x. The updater checks an archive's signature before it extracts it. Remove the ignores when tauri-plugin-updater 3 (zip 9) is stable.
- [ ] **Scribe glib alert** - The last open scribe alert is glib 0.18 (RUSTSEC-2024-0429, an unsound iterator), which comes in through Tauri 2's Linux GTK stack. It needs Tauri to move to glib 0.20. Scribe ships on Windows, which never compiles glib.
- [ ] **open-ping deploy** (owner) - Round 2 (redesign, app UI, free-plan scheduler limits, analytics CSP, no em dashes) and Hosted stage 1 (pricing section, waitlist, /install guide) are merged but not live. Set `WAITLIST_ENABLED` to "true" for the production deploy, run `npm run db:migrate` (migration 0010), then `npm run deploy`. Optional: `RESEND_API_KEY` for waitlist confirmations.
- [x] **dev-portfolio security round** - PR #6 fixed 82 of 87 alerts (all 7 critical). The last 5 are dev-only, inside `@lhci/cli`, and need either a new `@lhci/cli` release or running it on demand with `npx`.
- [ ] **TL;DW quality gate** - Failing on master since July 20. Diagnosis and fix plan: `docs/CI_QUALITY_GATE_FAILURE.md` on the tl-dw branch `docs/ci-failure-report` (a timezone-dependent test, a clock-dependent test, and Vite/Vitest advisories; about an hour of work).
- [ ] **GeminiGPT model** - It calls `gemini-3.1-flash-lite` (`lib/websocket/services/GeminiService.js`); the owner wants Gemini 3.5 Flash Lite. Upgrade in the GeminiGPT repo, test, then update the portfolio copy (it says "Gemini 3.1 Flash Lite" to match the code today).
- [ ] **Appturnity Actions minutes** - The Appturnity org used all 2,000 free minutes in October; its private CI stops until November 1 unless a spending budget is set.

## Product development
- [ ] **Solara** — Audit and finish functionality, polish UX, and prepare a Google Play release.
- [ ] **OpenPing** — Support self-hosting plus an optional paid managed hosting offering; review deployment and documentation.
  - Plan: `docs/HOSTED_PLAN.md` in open-ping (stages 0 to 7). Stages 0 and 1 are done; the gate is about 20 waitlist sign-ups in 8 weeks before building Hosted ($24 a year, +$12 for 1-minute checks).
  - Product report: https://claude.ai/artifact/BARzBrjwkQMgtZs2HWgjAk (short) and https://claude.ai/artifact/C67YiUApqTAGcsR7VHxiEN (full).
- [ ] **im-committed** (private) — Correctly count and display GitHub commits made today, accounting for timezone, API pagination, and refresh.
- [ ] **Scribe app** — Review Rust application code, architecture, performance, security, bugs, and tests.
- [ ] **Scribe website** — Update to accurately reflect the current application.
  - Rounds 4 to 10 are on scribe-web's branch `feat/landing-level-up` (worktree `~/projects/tools/scribe/scribe-web-lvl`), awaiting the owner's approval, then a PR and deploy. Its to-do list: `docs/TODO.md` on that branch.
  - Redo the videos as real recordings of the app on Windows; real screenshots of every theme and view.

## Assess for future work
- [ ] **T-Hub** — Assess product feasibility and code quality; recommend whether to continue.
- [ ] **Pivot** — Review inactive project, identify problems and next steps.
- [ ] **Cutely Ask Me** — Evaluate product potential and path to a polished release.
- [ ] **Fit Flow 7** — Assess code, usability, and missing functionality.
- [ ] **Felium** — Determine whether still used; maintain, archive, or retire.

## Cleanup and low-priority assessments
- [ ] **Net Trailers** — Clean up code, dependencies, structure, and technical debt.
- [ ] **Repo Steward** — Evaluate usefulness before committing to more development.

## AI agent workflow
1. Audit the repo, dependencies, documentation, tests, and recent development.
2. Produce a prioritized report distinguishing confirmed issues from possible improvements.
3. Plan fixes by impact and effort. Make changes on a branch, run tests, and document results.
4. Record PRs, decisions, and remaining tasks here; check off items only after verification.

## Suggested sequence (flexible)
- Weeks 1–2: Portfolio review, Tube Vault/TLDW bug, Portfolio Rank, Scribe Rust audit.
- Weeks 3–4: Solara, OpenPing, im-committed, Scribe website.
- Weeks 5–6+: Assess remaining products and cleanup tasks.

These are planning estimates, not deadlines.
