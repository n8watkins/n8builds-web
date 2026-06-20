# HANDOFF — Free Tools Trio (CanIHost · FreeStack · APIScout)

_Last updated: 2026-06-14. Covers the three OSS "awesome-list → real frontend" star-generation tools, how they're wired into n8builds.dev, plus the 2026-06-14 dev-CSP fix, security audit, and APIScout proxy hardening._

> **Read this if** you're picking up the free-tools initiative. The three tools each live in their OWN git repo under `/home/natkins/n8builds/public/<slug>/` (NOT part of n8builds-web). This doc is the cross-cutting state; each repo also has its own `README.md` + `HOW_IT_WORKS.md`.

## What this is

Three free, open-source, mostly-client-side web tools. Each takes a beloved giant "awesome list" README and gives it a real frontend **plus one differentiator competitors don't ship**, with the brand hook: **browse by what you want to DO, not the tech category.** They are a "star generation" play for Nate's brand (n8builds.dev / github.com/n8watkins).

| Tool | Repo | Live (alias) | Upstream | Differentiator |
|---|---|---|---|---|
| **CanIHost** | `public/canihost` → n8watkins/canihost | https://canihost.vercel.app | awesome-selfhosted | goal pills ("Replace Google Photos") + "Can I run this?" RAM/CPU/ARM calculator + docker-compose generator + live build bar |
| **FreeStack** | `public/freestack` → n8watkins/freestack | https://freestack-livid.vercel.app | ripienaar/free-for-dev | goal pills ("Spin up a database") + side-by-side free-tier **compare** table |
| **APIScout** | `public/apiscout` → n8watkins/apiscout | https://apiscout-cyan.vercel.app | public-apis/public-apis | live in-browser "try it" playground + no-auth/CORS filter + real category tiles + **HTTPS verified-vs-claimed** + animated hero |

**Stack (all three):** Next.js 15 App Router · React 19 · TypeScript · Tailwind v4 · framer-motion. Static-first, client-side filtering, data baked to `data/*.json` at build time. Hosted on Vercel free tier (team `natkins23s-projects`). APIScout additionally has ONE dynamic serverless route (`app/api/proxy/route.ts`, SSRF-hardened) for the playground.

**Distinct light identities (deliberate — Nate's call):** CanIHost = blueprint/homelab amber; FreeStack = pricing-page emerald/mint; APIScout = dev-playground indigo.

## State — done & verified

All three: built clean (`npm run build`), pushed to public GitHub under `n8watkins`, deployed to Vercel (all return 200), each has `README.md` + `HOW_IT_WORKS.md`, MIT LICENSE, SEO metadata + `sitemap.ts` + `robots.ts`, and brand furniture (Star-on-GitHub, Ko-fi `ko-fi.com/n8watkins`, Appturnity CTA `appturnity.com`, footer → n8builds.dev, upstream credit).

Key commits (latest per repo; ★ = 2026-06-14 session, all pushed to GitHub):
- **canihost** ★`c6613d9` (dev-CSP unsafe-eval gate), `dad14a0` (docs), `1db7d2c` (pills/logos/rank-by-basics/live build bar/CSS-card fix), `befec90` (goal-first).
- **freestack** ★`4a4933f` (dev-CSP unsafe-eval gate), `b13b27e` (docs), `b97f975` (pills + CSS-card fix), `d3f42dd` (goal-first).
- **apiscout** ★`c7de7fa` (proxy hardening: anti-rebind SSRF + rate limit + undici dep), ★`9dc08b3` (dev-CSP unsafe-eval gate), `24e0072` (screenshots), `6668514` (docs).
- **n8builds-web** `1b6aabb` — added all three to the homepage **Free Tools** section (`ToolsSection.tsx` + `data/builds.tsx`), pushed to `main` → **n8builds.dev redeployed (200)**.

Verified working: goal pills, per-app logos (CanIHost), sort-by-basics + collapsed Advanced filters, live floating build bar RAM/cores, FreeStack goal grid + compare, APIScout animated hero + category rail + honest HTTPS badges + live "try it" 200. Homepage Free Tools cards render with visuals + Try-it/Star buttons.

**2026-06-14 session adds:**
- **Dev-CSP fix (all 3):** the strict `script-src` had no `'unsafe-eval'`, which broke `next dev` (Fast Refresh/HMR uses eval) → blank framer-motion hero / featured strip / category rail **in local dev only** (production was always fine). Fixed by gating `'unsafe-eval'` on `process.env.NODE_ENV !== "production"` in each `next.config.ts`. Production CSP byte-identical. Verified: heroes + APIScout's 52 category tiles render locally, zero console errors.
- **Security audit (all 3):** full read of server surface, sinks, deps, headers. Clean except APIScout's proxy. Confirmed safe: `JsonViewer` (escapes before tokenizing, fixed class names — no XSS from proxied responses), static JSON-LD, all `target="_blank"` carry `rel="noopener noreferrer"`, no secrets in source, no `.env` tracked, proxy returns JSON-wrapped body (no content-type confusion). CanIHost/FreeStack are fully static (no server attack surface).
- **APIScout proxy hardening (`c7de7fa`):** (1) **SSRF anti-rebind** — the old guard only regex-checked the hostname string, so a public host with an A-record → private IP (127.0.0.1 / 169.254.169.254 / RFC1918 / CGNAT / ULA) bypassed it. Now a custom DNS `lookup` on the fetch dispatcher (undici `Agent`) resolves the host, rejects if ANY resolved IP is private/reserved, and **pins** the socket to the validated IP (no check-then-connect window), preserving TLS SNI, re-run on every redirect hop. New `isPrivateIp()` covers v4 ranges + v6 loopback/ULA/link-local/multicast/IPv4-mapped (unit-verified 18/18). (2) **Rate limit** — per-IP in-process 30/min, returns 429 + `Retry-After` (backstop; not distributed-safe — see next steps). Verified LIVE on `apiscout-cyan.vercel.app`: `localtest.me`→127.0.0.1 blocked (`"code":"blocked"`), legit APIs 200, 429s under burst.
- **Deploy mechanism confirmed:** Vercel **git integration is active** — `git push` to each tool's `master` auto-deploys to production (no manual `vercel deploy` needed). All three pushed + auto-deployed + aliases 200 this session.
- **Strategy decision (Nate):** the tools WILL be hosted on `*.n8builds.dev` subdomains (confirmed; security audit was the gate, now cleared).

## State — in flight / blocked

**Subdomains attached on Vercel but DNS STILL NOT live (re-checked 2026-06-14: all NXDOMAIN).** `canihost.n8builds.dev`, `freestack.n8builds.dev`, `apiscout.n8builds.dev` are added to their Vercel projects, but the Cloudflare token on this machine is **read-only**, so the DNS records were NOT created. They do not resolve yet. The homepage links currently point at the working `*.vercel.app` aliases. **This is the only blocker** — code is all pushed/deployed/live on aliases. (Vercel `domains inspect` shows nameservers as Cloudflare's, not Vercel's `✘` — that's EXPECTED for the CNAME method, not a problem.)

> **Re-verified 2026-06-19:** the `canihost`/`freestack`/`apiscout.n8builds.dev` subdomains still do not resolve (CNAMEs not added in Cloudflare — all NXDOMAIN), and the `liveSite` links in `data/builds.tsx` still point at `*.vercel.app` (`canihost.vercel.app`, `freestack-livid.vercel.app`, `apiscout-cyan.vercel.app`). No change since 2026-06-14; the Cloudflare-CNAME step in "Next steps" is still pending.

## Next steps (ordered)

1. **(USER action) Add 3 Cloudflare CNAME records** — zone `n8builds.dev`, all **DNS-only (grey cloud)**, matching the existing `portfolio` record:
   - `canihost` → `cname.vercel-dns.com`
   - `freestack` → `cname.vercel-dns.com`
   - `apiscout` → `cname.vercel-dns.com`
   Verify with: `curl -s "https://cloudflare-dns.com/dns-query?name=canihost.n8builds.dev&type=CNAME" -H "accept: application/dns-json"`. If Vercel cert stalls after DNS resolves: `vercel certs issue canihost.n8builds.dev --scope natkins23s-projects`.
2. **Flip homepage links to subdomains** once they resolve — edit `liveSite` for `canihost`/`freestack`/`apiscout` in `n8builds-web/data/builds.tsx` (currently the `*.vercel.app` aliases) → `https://<slug>.n8builds.dev`. Rebuild, commit, push (auto-deploys n8builds.dev). Acceptance: homepage "Try it" buttons hit the subdomains and they 200.
3. **(Recommended, APIScout) Add a Vercel WAF rate limit** on `/api/proxy` — the in-app limiter (`c7de7fa`) resets on cold starts and isn't distributed-safe. Configure platform rate limiting in the Vercel dashboard (Project → Firewall) for durable per-IP limiting. Dashboard-only; an agent can't do it via CLI.
4. **(Optional, low) Bump Next** to clear the 2 moderate `postcss <8.5.10` advisories (build-time only, not runtime-exploitable). Do NOT `npm audit fix --force` — it tries to downgrade Next to 9.x. Just bump Next to a release bundling patched postcss.
5. **(Optional) Auth** — deferred by Nate to the end; not started for any tool.
6. **(Optional) Polish backlog** — none outstanding; all rounds shipped.

## Conventions & gotchas (hard-won this session)

- **Deploy a tool:** from its dir, `vercel deploy --prod --yes --scope natkins23s-projects`. Public URL is the alias (e.g. `canihost.vercel.app`); the raw `*-natkins23s-projects.vercel.app` URL **401s** behind deployment protection — always test the alias.
- **`freestack.vercel.app` / `apiscout.vercel.app` were taken** by other Vercel users → Vercel auto-suffixed to `freestack-livid` / `apiscout-cyan`. That's why subdomains matter.
- **NEVER put framer-motion `layout` on list cards.** It re-animates on every render ("moving in/out" churn) AND its inline `transform` overrides CSS `hover:-translate-y` (broken hover). Cards are now **CSS-only** (`.fade-up` class + CSS hover); keep them that way.
- **Goal selectors must be compact pills, not boxes** — boxes competed visually with the result cards (Nate's explicit feedback). See `UseCaseGrid.tsx` (canihost) / `GoalGrid.tsx` (freestack).
- **CanIHost rank-by-basics:** primary controls are Sort (stars/recently-updated/lightest-RAM/A–Z) + Active/Docker/ARM toggles; category/language/license are behind "Advanced". Don't promote tech filters back to primary.
- **Honesty rule (APIScout):** never display "HTTPS ✓" you didn't verify — `scripts/enrich.mjs` probes for real and the UI distinguishes **verified / claimed / unconfirmed**. Resource/RAM numbers in CanIHost are labeled **estimates** (heuristics, not vendor specs). Keep this honesty — it's a brand value.
- **Data regen:** CanIHost `npm run data` (needs `awesome-selfhosted-data` cloned to /tmp first — see its README); APIScout `npm run data` then `npm run enrich` (enrich needs network + `gh auth token`; cached, incremental). Committed JSON makes deploy builds fully offline.
- **`pkill` in a `&&`/`;` chain returns exit 144** (signal propagation) and aborts the chain — run server-kills as their own standalone command, or just start the next server on a fresh port.
- **Screenshots:** each tool has `scripts/screenshot.mjs` (or `capture.mjs`); run against a running `npm run start` server. playwright is in the tool repos' deps (n8builds-web may not have it — borrow a tool's `node_modules` by running the script from that dir).
- **n8builds-web** has a husky/lint-staged pre-commit hook (`eslint --fix`) — expect it to run on commit. Pushing to `main` auto-deploys n8builds.dev. Dynamic-imported homepage sections aren't in SSR HTML, so `curl | grep` won't see them — verify visually.
- **Tool deploys are git-integration auto-deploys** (confirmed 2026-06-14): `git push origin master` in a tool repo auto-builds+deploys to Vercel prod. `vercel deploy --prod` still works but is redundant. Test the alias (`canihost.vercel.app`, `freestack-livid.vercel.app`, `apiscout-cyan.vercel.app`) — raw `*-natkins23s-projects.vercel.app` URLs 401.
- **Dev CSP needs `'unsafe-eval'` (dev only).** All 3 `next.config.ts` now gate it on `NODE_ENV !== "production"`. Don't strip it or local `next dev` heroes go blank again. Production must NOT have it.
- **Don't `npm run build` while that tool's `npm run dev` is running** — both write `.next`; the build clobbers the dev server (→ 500). Kill dev first, or `rm -rf .next && npm run dev` to recover.
- **APIScout now depends on `undici`** (added for the SSRF-pinning dispatcher). `import { Agent } from "undici"`; the route is `runtime = "nodejs"`. Verify `isPrivateIp` logic with a temp tsx file importing from `./lib/safefetch` (named export `isPrivateIp`).
- **Vercel is authed as `natkins23`** on this machine; scope flag is `--scope natkins23s-projects`. Cloudflare token is **read-only** (can't create DNS records).
- **SSRF test recipe:** `localtest.me` is a public hostname that resolves to `127.0.0.1` — use it to prove the resolved-IP block (regex-only checks would miss it). `127.0.0.1.nip.io` is caught by the cheap regex instead, so it does NOT exercise the DNS layer.

## File map

**Per tool (same shape):** `app/page.tsx` (composition) · `components/Directory.tsx` (search/filter/sort state + grid) · `lib/usecases.ts` (canihost) / `lib/goals.ts` (freestack) (the intent layer + matcher) · `scripts/build-data.*` (data pipeline) · `data/*.json` (baked data) · `README.md` + `HOW_IT_WORKS.md`.

CanIHost specifics: `lib/calculator.ts` (footprint heuristics) · `lib/compose.ts` (compose gen) · `components/FilterBar.tsx` (basics-first + Advanced) · `components/FloatingBuildBar.tsx` (live RAM/cores) · `components/Logo.tsx` (favicon→monogram) · `components/UseCaseGrid.tsx` (goal pills).
FreeStack specifics: `components/CompareModal.tsx` + `CompareContext.tsx` (the compare feature) · `components/GoalGrid.tsx` (goal pills) · `lib/format.ts` (facet extraction).
APIScout specifics: `app/api/proxy/route.ts` (proxy + per-IP rate limit) · `lib/safefetch.ts` (SSRF: `isPublicHttpUrl` string check + `isPrivateIp` IP check + `validatingLookup`/undici `Agent` resolved-IP pinning + `safeFetch` + `readCapped`) · `components/JsonViewer.tsx` (escape-before-tokenize highlighter — audited XSS-safe) · `scripts/enrich.mjs` (HTTPS/GitHub verification, build-time, uses `gh auth token`) · `lib/popular.ts` · `lib/categories.ts` · `components/CategoryRail.tsx` · `components/FeaturedStrip.tsx` · `components/Hero.tsx` (animated).
All 3: `next.config.ts` (security headers + dev-only `'unsafe-eval'` CSP gate).

**n8builds-web integration:** `components/sections/ToolsSection.tsx` (the homepage Free Tools grid — `tools[]` array) · `data/builds.tsx` (Build entries: `canihost`/`freestack`/`apiscout` — edit `liveSite` here to flip to subdomains) · `public/builds/<slug>/{icon.png,og-image.png}` (assets).

**Memory:** there is NO `freetool-trio.md` in this project's agent memory dir (`~/.claude/projects/-home-natkins-n8builds-n8builds-web/memory/`) — that earlier pointer was stale. This handoff doc is the canonical state; treat it as the source of truth.
