# End-to-end tests

Playwright drives a production build of the site in test mode (see `playwright.config.ts` for the projects and the test environment).
This page covers which tests run where in CI, and how to tag a new test so it lands in the right tier.

## Tiers

CI (`.github/workflows/ci.yml`) picks its Playwright jobs from `scripts/e2e-matrix.mjs`:

| When | What runs |
| --- | --- |
| A pull request | The `@smoke` tests plus the spec files of the areas it changes on `chromium`, the API specs among those on `api`, and those specs' `@cross-browser` tests on `firefox`, `webkit`, `mobile-chrome` and `mobile-safari` |
| A pull request that changes a shared file | `api` and the whole suite on `chromium`, plus every `@cross-browser` test on the other projects |
| A docs-only pull request (Markdown, `docs/`, the license) | No browser tests |
| A push to `main` | The tests tagged `@smoke` on `chromium` (the pull request already ran the rest on this code) |
| Nightly, the release train, "Run workflow", and a pull request labelled `full-e2e` | Every test on every project |

"Run workflow" has a `full` box, ticked by default; untick it to run the whole-suite pull request tier instead.
Labelling a pull request `full-e2e` starts a full run on its branch at once (`.github/workflows/full-e2e.yml`), and every later push to it runs in full too.
Use it when a change reaches further than its imports show: a change in how the site behaves everywhere, a risky refactor, or a release-blocking fix.

The "What changed" job's summary lists each changed file, the areas it ran, and the jobs.

To run a tier locally, pass the same filters:

```sh
npx playwright test --project=chromium --grep @smoke
npx playwright test --project=webkit --grep @cross-browser
```

## Areas: which specs a change runs

`tests/e2e/areas.json` maps the source to the specs, in one reviewed file:

- `groups`: each area's spec files (`specs`) and the files that own it (`sources`): its route under `app/`, its sections and components, its data and its images under `public/`.
- `inherit`: building blocks with no area of their own (`lib/`, `hooks/`, `data/`, `components/ui/`, the test helpers).
  They take the areas of whatever imports them.
- `shared`: files every page depends on (the layout, `globals.css`, the fonts, the Next, Playwright and TypeScript config, `package.json` and the lockfile, the Sentry setup, the D1 migrations, the workflows, and this map itself).
  A change to one runs the whole suite.
- `none`: files no browser test depends on (unit tests, scripts, docs, the Worker, lint config).
- `always`: areas that join every pull request that runs any area (`site`: every page renders cleanly, and the security headers).

A changed file runs the specs of its own areas and of every area owning a file that imports it, however indirectly; `scripts/e2e-matrix.mjs` reads the imports itself.
So a change to `components/ui/Reveal.tsx` runs every area that uses it, and a change to `components/log/LogFeed.tsx` only the build log's.
A changed spec runs itself, and a changed test helper the specs that import it.
A file the map doesn't name runs everything.

To see what a change would run:

```sh
node scripts/e2e-matrix.mjs --explain components/sections/Hero.tsx lib/sanity.ts
```

`tests/unit/e2e-matrix.test.ts` fails when a spec isn't in exactly one area, when a file in the repo isn't in the map, when a component folder, section or route has no area of its own, or when an entry matches nothing.
So a new spec, section or route needs a line here in the same pull request:

- A new spec: add it to the area whose source it tests.
- A new section, component folder or route: add it to an area's `sources` (a new area needs its own specs).
- A new building block under `lib/`, `hooks/`, `data/` or `components/ui/`: nothing to do, unless only shared files import it (then add it to `shared`).

## Running tests locally

Run only the specs your branch affects, and leave the full run to CI:

```sh
npm run test:affected                    # api and chromium, for everything changed since origin/main
npm run test:affected -- --list          # only show what would run, and why
npm run test:affected -- --project=webkit --grep @cross-browser
```

When the branch changes a shared file, it says so and runs nothing: the pull request runs the whole suite on every browser in CI.
Run a spec by name when you need one (`npx playwright test --project=chromium tests/e2e/hero.spec.ts`); `npm run test:e2e` runs the whole Chromium suite, which takes a while on a laptop and is rarely worth it.

## Tagging a test

Tag with Playwright's `tag` option, on the test or on a `test.describe` that holds only tests that need it:

```ts
test('the rail marks the part being read', { tag: '@cross-browser' }, async ({ page }) => {
  // ...
})
```

A test can carry both tags: `{ tag: ['@cross-browser', '@smoke'] }`.

### `@cross-browser`: the engine or the device can change the result

Tag a test when a browser engine or a phone could plausibly pass or fail it differently.
That means:

- Layout that depends on the engine: font metrics and line breaking (labels that must stay on one line, text that must fit a width), the scrollbar (WebKit on Linux draws one and leaves it out of media queries), sticky and fixed elements, and nothing scrolling sideways.
- Scrolling: jumps to an anchor, smooth scrolling, scroll anchoring (the Safari jump fixed in #141), and where the page lands after a navigation.
- IntersectionObserver and everything driven by it: reveals, carousels and animations that run only on screen, lazy loading.
- Motion: CSS and Web Animations, and reduced motion.
- Focus and keyboard behaviour: tab order, focus rings, arrow keys in widgets, focus after a click.
- Touch and phone layout: taps, swipes, hover-only affordances, the mobile menu.
- Forms whose input behaviour differs by browser: validation focus, implicit submission, Turnstile, autofill colours.
- Media: video and audio (the Scribe tour, the dino music).
- Anything that already branches on `browserName`, `isMobile` or `hasTouch`, or that a past bug showed was engine-specific (search the spec's comments and `git log` for WebKit, Firefox and Safari).

For a sweep over widths, tag the representative ones (usually the narrowest phone and a breakpoint edge), not every width: the full sweep still runs on Chromium on every pull request that touches its area, and on every browser nightly.

Leave a test untagged when the engine can't change the outcome: content and copy, links and their targets, SEO and metadata, security headers, the consent logic, data rendering, API behaviour, and game or timer logic that is the same in every engine.
Those run on Chromium on every pull request that touches their area, and on every browser nightly.

### `@smoke`: the quick check after a merge

The push to `main` runs only `@smoke`, so keep it small (about 60 to 100 tests) and broad: every page loads without errors, the navigation and menus work, the contact form and the waitlist send, and each part's main interaction works once.
Tag a test `@smoke` only when it is the one test that proves a page or a key interaction works at all; leave edge cases and layout sweeps out.

## Writing tests

- Every test runs on every project nightly, so a test that is right only on Chromium must say so with `test.skip(browserName !== 'chromium', 'why')`.
- Don't add retries: fix the flake (`playwright.config.ts` sets `retries: 0`).
- Before adding a test, check for one that already asserts the same thing; extend it instead of repeating its setup.
