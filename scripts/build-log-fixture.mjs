// Captures the build log's GitHub fixture (tests/fixtures/build-log-github.json)
// from the live repos, so unit and E2E tests run against real commit messages
// and releases without ever calling GitHub themselves.
//
//   GITHUB_TOKEN=... node scripts/build-log-fixture.mjs
//
// It fetches what lib/build-log.ts fetches (the repo, its releases and the
// owner's commits on the default branch, paged back to the log's 12-month
// window as `collectCommits` does) and stores it in the same
// normalized shape. On top of that it keeps the newest bot commits (which the
// real fetch never asks for), so the bot filter is tested against real ones.
// The highlights are a hand-written sample, not Sanity data.

import { readFileSync, writeFileSync } from 'node:fs'

const OUT = 'tests/fixtures/build-log-github.json'
const BOT_COMMITS = 15

/** `repo: 'owner/name'` of every visible build (hiddenBuilds stay out). */
export function trackedRepos(source = readFileSync('data/builds.tsx', 'utf8')) {
  const visible = source.split('export const hiddenBuilds')[0]
  return [...visible.matchAll(/^\s*repo: '([\w.-]+\/[\w.-]+)',?$/gm)].map((m) => m[1])
}

async function gh(path) {
  const token = process.env.GITHUB_TOKEN
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'n8builds-web',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`)
  return res.json()
}

const commit = (c) => ({
  sha: c.sha,
  message: c.commit.message.split('\n')[0],
  date: c.commit.committer?.date ?? c.commit.author?.date,
  author: c.author?.login ?? c.commit.author?.name ?? null,
  parents: c.parents.length,
  url: c.html_url,
})

const release = (r) => ({
  tag: r.tag_name,
  name: r.name || r.tag_name,
  publishedAt: r.published_at,
  url: r.html_url,
  draft: r.draft,
  prerelease: r.prerelease,
})

// Mirrors lib/build-log.ts (COMMIT_PAGE_SIZE, MAX_COMMIT_PAGES, historyCutoff, collectCommits).
const PAGE_SIZE = 100
const MAX_PAGES = 10
const now = new Date()
const CUTOFF = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)).toISOString()

async function ownerCommits(repo, owner) {
  const commits = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await gh(`/repos/${repo}/commits?per_page=${PAGE_SIZE}&author=${owner}${page > 1 ? `&page=${page}` : ''}`)
    commits.push(...batch)
    const oldest = Math.min(...batch.map((c) => Date.parse(c.commit.committer?.date ?? c.commit.author?.date)).filter((t) => !Number.isNaN(t)))
    if (batch.length < PAGE_SIZE || !Number.isFinite(oldest) || oldest < Date.parse(CUTOFF)) break
  }
  return commits
}

async function snapshot(repo) {
  const owner = repo.split('/')[0]
  const [info, releases, mine, all] = await Promise.all([
    gh(`/repos/${repo}`),
    gh(`/repos/${repo}/releases?per_page=100`),
    ownerCommits(repo, owner),
    gh(`/repos/${repo}/commits?per_page=100`),
  ])
  const bots = all.filter((c) => /\[bot\]$/.test(c.author?.login ?? c.commit.author?.name ?? '')).slice(0, BOT_COMMITS)
  const commits = [...mine, ...bots]
    .map(commit)
    .filter((c, i, list) => list.findIndex((o) => o.sha === c.sha) === i)
    .sort((a, b) => b.date.localeCompare(a.date))
  return { repo, pushedAt: info.pushed_at, releases: releases.map(release), commits }
}

const highlights = [
  {
    id: 'fixture-highlight-tldw',
    date: '2026-07-20',
    build: 'tldw',
    kind: 'shipped',
    title: 'TL;DW 1.0 is packaged for the Chrome Web Store',
    note: 'Bring your own Gemini key, summaries cached per prompt, and a clear message when a key or the daily quota runs out.',
    link: 'https://github.com/n8watkins/tl-dw',
  },
]

if (import.meta.url === `file://${process.argv[1]}`) {
  const repos = trackedRepos()
  const snapshots = []
  for (const repo of repos) snapshots.push(await snapshot(repo))
  const fixture = { capturedAt: new Date().toISOString(), snapshots, highlights }
  writeFileSync(OUT, `${JSON.stringify(fixture, null, 1)}\n`)
  console.log(`Wrote ${OUT}: ${snapshots.map((s) => `${s.repo} (${s.commits.length} commits, ${s.releases.length} releases)`).join(', ')}`)
}
