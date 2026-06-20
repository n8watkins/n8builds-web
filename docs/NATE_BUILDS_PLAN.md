# Nate Builds — The Big Plan

> Status: SHIPPED to prod (n8builds.dev) — Loadout, shelves, homepage redesign (extensions showcase, Projects+Lab merge, free-tools trio, Currently-Building section, galleries, tech-stack bento). Remaining: `/builds` Log index page, live-status layer, real screenshots for TL;DW/LocalDictate.
> Last updated: 2026-06-19
> Site: n8builds.dev — the public workshop (Next.js 16 + React 19, on Vercel, Cloudflare DNS)

---

## 0. North Star

**Nate Builds is the public workshop.** You watch the *during* — the build happening
live and unfinished, on purpose — not the polished after.

It is NOT a resume, NOT a hire-me page, NOT a linktree. It's a place to share myself
and my work. It isn't about finding work… but it helps, indirectly, because people see
the proof in motion.

Tagline: **"Building software in public. Occasionally on purpose."**

The killer differentiator: **live and unfinished by design.** No template can fake the
"you're watching it happen right now" energy.

---

## 1. The 3 Pillars

Every piece of content answers to exactly one pillar. This is the spine.

| Pillar     | What it covers                                                        |
| ---------- | -------------------------------------------------------------------- |
| **BUILD**  | The artifacts — projects, extensions, tools, the rig, experiments    |
| **STREAM** | The act — building live on camera, the process                       |
| **SIGNAL** | The takeaways — tools I use + what for, resources, things learned    |

---

## 2. The Loadout (the big idea)

The personal/identity layer is a **Loadout** — gaming-native, full of personality, and
the literal answer to "who I am without a resume." You ARE your loadout.

A loadout entry is never just a logo wall. Each item says **what it is + what I use it
for + my one-line take.** ("I want to say what the tools are AND what I'm using them for.")

Three sub-loadouts:

1. **Tech Loadout** — the software/tools I run.
   - e.g. *Claude Code — my pair-programmer; I build basically everything here now.*
   - e.g. *Next.js — every web app. App Router by default.*
   - e.g. *Tauri — when it needs to be a real desktop app (see Scribe).*
   - e.g. *Cursor / VS Code, Vercel, Supabase/Turso, Firebase, OpenAI/Gemini, OBS…*
2. **The Rig** (battlestation) — the PC hardware build. This is where "my computer build"
   lives — a build is literally a loadout. Specs + why each part.
3. **Desk / Peripherals** — keyboard, mic, cam, monitors. Optional, adds texture.

The Loadout is how "who I am" shows up without a bio paragraph — personality is the
seasoning on every module, never a standalone "About me" dish. Pair it with a terminal
`whoami` blurb (3 funny first-person lines) and an offline status line that name-drops
what I was last doing.

---

## 3. Information Architecture

### Pages (priority order)

**MUST-HAVE — all SHIPPED**
1. **Home / The Bench** — bento dashboard that IS the pitch: who I am + live signal + doors to everything.
2. **Lab** (`/lab`) — the filterable grid of everything I'm building. Projects + experiments were MERGED into one Lab shelf; there is no separate `/projects` route. Proof-of-work spine.
3. **Extensions** (`/extensions`) — the Chrome extensions; own shelf, github/live "Install" links.
4. **Loadout** (`/loadout`) — Tech Loadout + The Rig + Desk. (replaces the dry "/uses" idea)
5. **Tools** (`/tools`) — dev tools and free utilities I made (Scribe/LocalDictate, the free-tools trio).

**NOT YET BUILT**
- **Log** ("/builds" Log index) — the build-in-public journal, newest-first. The heartbeat. Only the *detail* route is wired (`app/builds/[slug]`); the **index page is still unbuilt** (Phase 4). There is no `/blog` route.

**NICE-TO-LATER**
- Unified reverse-chron feed across all lanes once volume justifies it.

### Top nav (as shipped — `components/layout/Navbar.tsx`)
`Lab · Extensions · Tools · Loadout`
- Logo → Home. After the nav links: Twitch + YouTube + a ViBlog `#contact` link.
- Right side: a **Portfolio** cross-link and an **Appturnity** button (the two bridge destinations) — not a GitHub icon.
- Single row, no dropdowns. "Projects" was folded into Lab; "Stack" lives inside Loadout / the homepage tech-stack bento.

---

## 4. The Unified Content Schema (the engine)

The one move that lets me "share everything" forever without ever redesigning.
**One schema powers every grid.** Adding new work = add a record + a tag. NEVER a new page.

Two axes, applied relentlessly:
- **tier** — `shipped` vs `experiment`. Only `shipped` surfaces on the homepage. *(credibility firewall)*
- **date** — within every lane, newest-first. Momentum comes from time, not category sprawl.

```ts
type Item = {
  slug: string
  type: 'project' | 'extension' | 'tool' | 'experiment' | 'log'
  tier: 'shipped' | 'experiment'
  pillar: 'build' | 'stream' | 'signal'
  title: string
  tagline: string
  status?: 'shipped' | 'active' | 'in the lab' | 'archived'
  date: string            // ISO; drives recency sort
  tags: string[]
  stack: { name: string; detail: string }[]
  links?: { github?: string; live?: string; store?: string }
  images?: { src: string; alt: string }[]
}
```

Note: `data/builds.tsx` already has a `Build` interface with
`status?: 'shipped' | 'in the lab'` — formalize that into this single shared shape and
have projects/extensions/tools/experiments all derive from it.

---

## 5. Homepage Section Order (as shipped)

The shipped sequence in `app/page.tsx` (each section wrapped in a `SectionErrorBoundary`,
most lazy-loaded via `next/dynamic`):

1. **Hero** (`components/sections/Hero.tsx`) — identity + a "Live on GitHub" pill that links
   github.com/n8watkins and name-drops "Currently Building: Asset Arsenal." A "Watch Live"
   CTA links Twitch. *(The hero offline status line is still TODO.)*
2. **NowBuilding / Currently Building** (`components/sections/NowBuilding.tsx`, data in
   `data/now.tsx`) — the in-public hook right under the hero.
3. **FeaturedProjects** (`components/sections/FeaturedProjects.tsx`) — hand-picked builds in
   alternating image rows.
4. **The Lab** — `ShelfSection shelf="lab"`: everything I'm building (the merged projects + lab grid).
5. **ExtensionsShowcase** (`components/sections/ExtensionsShowcase.tsx`).
6. **ToolsSection** (`components/sections/ToolsSection.tsx`).
7. **TechStackBento** (`components/sections/TechStackBento.tsx`) — tech-stack bento marquee → /loadout.
8. **Footer / Contact** (`components/layout/Footer.tsx`, in a `#contact` section) — with the
   Appturnity cross-link, not a hire-me CTA.

Note: the old standalone "Projects marquee" was removed entirely; shelf content is surfaced
inline via `ShelfSection` instead. The "Latest from the Log" strip is not on the homepage yet
(the Log index doesn't exist).

---

## 6. Cleanup / Remove

- **Delete testimonials** (`data/testimonials.tsx` + section) — read fake here; that's Portfolio/Appturnity's job. ✅ done.
- No "Hire Me" CTA, rate cards, skills bars, "X yrs experience," generic SaaS gradient hero.
- No purple — blue/cyan HUD only (purple is the agency lane).
- ⬜ **STILL OPEN:** `app/api/sentry-example-api/route.ts` is still present — Sentry was never integrated (no `@sentry` runtime dep, only stub/scaffolding), so this example route should be deleted.

---

## 7. Implementation Roadmap (phased)

**Phase 1 — Foundation** ✅ DONE
- [x] Single source of truth: `data/builds.tsx` (17 build records) + `data/shelves.ts` classifier (chose to derive from the existing rich builds.tsx rather than refactor to a new `Item` schema — same outcome, less churn).
- [x] Real data populated (the 17 builds; loadout/now content is representative pending Nate's real values).
- [x] Nav updated (`components/layout/Navbar.tsx`): Lab · Extensions · Tools · Loadout (Projects merged into Lab; Twitch/YouTube + Portfolio/Appturnity cross-links alongside).

**Phase 2 — Homepage reorder** ✅ DONE
- [x] Added **NowBuilding** ("Currently Building") section (`data/now.tsx`).
- [x] Reordered; marquee REMOVED entirely (replaced by inline shelf sections).
- [x] `whoami` block — shipped on the /loadout page (not the hero). Hero offline-status line still TODO.
- [x] Removed testimonials.

**Phase 3 — The shelves** ✅ DONE
- [x] `/lab` filterable grid (tag filter) — this absorbed the planned `/projects` page; there is no separate `/projects` route.
- [x] `/extensions` shelf. (Install actions = the github/live links; dedicated Web Store buttons still optional.)
- [x] `/loadout` — Tech Loadout + The Rig + Desk.
- [x] `/tools` + `/lab`.
- [x] BONUS: shelf content also surfaced inline on the homepage via `ShelfSection`.

**Phase 4 — Live layer** ⬜ NOT STARTED (next session)
- [ ] Wire real live/offline status (manual flag first, stream API later).
- [ ] Stream/VOD embed (assumed Twitch — Nate to confirm).
- [ ] **`/builds` Log index page** + journal authoring flow (top remaining must-have).

---

## 8. Content Inventory (from `data/builds.tsx` — 17 records)

All 17 builds, by their `category` in the data file. Only **Suggestion Box** carries
`status: 'in the lab'`; the rest have no status flag (treated as shipped/active).

**Web apps:** Asset Arsenal, Appturnity, JobSignal (web app + extension), Solara,
Suggestion Box *(in the lab)*, Portfolio Rank.
**Web tools:** Sprite Arsenal, CanIHost, FreeStack, APIScout — the free-tools utilities.
**Chrome extensions (own shelf):** Piper TTS, TL;DW, TubeVault. Plus the Chrome Extension
Launch Kit (a starter template) and JobSignal's Mark-Applied extension.
**Streaming tool:** VibeLog (the OBS/telemetry tool behind the planned "LIVE on VibeLog" badge).
**Desktop app / Tools:** LocalDictate (a.k.a. Scribe) — local speech-to-text (Tauri + whisper.cpp).
**GitHub Actions bot:** Repo Steward.

(Removed from this list: items that were never in the data — cutelyask.me, FitFlow 7,
TL;DR Comments, Terminal Invaders, Local Ops, BF6 Field Intel. If any of those ship later,
they get added to `data/builds.tsx`, not pages.)

---

## 9. Open Questions (need Nate)

- **Stream platform** — both **Twitch** and **YouTube** are already linked in the Navbar, and the Hero "Watch Live" CTA points at Twitch. Confirm which is the primary stream home.
- **Live status source** — currently a static "Live on GitHub" pill in the Hero (links github.com/n8watkins); auto-from-stream-API is a Phase 4 option.
- **Loadout content** — `data/loadout.tsx` has representative content; replace The Rig specs + Desk gear with real values.
- **"Log" definition** — is the `/builds` Log index a journal of written posts (~weekly) or just an index of all builds? Decides the Phase 4 build (the index page doesn't exist yet — only `app/builds/[slug]`).
- **reCAPTCHA is intentionally OFF in production** — not a "wire it later" TODO. `lib/security/recaptcha.ts` skips verification (returns true) when `RECAPTCHA_SECRET_KEY` is unset, and it is not set on Vercel. The active bot defenses are the honeypot + an in-memory (per-serverless-instance) rate limiter. GA4 wiring is the only env item still genuinely pending.
- **Log cadence** — how often will journal entries get written? Affects how prominent the Log is.
