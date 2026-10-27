# AI Agent Project Review Backlog
Updated: October 26, 2026

## Priority: code reviews and known bugs
- [ ] **Portfolio projects (3–4)** — Audit all code featured on the portfolio, including architecture, security, bugs, tests, dependencies, and modernization. Identify each project and create an action plan.
- [ ] **Tube Vault + TLDW** — Reproduce the YouTube Shorts bug where comments fail to update when scrolling between Shorts. Isolate which extension causes it; fix and regression-test.
- [ ] **Portfolio Rank** — Verify Gemini API key configuration without exposing secrets; restore reliable continuous portfolio ELO scoring, automatic refresh, persistence, and error handling.

## Security and CI follow-ups (added October 26, 2026)
- [ ] **Dependency security round per repo** - Dependabot alerts were switched on for every build repo on October 26. Open alerts then: scribe 68, open-ping 39, portfolio-rank 31 (6 critical), tl-dw 17, piper-tts 6 (1 critical), tube-vault 1. For each repo: update dependencies within their major versions, run its tests, open a PR, merge when CI is green, and list anything that needs a breaking upgrade. The admin dashboard's Security page shows the live counts.
- [x] **dev-portfolio security round** - PR #6 fixed 82 of 87 alerts (all 7 critical). The last 5 are dev-only, inside `@lhci/cli`, and need either a new `@lhci/cli` release or running it on demand with `npx`.
- [ ] **TL;DW quality gate** - Failing on master since July 20. Diagnosis and fix plan: `docs/CI_QUALITY_GATE_FAILURE.md` on the tl-dw branch `docs/ci-failure-report` (a timezone-dependent test, a clock-dependent test, and Vite/Vitest advisories; about an hour of work).
- [ ] **GeminiGPT model** - It calls `gemini-3.1-flash-lite` (`lib/websocket/services/GeminiService.js`); the owner wants Gemini 3.5 Flash Lite. Upgrade in the GeminiGPT repo, test, then update the portfolio copy (it says "Gemini 3.1 Flash Lite" to match the code today).
- [ ] **Appturnity Actions minutes** - The Appturnity org used all 2,000 free minutes in October; its private CI stops until November 1 unless a spending budget is set.

## Product development
- [ ] **Solara** — Audit and finish functionality, polish UX, and prepare a Google Play release.
- [ ] **OpenPing** — Support self-hosting plus an optional paid managed hosting offering; review deployment and documentation.
- [ ] **im-committed** (private) — Correctly count and display GitHub commits made today, accounting for timezone, API pagination, and refresh.
- [ ] **Scribe app** — Review Rust application code, architecture, performance, security, bugs, and tests.
- [ ] **Scribe website** — Update to accurately reflect the current application.

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
