// The Playwright jobs ci.yml runs, by tier (tests/e2e/README.md has the rules):
//
// - pr:    every pull request. The API tests and the whole suite on Chromium,
//          plus the tests tagged @cross-browser on Firefox, WebKit and the
//          two phones.
// - smoke: a push to main. The tests tagged @smoke on Chromium: the pull
//          request already ran the rest on this code.
// - full:  the nightly run, the release train and "Run workflow" (unless
//          "full" is unticked): every test on every project.
//
// Prints `tier=...` and `matrix=...` lines for $GITHUB_OUTPUT:
//   node scripts/e2e-matrix.mjs <event> <full>
// <full> is the workflow's `full` input: "true", "false" or "" (a pull
// request or push, which have no inputs).

/**
 * One job: a project, optionally a shard of it, one worker where the browser
 * is slow enough to overload the runner with two, and a tag to run only.
 * @param {string} project
 * @param {{ shard?: string, workers?: number, grep?: string }} [options]
 */
const job = (project, { shard, workers, grep } = {}) => ({
  id: [project, grep?.slice(1), shard?.replace('/', 'of')].filter(Boolean).join('-'),
  name: [project, grep, shard].filter(Boolean).join(' '),
  project,
  shard: shard ?? '',
  workers: workers ?? '',
  grep: grep ?? '',
})

/**
 * A project in `count` shards, each with the given options.
 * @param {string} project
 * @param {number} count
 * @param {{ workers?: number, grep?: string }} [options]
 */
const sharded = (project, count, options = {}) =>
  Array.from({ length: count }, (_, i) => job(project, { ...options, shard: `${i + 1}/${count}` }))

export const MATRIX = {
  // WebKit and mobile Safari are the slowest projects, and with two workers
  // they overloaded the runner and timed out at random on main: one worker,
  // in thirds (as halves, the first half took 20 to 24 of its 25 minutes).
  full: [
    job('api'),
    job('chromium'),
    job('firefox'),
    ...sharded('webkit', 3, { workers: 1 }),
    job('mobile-chrome'),
    ...sharded('mobile-safari', 3, { workers: 1 }),
  ],
  pr: [
    job('api'),
    ...sharded('chromium', 2),
    job('firefox', { grep: '@cross-browser' }),
    ...sharded('webkit', 2, { workers: 1, grep: '@cross-browser' }),
    job('mobile-chrome', { grep: '@cross-browser' }),
    ...sharded('mobile-safari', 2, { workers: 1, grep: '@cross-browser' }),
  ],
  smoke: [job('chromium', { grep: '@smoke' })],
}

/**
 * The tier for a run: the `full` input wins, then the event decides.
 * @param {string} event github.event_name
 * @param {string} full the `full` input: "true", "false" or ""
 * @returns {'full' | 'pr' | 'smoke'}
 */
export function tierFor(event, full) {
  if (full === 'true') return 'full'
  if (event === 'push') return 'smoke'
  return 'pr'
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [event = '', full = ''] = process.argv.slice(2)
  const tier = tierFor(event, full)
  console.log(`tier=${tier}`)
  console.log(`matrix=${JSON.stringify({ include: MATRIX[tier] })}`)
}
