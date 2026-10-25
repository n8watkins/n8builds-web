import { describe, expect, it } from 'vitest'
import { builds } from '@/data/builds'
import { trackedRepos } from '@/scripts/build-log-fixture.mjs'
import { passesCommitCheck } from '@/scripts/check-build-repos.mjs'

describe('the tracked repos script', () => {
  it('reads the same repos from data/builds.tsx as the site, and none of the hidden builds', () => {
    expect(trackedRepos()).toEqual(builds.filter((b) => b.repo).map((b) => b.repo))
  })

  it('applies the release-kit commit check', () => {
    expect(passesCommitCheck('feat(popup): summarize inline from the popup')).toBe(true)
    expect(passesCommitCheck('Merge pull request #7 from n8watkins/dependabot/x')).toBe(true)
    expect(passesCommitCheck('Lower first-sentence latency: small first chunk + prefetch pipeline')).toBe(false)
    expect(passesCommitCheck('security: verify every model download with SHA-256')).toBe(true)
    expect(passesCommitCheck('\r\n\nfix: a message with leading blank lines\r\n')).toBe(true)
    expect(passesCommitCheck('chore(deps): bump x')).toBe(true)
    expect(passesCommitCheck('')).toBe(false)
    expect(passesCommitCheck(`feat: ${'x'.repeat(100)}`)).toBe(false)
  })
})
