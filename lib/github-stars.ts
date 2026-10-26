/**
 * A public repo's star count, for the Star half of RepoButtons. Fetched on the
 * server and cached for an hour (like the build log and the downloads), so it
 * costs no client JS and at most one GitHub call per repo an hour. Null when
 * GitHub can't say: the button then shows just the star. The E2E suite
 * (BUILD_LOG_FIXTURE=1) never calls GitHub; it reads FIXTURE_STARS, where one
 * repo has a count and the rest have none, so both looks are covered.
 */
export const FIXTURE_STARS: Record<string, number> = { 'n8watkins/scribe': 1234 }

export async function repoStars(repo: string): Promise<number | null> {
  if (process.env.BUILD_LOG_FIXTURE === '1') return FIXTURE_STARS[repo] ?? null
  try {
    const token = process.env.GITHUB_TOKEN
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'n8builds-web',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const { stargazers_count } = (await res.json()) as { stargazers_count?: unknown }
    return typeof stargazers_count === 'number' ? stargazers_count : null
  } catch {
    return null
  }
}

/** `owner/name` from a GitHub repo URL, or null when it isn't one. */
export function repoFromUrl(url: string): string | null {
  const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(url)
  return m ? `${m[1]}/${m[2]}` : null
}

/** 1234 -> "1.2k"; small counts as they are. */
export function formatStars(n: number): string {
  if (n < 1000) return String(n)
  const k = n / 1000
  return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`
}
