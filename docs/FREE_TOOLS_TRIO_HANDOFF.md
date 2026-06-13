# HANDOFF — Free Tools Trio (CanIHost · FreeStack · APIScout)

_Last updated: 2026-06-13. Covers the three OSS "awesome-list → real frontend" star-generation tools built this session, plus how they're wired into n8builds.dev._

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

Key session commits (latest per repo):
- **canihost** `dad14a0` (docs), `1db7d2c` (pills/logos/rank-by-basics/live build bar/CSS-card fix), `befec90` (goal-first).
- **freestack** `b13b27e` (docs), `b97f975` (pills + CSS-card fix), `d3f42dd` (goal-first).
- **apiscout** `24e0072` (screenshots), `6668514` (docs), `4952696` + `f26a5b9` (popularity/categories/verification/animated hero).
- **n8builds-web** `1b6aabb` — added all three to the homepage **Free Tools** section (`ToolsSection.tsx` + `data/builds.tsx`), pushed to `main` → **n8builds.dev redeployed (200)**.

Verified working this session (via Playwright screenshots + curl 200s): goal pills, per-app logos (CanIHost), sort-by-basics + collapsed Advanced filters, live floating build bar RAM/cores, FreeStack goal grid + compare, APIScout animated hero + category rail (Animals/Anime/…) + honest HTTPS badges + live "try it" 200 response. Homepage Free Tools cards render with visuals + Try-it/Star buttons.

## State — in flight / blocked

**Subdomains attached on Vercel but DNS NOT live.** `canihost.n8builds.dev`, `freestack.n8builds.dev`, `apiscout.n8builds.dev` are added to their Vercel projects, but the Cloudflare token on this machine is **read-only**, so the DNS records were NOT created. They do not resolve yet. The homepage links currently point at the working `*.vercel.app` aliases.

## Next steps (ordered)

1. **(USER action) Add 3 Cloudflare CNAME records** — zone `n8builds.dev`, all **DNS-only (grey cloud)**, matching the existing `portfolio` record:
   - `canihost` → `cname.vercel-dns.com`
   - `freestack` → `cname.vercel-dns.com`
   - `apiscout` → `cname.vercel-dns.com`
   Verify with: `curl -s "https://cloudflare-dns.com/dns-query?name=canihost.n8builds.dev&type=CNAME" -H "accept: application/dns-json"`. If Vercel cert stalls after DNS resolves: `vercel certs issue canihost.n8builds.dev --scope natkins23s-projects`.
2. **Flip homepage links to subdomains** once they resolve — edit `liveSite` for `canihost`/`freestack`/`apiscout` in `n8builds-web/data/builds.tsx` (currently the `*.vercel.app` aliases) → `https://<slug>.n8builds.dev`. Rebuild, commit, push (auto-deploys n8builds.dev). Acceptance: homepage "Try it" buttons hit the subdomains and they 200.
3. **(Optional) Auth** — deferred by Nate to the end; not started for any tool.
4. **(Optional) Polish backlog** — none outstanding from Nate's feedback; all rounds (animation/hover/pills/logos/sort/build-bar/APIScout overhaul) are shipped.

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

## File map

**Per tool (same shape):** `app/page.tsx` (composition) · `components/Directory.tsx` (search/filter/sort state + grid) · `lib/usecases.ts` (canihost) / `lib/goals.ts` (freestack) (the intent layer + matcher) · `scripts/build-data.*` (data pipeline) · `data/*.json` (baked data) · `README.md` + `HOW_IT_WORKS.md`.

CanIHost specifics: `lib/calculator.ts` (footprint heuristics) · `lib/compose.ts` (compose gen) · `components/FilterBar.tsx` (basics-first + Advanced) · `components/FloatingBuildBar.tsx` (live RAM/cores) · `components/Logo.tsx` (favicon→monogram) · `components/UseCaseGrid.tsx` (goal pills).
FreeStack specifics: `components/CompareModal.tsx` + `CompareContext.tsx` (the compare feature) · `components/GoalGrid.tsx` (goal pills) · `lib/format.ts` (facet extraction).
APIScout specifics: `app/api/proxy/route.ts` + `lib/safefetch.ts` (SSRF-hardened proxy) · `scripts/enrich.mjs` (HTTPS/GitHub verification) · `lib/popular.ts` · `lib/categories.ts` · `components/CategoryRail.tsx` · `components/FeaturedStrip.tsx` · `components/Hero.tsx` (animated).

**n8builds-web integration:** `components/sections/ToolsSection.tsx` (the homepage Free Tools grid — `tools[]` array) · `data/builds.tsx` (Build entries: `canihost`/`freestack`/`apiscout` — edit `liveSite` here to flip to subdomains) · `public/builds/<slug>/{icon.png,og-image.png}` (assets).

**Memory:** `freetool-trio.md` in the agent memory dir mirrors this state.
