# Phone performance

Findings and open work from the 2026-11-04 performance pass on n8builds.dev and portfolio.n8builds.dev.
Measured with Lighthouse 13.6 mobile (simulated throttling), median of 3, CPU slowdown scaled to the machine's benchmark as in `scripts/lighthouse.mjs`.

## Baseline (live, 2026-11-04)

| Site | Perf | FCP | LCP | TBT | CLS | TTFB (curl, cache HIT) |
| --- | --- | --- | --- | --- | --- | --- |
| n8builds.dev | 0.72 | 1.54 s | 3.64 s | 770 ms | 0 | 0.17-1.2 s, very variable |
| portfolio.n8builds.dev | 0.64 | 1.24 s | 4.09 s | 955 ms | 0 | 0.13-0.85 s |

## What shipped

- n8builds-web (perf/phone-speed): Google Analytics after the first interaction or 5 s; the contact form's Turnstile only near the screen; the template carousel's hidden slides and the tall phone screenshot only near the screen; the hero portrait at `fetchpriority="high"`.
- dev-portfolio (perf/phone-speed): lazy Sentry (it was most of the 174 KB chunk `14bf1rdeuedjz.js`, React plus Sentry with Replay); the same GA deferral; gsap and lottie-react on demand; the contact card's gradient no longer runs a requestAnimationFrame loop forever; the hero portrait at high priority.

## Why the homepage is slow on phones

- The homepage HTML is about 1.1 MB (110-140 KB compressed): about 570 KB of markup with 3,300 tags and 240 inline SVGs, plus about 570 KB of inline RSC payload.
- Lighthouse's simulated LCP is mostly the bytes requested before the first paint (HTML, about 290 KB of JS, the font, CSS) on simulated slow 4G, plus the main-thread work of parsing and laying out that HTML.
  Blocking all JS still left LCP at about 3 s.
  The real (observed) LCP is about 0.4-0.6 s.
- The hero's comet circuit (`--n8ang` conic gradients, chip colour animations, `stroke-dashoffset`) restyles and repaints every frame while the hero is on screen, about 0.5 s of a throttled main thread over 7 s.
- Looping animations in off-screen bands (marquees, the flask, shimmers, spinners) cost about 1-2 s of throttled main thread in the first seconds.
- The main CSS is 228 KB raw (33 KB gzip) and render-blocking.

## Parked work

### perf/pause-offscreen-parked (n8builds-web)

Marks each homepage band and Lab part `data-pause-offscreen`; `HomeEffects` sets `data-offscreen` from an IntersectionObserver and CSS pauses every animation inside.
`reduced-motion.spec.ts` "marquees scroll a repeated track" fails with it (the marquee is off screen when the test reads it); adjust the test to scroll the marquee into view, or exclude marquees.

### Tried and dropped: `content-visibility: auto` on the bands

It cut style and layout, but broke in-page jumps: smooth scrolls to `#contact`, the Loadout rail and the Lab rail landed 1 px off or off screen, because the skipped bands render at their real height during the scroll.
Do not retry without reworking every anchor jump.

### perf/edge-cache (n8builds-web, not deployed)

Cached pages took 65-145 ms of Worker CPU per request (`wrangler tail`), against about 20 ms on the portfolio, because the homepage's ISR entry is about 3 MB (HTML 1.1 MB, RSC 0.5 MB, segment data 1.1 MB).
With `withRegionalCache` in long-lived mode, Next 16 defaults to `shouldLazilyUpdateOnCacheHit: true`, so every hit also reads the entry from R2 and rewrites the regional copy in the background.
The branch turns that off (no page reads D1 when it renders, and nothing revalidates on demand; a region can serve a page up to two revalidate periods old) and adds `Server-Timing: worker;dur=` to tell Worker time from network time.
Next step: build, deploy, and compare `wrangler tail` CPU and the TTFB spread before merging.
Startup time is not the issue (34 ms at deploy).

### perf/lighthouse-gate-parked (dev-portfolio)

Ports `scripts/lighthouse.mjs` and the CI job to the portfolio, replacing the unused `lighthouserc.json`.
Its mobile pages and budgets are still n8builds-web's; set them just below the CI medians after the perf PR has merged.
n8builds-web's own gate (mobile `/`, `/blog`, `/builds`: perf 0.8, LCP 4.2 s) can be tightened the same way.

## Other findings

- `/favicon.ico` returns the 404 page (the icons are under `/tab/`); browsers request it anyway.
- Cloudflare's image optimizer falls back from AVIF to JPEG for very tall images (the 280x7685 phone screenshot came back as a 250 KB JPEG at w=256).
- The hero portrait's swap to the watercolor version every 3 s is a deliberate design (from the portfolio), pauses off screen and under reduced motion; no CLS was reproduced in 9 runs.
