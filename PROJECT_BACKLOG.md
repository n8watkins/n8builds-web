# AI Agent Project Review Backlog
Updated: October 26, 2026

## Priority: code reviews and known bugs
- [ ] **Portfolio projects (3–4)** — Audit all code featured on the portfolio, including architecture, security, bugs, tests, dependencies, and modernization. Identify each project and create an action plan.
- [ ] **Tube Vault + TLDW** — Reproduce the YouTube Shorts bug where comments fail to update when scrolling between Shorts. Isolate which extension causes it; fix and regression-test.
- [ ] **Portfolio Rank** — Verify Gemini API key configuration without exposing secrets; restore reliable continuous portfolio ELO scoring, automatic refresh, persistence, and error handling.

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
