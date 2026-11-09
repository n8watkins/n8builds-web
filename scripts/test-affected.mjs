// npm run test:affected: the browser tests for the areas this branch changes
// (tests/e2e/areas.json), on Chromium and the API project, like CI's
// affected tier without the cross-browser and @smoke jobs. CI runs the rest.
//
// "Changed" is everything since the branch left origin/main: commits,
// staged and unstaged edits, and new files.
//
//   npm run test:affected                    run them
//   npm run test:affected -- --list          only show what would run and why
//   npm run test:affected -- --project=webkit --headed
//                                            extra flags go to Playwright (a
//                                            --project replaces the default two)

import { execFileSync, spawnSync } from 'node:child_process'
import { ROOT, buildImporters, loadAreas, selectFor } from './e2e-matrix.mjs'

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)

let base
try {
  base = git('merge-base', 'origin/main', 'HEAD')[0]
} catch {
  console.error('No origin/main to compare with: run `git fetch origin main` first.')
  process.exit(2)
}
const changed = [
  ...new Set([...git('diff', '--name-only', base), ...git('ls-files', '--others', '--exclude-standard')]),
].sort()

const args = process.argv.slice(2)
const listOnly = args.includes('--list')
const passThrough = args.filter((a) => a !== '--list')

const selection = selectFor(changed, loadAreas(), buildImporters())
for (const [path, r] of Object.entries(selection.reasons)) {
  const runs = r.kind === 'none' ? 'nothing' : r.kind === 'full' ? `everything (${r.why})` : r.groups.join(', ') || 'its own spec'
  console.log(`  ${path}: ${runs}`)
}

if (changed.length === 0) {
  console.log('No changes since origin/main: nothing to run.')
  process.exit(0)
}
if (selection.full) {
  console.log(
    '\nThis touches a shared file, so the pull request will run the whole suite in CI.' +
      '\nLocally, run the specs for what you changed by name, e.g. `npx playwright test --project=chromium tests/e2e/hero.spec.ts`,' +
      '\nor everything on Chromium with `npm run test:e2e` if you really need it.',
  )
  process.exit(0)
}
if (selection.specs.length === 0) {
  console.log('\nNo browser test depends on these changes.')
  process.exit(0)
}

console.log(`\nSpecs:\n${selection.specs.map((s) => `  ${s}`).join('\n')}`)
if (listOnly) process.exit(0)

const projects = passThrough.some((a) => a.startsWith('--project')) ? [] : ['--project=api', '--project=chromium']
const result = spawnSync('npx', ['playwright', 'test', ...projects, ...passThrough, ...selection.specs], { cwd: ROOT, stdio: 'inherit' })
process.exit(result.status ?? 1)
