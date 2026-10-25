# Owner decisions

The standing rules for n8builds.dev, decided by the owner.
This is the one place they are kept: HANDOFF, NEXT_STEPS and OWNER_TODO link here instead of repeating them.
Agents read this before changing content, design or workflow, follow it, and never re-ask a settled question.
When the owner decides something new, add it here (with the date) in the same change.

## Brand and content

- Blue/cyan accents, **no purple** (except the Twitch brand hover in the navbar).
  Indigo (between blue and violet) is allowed and stays: the Loadout "indigo" group and the "Browser tools" eyebrow.
- The site is a **build-in-public workshop, not a portfolio**.
  The hire-me lane is portfolio.n8builds.dev; client work is appturnity.com.
- **Projects and Lab are one.**
  The Lab (`#lab`) is one homepage section with two parts: Featured builds (`#featured`, the big alternating rows) and Chrome extensions (`#extensions`).
  The featured rows lead with the owner's daily drivers: Scribe, OpenPing, Solara, Portfolio Rank (2026-10-25); a build joins them with `featured: true` in `data/builds.tsx` whatever its category.
  A Tools grid (`#tools`) renders only if a non-featured tool build exists (none today); `/tools` redirects to `#featured` temporarily.
  There is no "web apps and experiments" shelf (removed 2026-10-22); web apps are featured rows.
  There are no standalone shelf pages; `/lab`, `/extensions` and `/tools` redirect to the anchors, and the retired `/resources` redirects to `#lab` (`next.config.mjs`).
  The navbar "Lab" dropdown scrolls to them.
- **"What I'm working on"** sits right under the hero (it was removed and then brought back on 2026-10-23), showing Appturnity only with a link to appturnity.com; its band fades in from the hero with no divider.
- **Hero grid:** it starts dark, warms up as cells fade in one by one over about 7 seconds, then the cells wander at random (fade out, jump to a free cell, fade in, each on its own clock) so no pattern repeats; it stays still under reduced motion.
  Keep it dim: the owner found a brighter version too dramatic.
- **Blog covers:** each post has its own topic illustration uploaded as its Sanity cover (2026-10-23); the generated "signal" cover is the fallback for posts without one.
  Hero copy (2026-10-23): heading "n8builds", subheader "Spending tokens, shipping features.", and the whoami line "Nathan Watkins, AI-first software developer in LA, building apps, Chrome extensions and tools I wish existed, with AI agents doing the heavy lifting." No pill above the heading.
  Say "in public" sparingly; the owner felt the old hero overused it.
- **Page titles use " | " as the separator** ("Speed Beats Mastery | n8builds"), and no visible copy uses the em dash (swept 2026-10-23).
- **Streaming:** the owner plans to start streaming on Twitch in the coming weeks.
  The navbar keeps Twitch; **YouTube was removed on 2026-10-23** (its `@n8watkins` handle was a 404) and goes back in the same spot, after Twitch, once the channel is live (also add it back to `sameAs` in `lib/seo.ts`).
  The live player is built (see "Live streams"); Twitch and YouTube detection switch on once their credentials are in Vercel.
- **n8builds.dev has its own build page** (`/builds/n8builds`, added 2026-10-24): the site as a case study.
  It is not a featured row (since 2026-10-25): the homepage ends with "Use this as a template" (`#template`, before the contact form), offering n8builds-web and dev-portfolio as public templates with their licenses and linking to the case study.
  Every number on it was checked against the repo or a CI run: the test counts (stated as "more than 200" unit and "more than 450" Playwright tests, so they don't go stale with every new test; recheck them if the suites shrink), the Lighthouse scores (0.98-1.00 performance, 1.00 elsewhere), the CLS story (0.29 nightly, 0.91 at 6x CPU, 0.000 after), and the contact-form limits.
  Refresh the test counts in its `solution` (and the template section's summary in `components/sections/UseAsTemplate.tsx`) when the suites grow.
  Its screenshots in `public/builds/n8builds/` are real: the live homepage hero, the CI Lighthouse report for `/` (summary only), the GitHub Actions run of PR #10, and its own generated share card; `tests/e2e/n8builds-build.spec.ts` and `tests/e2e/api/n8builds-build.spec.ts` guard them.
- **Private repos get no GitHub link:** a build links its repo only while the repo is public (the build log also links commits and releases only then). Solara went public on 2026-10-24 and has its link; its live site moved to https://solara-uv.web.app (the old uv-activity-planner.web.app redirects there).
- **Hero chips at 320px:** below 360px the idea -> repeat chain shrinks so it fits an iPhone SE (1st gen); `tests/e2e/hero.spec.ts` guards it.
  The loop-back light measures its wire at runtime (`useWireLength` in `Hero.tsx`), so chip size changes need no manual re-measuring.
- **Appturnity has no build page:** `/builds/appturnity` redirects to appturnity.com, and the site never links Appturnity's GitHub repo.
- **Hidden builds:** `hiddenBuilds` in `data/builds.tsx` keeps builds that are paused but not dead, with no page, card, sitemap entry or nav link; their old URLs redirect temporarily (307) so they can come back at the same address.
  **The Chrome Extension Launch Kit is on hold** (2026-10-23): the owner is deciding what to do with it (its repo is private, and the homepage banner's claim that the extensions are built on it wasn't accurate). Banner removed; `/builds/chrome-extension-kit` redirects to `/#extensions`.
  **VibeLog is on hiatus** (hidden 2026-10-22, also removed from the loadout, the navbar and the Welcome post on 2026-10-23).
  Keep its record (it has no images yet); the owner wants it back once it's ready, by moving its record from `hiddenBuilds` into `builds` (backlog item 4).
- **`data/builds.tsx` is the single source of truth** for every build; `data/shelves.ts` routes each one to its section by `category`.
  Never create a parallel dataset.
- **Don't list the same build twice.**
  Chrome extensions appear only in the extensions showcase; featured web apps appear only as featured rows.
- Extensions and featured projects **auto-cycle with hover-to-expand** on desktop, tap or stacked on mobile.
  Not click-only.
- If the Chrome Extension Launch Kit comes back, it is a banner under the extensions, not a main card.
- Open-source builds (Piper, TubeVault, TL;DW, Portfolio Rank, Scribe) get prominent Star-on-GitHub CTAs.
- CanIHost, FreeStack and APIScout (the "free tools trio") were dropped from the site on 2026-10-21, and Suggestion Box, Repo Steward, Sprite Arsenal and Quizmatic on 2026-10-22 (Solara took Quizmatic's featured slot).
  Their repos and Vercel projects still exist; do not re-add them unless asked.
- The **Loadout** is the identity device ("who I am without a resume"); PC hardware lives there as "The Rig".
- Blog name: **N8 Notions** (Sanity project `abgyc32w`, dataset `production`, nav label "Notions").
- Stack preference: **Firebase over Supabase** (reflected in `data/buildStacks.tsx`).
- **No Resend**: Nodemailer + Gmail SMTP (rationale in `~/docs/faq/email-and-domains.md`).
- contact@n8builds.dev is the public address (Cloudflare Email Routing forwards it to Gmail).
- Email template structure and copy are owner-approved; change only on request.
- **appturnity.com** is the canonical Appturnity URL.
- Keep the three brands on separate sites.
  Footer, navbar and redirect links to the portfolio and Appturnity are intentional bridges.
- The N8 neon icon is the brand mark and favicon for both n8builds and the portfolio.
- One GA4 property (`G-JZQGKY9Q37`) covers the whole n8builds.dev domain, subdomains included.
- The site is dark-only (`defaultTheme="dark"`, no theme toggle).
  Muted text uses `text-slate-450` / `text-slate-475`, not stock slate-500/600, which fail WCAG AA contrast on the dark backgrounds.
- react-icons are decorative by default (`aria-hidden` via `IconContext` in `app/provider.tsx`).
  An icon-only control needs its own `aria-label`.

## Publishing and releases (2026-10-25)

- **Articles are always site first.** Every article is written and published on n8builds.dev (N8 Notions, in Sanity); posting or reposting it on X is a separate, later step, never the primary copy.
- **The release train runs Mondays at 16:00 UTC** (confirmed 2026-10-25). It releases only when a `feat` or `fix` landed since the last release.
- **The owner applies release-kit to the other projects** (TL;DW, TubeVault, Piper TTS, Solara, Portfolio Rank, OpenPing and dev-portfolio) themselves, later. Agents don't, unless asked.
- **portfolio.n8builds.dev stays a separate site and a separate repo:** it is the developer-portfolio (hire-me) segment, a repo the owner can share on its own (renamed from Portfolio2.0 to `dev-portfolio` on 2026-10-25); n8builds.dev is the build-in-public workshop. Not a page of n8builds.dev.
- **The portfolio features Echo, Scout, GeminiGPT and Net-Trailer, not Scribe or Solara** (2026-10-25). It shows more builds as links to their n8builds.dev pages, and the Render demos' live status from OpenPing.
- **OpenPing and Scribe are featured rows** (2026-10-25): the owner uses both daily.
- **A direct route to the portfolio:** "Hiring? See my developer portfolio" under the hero, and `n8builds.dev/portfolio` redirects to portfolio.n8builds.dev (2026-10-25).

## Operations

- **Upstash plan:** confirmed Free (500,000 commands/month, no payment method).
- **Daily cap:** stays at the default 50 verified submissions/day (100 emails, well under Gmail's ~500/day). Change with `CONTACT_DAILY_LIMIT` in Vercel if ever needed.
- **HSTS preload:** not adding it. Vercel already sends `max-age=63072000`; preload would force HTTPS on every subdomain and is slow to undo.
- **Branch protection:** reversed (with #20): `main` now requires CI through pull requests (see HANDOFF, "Branch protection on `main`"). Docs-only changes skip the browser suite.
- **Indigo accents:** kept. Tailwind 4 kept the original (approved) hue; it is only slightly more saturated.
