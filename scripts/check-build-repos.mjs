// Reports on the repos that feed the /builds log (the builds with a `repo` in
// data/builds.tsx): each one's latest release, whether it has adopted the n8
// release standard (release-kit, and which version), and whether its newest
// commits pass the standard's commit check.
//
//   GITHUB_TOKEN=... node scripts/check-build-repos.mjs
//
// The nightly workflow runs it. It fails only when a repo can't be read (a
// revoked or expired token, a repo gone private), so a token problem is caught
// before the log goes stale; everything else is information.

import { appendFileSync } from 'node:fs'
import { trackedRepos } from './build-log-fixture.mjs'

const RECENT = 20

// The release-kit commit check (release-kit/template/scripts/release-kit/conventional.mjs).
const TYPES = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'style', 'revert']
const HEADER = /^([a-z]+)(?:\(([^()\s][^()]*)\))?(!)?: (\S.*)$/
const isExempt = (header) => /^(Merge |Revert "|fixup! |squash! |amend! )/.test(header) || /^Initial commit\b/.test(header)
export function passesCommitCheck(message) {
  const header = message.replace(/\r/g, '').split('\n')[0].trim()
  if (!header) return false
  if (isExempt(header)) return true
  if (header.length > 100) return false
  const match = HEADER.exec(header)
  return !!match && TYPES.includes(match[1])
}

async function gh(path, { optional = false } = {}) {
  const token = process.env.GITHUB_TOKEN
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'n8builds-web',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (optional && res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`)
  return res.json()
}

async function check(repo) {
  const [, releases, commits, kit] = await Promise.all([
    gh(`/repos/${repo}`),
    gh(`/repos/${repo}/releases?per_page=1`),
    // The owner's commits, as the log reads them (a bot can fill a repo's newest 100).
    gh(`/repos/${repo}/commits?per_page=${RECENT * 2}&author=${repo.split('/')[0]}`),
    gh(`/repos/${repo}/contents/scripts/release-kit/VERSION`, { optional: true }),
  ])
  const human = commits.filter((c) => !/\[bot\]$/.test(c.author?.login ?? '')).slice(0, RECENT)
  const passing = human.filter((c) => passesCommitCheck(c.commit.message)).length
  const latest = releases[0]
  return {
    repo,
    release: latest ? `${latest.tag_name} (${latest.published_at?.slice(0, 10)})` : 'none',
    kit: kit ? `v${Buffer.from(kit.content, 'base64').toString('utf8').trim()}` : 'not adopted',
    commits: `${passing}/${human.length} pass`,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = []
  const unreadable = []
  for (const repo of trackedRepos()) {
    try {
      rows.push(await check(repo))
    } catch (error) {
      unreadable.push(`${repo}: ${error.message}`)
    }
  }

  const table = [
    '| Repo | Latest release | release-kit | Newest commits |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ${r.repo} | ${r.release} | ${r.kit} | ${r.commits} |`),
    ...unreadable.map((line) => `| ${line.split(':')[0]} | unreadable | - | - |`),
  ].join('\n')
  console.log(table)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Build log repos\n\n${table}\n`)

  if (unreadable.length) {
    console.error(`\nCan't read ${unreadable.length} tracked repo(s); the build log would go stale:\n${unreadable.join('\n')}`)
    console.error('Check the token (GITHUB_TOKEN in Vercel, BUILD_LOG_GITHUB_TOKEN in the repo secrets) and that each repo is still public.')
    process.exit(1)
  }
}
