// Watches the GitHub Actions minutes of n8watkins's private repos, so the
// monthly allowance never runs out by surprise again.
//
// GitHub Free includes $12 of Actions compute a month: 2,000 minutes on a
// standard Linux runner ($0.006 a minute). Windows ($0.010) and macOS ($0.062)
// eat it faster; public repos don't touch it. So "minutes" here are Linux
// minutes: a repo's cost divided by the Linux rate, the way the allowance is
// spent (docs.github.com/en/billing/concepts/product-billing/github-actions).
//
// The Actions minutes workflow runs it daily. It reads this month's usage
// report (GET /users/{user}/settings/billing/usage, which needs a fine-grained
// token with the "Plan" user permission, read: secret ACTIONS_USAGE_TOKEN),
// leaves out the public repos, and compares the total with the month's pace.
// Each alert fires once a month, as an issue assigned to the owner (GitHub
// emails him): the issue's body keeps which alerts fired. The first run of a
// new month closes last month's issue.
//
//   ACTIONS_USAGE_TOKEN=... GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo node scripts/actions-usage.mjs
//
// Without ACTIONS_USAGE_TOKEN it explains how to add it and exits cleanly.

import { appendFileSync } from 'node:fs'

export const USER = 'n8watkins'
export const BUDGET = 2000 // Linux minutes a month ($12 at $0.006)
export const LINUX_RATE = 0.006
export const THRESHOLDS = [50, 75, 90, 100]
export const PACE_MARGIN = 0.25 // alert when more than 25% ahead of pace
export const PACE_FLOOR = 100 // ...but not over a handful of minutes on the 1st
export const LABEL = 'actions-usage'
const STATE = /<!-- actions-usage: (\{.*?\}) -->/

const DAY = 24 * 60 * 60 * 1000

/** The billing month (UTC) that `now` falls in. */
export function monthOf(now) {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  const start = Date.UTC(year, month - 1, 1)
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return {
    year,
    month,
    key: `${year}-${String(month).padStart(2, '0')}`,
    name: new Date(start).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    start,
    days,
    elapsed: Math.min(1, (now.getTime() - start) / (days * DAY)),
  }
}

/** Minutes an even spread would have used by now, and the weekly budget. */
export function pace(now) {
  const m = monthOf(now)
  return { expected: BUDGET * m.elapsed, weekly: (BUDGET * 7) / m.days }
}

const repoKey = (name) => String(name).split('/').pop().toLowerCase()

/** Linux minutes one usage line cost (its gross amount at the Linux rate). */
export function linuxMinutes(item) {
  const amount = typeof item.grossAmount === 'number' ? item.grossAmount : (item.quantity ?? 0) * (item.pricePerUnit ?? LINUX_RATE)
  return amount / LINUX_RATE
}

/**
 * This month's private-repo Actions minutes: the total, the last 7 days (this
 * month only, since the allowance resets on the 1st), and each repo's share,
 * biggest first. Usage with no repo counts as private.
 */
export function summarize(items, publicRepos, now) {
  const isPublic = new Set([...publicRepos].map(repoKey))
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const weekStart = Math.max(monthOf(now).start, today - 6 * DAY)
  const byRepo = new Map()
  let used = 0
  let last7 = 0
  for (const item of items) {
    if (String(item.product).toLowerCase() !== 'actions' || !/minute/i.test(String(item.unitType))) continue
    if (item.repositoryName && isPublic.has(repoKey(item.repositoryName))) continue
    const minutes = linuxMinutes(item)
    used += minutes
    if (Date.parse(String(item.date).slice(0, 10)) >= weekStart) last7 += minutes
    const repo = item.repositoryName ? repoKey(item.repositoryName) : '(no repo)'
    byRepo.set(repo, (byRepo.get(repo) ?? 0) + minutes)
  }
  const repos = [...byRepo].map(([repo, minutes]) => ({ repo, minutes })).sort((a, b) => b.minutes - a.minutes)
  return { used, last7, repos }
}

/** Every alert the numbers call for now, whether or not it fired already. */
export function alertsFor({ used, last7 }, now) {
  const { expected, weekly } = pace(now)
  const alerts = []
  for (const t of THRESHOLDS) {
    if (used >= (BUDGET * t) / 100) alerts.push({ key: `${t}%`, text: `Used ${t}% of the month's minutes.` })
  }
  if (used >= PACE_FLOOR && used > expected * (1 + PACE_MARGIN)) {
    alerts.push({ key: 'pace', text: `More than ${PACE_MARGIN * 100}% ahead of pace: ${round(used)} used, ${round(expected)} expected by now.` })
  }
  if (last7 > weekly) alerts.push({ key: 'week', text: `The last 7 days used ${round(last7)} minutes, over the weekly budget of ${round(weekly)}.` })
  return alerts
}

export const round = (n) => Math.round(n).toLocaleString('en-US')

/** The fired alerts and month an issue body records. */
export function readState(body) {
  const match = STATE.exec(body ?? '')
  try {
    const state = match && JSON.parse(match[1])
    if (state && typeof state.month === 'string' && Array.isArray(state.fired)) return state
  } catch {}
  return null
}

/** The issue body: plain numbers, the top repos, what to do, and the state. */
export function issueBody(usage, now, fired) {
  const m = monthOf(now)
  const { expected, weekly } = pace(now)
  const pct = Math.round((usage.used / BUDGET) * 100)
  const top = usage.repos.slice(0, 5)
  return [
    `**Used ${round(usage.used)} of ${round(BUDGET)} Actions minutes (${pct}%) in ${m.name}.**`,
    '',
    `- Pace: ${round(expected)} would be on track by now (day ${Math.ceil(m.elapsed * m.days)} of ${m.days}).`,
    `- Last 7 days: ${round(usage.last7)} (weekly budget ${round(weekly)}).`,
    `- Alerts this month: ${fired.length ? fired.join(', ') : 'none'}.`,
    '',
    '**Top private repos**',
    '',
    ...(top.length ? top.map((r) => `- ${r.repo}: ${round(r.minutes)}`) : ['- none yet']),
    '',
    '**What to do**',
    '',
    '- Look at the top repo first: `gh run list -R n8watkins/<repo>` shows what ran.',
    '- Pause a busy workflow with `gh workflow disable <name> -R n8watkins/<repo>`, or trim it: skip docs-only changes (`paths-ignore`), cancel superseded runs (`concurrency`), drop Windows and macOS jobs where Linux will do.',
    '- At 100%, private repos stop running Actions until the 1st (billing stays off). Public repos are not affected.',
    '',
    `Minutes are Linux minutes: Windows counts about 1.7x and macOS about 10x. Usage data can lag a few hours. Updated ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC by the [Actions minutes workflow](../actions/workflows/actions-usage.yml); this issue closes itself on the 1st.`,
    '',
    `<!-- actions-usage: ${JSON.stringify({ month: m.key, fired })} -->`,
  ].join('\n')
}

/** The job summary every run writes. */
export function summaryText(usage, now) {
  const m = monthOf(now)
  const { expected, weekly } = pace(now)
  return [
    `## Actions minutes, ${m.name}`,
    '',
    `| Used | Pace (expected by now) | Last 7 days | Weekly budget |`,
    `| --- | --- | --- | --- |`,
    `| ${round(usage.used)} of ${round(BUDGET)} (${Math.round((usage.used / BUDGET) * 100)}%) | ${round(expected)} | ${round(usage.last7)} | ${round(weekly)} |`,
    '',
    ...(usage.repos.length ? ['| Private repo | Minutes |', '| --- | --- |', ...usage.repos.map((r) => `| ${r.repo} | ${round(r.minutes)} |`)] : ['No private-repo minutes yet this month.']),
    '',
  ].join('\n')
}

function summary(text) {
  console.log(text)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`)
}

async function api(token, method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'n8builds-web-actions-usage',
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const error = new Error(`GitHub ${res.status} for ${method} ${path.split('?')[0]}`)
    error.status = res.status
    throw error
  }
  return res.status === 204 ? null : res.json()
}

async function publicRepos(token) {
  const names = []
  for (let page = 1; ; page++) {
    const repos = await api(token, 'GET', `/users/${USER}/repos?type=owner&per_page=100&page=${page}`)
    names.push(...repos.filter((r) => !r.private).map((r) => r.name))
    if (repos.length < 100) return names
  }
}

async function main() {
  const usageToken = process.env.ACTIONS_USAGE_TOKEN
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPOSITORY
  if (!usageToken) {
    console.log('::notice::ACTIONS_USAGE_TOKEN is not set, so Actions usage was not checked. Add it: docs/ACTIONS_USAGE.md.')
    summary('## Actions minutes\n\nSkipped: the `ACTIONS_USAGE_TOKEN` secret is not set yet. How to add it: `docs/ACTIONS_USAGE.md`.\n')
    return
  }
  if (!token || !repo) throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required.')

  const now = new Date()
  const m = monthOf(now)
  let report
  try {
    report = await api(usageToken, 'GET', `/users/${USER}/settings/billing/usage?year=${m.year}&month=${m.month}`)
  } catch (error) {
    if ([401, 403, 404].includes(error.status)) {
      throw new Error(`${error.message}: ACTIONS_USAGE_TOKEN can't read billing usage. It may have expired, or lack the "Plan" user permission (docs/ACTIONS_USAGE.md).`)
    }
    throw error
  }
  const usage = summarize(report.usageItems ?? [], await publicRepos(token), now)
  summary(summaryText(usage, now))

  // Find this monitor's open issues; close any from an earlier month.
  try {
    await api(token, 'POST', `/repos/${repo}/labels`, { name: LABEL, color: 'd93f0b', description: 'Actions minutes alerts (actions-usage workflow)' })
  } catch (error) {
    if (error.status !== 422) throw error // 422: the label exists
  }
  const open = await api(token, 'GET', `/repos/${repo}/issues?labels=${LABEL}&state=open&per_page=100`)
  let current = null
  for (const issue of open.filter((i) => !i.pull_request)) {
    const month = readState(issue.body)?.month
    if (!month) continue // not one of this monitor's issues
    if (month === m.key && !current) {
      current = issue
      continue
    }
    await api(token, 'POST', `/repos/${repo}/issues/${issue.number}/comments`, { body: `A new month (${m.name}) started, so this closes. A new issue opens if this month needs one.` })
    await api(token, 'PATCH', `/repos/${repo}/issues/${issue.number}`, { state: 'closed', state_reason: 'completed' })
    console.log(`Closed #${issue.number} (an earlier month).`)
  }

  const fired = readState(current?.body)?.fired ?? []
  const fresh = alertsFor(usage, now).filter((a) => !fired.includes(a.key))
  const allFired = [...fired, ...fresh.map((a) => a.key)]
  const body = issueBody(usage, now, allFired)
  const title = `Actions minutes: ${round(usage.used)} of ${round(BUDGET)} used in ${m.name}`
  const news = `@${USER} ${fresh.map((a) => a.text).join(' ')} Used ${round(usage.used)} of ${round(BUDGET)}; top repo: ${usage.repos[0]?.repo ?? 'none'}.`

  if (current) {
    await api(token, 'PATCH', `/repos/${repo}/issues/${current.number}`, { title, body })
    if (fresh.length) await api(token, 'POST', `/repos/${repo}/issues/${current.number}/comments`, { body: news })
    console.log(fresh.length ? `Alerted on #${current.number}: ${fresh.map((a) => a.key).join(', ')}` : `Updated #${current.number}; no new alerts.`)
  } else if (fresh.length) {
    const issue = await api(token, 'POST', `/repos/${repo}/issues`, {
      title,
      body: `${news}\n\n${body}`,
      assignees: [USER],
      labels: [LABEL],
    })
    console.log(`Opened #${issue.number}: ${fresh.map((a) => a.key).join(', ')}`)
  } else {
    console.log('No alerts.')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.log(`::error::${error.message}`)
    process.exit(1)
  })
}
