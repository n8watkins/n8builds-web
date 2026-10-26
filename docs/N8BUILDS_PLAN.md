# n8builds - The Big Plan

> Status: shipped and live at n8builds.dev (Next.js 16 + React 19 on Vercel, Cloudflare DNS).
> Sections 0-2 are the vision; sections 3 and 5-9 describe the site as it is now.
> Last updated: 2026-10-23.
> Current state and decisions in detail: `docs/HANDOFF.md`.

---

## 0. North Star

**n8builds is the public workshop.** You watch the *during* - the build happening
live and unfinished, on purpose - not the polished after.

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
| **BUILD**  | The artifacts - projects, extensions, tools, the rig, experiments    |
| **STREAM** | The act - building live on camera, the process                       |
| **SIGNAL** | The takeaways - tools I use + what for, resources, things learned    |

---

## 2. The Loadout (the big idea)

The personal/identity layer is a **Loadout** - gaming-native, full of personality, and
the literal answer to "who I am without a resume." You ARE your loadout.

A loadout entry is never just a logo wall. Each item says **what it is + what I use it
for + my one-line take.** ("I want to say what the tools are AND what I'm using them for.")

Three sub-loadouts:

1. **Tech Loadout** - the software/tools I run.
   - e.g. *Claude Code - my pair-programmer; I build basically everything here now.*
   - e.g. *Next.js - every web app. App Router by default.*
   - e.g. *Tauri - when it needs to be a real desktop app (see Scribe).*
   - e.g. *Cursor / VS Code, Vercel, Supabase/Turso, Firebase, OpenAI/Gemini, OBS…*
2. **The Rig** (battlestation) - the PC hardware build. This is where "my computer build"
   lives - a build is literally a loadout. Specs + why each part.
3. **Desk / Peripherals** - keyboard, mic, cam, monitors. Optional, adds texture.

The Loadout is how "who I am" shows up without a bio paragraph - personality is the
seasoning on every module, never a standalone "About me" dish. Pair it with a terminal
`whoami` blurb (3 funny first-person lines) and an offline status line that name-drops
what I was last doing.

---

## 3. Information Architecture

### Pages (as shipped)

1. **Home** (`/`): hero, "What I'm working on", the Lab, Nate's Notions strip, stack, work-with-me, contact.
2. **The Lab** (`/#lab`): one homepage section with Featured web apps (`#featured`), Chrome extensions (`#extensions`) and Tools (`#tools`).
   There are no standalone shelf pages: `/lab`, `/extensions` and `/tools` redirect to the anchors.
3. **Build pages** (`/builds/[slug]`): one per build in `data/builds.tsx`.
4. **Loadout** (`/loadout`): Tech Loadout, The Rig and Desk.
5. **Nate's Notions** (`/blog`, `/blog/[slug]`): the Sanity-backed blog (nav label "Notions").

**Not yet built:** the `/builds` Log index (a newest-first journal of all builds); only the detail pages exist.

### Top nav (`components/layout/Navbar.tsx`)

- Logo to home; a "Lab" dropdown (Featured, Chrome Extensions, Tools); Notions; Loadout; Twitch and YouTube.
- Right side: a **Portfolio** cross-link and an **Appturnity** button (the two bridge destinations).
- Desktop links from `lg` (1024px) up; below that, a menu button opens a modal overlay menu.

---

## 4. The Unified Content Schema (the engine)

The one move that lets me "share everything" forever without ever redesigning.
**One schema powers every grid.** Adding new work = add a record + a tag. NEVER a new page.

Two axes, applied relentlessly:
- **tier** - `shipped` vs `experiment`. Only `shipped` surfaces on the homepage. *(credibility firewall)*
- **date** - within every lane, newest-first. Momentum comes from time, not category sprawl.

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
`status?: 'shipped' | 'in the lab'` - formalize that into this single shared shape and
have projects/extensions/tools/experiments all derive from it.

---

## 5. Homepage Section Order (as shipped)

`components/HomePage.tsx`, each section in a full-width band and a `SectionErrorBoundary`, most lazy-loaded via `next/dynamic`:

1. **Hero** (`Hero.tsx`): "n8builds", "Spending tokens, shipping features.", the `whoami` terminal, the idea -> prompt -> build -> ship -> repeat circuit, a "See what I'm building" button, socials, and a background grid that warms up and wanders.
2. **What I'm working on** (`NowBuilding.tsx`, data in `data/now.tsx`): Appturnity only, linking appturnity.com.
3. **The Lab**: Featured web apps (`FeaturedProjects.tsx`: Portfolio Rank, Solara), Chrome extensions (`ExtensionsShowcase.tsx`) and Tools (`ShelfSection shelf="tool"`).
4. **Nate's Notions strip** (`NotionsStrip.tsx`).
5. **Stack** (`HomeStack.tsx`), linking to /loadout.
6. **Work with me** (`WorkWithMe.tsx`): bridges to the portfolio and Appturnity.
7. **Contact** (`Footer.tsx`, `#contact`).

---

## 6. Cleanup / Remove

- Testimonials: deleted.
- No "Hire Me" CTA, rate cards, skills bars, "X yrs experience", or generic SaaS gradient hero.
- No purple: blue/cyan HUD only (purple is the agency lane).

---

## 7. Implementation Roadmap

**Done:** single source of truth (`data/builds.tsx` + `data/shelves.ts`), homepage reorder, the Lab, the Loadout, Nate's Notions, contact form hardening, SEO and share cards.

**Next** (the backlog in `docs/HANDOFF.md` is authoritative):

- [ ] `/builds` Log index page and a "Log" nav item.
- [ ] Real screenshots for TL;DW and Scribe; a real mark for Portfolio Rank.
- [ ] Bring VibeLog back from `hiddenBuilds` when it comes off hiatus.
- [ ] A live/offline status layer (manual flag first, stream API later).

---

## 8. Content Inventory (`data/builds.tsx`)

**Featured web apps:** Portfolio Rank, Solara, and n8builds.dev itself (`/builds/n8builds`, the site as a case study: CI, Lighthouse, security headers, the contact-form defenses, the CLS fix).
**Chrome extensions:** Piper TTS, TL;DW, TubeVault.
**Tools:** Scribe, a local Windows dictation app (Tauri + whisper.cpp).
**Hidden (on hold, records kept):** VibeLog, the OBS/telemetry streaming tool, and the Chrome Extension Launch Kit, in `hiddenBuilds`.
**Not a build page:** Appturnity is the "What I'm working on" card; `/builds/appturnity` redirects to appturnity.com.

Dropped from the site (repos still exist, do not re-add unless asked): CanIHost, FreeStack, APIScout (2026-10-21); Suggestion Box, Repo Steward, Sprite Arsenal, Quizmatic, Asset Arsenal, JobSignal (2026-10-22).
Their old `/builds/<slug>` URLs redirect to `/#lab`.

---

## 9. Open Questions (need Nate)

- **Stream platform:** Twitch and YouTube are both in the navbar; which is the primary stream home?
- **Live status source:** manual flag or a stream API, once the live layer is built.
- **Loadout content:** keep `data/loadout.tsx` current.
- **"Log" definition:** is the `/builds` Log a journal of written entries, or an index of all builds? Decides how it gets built, and how often it needs updating.
