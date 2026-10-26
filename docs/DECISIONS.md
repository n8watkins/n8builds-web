# Owner decisions

The standing rules for n8builds.dev, decided by the owner.
This is the one place they are kept: HANDOFF, NEXT_STEPS and OWNER_TODO link here instead of repeating them.
Agents read this before changing content, design or workflow, follow it, and never re-ask a settled question.
When the owner decides something new, add it here (with the date) in the same change.

## Brand and content

- Blue/cyan accents, **no purple** (except the Twitch brand hover in the navbar).
  Indigo (between blue and violet) is allowed and stays: the Loadout "indigo" group and the Chrome extensions part's wash and bar.
- The site is a **build-in-public workshop, not a portfolio**.
  The hire-me lane is portfolio.n8builds.dev; client work is appturnity.com.
- **Projects and Lab are one.**
  The Lab (`#lab`) is one homepage section in three parts (2026-10-25): "My daily drivers" (`#my-tools`: Scribe and OpenPing, the owner's daily tools, marked `mine: true` in `data/builds.tsx`), "Featured builds" (`#featured`: Solara, Portfolio Rank) and Chrome Extensions (`#extensions`). No "The bench" eyebrow; no "Featured" eyebrow over "Featured builds".
  The three part headings are titles only (2026-10-26): no eyebrow (the "Browser tools" label is gone) and no subtext, each with its part's colour bar. The intro says everything is public and mostly MIT open source.
  Each row: the app's icon left of its name, the subtitle under the name (never above), description, its tech as small pills, ad, then one row of buttons: Live Site, the joined Star | GitHub split button (`components/ui/RepoButtons.tsx`) and Details (2026-10-26; on phones the split button takes its own line). The full tech stack and the build-log link live in the Details dialog, so rows stay short.
  Descriptions are about features, short and not salesy (2026-10-26); the tech (whisper.cpp, Tauri, Workers, D1, Next.js...) goes in the pills, never the prose.
  The Details dialog (2026-10-26) shows the project's screenshots on its left from md up (hidden on phones), with larger type, tabs and tech icons, each icon centred over its name.
  Portfolio Rank's title writes "Rank" in its own gold (#fbbf24, as its wordmark does). Scribe's icon is its real app icon (the microphone, from the Scribe repo).
  Rows are compact (2026-10-26): a row's screenshots are one image you step through by clicking or tapping its left or right half (arrows show on hover and focus, the arrow keys and a swipe work too, small dots just under the image show the position, never over the screenshot); there are no thumbnails under it.
  No two buttons in a row go to the same place (2026-10-26): an ad link never repeats the row's Live Site or GitHub link (Scribe's "How it works" was dropped; OpenPing's "Deploy your own" goes to its install guide; Solara's ad opens the planner at /app/; Portfolio Rank's "Add your portfolio" goes to the leaderboard's Browse section, where its submit button is). Star and GitHub both open the repo on purpose: starring happens there.
  Each row's ad puts its button on the left and a few short checked points beside it (2026-10-26; under it on phones), in its product's colour (Scribe sky, OpenPing green, Solara orange, Portfolio Rank gold #fbbf24), with no icon chip. Scribe's four points are two by two; its download button holds still on hover, carries the Windows logo by "Windows", and its caption names Windows 10 and 11, 64-bit (the only platforms Scribe supports).
  Rows alternate sides starting with Scribe's screenshot on the right, and each row's colour glows in from the page edge on its screenshot's side.
  **The Lab heading has a flask mark** (picked by the owner, 2026-10-26): Lucide's flask-conical in a cyan chip beside "The Lab", sized like the rows' app icons.
  **The Lab has a floating side nav** (owner's request, 2026-10-26): on desktop (from 1280px) a sticky rail in the left gutter lists My tools, Featured and Chrome extensions, marks the part on screen and jumps to it; it shows only while the Lab is on screen, never overlaps the content and never wraps a label (vertical labels from 1280px, side by side from 1440px, "Extensions" on screen at 1440-1535px). Hidden on phones and tablets, where the pill links under the heading do the job (`components/sections/LabSectionNav.tsx`, `tests/e2e/lab-section-nav.spec.ts`).
  **One repo control sitewide** (2026-10-26): `components/ui/RepoButtons.tsx`, "Star" (amber-tinted, like `components/ui/StarButton.tsx`) and "GitHub" joined as one split button, both opening the repo, with the repo's live star count (cached hourly on the server, omitted when GitHub can't say); used by the Lab rows and the Chrome extensions.
  A Tools grid (`#tools`) renders only if a non-mine tool build exists (none today); `/tools` redirects to `#my-tools` temporarily.
  There is no "web apps and experiments" shelf (removed 2026-10-22); web apps are featured rows.
  There are no standalone shelf pages; `/lab`, `/extensions` and `/tools` redirect to the anchors, and the retired `/resources` redirects to `#lab` (`next.config.mjs`).
  The navbar "Lab" dropdown scrolls to them.
- **"What I'm working on" is the Appturnity ad** (2026-10-25), right under the hero: Appturnity is a platform for local service businesses (pool, HVAC, landscaping): a free, done-for-you website (the way in), then paid plans (Care, Pro) with systems like Google review requests, and booking coming. Not generic consulting. Copy comes from Appturnity's own repo (`~/appturnity/monorepo-app`, docs/COMPANY_STRATEGY.md) and its recent commits; buttons go to appturnity.com/#free-website and /examples. Its mark is the real one (`public/brands/appturnity.png`), never an invented logo. The "Check out the lab" button is gone.
  It reads like a real ad (2026-10-26): headline, pitch, selling points and the two buttons, with Appturnity's own template screenshots (copied from its `apps/hub/public/example-shots` into `public/now/`) in a browser and phone frame. Recent activity, the goal and the stack are not on the card face; they live in the "What's new" dialog.
- **"Two ways to put me to work":** the project card is Appturnity by name and mark, offering the free website.
- **Hero grid:** it starts dark, warms up as cells fade in one by one over about 7 seconds, then the cells wander at random (fade out, jump to a free cell, fade in, each on its own clock) so no pattern repeats; it stays still under reduced motion.
  Keep it dim: the owner found a brighter version too dramatic.
  Since 2026-10-26: lit cells never touch (no shared edge or corner, even mid-fade), never sit behind the portrait, and fill the part of the grid on screen (up to 48 at once); a steady number is lit at every moment (at most a quarter dark or fading at once); they cycle at a pace between the original and a livelier one, fade on a soft ease in and out with no pop, and hold still while the hero is off screen. A dark wash over the grid keeps the hero text pronounced.
- **Blog covers:** each post has its own topic illustration uploaded as its Sanity cover (2026-10-23); the generated "signal" cover is the fallback for posts without one.
  Hero copy (2026-10-23, whoami reworked 2026-10-26): heading "n8builds", subheader "Spending tokens, shipping features." (one line on every phone, down to 320px), and the whoami terminal titled "~/whoami :: Nathan 'N8' Watkins" with the body "AI-first software developer." then "I build apps and tools I wish existed." (no "in LA", no "AI agents doing the heavy lifting"; shared with /loadout). No pill above the heading.
  Say "in public" sparingly; the owner felt the old hero overused it.
- **Page titles use " | " as the separator** ("Speed Beats Mastery | n8builds"), and no visible copy uses the em dash (swept 2026-10-23).
- **Streaming:** the owner plans to start streaming on Twitch in the coming weeks.
  The navbar keeps Twitch; **YouTube was removed on 2026-10-23** (its `@n8watkins` handle was a 404) and goes back in the same spot, after Twitch, once the channel is live (also add it back to `sameAs` in `lib/seo.ts`).
  The live player is built (see "Live streams"); Twitch and YouTube detection switch on once their credentials are in Vercel.
- **n8builds.dev has its own build page** (`/builds/n8builds`, added 2026-10-24): the site as a case study.
  It is not a featured row (since 2026-10-25): the "Building your own site?" part of the Lab (`#template`, right after the featured builds since 2026-10-26) offers n8builds-web and dev-portfolio as public templates with their licenses and linking to the case study.
  Every number on it was checked against the repo or a CI run: the test counts (stated as "more than 200" unit and "more than 450" Playwright tests, so they don't go stale with every new test; recheck them if the suites shrink), the desktop Lighthouse scores (0.98-1.00 performance, 1.00 elsewhere; the mobile pass is named without a score), the CLS story (0.29 nightly, 0.91 at 6x CPU, 0.000 after), and the contact-form limits.
  Refresh the test counts in its `solution` (and the template section's summary in `components/sections/UseAsTemplate.tsx`) when the suites grow.
  Its screenshots in `public/builds/n8builds/` are real: the live homepage hero, the CI Lighthouse report for `/` (summary only), the GitHub Actions run of PR #10, and its own generated share card; `tests/e2e/n8builds-build.spec.ts` and `tests/e2e/api/n8builds-build.spec.ts` guard them.
- **Private repos get no GitHub link:** a build links its repo only while the repo is public (the build log also links commits and releases only then). Solara went public on 2026-10-24 and has its link; its live site moved to https://solara-uv.web.app (the old uv-activity-planner.web.app redirects there).
- **The hero chain is prompt -> build -> ship -> repeat** (2026-10-26): "idea" was dropped. The first chip keeps idea's old box, single comet and wire landing; only its label changed.
- **Hero chips at 320px:** below 360px the prompt -> repeat chain shrinks so it fits an iPhone SE (1st gen); `tests/e2e/hero.spec.ts` guards it.
  The loop-back light measures its wire at runtime (`components/sections/HeroChainMeter.tsx`), so chip size changes need no manual re-measuring.
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
  /loadout has no whoami terminal (2026-10-26); the whoami lives in the homepage hero only.
- **The AI kit lists only tools in real use** (2026-10-26): LangChain and Ollama were removed (not really used); Perplexity stays. whisper.cpp powers Scribe and Piper powers the Piper TTS extension.
- **The homepage AI kit has a dino easter egg** (2026-10-26): a pixel dino (our own art, not Google's sprite) hops the gaps along the marquee rows; pausing the marquee makes it miss and fall to the next row, walking the other way, and off the last row it drops back in at the top left. Homepage only, never on /loadout; hidden under reduced motion.
- Blog name: **N8's Notions** (renamed from "N8 Notions" on 2026-10-25; Sanity project `abgyc32w`, dataset `production`, nav label "Notions").
  Every full mention says "N8's Notions" (capital N, the digit 8, apostrophe s; not "Nate's Notions"); short nav and footer labels stay "Notions".
  URLs and slugs keep their old names (`/blog/welcome-to-n8-notions` stays).
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

- **Articles are always site first.** Every article is written and published on n8builds.dev (N8's Notions, in Sanity); posting or reposting it on X is a separate, later step, never the primary copy.
- **The release train runs Mondays at 16:00 UTC** (confirmed 2026-10-25). It releases only when a `feat` or `fix` landed since the last release.
- **The owner applies release-kit to the other projects** (TL;DW, TubeVault, Piper TTS, Solara, Portfolio Rank, OpenPing and dev-portfolio) themselves, later. Agents don't, unless asked.
- **portfolio.n8builds.dev stays a separate site and a separate repo:** it is the developer-portfolio (hire-me) segment, a repo the owner can share on its own (renamed from Portfolio2.0 to `dev-portfolio` on 2026-10-25); n8builds.dev is the build-in-public workshop. Not a page of n8builds.dev.
- **The portfolio features Echo, Scout, GeminiGPT and Net-Trailer, not Scribe or Solara** (2026-10-25). It shows more builds as links to their n8builds.dev pages, and the Render demos' live status from OpenPing.
- **OpenPing and Scribe are featured rows** (2026-10-25): the owner uses both daily.
- **Featured rows sell as well as show** (2026-10-25): each keeps its technical substance and adds a reason to try it, with links out (`ctas` in `components/sections/FeaturedProjects.tsx`, `cta` on the build page). Scribe and OpenPing say the owner uses them every day; Solara is "free, no sign-up"; Portfolio Rank invites a five-second vote and a submission.
- **Each featured row carries an ad** (2026-10-25): a hook and buttons (`ad` in `components/sections/FeaturedProjects.tsx`). Scribe's primary button downloads the installer through `n8builds.dev/download/scribe`, a stable link that always resolves to the newest release (`lib/downloads.ts`). It shows a download mark and the Windows logo, says under the button what it downloads ("Windows installer (.exe) · v0.8.0 · 12 MB"), read from the newest GitHub release; when GitHub can't say, only "Windows installer (.exe)".
- **The homepage advertises the developer portfolio** right after the Lab (`components/sections/PortfolioAd.tsx`, image `public/ads/dev-portfolio.webp`; recapture it when the portfolio's hero changes). The portfolio mirrors it with a card selling how n8builds is built.
- **Portfolio Rank credits its origins and invites submissions** (2026-10-25): its featured row and build page link Emma Bostian's developer-portfolios list (and, on the page, Ali Spittel's tweet that started it), and invite visitors to add their portfolio by sending them to the Portfolio Rank site. n8builds only links there; submissions are Portfolio Rank's business, not this site's. Builds can carry `credits` and a `cta` in `data/builds.tsx`.
- **The build log has no top-level navbar link** (2026-10-25): it lives in the Lab menu ("Build log") and in the site-wide footer sitemap (`components/layout/SiteFooter.tsx`, on every page). The homepage's contact card sits above that footer.
- **Visitor-facing email is contact@n8builds.dev** everywhere (footer, form errors, privacy page); the Gmail address only appears as the SMTP delivery fallback.
- **Contact form fields:** short labels (Name, Email, Topic, Message) with example placeholders, never repeating each other.
- **Speed first** (2026-10-25): the browser Sentry SDK (and Session Replay, a further chunk) loads once the page is idle (`lib/sentry/lazy.ts`); client code reports errors with `captureError()`, never by importing `@sentry/nextjs`, and errors before the SDK loads are queued and sent. Animations are CSS (2026-10-26): the scroll reveal (`components/ui/Reveal.tsx`), the hero, the navbar menus, the carousels and the contact form's fields; motion (`motion/react`) loads only inside lazily loaded parts (the form's sending and success screens, the live player), each wrapped in `components/MotionProvider.tsx`, so no page ships it up front. The homepage is server-rendered, with client islands only for its interactive parts. Big ambient glows are radial gradients, not blur filters. CI's Lighthouse budgets include a mobile pass on `/`, `/blog` and `/builds`.
- **A direct route to the portfolio:** "Hiring? See my developer portfolio" in the hero, above the social icons (moved there 2026-10-26, when the "See what I'm building" button was removed), and `n8builds.dev/portfolio` redirects to portfolio.n8builds.dev (2026-10-25).
- **The hero portrait fades in with the rest of the hero** (2026-10-25), not "just there" at the start. It is the page's LCP element, so the fade is CSS from first paint (not after hydration), starts at 1% opacity so LCP timing is unchanged, and is skipped under reduced motion.
- **On phones the portrait sits above the "n8builds" heading** (2026-10-26), smaller (10-11rem), so the face is on the first screen; from tablet width up it stays to the right of the text. The "What I'm working on" peek applies to laptops and tablets only.
- **The first screen on laptops and tablets** (2026-10-26): the hero content is centred in its space, and "What I'm working on" sits close enough under it that its heading and the top of its card (gradient edge, and the logo row from 800px tall) show as a sneak peek.
- **The hero portrait swaps with its watercolor version** (2026-10-26), borrowed from the dev portfolio: each look holds 3s, then they cross-fade over 0.8s. The photo stays the first paint and LCP; the watercolor (`public/hero/portrait-watercolor-*.webp`) loads after the page is idle, pauses off screen or in a hidden tab, and never runs under reduced motion.
- **"Don't have a site? Need help building your own? Use mine as a template."** (2026-10-26, was "Use this as a template"; the last line in the tagline's gradient, underlined, with checks under it: Open source, MIT-licensed, Tested on every pull request): a part of the Lab right after the featured builds (before the Chrome extensions), with two template cards side by side and no screenshots: "This site" (n8builds.dev, the N8 icon) and "My developer portfolio" (portfolio.n8builds.dev, a briefcase chip: the N8 mark belongs to n8builds.dev). Each card links its site under the title, says what you get if you fork it and what it is built with (pills; no testing tools or OpenPing as pills), then, on the n8builds card only, "How it is built and tested" (`/builds/n8builds`; the portfolio has no build page and its repo is already the GitHub half) and the shared Star | GitHub split button (`components/ui/RepoButtons.tsx`). No checked-points box in the cards, no release-kit line, no licence sentence. Hiring stays the PortfolioAd section's job, right after the Lab. The repo names (`n8builds-web`, `dev-portfolio`) are never shown as site names.

## Operations

- **Upstash plan:** confirmed Free (500,000 commands/month, no payment method).
- **Daily cap:** stays at the default 50 verified submissions/day (100 emails, well under Gmail's ~500/day). Change with `CONTACT_DAILY_LIMIT` in Vercel if ever needed.
- **HSTS preload:** not adding it. Vercel already sends `max-age=63072000`; preload would force HTTPS on every subdomain and is slow to undo.
- **Branch protection:** reversed (with #20): `main` now requires CI through pull requests (see HANDOFF, "Branch protection on `main`"). Docs-only changes skip the browser suite.
- **Indigo accents:** kept. Tailwind 4 kept the original (approved) hue; it is only slightly more saturated.
