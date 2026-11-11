import { usesFixtures } from '@/lib/fixtures'

/**
 * A public repo's facts from GitHub: its star count (the Star half of
 * RepoButtons) and its license (a build page's sidebar). Fetched on the
 * server and cached for six hours (like the build log and the downloads), so it
 * costs no client JS and at most one GitHub call per repo every six hours: both read
 * the same response. Null when GitHub can't say: the button then shows just
 * the star, the sidebar no license. The E2E suite (BUILD_LOG_FIXTURE=1) never
 * calls GitHub; it reads the fixtures below, where some repos have a value and
 * the rest have none, so both looks are covered.
 */
export const FIXTURE_STARS: Record<string, number> = { 'n8watkins/scribe': 1234 }
export const FIXTURE_LICENSES: Record<string, string> = { 'n8watkins/open-ping': 'MIT', 'n8watkins/solara': 'MIT' }

export type RepoFacts = { stars: number | null; license: string | null }

export async function repoFacts(repo: string): Promise<RepoFacts> {
  if (usesFixtures()) return { stars: FIXTURE_STARS[repo] ?? null, license: FIXTURE_LICENSES[repo] ?? null }
  try {
    const token = process.env.GITHUB_TOKEN
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'n8builds-web',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { stars: null, license: null }
    const { stargazers_count, license } = (await res.json()) as { stargazers_count?: unknown; license?: { spdx_id?: unknown } | null }
    const spdx = license?.spdx_id
    return {
      stars: typeof stargazers_count === 'number' ? stargazers_count : null,
      // GitHub says NOASSERTION for a license it can't name.
      license: typeof spdx === 'string' && spdx !== 'NOASSERTION' ? spdx : null,
    }
  } catch {
    return { stars: null, license: null }
  }
}

export async function repoStars(repo: string): Promise<number | null> {
  return (await repoFacts(repo)).stars
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
