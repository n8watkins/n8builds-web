# Changelog

## 1.3.0 - 2026-11-02

### New

- Homepage rounds 11 to 13, My Loadout, richer build pages and build log ([#69](https://github.com/n8watkins/n8builds-web/pull/69))
- Private game stats for the catch game, and the all-time record beside your best ([#73](https://github.com/n8watkins/n8builds-web/pull/73))
- Load Vercel Web Analytics next to Speed Insights ([#76](https://github.com/n8watkins/n8builds-web/pull/76))
- Redesigned contact emails, and counted links to Appturnity ([#94](https://github.com/n8watkins/n8builds-web/pull/94))
- Pick a topic from three cards, and Contact in the navbar ([#96](https://github.com/n8watkins/n8builds-web/pull/96))
- The rest of the AI kit, and a third row for the dev stack ([#100](https://github.com/n8watkins/n8builds-web/pull/100))
- One tile list shared with the portfolio, with its stack merged in ([#107](https://github.com/n8watkins/n8builds-web/pull/107))
- The new lowercase n8 mark in the navbar, footer, tab and app icons ([#110](https://github.com/n8watkins/n8builds-web/pull/110))
- Tech for Pros is my company now, in place of Appturnity ([#111](https://github.com/n8watkins/n8builds-web/pull/111))
- Dev setup, tools I use, honorable mentions, people I follow, tools I built ([#112](https://github.com/n8watkins/n8builds-web/pull/112))
- Techforpros.com everywhere, a new tagline, and People I follow on the homepage ([#118](https://github.com/n8watkins/n8builds-web/pull/118))
- An Upcoming page with a real waitlist, and What's cookin' in the Lab ([#117](https://github.com/n8watkins/n8builds-web/pull/117))
- Add optional arcade music to the dino game, off until you turn it on ([#120](https://github.com/n8watkins/n8builds-web/pull/120))
- Page through the month's updates with a staggered fade ([#121](https://github.com/n8watkins/n8builds-web/pull/121))
- Add Asset Arsenal, page skins, with its waitlist ([#125](https://github.com/n8watkins/n8builds-web/pull/125))
- Piper TTS is now VoiceDock, with Piper and Kokoro voices ([#124](https://github.com/n8watkins/n8builds-web/pull/124))

### Fixed

- No more teleports; best score at the bottom; AI kit tiles can't be selected ([#68](https://github.com/n8watkins/n8builds-web/pull/68))
- Catches never shout a miss; a bigger countdown with a draining bar ([#71](https://github.com/n8watkins/n8builds-web/pull/71))
- The Lab rail shows reliably in Safari after a jump to the Lab ([#75](https://github.com/n8watkins/n8builds-web/pull/75))
- A catch round lasts its real 30 seconds, even on a device that drops frames ([#88](https://github.com/n8watkins/n8builds-web/pull/88))
- Pausing its row always trips it, even right as it appears or after it drops back in ([#90](https://github.com/n8watkins/n8builds-web/pull/90))
- The Lab contents rail can be clicked and read the moment it appears ([#93](https://github.com/n8watkins/n8builds-web/pull/93))
- Show each tile's use on hover, and a mouse click no longer stops its row ([#98](https://github.com/n8watkins/n8builds-web/pull/98))
- Stop riding window resizes as row travel, fit click test ([#99](https://github.com/n8watkins/n8builds-web/pull/99))
- Hold a row the pointer already rests on when the page loads ([#108](https://github.com/n8watkins/n8builds-web/pull/108))
- Force minimatch 11 and glob 14 past two moderate advisories ([#119](https://github.com/n8watkins/n8builds-web/pull/119))
- Force the dark theme so a saved light choice can't whiten the form fields ([#122](https://github.com/n8watkins/n8builds-web/pull/122))
- The dino turns round and leaves along its row instead of falling into a gap ([#123](https://github.com/n8watkins/n8builds-web/pull/123))

## 1.2.0 - 2026-10-27

### Features

- **builds:** OpenPing joins the Tools, with its build page and build log (#27)
- **lab:** Daily drivers lead the featured rows; portfolio link; Use this as a template (#28)
- **builds:** Portfolio Rank credits its list and invites visitors to add their portfolio (#29)
- **lab:** Featured rows and build pages invite visitors to try each build (#30)
- **lab:** Ads for every featured build, a Scribe download link, and a portfolio ad (#31)
- **home:** Appturnity ad, Appturnity-branded work card, site-wide footer sitemap (#32)
- **lab:** My daily tools lead the Lab; icons, Star, and a Details dialog for every build (#33)
- **blog:** N8's Notions, and consistent fade-ins across the site (#35)
- **hero:** The portrait fades in with the hero; templates named by site, with the N8 icon (#37)
- **home:** Homepage refresh from the owner's 2026-10-26 review (#48)
- **consent:** Bigger cookie bar with an inviting Accept and an exit animation (#49)
- Owner round 10 (loadout, dino game, build log, brand and contact) (#61)

### Fixes

- **blog:** Post images no longer shift the page as they load (#24)
- **nav:** A new page opens at its top instead of scrolling up to it (#34)
- Appturnity contact copy and desktop Lighthouse wording (#43)
- **a11y:** Build log titles are tap-sized (24px), so /builds passes Lighthouse's target-size audit (#45)
- **marquee:** WebKit tab-stop test race and pause for pre-hydration focus (#47)
- **dino:** Ride along with the row so a slow frame can't drop it (#51)
- **builds:** Fresh Actions screenshot and WebKit keyboard test on the n8builds case study (#55)
- **dino:** Measure the walk-in after an entry in panel position, not distance walked (#62)
- **dino:** Drop the walk-in target once it turns (#63)

### Performance

- **builds:** The build log hydrates in place and no longer shifts layout (#36)
- Lazy Sentry, LazyMotion, filter-free glows, and a mobile Lighthouse pass (#39)
- **home:** Server-render the homepage and animate with CSS (#44)

## 1.1.1 - 2026-10-25

### Fixes

- **content:** Current case-study numbers; Solara's GitHub link and live URL
- **build-log:** Keep internal work out of the public log; let the owner hide entries
- **fonts:** Bundle Inter instead of fetching it from Google at build time
- **build-log:** A shared filtered link no longer flashes the whole feed
- **live:** Closed streams stay closed; live status lags two minutes, not four
- **share:** Copy link reports a failed copy; Share on X says it opens a new tab

## 1.1.0 - 2026-10-25

### Features

- **share:** Titled post cards over the cover, and share text that fits
- **motion:** Sections fade up as they scroll into view
- **blog:** Share bar on every post: Share on X and Copy link
- **builds:** A build page for n8builds.dev itself, featured on the homepage
- **builds:** Track each build's GitHub repo for the build log
- **build-log:** GitHub-fed build log with commit filtering and Sanity highlights
- **builds:** /builds log page, share card, build-page activity and nav link
- **live:** Live status resolver and /api/live
- **live:** Floating corner player, /live redirect and navbar live dot

### Fixes

- **nav:** Make the open mobile menu modal
- **hero:** Fit the chips on 320px phones, measure the loop wire, trim the iPad gap
- **home:** No layout shift while a slow device paints the page
- **stack cards:** No 24px offset before hydration, and the slide can't widen the page
- **motion:** Reduced motion shows sections without a fade or a jump
- **lighthouse:** Retry a Chrome launch that never reports its debugging port
- **build-log:** Leave builds without a tracked repo out of the log
- **build-log:** Filter chips apply the filter when clicked
- **share:** Keep Copy link disabled until it hydrates

