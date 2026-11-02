# Owner decisions

The standing rules for n8builds.dev, decided by the owner.
This is the one place they are kept: HANDOFF, NEXT_STEPS and OWNER_TODO link here instead of repeating them.
Agents read this before changing content, design or workflow, follow it, and never re-ask a settled question.
When the owner decides something new, add it here (with the date) in the same change.

## Brand and content

- Blue/cyan accents, **no purple** (except the Twitch brand hover in the navbar).
  Indigo (between blue and violet) is allowed and stays: the Loadout "indigo" group and the Chrome extensions part's wash and bar.
- The site is a **build-in-public workshop, not a portfolio**.
  The hire-me lane is portfolio.n8builds.dev; the owner's company is Tech for Pros (techforpros.com).
- **Tech for Pros replaces Appturnity** (owner, 2026-11-01).
  Tech for Pros is the owner's SaaS for service businesses: it turns a few details about a business into a launch-ready website, then takes the follow-up off their plate (lead capture, reviews, reminders, missed-call text-back).
  Appturnity was his consulting firm, and ended in June 2026; the site no longer links to it.
  It takes Appturnity's place in "What I'm working on", the Work with me card, the contact card, the footer and the structured data.
  **The site treats it as live** (owner, 2026-11-01, before the domain is registered): no "Coming soon", "Launching soon" or "will soon" for it anywhere, and the `live` flag is gone from `lib/techForPros.ts`.
  Every on-site link goes through the counted short link (`/techforpros?from=navbar|hero|card|footer`); the structured data's `sameAs` lists https://techforpros.com.
  The navbar's top right is its icon and "techforpros.com" in place of the gradient button, at every width: a bordered pill like Ko-fi and Portfolio (same height, radius and border, a faint cyan tint), with a hand-drawn cyan-to-blue swoosh under the text instead of a straight underline. The swoosh draws itself in on load and again on hover or focus, and shows fully drawn under reduced motion (owner, 2026-11-01).
  "What I'm working on" is headed by its icon and "techforpros.com", with no badge, a "Visit techforpros.com" button (`from=hero`) and screenshots that link there too.
  The Work with me card lists its planned features under "Next up", never "Coming soon".
  The footer sitemap has "techforpros.com" with the icon under Work with me, and the contact card says it "puts your business online", linked.
  Its icon (a worker in a cap holding a blue gear) is `public/brands/techforpros.png`, 256px, made from the owner's 1254px master by `scripts/gen-techforpros-icon.mjs` (the master stays out of the repo). On the site's dark navy it always sits on a light rounded tile (`components/ui/TechForProsMark.tsx`), because its navy outlines vanish on dark.
  The contact auto-reply's "While you wait" cards add Tech for Pros (its icon on a light tile, `n8builds.dev/techforpros?from=email`) after the Lab and the portfolio.
  The cards still reuse the Appturnity-era template screenshots.
  It never claims "free websites" or AI voice agents, which were Appturnity's offer.
  `n8builds.dev/appturnity` still counts and redirects for links already out there (sent emails); the admin's `ref:appturnity` counter keeps working.
  The Appturnity entries below are history.
- **Projects and Lab are one.**
  The Lab (`#lab`) is one homepage section in three parts (2026-10-25): "My daily drivers" (`#my-tools`: Scribe and OpenPing, the owner's daily tools, marked `mine: true` in `data/builds.tsx`), "Featured builds" (`#featured`: Solara, Portfolio Rank) and Chrome Extensions (`#extensions`), and since 2026-11-01 a fourth, "What's cookin'" (`#upcoming`, see /upcoming below). No "The bench" eyebrow; no "Featured" eyebrow over "Featured builds".
  The part headings have no eyebrow (the "Browser tools" label is gone, 2026-10-26), each with its part's colour bar. The claims every row shares (free, open source, no sign-up to start) are one short line under "My daily drivers" and "Featured builds", never repeated in the rows; Chrome Extensions has no subtext. The intro says everything is public and mostly MIT open source.
  Each row: the app's icon left of its name, the subtitle under the name (never above), a two-line description, its tech as pills with the product's main action (Download for Windows, Try the free tools, Find your sun window, Vote in a face-off) on the same line, the project's real features as checks in its colour, then one row of buttons spanning the column in even thirds: Live Site, the joined Star | GitHub split button (`components/ui/RepoButtons.tsx`) and Details (2026-10-26; on phones the split button takes its own line). There are no coloured ad boxes: the coloured checks carry each product's colour. The full tech stack and the build-log link live in the Details dialog, so rows stay short.
  Descriptions are about features, short and not salesy (2026-10-26); the tech (whisper.cpp, Tauri, Workers, D1, Next.js...) goes in the pills, never the prose.
  The Details dialog (2026-10-26) shows the project's screenshots on its left from md up (hidden on phones), with larger type, tabs and tech icons, each icon centred over its name.
  Portfolio Rank's title writes "Rank" in its own gold (#fbbf24, as its wordmark does). Scribe's icon is its real app icon (the microphone, from the Scribe repo).
  Rows are compact (2026-10-26): a row's screenshots are one image you step through by clicking or tapping its left or right half (arrows show on hover and focus, the arrow keys and a swipe work too, small dots just under the image show the position, never over the screenshot); there are no thumbnails under it.
  No two buttons in a row go to the same place (2026-10-26): an ad link never repeats the row's Live Site or GitHub link (Scribe's "How it works" was dropped; OpenPing's "Deploy your own" goes to its install guide; Solara's ad opens the planner at /app/; Portfolio Rank's "Add your portfolio" goes to the leaderboard's Browse section, where its submit button is). Star and GitHub both open the repo on purpose: starring happens there.
  Each row's features (2026-10-26) come from its README and site (Scribe sky, OpenPing green, Solara orange, Portfolio Rank gold #fbbf24), two by two from small screens up; Portfolio Rank's "Add your portfolio and see how you compare" is a linked check, not a button. Scribe's download button is near-solid blue, holds still on hover, carries the Windows logo by "Windows", and its caption reads "Windows 10 and 11, 64-bit · version · size" (the only platforms Scribe supports). Every Lab button passes WCAG AA, gradients included (white on blue-600 or darker).
  Rows alternate sides starting with Scribe's screenshot on the right, and each row's colour glows in from the page edge on its screenshot's side.
  **The Lab heading has a flask mark** (picked by the owner, 2026-10-26): Lucide's flask-conical in a cyan chip beside "The Lab", sized like the rows' app icons.
  **The Lab has a floating side nav** (owner's request, 2026-10-26): on desktop (from 1280px) a sticky rail in the left gutter lists My tools, Featured, Chrome extensions and What's cookin' (since 2026-11-01), marks the part on screen and jumps to it; it shows only while the Lab is on screen, never overlaps the content and never wraps a label (vertical labels from 1280px, side by side from 1440px, "Extensions" on screen at 1440-1535px). Hidden on phones and tablets, where the pill links under the heading do the job (`components/sections/LabSectionNav.tsx`, `tests/e2e/lab-section-nav.spec.ts`).
  **One repo control sitewide** (2026-10-26): `components/ui/RepoButtons.tsx`, a star icon with the repo's live star count (amber-tinted; the count is cached hourly on the server and omitted when GitHub can't say or it is 0, leaving the icon) and "GitHub", joined as one split button, both opening the repo, with full accessible names ("Star <name> on GitHub"); used by the Lab rows and the Chrome extensions.
  A Tools grid (`#tools`) renders only if a non-mine tool build exists (none today); `/tools` redirects to `#my-tools` temporarily.
  There is no "web apps and experiments" shelf (removed 2026-10-22); web apps are featured rows.
  There are no standalone shelf pages; `/lab`, `/extensions` and `/tools` redirect to the anchors, and the retired `/resources` redirects to `#lab` (`next.config.mjs`).
  The navbar "Lab" dropdown scrolls to them.
- **"What I'm working on" is the Appturnity ad** (2026-10-25), right under the hero: Appturnity is a platform for local service businesses (pool, HVAC, landscaping): a free, done-for-you website (the way in), then paid plans (Care, Pro) with systems like Google review requests, and booking coming. Not generic consulting. Copy comes from Appturnity's own repo (`~/appturnity/monorepo-app`, docs/COMPANY_STRATEGY.md) and its recent commits; buttons go to appturnity.com/#free-website and /examples. Its mark is the real one (`public/brands/appturnity.png`), never an invented logo. The "Check out the lab" button is gone.
  It reads like a real ad (2026-10-26): headline, pitch, selling points and the two buttons, with Appturnity's own template screenshots (copied from its `apps/hub/public/example-shots` into `public/now/`) in a browser and phone frame. Recent activity, the goal and the stack are not on the card face; they live in the "What's new" dialog.
  Since 2026-10-26 (hero round 3): the phone shows the full-length HVAC page scrolling slowly inside its frame (down, a pause, back up, 30s each way, as on Appturnity's own site), in CSS; it pauses while the card is off screen and holds still under reduced motion.
  There is no "Building now" line; the "What's new" button sits at the far right of the buttons' row (full width under them on phones).
- **"Two ways to put me to work":** the project card is Appturnity by name and mark, offering the free website.
  Since 2026-10-26 the two cards are large and stacked, with the screenshot alternating sides (right, then left).
  "Need a developer?" is the second hiring ad (the first is the portfolio band after the Lab) and must not repeat it: it closes the page as the next step ("Like the builds? I can build yours."), with what the owner brings instead of the project list, and the portfolio's Projects section instead of its hero.
  The cards stay compact; each shows a browser and a phone mostly side by side with a small overlap, and full-length shots scroll slowly inside their frames (down, pause, up; CSS transform only, paused off screen, still under reduced motion), as on Appturnity's own site.
  Appturnity's brand is white to light blue, never green: its eyebrow is a white-to-light-blue gradient and its button is Appturnity's blue (#1066f4). "Need a developer?" takes green to cyan.
  The Appturnity card says what it offers today and lists the planned features as "Coming soon" (from Appturnity's catalog), never leading with review requests.
- **Hero grid:** it starts dark, warms up as cells fade in one by one over about 7 seconds, then the cells wander at random (fade out, jump to a free cell, fade in, each on its own clock) so no pattern repeats; it stays still under reduced motion.
  Keep it dim: the owner found a brighter version too dramatic.
  Since 2026-10-26: lit cells never touch (no shared edge or corner, even mid-fade), never sit behind the portrait, and fill the part of the grid on screen; a steady number is lit at every moment (at most a quarter dark or fading at once); they cycle at a pace between the original and a livelier one, fade on a soft ease in and out with no pop, and hold still while the hero is off screen. A dark wash over the grid keeps the hero text pronounced.
  Since 2026-10-26 (hero round 3): noticeably fewer lit cells (about one per 12 cells of the visible band, at most 36), spread across the grid's full width, and the grid fades out toward its left and right edges as well as top and bottom.
- **Blog covers:** each post has its own topic illustration uploaded as its Sanity cover (2026-10-23); the generated "signal" cover is the fallback for posts without one.
  Hero copy (2026-10-23, whoami reworked 2026-10-26, tagline changed 2026-11-01): heading "n8builds", subheader "Think bigger. Ship sooner." (was "Spending tokens, shipping features." until 2026-11-01; the same cyan-to-blue gradient runs across both sentences) (one line on every phone, down to 320px), and the whoami terminal titled "~/whoami :: Nathan 'N8' Watkins" with the body "AI-first software developer." then "I build apps and tools I wish existed." (no "in LA", no "AI agents doing the heavy lifting").
  The terminal's third line, "Shipping with Claude Opus 5.5." (added in round 13), was removed on 2026-11-01: the body is those two lines again, here and on /loadout. No pill above the heading.
  The body has no "$ whoami" line (the title bar says it); its two lines type out on load, terminal-style, then the prompt returns with a blinking cursor (2026-10-26). The typing is CSS only, the text is in the server HTML, and reduced motion shows it at once.
  Say "in public" sparingly; the owner felt the old hero overused it.
- **/upcoming: projects I'm outlining, with a real waitlist** (owner, 2026-11-01).
  `n8builds.dev/upcoming` lists Relink (working name; fallbacks Rewire and deadlink; renamed from Rewire on 2026-11-01), Strollz and VibeLog, each with status "Outlining", and since 2026-11-01 (owner's request) KeysReady, status "Concept" (a working single-shop prototype), from `data/upcoming.ts`.
  The cards are two by two from 960px up and one column below; the homepage items are two by two from 768px up, since four across would squeeze their buttons onto two lines.
  Its anchors and `?interest=` values (`relink`, `strollz`, `vibelog`, `keysready`) are a public contract: the projects' landing pages link to `/upcoming?interest=<slug>#<slug>`, and the old `rewire` value and `#rewire` anchor still land on Relink.
  The page itself is linked from the footer's Lab column and from the homepage part below.
  **Upcoming gets a small homepage section; full detail stays on /upcoming** (owner, 2026-11-01): it is the Lab's last part, "What's cookin'" (eyebrow "Upcoming", after Chrome Extensions and the Tools grid, so the portfolio ad still comes right after the Lab), with one line on what it is and each project as a compact item (icon, name, tagline, "Let 'em cook: join the waitlist" to `/upcoming?interest=<slug>#<slug>`, "Visit the landing page"), plus "See all upcoming". No statuses, points or audiences there (`components/sections/UpcomingStrip.tsx`, server-rendered, in a rose-to-orange part wash). It is in the Lab's pill links, the Lab rail (`LabSectionNav`, "Upcoming" where the gutter is narrow) and the navbar's Lab menu (to `/#upcoming`); the footer's "Upcoming" goes to `/upcoming`, whose heading also reads "What's cookin'".
  The landing pages: Relink https://relink.n8builds.dev, Strollz https://strollz.n8builds.dev, VibeLog https://vibelogs.dev, KeysReady https://keysready.n8builds.dev (signal red #ff5a4e on this dark site, #c81e1e on light backgrounds), linked from the homepage items and the /upcoming cards.
  VibeLog stays hidden as a build (`hiddenBuilds`, no Lab row or build page) while it is listed here as an upcoming project.
  Sign-ups are stored for real, in the analytics database (keys `waitlist:*`, `lib/waitlist/store.ts`), with double opt-in: joining emails a confirm link (Gmail SMTP, like the contact form), nothing is kept unconfirmed past 7 days, every email carries a leave link that deletes the entry, and `/upcoming/leave` emails that link to anyone who asks.
  The form has a honeypot and Turnstile, and its own rate limits (5 an hour per IP, 3 emails a day per address, `WAITLIST_DAILY_LIMIT` emails a day site-wide, default 100).
  The owner reads the list on the admin dashboard's Waitlist page.
- **Page titles use " | " as the separator** ("Speed Beats Mastery | n8builds"), and no visible copy uses the em dash (swept 2026-10-23).
- **Streaming:** the owner plans to start streaming on Twitch in the coming weeks.
  The navbar has a Ko-fi link (https://ko-fi.com/n8watkins, the same as Portfolio Rank's) left of Portfolio, and in the mobile menu (2026-10-26).
  The navbar keeps Twitch; **YouTube was removed on 2026-10-23** (its `@n8watkins` handle was a 404) and goes back in the same spot, after Twitch, once the channel is live (also add it back to `sameAs` in `lib/seo.ts`).
  The live player is built (see "Live streams"); Twitch and YouTube detection switch on once their credentials are in Vercel.
  The contact card and footer socials come from one list, `data/socials.ts`, each with an `enabled` flag (2026-10-26), always in this order: GitHub, LinkedIn, Email, X, Twitch, YouTube, Ko-fi (ko-fi.com/n8watkins). Twitch and YouTube are hidden until the owner starts streaming, then switched on by flipping the flag (YouTube's URL there is a placeholder until the channel exists).
- **n8builds.dev has its own build page** (`/builds/n8builds`, added 2026-10-24): the site as a case study.
  It is not a featured row (since 2026-10-25): the "Building your own site?" part of the Lab (`#template`, right after the featured builds since 2026-10-26) offers n8builds-web and dev-portfolio as public templates with their licenses and linking to the case study.
  Every number on it was checked against the repo or a CI run: the test counts (stated as "more than 200" unit and "more than 450" Playwright tests, so they don't go stale with every new test; recheck them if the suites shrink), the desktop Lighthouse scores (0.98-1.00 performance, 1.00 elsewhere; the mobile pass is named without a score), the CLS story (0.29 nightly, 0.91 at 6x CPU, 0.000 after), and the contact-form limits.
  Refresh the test counts in its `solution` (and the template section's summary in `components/sections/UseAsTemplate.tsx`) when the suites grow.
  Its screenshots in `public/builds/n8builds/` are real: the homepage hero, the CI Lighthouse report for `/` (summary only, cropped so no localhost URL shows) and a GitHub Actions run on main (run #169, the #48 merge, retaken 2026-10-26; a retaken screenshot gets a new dated file name so image caches can't serve the old one); `tests/e2e/n8builds-build.spec.ts` and `tests/e2e/api/n8builds-build.spec.ts` guard them.
  Since 2026-10-26 it has its own layout (`components/builds/n8builds/`), written for developers deciding whether to fork the site: hero with the homepage screenshot, what a fork gets, the CI pipeline lighting up stage by stage, the speed numbers before and after (only numbers from the done log in NEXT_STEPS, mobile ones labelled as local runs), how it is built, and a fork call to action with RepoButtons.
  It has no "problem" section (`problem` is optional on builds) and no share-card screenshot. Its animations are CSS, started by the shared scroll reveal, and its numbers live in `components/builds/n8builds/content.ts` with their sources.
- **Private repos get no GitHub link:** a build links its repo only while the repo is public (the build log also links commits and releases only then). Solara went public on 2026-10-24 and has its link; its live site moved to https://solara-uv.web.app (the old uv-activity-planner.web.app redirects there).
- **The hero chain is prompt -> build -> ship -> repeat** (2026-10-26): "idea" was dropped. The first chip keeps idea's old box, single comet and wire landing; only its label changed.
  Its comet starts exactly where the loop-back wire lands (near its bottom-left corner, measured at runtime by `HeroChainMeter`) and has almost no trail (2026-10-26).
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
- CanIHost, FreeStack and APIScout (the "free tools trio") were dropped from the site on 2026-10-21 and retired on 2026-11-01 (owner's call: live sites and Vercel projects deleted, GitHub repos archived; `/builds/<slug>` still redirects to the Lab for old links), and Suggestion Box, Repo Steward, Sprite Arsenal and Quizmatic on 2026-10-22 (Solara took Quizmatic's featured slot).
  Their repos and Vercel projects still exist; do not re-add them unless asked.
- The **Loadout** is the identity device ("who I am without a resume"); PC hardware lives there as "The Rig".
  /loadout has no whoami terminal (2026-10-26); the whoami lives in the homepage hero only.
- **My Loadout has the dev tools** (owner, 2026-11-01; the people moved to the homepage the same day, see below): the page opens with "My dev setup", then "How I work with AI", "Tools I built" (before "Tools I use", owner, 2026-11-01), "Tools I use" and "Honorable mentions", then "Inside the apps I build" and "The gear" (the rig, desk and stream kit; renamed from "The setup" with the owner's approval on 2026-11-01 so it doesn't clash with "My dev setup", "gear" rather than "hardware" because the stream kit includes OBS and Scribe; its id is `gear`, and the old `#setup` anchor still lands there), with pills under the header jumping to each part (`components/sections/LoadoutDevTools.tsx`, lists in `data/loadout.tsx`).
  "My dev setup" (`devSetup`) groups the machine (Ryzen 7 9700X, 31 GB RAM, Windows 11 Pro), WSL2 (Ubuntu 24.04, capped at 20 GB RAM and 16 GB swap, 8 processors, mirrored networking, dropcache memory reclaim, sparse VHD, with the `.wslconfig` shown), the terminal (Windows Terminal, zsh and oh-my-zsh with zsh-autosuggestions, tmux, herdr), editors (Neovim, VS Code, Cursor), agents (Claude Code, Codex), agent tooling (linking the Tools I use cards, not repeating them), runtimes (Node 24 with nvm, pnpm, Bun, Python 3.12 with uv, Rust), the owner's own tools in daily use (T-Hub, Scribe linking its build page, devguard, pass-env, release-kit, and N8 Tray, which is private and unlinked) and shipping (Vercel, Cloudflare with Wrangler, Turso).
  "Honorable mentions" (`honorableMentions`) are other people's tools the owner recommends, not already in Tools I use: herdr (by Can Celik, in daily use), firstmate and treehouse (Kun Chen) and ccusage (ryoppippi). gnhf stays off (no code changes since 3 October 2026).
  Kun Chen's card says how he works (macOS with nix-darwin, WezTerm, Neovim and tmux or herdr; Claude Code interactive, Codex for background runs) and links his workflow video.
  The homepage's My Loadout band ends with a one-line "My setup" teaser (Windows 11 + WSL2 · Claude Code + Codex · herdr + T-Hub) linking to `/loadout#dev-setup`.
  "Tools I use" lists only agent tools with evidence of real use (installed, wired in as skills, used by the agents): no-mistakes, chrome-devtools-axi, gh-axi and Lavish, each credited inline to its maker ("no-mistakes, by Kun Chen", the name linking to the maker's card). Claude Code, Codex and Pi stay in the workflow and harnesses, not repeated there.
  **People I follow and Tools I built are on the homepage** (owner, 2026-11-01): after N8's Notions come "People I follow" (`components/sections/HomePeople.tsx`, `#people`, no longer on /loadout), with a project card for "The Pull Request Post" directly beneath it (the newspaper pr-post prints from the public GitHub activity of the people I follow; a Live demo button to https://n8watkins.github.io/pr-post/, the Star | GitHub button for https://github.com/n8watkins/pr-post, and a front page from the demo beside the copy, `public/projects/pr-post-edition.webp`), then "Tools I built" (`components/sections/HomeToolsIBuilt.tsx`, the same cards as /loadout, less pr-post, which the card above already shows), then My Loadout. The tools on /loadout credit a maker in People I follow with a link to their homepage card (`/#kun-chen`), and the footer sitemap links both sections. The sentence under the cards about pr-post is gone: the card says it.
  "People I follow" is exactly Kun Chen, Phaedrus Raznikov and Nate Herk, in that order: who they are, one or two plain sentences on what they work on in public, and only their own links (Nate Herk has no public GitHub). Each card shows the person's own avatar (owner, 2026-11-01), self-hosted as a 256x256 WebP in `public/people/` (never hotlinked, so no new image host), with their initials behind it as the fallback; Phaedrus's is the artwork he uses on GitHub, as he has no public photo. The cards are static for now; each person's `activity` (recent public pull requests, releases and new repos, never private counts) will come from the `feed.json` of pr-post (https://github.com/n8watkins/pr-post), the owner's open-source tool for following what builders ship.
  herdr (in Honorable mentions) shows its own app icon, the ram on its light tile from herdr.dev, self-hosted as `public/brands/herdr.png` (2026-11-01).
  "Tools I built" holds the owner's small public tools (pass-env, release-kit, devguard, pr-post), not the Lab's apps; each gets the Star | GitHub button, and a tool with a live demo (pr-post) links it beside the button. pass-env always carries "Created by Phaedrus Raznikov at Misty Step; my fork adds import, generate, doctor and more." Adding a tool or a person is one entry in `data/loadout.tsx`.
- **The AI kit lists only tools in real use** (2026-10-26): LangChain and Ollama were removed (not really used); Perplexity stays. whisper.cpp powers Scribe and Piper powers the Piper TTS extension.
- **The homepage AI kit has a dino easter egg** (2026-10-26): a pixel dino (our own art, not Google's sprite) hops the gaps along the marquee rows; pausing the row it is on (hover, focus or tap; never another row) makes it miss and fall to the next row, walking the other way, and off the last row it drops back in at the top left. Homepage only, never on /loadout; hidden under reduced motion (`components/features/dino/`, `tests/e2e/ai-kit.spec.ts`).
  It moves briskly (about 1.5x the first version) and the AI kit tiles sit 2.5rem apart across and between the rows, so every gap is clearly wider than the dino (the reduced-motion grid keeps 1rem).
  Clicking or tapping it makes it roar (2026-10-26, "I love the dinosaur change"): a pixel "RAWR!" bubble, a backflip on the spot and a new body colour each time. Only its own small box takes the pointer; it stays aria-hidden.
  Now and then it stops to say a line in a small pixel bubble, each once per visit, in this order (picked by the owner): "Psst... click me" (a few seconds in, skipped once it has been clicked), "Can't catch me!", "Hop hop", "RAWR!!!", one every 15-25 seconds; the list is `DINO_LINES` in `DinoGame.tsx`.
- **AI kit marks are the real brand marks** (2026-10-26): Simple Icons where they exist (Cursor's cube, Claude, Gemini, Perplexity, Hugging Face), OpenAI's blossom, Piper's jester-cap "P" from its logo and, for whisper.cpp (no icon of its own), the ggml-org "GG" badge; black-and-white marks show light grey on the dark tiles.
- **The homepage default stack says why** (2026-10-26): under the AI kit, "My default stack" (no "TL;DR") shows The Turso Stack in the Lab's style, each tool with its icon and one line on why it is in the stack, kept true to the loadout (`components/sections/HomeStack.tsx`).
- Blog name: **N8's Notions** (renamed from "N8 Notions" on 2026-10-25; Sanity project `abgyc32w`, dataset `production`, nav label "Notions").
  Every full mention says "N8's Notions" (capital N, the digit 8, apostrophe s; not "Nate's Notions"); short nav and footer labels stay "Notions".
  URLs and slugs keep their old names (`/blog/welcome-to-n8-notions` stays).
- Stack preference: **Firebase over Supabase** (reflected in `data/buildStacks.tsx`).
- **No Resend**: Nodemailer + Gmail SMTP (rationale in `~/docs/faq/email-and-domains.md`).
- contact@n8builds.dev is the public address (Cloudflare Email Routing forwards it to Gmail).
- Email template structure and copy are owner-approved; change only on request.
- **The contact emails' redesign** (owner's ask, 2026-10-28): both emails in the site's dark navy and cyan (`lib/email/templates.ts`). The notification leads with the topic, the sender and a "Reply to {name}" button; the auto-reply greets by first name, says what happens next (a reply within 24 hours, the promise the old copy made) and links the Lab, the portfolio and Appturnity. The auto-reply never repeats the visitor's message: it goes to whatever address was typed, so echoing it would let anyone send their own text from contact@n8builds.dev. Images are inline attachments, never remote.
- **appturnity.com** is the canonical Appturnity URL (history: the site no longer links to it, 2026-11-01).
- Keep the three brands on separate sites.
  Footer, navbar and redirect links to the portfolio and Tech for Pros are intentional bridges.
- **The brand mark is the lowercase "n8"** (owner, 2026-11-01): a white "n" flowing into a blue "8", replacing the N8 neon icon on n8builds and the portfolio.
  The master is `public/brand/n8-mark.png` (transparent, trimmed); `scripts/gen-brand-icons.mjs` makes the tab, app and Apple icons from it (the mark on a dark navy rounded tile with a faint sky edge), and `scripts/gen-email-icons.mjs` the emails' logo.
  The navbar and footer show the mark on its own, without a tile.
  The admin dashboard still has the old N8 mark.
- One GA4 property (`G-JZQGKY9Q37`) covers the whole n8builds.dev domain, subdomains included.
- **Vercel Web Analytics** (2026-10-27): loaded on every page next to Speed Insights, only on Vercel builds, and outside the consent banner, because it sets no cookies and keeps no visitor identifier past a day.
  GA4 stays as it is and remains the main analytics; Vercel's is a cookie-free count that also covers visitors who decline.
  The privacy page's "Hosting" item names both Vercel tools.
- **Analytics consent** (2026-10-26): Google Consent Mode v2 with region defaults (analytics denied for the EEA, UK, Switzerland and Quebec `CA-QC`, granted elsewhere; ad signals denied everywhere, as the site runs no ads).
  Visitors whose time zone is in Europe or covers Quebec (`America/Toronto` and friends, so Ontario is asked too) get the banner, and GA doesn't load at all until they accept (basic mode); everyone else gets analytics by default, with "Cookie settings" in the footer.
  Global Privacy Control counts as a decline everywhere until the visitor chooses.
  The choice is the `n8-consent` cookie on `.n8builds.dev` (12 months), shared with portfolio.n8builds.dev, which runs a copy of `lib/consent.ts`.
  The banner is a centred bottom bar (up to 62rem) titled "Cookies", with a cookie icon inline with the title (no icon chip), and it links to `/privacy#cookies`, which names Google Analytics.
  **Accept is the more inviting button** (owner's call, 2026-10-26, knowing EU regulators can read a much stronger Accept as a nudge): larger, brand gradient with a check icon, on the right; Decline is a smaller secondary button on its left but stays a real, solid, readable (AA) button at least 40px tall.
  Choosing plays a short exit (the bar fades and slides down for about 220ms, then unmounts; instant under reduced motion), and focus returns to "Cookie settings" or moves to the page's main content.
- The site is dark-only (`defaultTheme="dark"`, no theme toggle).
  Muted text uses `text-slate-450` / `text-slate-475`, not stock slate-500/600, which fail WCAG AA contrast on the dark backgrounds.
- react-icons are decorative by default (`aria-hidden` via `IconContext` in `app/provider.tsx`).
  An icon-only control needs its own `aria-label`.
- **Round 10 (2026-10-27, owner's calls):**
  - The Loadout (`/loadout`) is about the tools, not a tech stack: how I work with AI (decide with ChatGPT, build with Claude Code on Claude Opus 5.5, fix with Codex and Gemini), the harnesses (Claude Code, Pi), the AI inside my apps, then the stream kit, rig and desk.
    The homepage keeps the AI kit marquee and the dino.
  - The AI kit tiles show what each tool is for on hover (owner, 2026-10-28; calm tiles from round 10 dropped), and on focus or a tap on touch screens.
    A mouse click on a tile does nothing: only hovering pauses its row (each tile is still one tab stop, so a row can be paused from the keyboard).
  - The AI kit has three rows (owner, 2026-10-29): agents and models (Claude Code, Claude Opus 5.5, ChatGPT, Codex, Pi, Cursor, OpenAI, Gemini), AI tools (whisper.cpp, Piper, Hugging Face), and the dev stack.
    **One list for both sites** (owner, 2026-10-29): `data/stack.tsx` is shared with the portfolio byte for byte (its `npm run check:sync`), which shows the same tiles in two rows (the AI kit, then the dev stack).
    The dev stack is Next.js, React, TypeScript, Tailwind CSS, Zod, ShadCN, Vite, PostgreSQL, Turso, Drizzle, Firebase, AWS, Google Cloud, Vercel, Cloudflare, Sanity, Upstash, Clerk, NextAuth, Sentry, Google Analytics, Playwright, GitHub Actions, ESLint, Prettier, Git and Figma.
    Dropped as filler or dated: HTML5, CSS3, ES6+, React-Icons, Context API, Recoil, Material-UI, PayPal, Postman, Jest, MySQL, Stripe, GraphQL, AWS Amplify, Prisma and REST APIs.
    Row durations come from the tile count (`rowDuration`), so every row moves at the old speed (about 22px/s) on both sites.
    Purple marks (Clerk, ESLint, Vite) show light or in another brand colour.
    Its intro reads "The AI kit and stack I build with, in daily use right now." (owner, 2026-10-29).
    Pi shows a π (it has no mark of its own), ChatGPT and Codex use OpenAI's mark, and Playwright's logo is `public/projectIcons/playwright.svg`, from playwright.dev.
  - The dino is a game: the first click starts a 30-second catch round with a scoreboard and a best score (kept in the browser); every click is a random colour and one of several reactions and roar lines; the rainbow comes on the 5th click, every 10th catch and 1 in 12 at random.
    The portfolio runs byte-identical dino files.
  - Copy says "service businesses", never "local".
  - Twitch shows in the navbar only while live; streaming will be on YouTube and X.
  - Ko-fi appears in its own blue with the red cup (replaced in round 12: outlined like Portfolio, white cup).
  - The build log drops the six-month view; "Shipped this month" cycles real figures from the log.
- **Round 11 (2026-10-27, owner's calls):**
  - The navbar's Ko-fi, Portfolio and Appturnity buttons share one text style (semibold, same size and padding); Appturnity's has no "A" icon.
  - Appturnity's card shows Appturnity's own wordmark (from appturnity.com, its navy letters lightened for the dark card), not a font guess.
  - "Shipped this month": the figures card is on the left and clicking a figure moves to the next; the month heading sits above its rows.
  - The Lab opens with "Check out the Lab": spaced capitals in the cyan-to-blue gradient with a shimmer.
    Its side rail's heading is "The Lab", and the dot riding the rail is brighter.
  - More room between My tools and Featured.
  - Each Lab row's colour wash swells in as the row scrolls into view and fades as it leaves (steady where the browser can't animate on scroll, and under reduced motion).
  - The Lab rows' main buttons (Download for Windows, Try the free tools, Find your sun window, Vote in a face-off) have a light sweeping across them now and then, only while on screen and each on its own rhythm (round 12).
- **Round 12 (2026-10-27, owner's calls):**
  - Ko-fi is outlined like Portfolio with a plain white cup, everywhere (navbar, footer, contact); Portfolio gets a briefcase icon.
  - Appturnity's badge says "Free websites", not a status; its Work with me door shows the wordmark (no gradient text) and says "We help!".
  - Appturnity today: a free website, online booking, appointment reminders, lead and quote follow-up; coming soon: AI phone receptionist, missed-call text-back, online payments.
  - "Shipped this month" names the month once, large, on the figures card.
  - "Check out the Lab" spans the width of the flask and title.
  - The Lab rail's light locks onto the current part, which changes when the next part reaches the middle of the screen; it never runs past the last part. Rows are further apart.
  - Taglines: Scribe "Speech-to-text for Windows"; Portfolio Rank "The developer portfolio leaderboard".
  - The portfolio ad reads "The developer behind the build" on one line and links each AI project to its portfolio page.
  - Work with me points stay on one line each; "QA" replaces "Quality built in".
  - The hero's whoami terminal adds "Shipping with Claude Opus 5.5."
  - The Loadout is "My Loadout", and its rig, desk and stream kit are one "The setup" section (renamed "The gear" on 2026-11-01).
  - Every Lab project is MIT-licensed (Solara and TubeVault got the license); the Lab says "MIT-licensed".
  - The "Use mine as a template" wash is quieter.
- **Round 13 (2026-10-27, owner's calls): build pages and the build log:**
  - A build page opens with the app icon, the title and tagline, then the kind pill and the tech pills (each with its real mark) under them, then the actions; the live site sits on the right of the screenshot.
  - Scribe's page offers "Download for Windows" at the top (/download/scribe); a download replaces the lower invitation box, so it isn't offered twice.
  - Each build page has a checklist of what it does, the Details dialog's "How it's built" explainer, and Stack cards with each technology's mark.
  - The Details dialog says what each part does in that app (not what it is), one icon per technology; it links to the full story and straight to the build's part of the log.
  - /builds opens with three figures (builds tracked, updates and releases in the last 12 months); build cards carry their colour and newest version; months count their updates and releases; a release with release-kit notes shows them as patch notes (New, Fixed, Faster, Safer).
- **Round 13 (2026-10-27, owner's calls): the homepage and My Loadout:**
  - "Shipped this month" names the month once, at the top of the figures card; the figure and dots sit centred below it.
  - "Check out the Lab" is one line of plain text, larger, justified to the width of the flask and title.
  - (2026-11-01) The eyebrow is just "Check out", a size larger (1.125rem, 1.5rem from sm), its letters spaced so it still spans exactly the flask and title (container units, `components/HomePage.tsx`).
  - The Lab rail's line stops at Chrome Extensions; the comet around the current icon turns a little faster.
  - The portfolio ad's heading is "The developer behind the build".
  - My Loadout: each setup item shows its brand's mark (AMD, Samsung, Acer, Razer, OBS, Scribe's own) or a plain icon; no "daily driver" badge; the cards animate in.
  - whisper.cpp is listed on its own with its real (ggml) mark; Piper isn't in the Loadout's in-app AI.
  - Codex is listed as a harness: OpenAI's coding agent, which comes with its own harness.
  - Perplexity is off the AI kit (not used).
- **Dino fixes (2026-10-27, owner's calls):** the dino never teleports.
  Its click reactions are a backflip, a fall, a leap up and a dash, all in plain sight (the "blink" to another spot is gone), and a resize or relayout no longer carries it or flings it across the panel.
  A catch round's scoreboard and its best score (lit when this round beats it) sit in a band across the top of the kit panel that the dino never enters: the panel has twice the room above its rows, the dino is clipped below the band, and its jumps and bubbles stay under it.
  The AI kit's tiles can't be selected (not even by a triple click) or highlighted.
  A click on the dino is always a catch, so its roars react to being caught (RAWR!, OUCH!, GOT ME!, NO FAIR!, AGAIN?!, HEY!); none claims a miss.
  The round's countdown has its own pill in the band: bigger digits over a bar that drains with the round, red and pulsing for the last 5 seconds.
- **Dino game stats (2026-10-27, owner's call):** rounds and scores from n8builds.dev and the portfolio go to `/api/game` here and land in the admin dashboard's analytics database (aggregates only).
  Privacy first, no consent banner needed: no cookies, nothing stored in the browser, no IP or user agent stored; a player is a hash of IP and browser with a random salt that rotates daily and is deleted after two days.
  Only the listed origins are answered, each player is rate limited, a score counts only for a round that player started at least 29 seconds earlier and is capped at 60, and the privacy page says all of this.
  The best pill shows the all-time record next to the player's own best.

## Publishing and releases (2026-10-25)

- **Articles are always site first.** Every article is written and published on n8builds.dev (N8's Notions, in Sanity); posting or reposting it on X is a separate, later step, never the primary copy.
- **The release train runs Mondays at 16:00 UTC** (confirmed 2026-10-25). It releases only when a `feat` or `fix` landed since the last release.
- **release-kit is a dev dependency in every project** (2026-10-27, the owner's call, replacing "the owner applies it later"): each repo pins `github:n8watkins/release-kit` at a tag, Dependabot opens an update PR on every kit release, and notes default to the plain style (New, Fixed, Faster, Safer).
- **portfolio.n8builds.dev stays a separate site and a separate repo:** it is the developer-portfolio (hire-me) segment, a repo the owner can share on its own (renamed from Portfolio2.0 to `dev-portfolio` on 2026-10-25); n8builds.dev is the build-in-public workshop. Not a page of n8builds.dev.
- **The portfolio features Echo, Scout, GeminiGPT and Net-Trailer, not Scribe or Solara** (2026-10-25). It shows more builds as links to their n8builds.dev pages, and the Render demos' live status from OpenPing.
- **OpenPing and Scribe are featured rows** (2026-10-25): the owner uses both daily.
- **Featured rows sell as well as show** (2026-10-25): each keeps its technical substance and adds a reason to try it, with links out (`ctas` in `components/sections/FeaturedProjects.tsx`, `cta` on the build page). Scribe and OpenPing say the owner uses them every day; Solara is "free, no sign-up"; Portfolio Rank invites a five-second vote and a submission.
- **Each featured row carries an ad** (2026-10-25): a hook and buttons (`ad` in `components/sections/FeaturedProjects.tsx`). Scribe's primary button downloads the installer through `n8builds.dev/download/scribe`, a stable link that always resolves to the newest release (`lib/downloads.ts`). It shows a download mark and the Windows logo, says under the button what it downloads ("Windows installer (.exe) · v0.8.0 · 12 MB"), read from the newest GitHub release; when GitHub can't say, only "Windows installer (.exe)".
- **The homepage advertises the developer portfolio** right after the Lab (`components/sections/PortfolioAd.tsx`, image `public/ads/dev-portfolio.webp`; recapture it when the portfolio's hero changes). The portfolio mirrors it with a card selling how n8builds is built.
- **Portfolio Rank credits its origins and invites submissions** (2026-10-25): its featured row and build page link Emma Bostian's developer-portfolios list (and, on the page, Ali Spittel's tweet that started it), and invite visitors to add their portfolio by sending them to the Portfolio Rank site. n8builds only links there; submissions are Portfolio Rank's business, not this site's. Builds can carry `credits` and a `cta` in `data/builds.tsx`.
- **Footer copyright** reads "© 2026 n8builds.dev. All rights reserved." (2026-10-26).
- **The build log has no top-level navbar link** (2026-10-25): it lives in the Lab menu ("Build log") and in the site-wide footer sitemap (`components/layout/SiteFooter.tsx`, on every page). The homepage's contact card sits above that footer.
- **Visitor-facing email is contact@n8builds.dev** everywhere (footer, form errors, privacy page); the Gmail address only appears as the SMTP delivery fallback.
- **Contact form fields:** short labels (Name, Email, Topic, Message) with example placeholders, never repeating each other.
- **Speed first** (2026-10-25): the browser Sentry SDK (and Session Replay, a further chunk) loads once the page is idle (`lib/sentry/lazy.ts`); client code reports errors with `captureError()`, never by importing `@sentry/nextjs`, and errors before the SDK loads are queued and sent. Animations are CSS (2026-10-26): the scroll reveal (`components/ui/Reveal.tsx`), the hero, the navbar menus, the carousels and the contact form's fields; motion (`motion/react`) loads only inside lazily loaded parts (the form's sending and success screens, the live player), each wrapped in `components/MotionProvider.tsx`, so no page ships it up front. The homepage is server-rendered, with client islands only for its interactive parts. Big ambient glows are radial gradients, not blur filters. CI's Lighthouse budgets include a mobile pass on `/`, `/blog` and `/builds`.
- **A direct route to the portfolio:** "Hiring? Check out my dev portfolio" (was "See my developer portfolio" until 2026-11-01) in the hero, above the social icons (moved there 2026-10-26, when the "See what I'm building" button was removed), and `n8builds.dev/portfolio` redirects to portfolio.n8builds.dev (2026-10-25).
- **The hero portrait fades in with the rest of the hero** (2026-10-25), not "just there" at the start. It is the page's LCP element, so the fade is CSS from first paint (not after hydration), starts at 1% opacity so LCP timing is unchanged, and is skipped under reduced motion. It settles down from a touch larger (scale 1.03), never up from smaller: from smaller, the full-size watercolor swap became a late LCP entry.
- **On phones the portrait sits above the "n8builds" heading** (2026-10-26), smaller (10-11rem), so the face is on the first screen; from tablet width up it stays to the right of the text. The "What I'm working on" peek applies to laptops and tablets only.
- **The first screen on laptops and tablets** (2026-10-26): the hero content sits a little low in its space (60% of the spare height above it, 2026-10-26, so the gap down to the next section stays small on big screens), and "What I'm working on" sits close enough under it that its heading and the top of its card (gradient edge, and the logo row from 800px tall) show as a sneak peek.
- **The hero portrait swaps with its watercolor version** (2026-10-26), borrowed from the dev portfolio: each look holds 3s, then they cross-fade over 0.8s. The photo stays the first paint and LCP; the watercolor (`public/hero/portrait-watercolor-*.webp`) loads after the page is idle, pauses off screen or in a hidden tab, and never runs under reduced motion.
- **"Don't have a site? Need help building your own? Use mine as a template."** (2026-10-26, was "Use this as a template"; the last line in the tagline's gradient, underlined, with checks under it: Open source, MIT-licensed, Tested on every pull request): a part of the Lab right after the featured builds (before the Chrome extensions), with two template cards side by side and no screenshots: "This site" (n8builds.dev, the N8 icon) and "My developer portfolio" (portfolio.n8builds.dev, a briefcase chip: the N8 mark belongs to n8builds.dev). Each card links its site under the title, says what you get if you fork it and what it is built with (pills; no testing tools or OpenPing as pills), then, on the n8builds card only, "How it is built and tested" (`/builds/n8builds`; the portfolio has no build page and its repo is already the GitHub half) and the shared Star | GitHub split button (`components/ui/RepoButtons.tsx`). No checked-points box in the cards, no release-kit line, no licence sentence. Hiring stays the PortfolioAd section's job, right after the Lab. The repo names (`n8builds-web`, `dev-portfolio`) are never shown as site names.

## Operations

- **Upstash plan:** confirmed Free (500,000 commands/month, no payment method).
- **Daily cap:** stays at the default 50 verified submissions/day (100 emails, well under Gmail's ~500/day). Change with `CONTACT_DAILY_LIMIT` in Vercel if ever needed.
- **HSTS preload:** not adding it. Vercel already sends `max-age=63072000`; preload would force HTTPS on every subdomain and is slow to undo.
- **Branch protection:** reversed (with #20): `main` now requires CI through pull requests (see HANDOFF, "Branch protection on `main`"). Docs-only changes skip the browser suite.
- **Indigo accents:** kept. Tailwind 4 kept the original (approved) hue; it is only slightly more saturated.
- **Counted short links** (2026-10-28): n8builds.dev/appturnity and /portfolio are route handlers (`lib/referrals.ts`, `lib/refRedirect.ts`), not plain redirects. Each click adds one to `ref:<target>:<date>` (placement: email, lab, navbar, footer, card, hero or other) in the analytics database, after the redirect is sent, and lands only on a named page (`to=free-website`, `pricing`, `examples`) with UTM tags; bots and link previews aren't counted, and nothing about the visitor is kept. The site's Appturnity links use them, so the admin's referral card counts real clicks; the portfolio links on the site don't yet (only the auto-reply's card), and the admin doesn't show `ref:portfolio` yet. Delivered contact messages count in `contact:sent:<date>`.
- **Turbopack everywhere** (2026-11-01): every `next dev`, every test run and the production build run on Turbopack, here, on the portfolio and on the admin. `--webpack` comes back only where something genuinely needs it, with the reason in AGENTS.md; never cap the Node heap instead. Webpack dev held three times the memory of Turbopack in the Appturnity monorepo (8.9 GB vs 2.9 GB), and heap caps made Next restart and fail requests.
- **Vercel deploys `main` only** (2026-10-28): `git.deploymentEnabled` in `vercel.json` turns off automatic preview deployments on every other branch, here, on the portfolio and on the admin. Previews used about half of the Hobby plan's 100 deployments a day, shared by every project on the account, and CI already builds and tests each pull request. For a preview by hand: `vercel deploy` from the branch.
