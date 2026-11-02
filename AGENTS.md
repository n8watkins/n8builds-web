<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- release-kit -->
## Commits and releases

- Write every commit message as a Conventional Commit: `type(scope): subject`, with type one of feat, fix, perf, security, refactor, docs, test, build, ci, chore, style, revert. A hook and a CI check reject anything else; see RELEASING.md.
- Use `feat` and `fix` only for changes a user would notice: they become the release notes and the public build log.
- Write those subjects as patch notes, for users: what they can now do or what works better, not the file, library or test you touched. When the subject must stay technical, add a `Release-note: <plain sentence>` line to the body, or `Release-note: skip` for a change no user would notice.
- Don't bump versions, edit CHANGELOG.md or create tags by hand: `npm run release` does all three.
<!-- /release-kit -->

## Owner decisions

- The owner's standing rules (brand, content, publishing, releases, operations) are in `docs/DECISIONS.md`. Read it before changing content, design or workflow; never re-ask a settled question.
- Record every new owner decision there, with its date, in the same change.

## Bundler: Turbopack everywhere

- Dev servers and tests run on Turbopack; never add `--webpack` to `next dev`, and never cap the heap (`NODE_OPTIONS=--max-old-space-size`): a capped heap makes Next restart and fail requests instead of saving memory.
- The production build (`npm run build`, Playwright's test build, Lighthouse, Vercel) runs on Turbopack too (owner decision, 2026-11-01, in `docs/DECISIONS.md`).
  Add `--webpack` back only for something that genuinely needs it, and write the reason here.
- Webpack-only settings do nothing under Turbopack, so use the ones both bundlers read:
  the bundle analyzer is `npm run analyze` (`next analyze`), not `@next/bundle-analyzer`, and Sentry's `webpack` options are ignored.
  Sentry's `bundleSizeOptimizations` in `next.config.mjs` do apply: since v11 the SDK turns them into Turbopack `compiler.define` flags itself.
- A worktree needs its own `npm ci`: Turbopack refuses a `node_modules` symlinked from outside the project.

## Where things live

- `docs/NEXT_STEPS.md`: the owner's to-dos (decisions, keys), what agents build next, and a done log with PR numbers.
- `docs/DECISIONS.md`: the owner's standing decisions; `docs/HANDOFF.md`: current state and conventions.

## Before pushing and before local previews

- Keep every commit header at 100 characters or less: the commit check runs on every commit in a PR, and force pushes are blocked, so a long header means a fresh branch and new PR. Check with `git log --format=%s origin/main.. | awk 'length>100'`.
- Build from a clean `.next` (`rm -rf .next`) before a local preview or Playwright run: a reused build cache once shipped stale Tailwind CSS that wasn't on the live site.
- Stop any old server on the E2E port first: `reuseExistingServer` silently tests a stale build.
