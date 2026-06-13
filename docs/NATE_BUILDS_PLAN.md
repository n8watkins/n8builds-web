# Nate Builds — The Big Plan

> Status: IN PROGRESS — Loadout + shelves + homepage sections SHIPPED (local, unpushed). Remaining: `/builds` Log index, live layer.
> Last updated: 2026-06-12
> Site: n8builds.dev — the public workshop

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

**MUST-HAVE**
1. **Home / The Bench** — bento dashboard that IS the pitch: who I am + live signal + doors to everything.
2. **Projects** (`/projects`) — filterable grid of the ~10 shipped apps. Proof-of-work spine.
3. **Log** (`/builds` → relabel "Log") — the build-in-public journal, newest-first. The heartbeat. *(route already wired at /builds/[slug])*
4. **Extensions** (`/extensions`) — the 5 Chrome extensions; own shelf, "Install" action.
5. **Loadout** (`/loadout`) — Tech Loadout + The Rig + Desk. (replaces the dry "/uses" idea)

**SHOULD-HAVE**
6. **Tools & Signal** (`/tools`) — dev tools I made (Scribe) + curated resources worth passing on.
7. **Lab** (`/lab`) — meme/throwaway experiments (Terminal Invaders, FitFlow 7), quarantined.

**NICE-TO-LATER**
8. Unified reverse-chron feed across all lanes once volume justifies it.

### Top nav
`Projects · Log · Extensions · Loadout · Lab`
- Logo → Home. Right side: GitHub icon + small Portfolio/Appturnity cross-link.
- Keep to ~5-6 items, single row, no dropdowns.
- **Rename current nav** (`Builds / Stack / Contact`) → the above. "Stack" becomes part of Loadout.

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

## 5. Homepage Section Order (concrete)

Current: `Hero → FeaturedProjects → ProjectsMarquee → Contact`. Reorder to:

1. **Hero** — identity + live pill (keep). Add the offline status line that name-drops last activity.
2. **NOW / Currently Building** *(NEW — highest-leverage add)* — "what I'm building right now"
   block right under the hero. This is the in-public hook. Pulls the newest `log` entry +
   current project. Make the site feel alive.
3. **Featured Builds** — 3-4 hand-picked shipped projects (VibeLog, cutelyask.me, Portfolio Rank, FitFlow 7 / Piper TTS), premium cards.
4. **Latest from the Log** — 2-3 newest journal posts.
5. **Extensions + Tools strip** — compact dual-shelf teaser → links to full pages.
6. **Tech Loadout teaser** — a few loadout items with "what I use it for," → /loadout.
7. **Projects marquee** — DEMOTED to here as a "and 15 more" breadth-flex.
8. **Contact / Footer** — keep, with Appturnity cross-link (not a hire-me CTA).

Key moves: promote *latest activity* up; demote the marquee down.

---

## 6. Cleanup / Remove

- **Delete testimonials** (`data/testimonials.tsx` + section) — read fake here; that's Portfolio/Appturnity's job.
- No "Hire Me" CTA, rate cards, skills bars, "X yrs experience," generic SaaS gradient hero.
- No purple — blue/cyan HUD only (purple is the agency lane).
- Remove leftover `app/api/sentry-example-api` if still present.

---

## 7. Implementation Roadmap (phased)

**Phase 1 — Foundation** ✅ DONE
- [x] Single source of truth: `data/builds.tsx` (12 builds) + `data/shelves.ts` classifier (chose to derive from the existing rich builds.tsx rather than refactor to a new `Item` schema — same outcome, less churn).
- [x] Real data populated (the 12 builds; loadout/now content is representative pending Nate's real values).
- [x] Nav updated (`components/layout/Navbar.tsx`): Projects · Extensions · Tools · Loadout · Lab.

**Phase 2 — Homepage reorder** ✅ DONE
- [x] Added **NowBuilding** ("Currently Building") section (`data/now.tsx`).
- [x] Reordered; marquee REMOVED entirely (replaced by inline shelf sections).
- [x] `whoami` block — shipped on the /loadout page (not the hero). Hero offline-status line still TODO.
- [x] Removed testimonials.

**Phase 3 — The shelves** ✅ DONE
- [x] `/projects` filterable grid (tag filter).
- [x] `/extensions` shelf. (Install actions = the github/live links; dedicated Web Store buttons still optional.)
- [x] `/loadout` — Tech Loadout + The Rig + Desk.
- [x] `/tools` + `/lab`.
- [x] BONUS: shelf content also surfaced inline on the homepage via `ShelfSection`.

**Phase 4 — Live layer** ⬜ NOT STARTED (next session)
- [ ] Wire real live/offline status (manual flag first, stream API later).
- [ ] Stream/VOD embed (assumed Twitch — Nate to confirm).
- [ ] **`/builds` Log index page** + journal authoring flow (top remaining must-have).

---

## 8. Content Inventory (raw material, all real)

**Shipped & live (homepage-eligible):** VibeLog, Solara, cutelyask.me, Portfolio Rank,
FitFlow 7, Piper TTS, TL;DW, TL;DR Comments, TubeVault, Scribe (LocalDictate),
Terminal Invaders, Sprite Arsenal.
**Active dev:** Asset Arsenal, Local Ops, BF6 Field Intel.
**Extensions (own shelf):** TL;DW, TL;DR Comments, TubeVault, Piper TTS, Chrome Extension Launch Kit.
**Tools:** Scribe (LocalDictate).
**Lab/experiments:** Terminal Invaders, FitFlow 7.

---

## 9. Open Questions (need Nate)

- **Stream platform** — assumed **Twitch** for now (already linked in Hero); confirm or add YouTube.
- **Live status source** — currently a manual pill; auto-from-stream-API is a Phase 4 option.
- **Loadout content** — `data/loadout.tsx` has representative content; replace The Rig specs + Desk gear with real values.
- **"Log" definition** — is `/builds` a journal of written posts (~weekly) or just an index of all builds? Decides Phase 4 build.
- **GA4 + reCAPTCHA** — still blank in `.env.local` (TODO from launch); wire when ready.
- **Log cadence** — how often will journal entries get written? Affects how prominent the Log is.
