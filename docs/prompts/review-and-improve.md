# Prompt: review-and-improve pass

A ready-to-paste prompt for a fresh Claude Code session in this repo.
It runs three parallel read-only reviews (security, SEO, mobile/UX) as subagents, fixes the known improvements meanwhile, then verifies and fixes what the reviews find.
It stops before pushing and before any Vercel or Cloudflare change.

Written 2026-10-22.
Before reusing it later, update the "known improvements" in Phase 2 against `docs/HANDOFF.md`.

## The prompt

````
Read docs/HANDOFF.md, docs/OWNER_TODO.md and README.md for context on n8builds-web (Next.js 16 App Router on Vercel, live at https://n8builds.dev). Then run the review-and-improve pass below. Follow the conventions in HANDOFF: commit each logical change separately, no agent co-author trailer, no em dashes, one sentence per line in long Markdown, and reproduce every bug before fixing it. Do not push, and ask me before any change outside the repo (Vercel or Cloudflare settings, DNS).

## Phase 1: three parallel read-only reviews (subagents)

Spawn these three reviewers in the background at the same time. Give each its own detached git worktree at the current HEAD (create them yourself with `git worktree add --detach`), its own `npm ci`, and its own ports so they never collide with each other or with you: security 3770, SEO 3780, UX 3790 (for both `next start` and E2E_PORT). Tell each one:
- read only: no edits to tracked files, no commits, no pushes
- only kill processes it started itself (never pkill or killall)
- throwaway scripts go under /tmp, never in the repo
- read-only GET requests are the only allowed contact with the live site
- never send real email
- report findings ranked by severity, each with file:line, a concrete failure or exploit scenario, how it was verified (reproduced or code read), and a suggested fix; also list what was checked and found sound; no style nits

While they run, start on the known items in Phase 2.

### Reviewer A: security (adversarial)
Threat model: a public personal site; attackers are anonymous users and bots. Assets: the owner's Gmail sending reputation and quota (each contact submission sends two emails), the inbox, the Upstash rate-limit database, Sentry and GA credentials, site integrity, and visitors' privacy.
1. Contact flow end to end (app/api/contact/route.ts, lib/security/*, lib/email/*, lib/validations/contact.ts, components/ContactForm/*): sending without passing Turnstile, rate-limit bypass or poisoning (IP headers, key collisions, the order of checks), email header injection through name, email or subject, HTML injection into the notification or auto-reply, using the auto-reply to spam third-party addresses, and abuse of CONTACT_TEST_MODE or the VERCEL checks.
2. Other server surfaces: app/api/health, app/api/notions/recent, app/notions-cover/[version]/[topic]/[file]/route.ts (validation, cache poisoning, resource use), app/sitemap.ts, redirects in next.config.mjs (open redirects), and Sanity content paths (stored XSS through PortableText or images).
3. Headers and CSP (lib/security/headers.mjs and the live headers): real bypasses (script-src 'unsafe-inline' is a known tradeoff; state what it actually exposes), missing headers, and the Sentry tunnel at /monitoring as an open relay.
4. Secrets and configuration: sensitive values in the client bundle (build, then grep .next/static), NEXT_PUBLIC_* usage, git history for leaked keys, GitHub workflows (permissions, untrusted input), and what Vercel preview deployments expose.
5. Dependencies: npm audit (one unfixable braces advisory in dev tooling is documented), risky packages in the production bundle, and anything loading remote code at runtime.
6. Client side: dangerouslySetInnerHTML, target=_blank links, postMessage handlers, localStorage, and third-party scripts.
Test against a local production build in test mode: `npm run build`, then `CONTACT_TEST_MODE=1 TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA npx next start -p 3770`.

### Reviewer B: SEO and sharing
Check every route (the homepage, /blog, each post, each /builds/<slug>, /loadout, /privacy, the 404 page) for:
- titles and descriptions: present, unique, and the right length
- canonical URLs
- Open Graph and Twitter tags, including og:image (check how Next.js merges metadata between layout and page)
- robots.txt and the sitemap (accuracy, and no dropped or redirecting URLs)
- structured data (JSON-LD for Person, WebSite and BlogPosting)
- heading outline, image alt text, internal links, and duplicate hosts (www vs apex, *.vercel.app)
Compare the live site with the local build.

### Reviewer C: mobile and UX (stands in for a real-device test)
Using Playwright device emulation (Pixel 7, iPhone 14, an iPad) plus 1440px desktop, walk every page as a visitor would:
- taps and touch targets
- the mobile menu
- horizontal overflow
- text overflow, clipping and truncation
- fixed elements covering content
- the contact form on a phone (keyboard types, autocomplete attributes, error states, the loading and success screens)
- reduced motion and keyboard-only navigation
Be picky about anything misaligned, cramped or broken, and attach screenshots of every finding.

## Phase 2: known improvements (main session, while the reviewers run)

Reproduce each one first, then fix it as its own commit, with a test where it makes sense:
1. Social preview images: only the homepage has og:image, because pages that set their own openGraph replace the layout's. Every page should keep a preview image. Better still, give each blog post its own Open Graph image (next/og) built from its generated cover art (lib/blog-cover.ts), keeping the topic colour and waveform, rendered as PNG, with a fallback for posts that have an uploaded cover.
2. Canonical URLs on every route that lacks one (the homepage, /loadout, /privacy, /builds/<slug>).
3. www.n8builds.dev serves a duplicate of the site. The fix is a Vercel domain redirect (www to apex, 308). It is a dashboard or API setting, so ask me before changing it, and say what you will run.
4. robots.txt: stale comment calling the site a portfolio.

## Phase 3: triage and fixes

When each reviewer reports, verify every finding yourself (reproduce it, or confirm it by reading the code), then:
- fix the real ones as separate commits, each with a test that fails without the fix, avoiding conflicts with Phase 2 work
- record anything that needs me (dashboards, credentials, taste decisions) in docs/OWNER_TODO.md
- tell me which findings you rejected and why

Run fixes and builds in the main checkout only, one build or Playwright run at a time per checkout, since they share .next and test-results.

## Phase 4: finish

Run the full verification list:
- `npm run lint`
- `npm run type-check`, done the CI way: `rm -rf .next/types .next/dev` first
- `npm run test:unit`
- `npm run test:e2e:all`
- `npm audit --omit=dev`
- `npm run lighthouse` (with CHROME_PATH set to Playwright's Chromium)

Update docs/HANDOFF.md and docs/OWNER_TODO.md for anything that changed, remove the reviewer worktrees, and report:
- what was fixed, by commit
- what was rejected, and why
- exact check results
- what remains for me
Don't push; I'll ask.
````
