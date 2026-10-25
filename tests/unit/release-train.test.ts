// The release train's setup in this repo: the schedule, and the checks it runs
// on its release commit before moving the protected main.
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')
const config = JSON.parse(read('.release.json'))

describe('the release train', () => {
  it('runs weekly on the schedule in .release.json', () => {
    expect(config.train.schedule).toBe('0 16 * * 1')
    expect(read('.github/workflows/release-train.yml')).toContain(`- cron: "${config.train.schedule}" # release-kit: schedule`)
  })

  it('runs the workflows behind the required checks ("CI result" and "check") on its release commit', () => {
    expect(config.train.checks).toEqual(['ci.yml', 'commits.yml'])
    for (const file of config.train.checks) expect(existsSync(`.github/workflows/${file}`)).toBe(true)
    expect(read('.github/workflows/commits.yml')).toMatch(/^ {2}check:$/m)
    // The train starts each of them with workflow_dispatch.
    expect(read('.github/workflows/commits.yml')).toMatch(/^ {2}workflow_dispatch:$/m)
  })

  it('dates releases in Los Angeles and checks with the Node version CI uses', () => {
    expect(config.timeZone).toBe('America/Los_Angeles')
    expect(read('.github/workflows/ci.yml')).toContain(`node-version: ${config.node}`)
  })
})
