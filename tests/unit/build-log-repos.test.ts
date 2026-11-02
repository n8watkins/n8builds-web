import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { UPCOMING } from '@/data/upcoming'
import { toolsIBuilt } from '@/data/loadout'
import { allBuilds } from '@/lib/build-log'
import { BUILD_ICONS } from '@/lib/build-meta'
import { trackedRepos } from '@/scripts/build-log-fixture.mjs'
import { passesCommitCheck } from '@/scripts/check-build-repos.mjs'

describe('the tracked repos script', () => {
  it('reads the same repos from data/builds.tsx and data/logBuilds.ts as the site, and none of the hidden builds', () => {
    expect(trackedRepos()).toEqual(allBuilds.filter((b) => b.repo).map((b) => b.repo))
  })

  it('follows every upcoming project with a public repo and every tool I built (round 5 of 2026-11-02)', () => {
    const repos = new Set(allBuilds.map((b) => b.repo))
    for (const project of UPCOMING.filter((p) => p.repo)) expect(repos, project.name).toContain(project.repo)
    for (const tool of toolsIBuilt) expect(repos, tool.name).toContain(tool.github.replace('https://github.com/', ''))
    // Its log row links the project's card where the site shows it.
    for (const project of UPCOMING.filter((p) => p.repo)) {
      expect(allBuilds.find((b) => b.repo === project.repo)?.href).toBe(`/upcoming#${project.slug}`)
    }
  })

  it('gives every followed project an icon that exists, and unique slugs', () => {
    const slugs = allBuilds.map((b) => b.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const build of allBuilds.filter((b) => b.repo)) {
      expect(BUILD_ICONS[build.slug], build.slug).toBeTruthy()
      expect(existsSync(`public${BUILD_ICONS[build.slug]}`), BUILD_ICONS[build.slug]).toBe(true)
    }
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
