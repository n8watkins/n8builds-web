# End-to-end tests

Playwright drives a production build of the site in test mode (see `playwright.config.ts` for the projects and the test environment).
This page covers which tests run where in CI, and how to tag a new test so it lands in the right tier.

## Tiers

CI (`.github/workflows/ci.yml`) picks its Playwright jobs from `scripts/e2e-matrix.mjs`:

| When | What runs |
| --- | --- |
| Every pull request | `api` and the whole suite on `chromium`, plus the tests tagged `@cross-browser` on `firefox`, `webkit`, `mobile-chrome` and `mobile-safari` |
| A push to `main` | The tests tagged `@smoke` on `chromium` (the pull request already ran everything else on this code) |
| Nightly, the release train, and "Run workflow" | Every test on every project |

"Run workflow" has a `full` box, ticked by default; untick it to run the pull request tier instead.

To run a tier locally, pass the same filters:

```sh
npx playwright test --project=chromium --grep @smoke
npx playwright test --project=webkit --grep @cross-browser
```

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

For a sweep over widths, tag the representative ones (usually the narrowest phone and a breakpoint edge), not every width: the full sweep still runs on Chromium on every pull request and on every browser nightly.

Leave a test untagged when the engine can't change the outcome: content and copy, links and their targets, SEO and metadata, security headers, the consent logic, data rendering, API behaviour, and game or timer logic that is the same in every engine.
Those run on Chromium on every pull request, and on every browser nightly.

### `@smoke`: the quick check after a merge

The push to `main` runs only `@smoke`, so keep it small (about 60 to 100 tests) and broad: every page loads without errors, the navigation and menus work, the contact form and the waitlist send, and each part's main interaction works once.
Tag a test `@smoke` only when it is the one test that proves a page or a key interaction works at all; leave edge cases and layout sweeps out.

## Writing tests

- Every test runs on every project nightly, so a test that is right only on Chromium must say so with `test.skip(browserName !== 'chromium', 'why')`.
- Don't add retries: fix the flake (`playwright.config.ts` sets `retries: 0`).
- Before adding a test, check for one that already asserts the same thing; extend it instead of repeating its setup.
