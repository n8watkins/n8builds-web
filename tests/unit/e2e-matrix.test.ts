// The Playwright jobs ci.yml runs for each tier (scripts/e2e-matrix.mjs).
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MATRIX as matrix, tierFor } from '@/scripts/e2e-matrix.mjs'

type Job = (typeof matrix)['full'][number]
const PROJECTS = ['api', 'chromium', 'firefox', 'webkit', 'mobile-chrome', 'mobile-safari']

/** Every project's jobs, shard by shard, so a missing or doubled shard shows. */
const shardsOf = (jobs: Job[]) =>
  Object.fromEntries(PROJECTS.map((p) => [p, jobs.filter((j) => j.project === p).map((j) => j.shard || 'all')]))

describe('the E2E tiers', () => {
  it('runs everything when the full input is on, whatever started the run', () => {
    for (const event of ['workflow_dispatch', 'schedule', 'push', 'pull_request']) expect(tierFor(event, 'true')).toBe('full')
  })

  it('runs the pull request tier on pull requests and when "full" is unticked', () => {
    expect(tierFor('pull_request', '')).toBe('pr')
    expect(tierFor('workflow_dispatch', 'false')).toBe('pr')
  })

  it('runs the smoke tier on a push to main', () => {
    expect(tierFor('push', '')).toBe('smoke')
  })

  it('runs every project in full, each shard once, with no filter', () => {
    expect(shardsOf(matrix.full)).toEqual({
      api: ['all'],
      chromium: ['all'],
      firefox: ['all'],
      webkit: ['1/3', '2/3', '3/3'],
      'mobile-chrome': ['all'],
      'mobile-safari': ['1/3', '2/3', '3/3'],
    })
    expect(matrix.full.every((j) => j.grep === '')).toBe(true)
  })

  it('runs the API and Chromium whole on a pull request, and only @cross-browser on the other browsers', () => {
    for (const job of matrix.pr) expect(job.grep, job.name).toBe(['api', 'chromium'].includes(job.project) ? '' : '@cross-browser')
    const shards = shardsOf(matrix.pr)
    for (const project of PROJECTS) {
      const count = shards[project].length
      expect(shards[project], project).toEqual(count === 1 ? ['all'] : Array.from({ length: count }, (_, i) => `${i + 1}/${count}`))
    }
  })

  it('runs only the @smoke tests on Chromium after a push', () => {
    expect(matrix.smoke.map((j) => [j.project, j.grep, j.shard])).toEqual([['chromium', '@smoke', '']])
  })

  it('gives every job a distinct name and an id fit for an artifact name', () => {
    for (const jobs of Object.values(matrix)) {
      expect(new Set(jobs.map((j) => j.name)).size).toBe(jobs.length)
      expect(new Set(jobs.map((j) => j.id)).size).toBe(jobs.length)
      for (const job of jobs) expect(job.id).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('prints the tier and the matrix for $GITHUB_OUTPUT, and ci.yml reads them', () => {
    const out = execFileSync('node', ['scripts/e2e-matrix.mjs', 'push', ''], { encoding: 'utf8' }).trim().split('\n')
    expect(out[0]).toBe('tier=smoke')
    expect(JSON.parse(out[1].replace(/^matrix=/, ''))).toEqual({ include: matrix.smoke })
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8')
    expect(ci).toContain('node scripts/e2e-matrix.mjs "$EVENT" "$FULL"')
    expect(ci).toContain('matrix: ${{ fromJSON(needs.changes.outputs.e2e) }}')
  })
})
