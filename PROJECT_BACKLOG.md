# AI Agent Project Review Backlog
Updated: October 28, 2026

This is the one backlog for general work across every project (the owner's call, 2026-10-27).
Each project keeps its own detailed plans in its repo; this file points to them.
The owner's manual steps live in `docs/OWNER_TODO.md`.
Since 2026-10-27 every project repo also has its own start-here section in `docs/HANDOFF.md`, so a session started in that repo's folder has what it needs.

## Security: outdated Next.js and Node on live sites (found October 27, 2026; owner will address)
Checked against GitHub's advisory database on 2026-10-27.
Four live public sites run Next.js versions with critical advisories, including unauthenticated remote code execution (`use cache`, Image Optimization, `next/og`).
All are fixed in Next.js 16.4.1 and later.
- [ ] **GeminiGPT** - next 16.0.0: 4 critical, 15 high, 16 moderate, 3 low. Render runs it on native Node 24 (the Dockerfile's `node:20-alpine` isn't used). Render auto-deploy hasn't fired since June 14, so merged commits aren't live.
- [ ] **Echo** - next 16.2.9: 5 critical, 6 high, 8 moderate, 1 low. Node 22 on Render.
- [ ] **Scout** - next 16.2.9: same advisories as Echo. Node 22 on Render; auto-deploy hasn't worked since June.
- [ ] **Net Trailers** - next 16.2.7: same advisories as Echo. Vercel builds on Node 22 (supported until April 2027); move to 24 with the upgrade.
- [ ] **Node 20 in CI** (low) - portfolio-rank, tl-dw and scribe run CI on Node 20, which no longer gets security fixes; move them to Node 24.
- Clean: Portfolio Rank (next 15.5.28), Solara (next 16.4.3).
- The fix for each: upgrade next to the latest 16.x, run lint, build and tests, deploy, then check the live site. Each repo's handoff lists it as its first open problem.

## Priority: code reviews and known bugs
- [x] **Leaked keys in GeminiGPT** - Two keys (a Gemini key ending `6C4w`, a Google Search key ending `0cpQ`) were in the public repo. On October 27 Google rejected both as not valid, and the branch history was rewritten to redact them (GeminiGPT #5 records it). GitHub's read-only refs for PRs #1, #2 and #4 still hold the old commits; only GitHub Support can purge those.
- [ ] **Echo duplicate Render service** (owner) - Echo's `render.yaml` names the service `echo`, but the real one is `echo-genai-voice-agent`, so every Blueprint sync creates a stray `echo` service (live now at echo-a8ec.onrender.com, `srv-dbgp1j1srm7s73eejav0`). Delete it, then delete the Blueprint or link it to the real service. Don't edit Echo's `render.yaml` until then.
- [ ] **Render and Vercel housekeeping** (owner) - Fix auto-deploy for GeminiGPT and Scout (likely the Render GitHub app's repo access) and deploy each once; disconnect the leftover `gemini-gpt` Vercel project and net_trailers' GitHub Pages and Netlify (`silly-palmier-862249`) integrations, which fail on every push; Echo's `ECHO_MODEL` Render variable pins 3.1 and must change with its model PR.
- [ ] **OpenPing off-hours bug** - The public feed, status page and widget report a monitor in scheduled off-hours as "operational", so the portfolio shows sleeping Render apps as up. Report: `docs/BUG-public-scheduled-off.md` in open-ping (#13). Fix before the owner's next `npm run deploy`, so one deploy ships it with round 2.
- [ ] **Gemini 3.5 Flash Lite** (owner's call, 2026-10-27) - GeminiGPT and Portfolio Rank move to Gemini 3.5 Flash Lite; Echo, Scout and Net Trailers where it fits; TL;DW is on 3.1 Flash Lite too. The ID is `gemini-3.5-flash-lite` (stable). Open PRs: GeminiGPT #3, Echo #3, Scout #3, portfolio-rank #10, net_trailers #5; each waits on the owner's new key (Render for the demos, Vercel for Net Trailers, the GitHub Actions secret for Portfolio Rank), then a live check. Echo's realtime voice model has no Flash Lite version; moving it off the legacy live preview is an owner decision.
- [ ] **Portfolio projects (3–4)** - Audit all code featured on the portfolio, including architecture, security, bugs, tests, dependencies, and modernization. Identify each project and create an action plan.
- [ ] **Tube Vault + TLDW** - Reproduce the YouTube Shorts bug where comments fail to update when scrolling between Shorts. Isolate which extension causes it; fix and regression-test.
  - Both handoffs (October 27) name the suspects: TubeVault's `mountShortsButton()` in `extension/src/content-script.tsx` (it mounts into YouTube's recycled action bar, which holds the comments button); TL;DW's 500 ms `onNavigate()` in `src/content/youtube.ts` and `handleNav()` in `src/content/sponsorblock.ts`.
- [ ] **Portfolio Rank** - Verify Gemini API key configuration without exposing secrets; restore reliable continuous portfolio ELO scoring, automatic refresh, persistence, and error handling.
  - Blocked on the owner's new Gemini key (grading has been off since July). The "AI reviews" claim stays on n8builds.dev and the portfolio until then, by the owner's call (2026-10-27).
- [ ] **Dino game stats** - Built (n8builds-web #73, dev-portfolio #14, n8builds-admin #2): plays, unique players (cookie-free), attempts and high scores per site and overall, by country, in the admin dashboard.
  Waits on the owner's second Upstash Redis database (`ANALYTICS_REDIS_REST_URL` and `_TOKEN` on the n8builds-web and n8builds-admin Vercel projects); until then the panel shows "not connected".
- [x] **Vercel Analytics** - Live on n8builds.dev since n8builds-web #76 (2026-10-28), alongside GA4 (cookie-free, so it also counts visitors who decline cookies).
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
- [x] **dev-portfolio security round** - PR #6 fixed 82 of 87 alerts (all 7 critical).
- [ ] **dev-portfolio `@lhci/cli`** (low) - Its last 5 alerts are dev-only, inside `@lhci/cli`: drop the dev dependency and run it on demand with `npx`, or wait for a fixed `@lhci/cli` release.
- [x] **TL;DW quality gate** - Fixed by tl-dw #3 (October 27); the diagnosis is on master as `docs/CI_QUALITY_GATE_FAILURE.md` (#5).
- [ ] **GeminiGPT model** - It calls `gemini-3.1-flash-lite` (`lib/websocket/services/GeminiService.js`); the owner wants Gemini 3.5 Flash Lite. Upgrade in the GeminiGPT repo, test, then update the portfolio copy (it says "Gemini 3.1 Flash Lite" to match the code today).
- [ ] **Appturnity Actions minutes** - The Appturnity org used all 2,000 free minutes in October; its private CI stops until November 1 unless a spending budget is set.

## Product development
- [ ] **Solara** - Audit and finish functionality, polish UX, and prepare a Google Play release.
- [ ] **OpenPing** - Support self-hosting plus an optional paid managed hosting offering; review deployment and documentation.
  - Plan: `docs/HOSTED_PLAN.md` in open-ping (stages 0 to 7). Stages 0 and 1 are done; the gate is about 20 waitlist sign-ups in 8 weeks before building Hosted ($24 a year, +$12 for 1-minute checks).
  - Product report: https://claude.ai/artifact/BARzBrjwkQMgtZs2HWgjAk (short) and https://claude.ai/artifact/C67YiUApqTAGcsR7VHxiEN (full).
- [x] **im-committed** (private) - A scheduled bot that commits daily. Since October 27 (#1) it commits every day, usually 100 to 150 times, with no overlapping runs and retried pushes.
- [ ] **Scribe app** - Review Rust application code, architecture, performance, security, bugs, and tests (plan: `docs/ASSESSMENT_PLAN_2026-10.md`). The security fixes from #40 reach users only with a release, which needs the owner's go-ahead. The local checkout's branch `feat/rust-storage-profiles` holds 5 commits not on main (its PR #18 was closed); revive or drop it with the owner.
- [ ] **Scribe website** - The rework is live (scribe-web #11, October 27). Left: real Windows screenshots and recordings (from the Scribe app assessment), a "What's new" page from app releases, and a phone version of the app tour. To-do list: `docs/TODO.md` in scribe-web.

## Assess for future work
- [ ] **T-Hub** - Assess product feasibility and code quality; recommend whether to continue.
- [ ] **Pivot** - Review inactive project, identify problems and next steps.
- [ ] **Cutely Ask Me** - Evaluate product potential and path to a polished release.
- [ ] **Fit Flow 7** - Assess code, usability, and missing functionality.
- [ ] **Felium** - Determine whether still used; maintain, archive, or retire.

## Cleanup and low-priority assessments
- [ ] **Net Trailers** - Clean up code, dependencies, structure, and technical debt.
- [ ] **Repo Steward** - Evaluate usefulness before committing to more development.

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
