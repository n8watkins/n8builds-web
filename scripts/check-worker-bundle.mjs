// Checks the Worker bundle that `wrangler deploy --dry-run --outdir <dir>`
// wrote (npm run check:deploy): no esbuild __name() helper calls.
//
// With keepNames on, esbuild wraps functions in __name(fn, "fn"). A function
// the app turns into an inline <script> with toString() (next-themes' theme
// script) then carries the call into the browser, where __name doesn't exist:
// "ReferenceError: __name is not defined" on every page the Worker renders.
// wrangler.jsonc turns keep_names off; this keeps it off.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
if (!dir) {
  console.error('usage: node scripts/check-worker-bundle.mjs <wrangler --outdir>')
  process.exit(2)
}

function* files(path) {
  for (const name of readdirSync(path)) {
    const full = join(path, name)
    if (statSync(full).isDirectory()) yield* files(full)
    else if (/\.(m?js|cjs)$/.test(name)) yield full
  }
}

let checked = 0
const offenders = []
for (const file of files(dir)) {
  checked++
  const count = readFileSync(file, 'utf8').split('__name(').length - 1
  if (count > 0) offenders.push(`${file}: ${count}`)
}

if (checked === 0) {
  console.error(`No bundle files in ${dir}: did wrangler write its --outdir?`)
  process.exit(1)
}
if (offenders.length > 0) {
  console.error('The Worker bundle calls esbuild\'s __name() helper (keep_names is on?):')
  for (const line of offenders) console.error(`  ${line}`)
  console.error('Inline scripts made with toString() would throw "__name is not defined". Set "keep_names": false in wrangler.jsonc.')
  process.exit(1)
}
console.log(`Worker bundle: ${checked} files, no __name() calls.`)
