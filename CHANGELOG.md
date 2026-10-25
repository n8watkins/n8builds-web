# Changelog

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

