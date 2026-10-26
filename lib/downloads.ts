/**
 * Stable download links for builds that ship installers: n8builds.dev/download/<app>
 * always points at the newest release's file, though its name carries the
 * version (Scribe_0.8.0_x64-setup.exe).
 */

export interface Download {
  /** The GitHub repo (`owner/name`) whose latest release holds the file. */
  repo: string
  /** Picks the file among the release's assets. */
  asset: RegExp
}

export const DOWNLOADS: Record<string, Download> = {
  // The NSIS installer: the smaller of Scribe's two Windows installers, and the one its site offers.
  scribe: { repo: 'n8watkins/scribe', asset: /_x64-setup\.exe$/ },
}

interface Release {
  tag_name: string
  assets: { name: string; browser_download_url: string }[]
}

// The E2E suite's release (BUILD_LOG_FIXTURE=1), so the tests never call GitHub.
const FIXTURE: Release = {
  tag_name: 'v0.8.0',
  assets: [
    { name: 'latest.json', browser_download_url: 'https://github.com/n8watkins/scribe/releases/download/v0.8.0/latest.json' },
    {
      name: 'Scribe_0.8.0_x64-setup.exe',
      browser_download_url: 'https://github.com/n8watkins/scribe/releases/download/v0.8.0/Scribe_0.8.0_x64-setup.exe',
    },
    { name: 'Scribe_0.8.0_x64_en-US.msi', browser_download_url: 'https://github.com/n8watkins/scribe/releases/download/v0.8.0/Scribe_0.8.0_x64_en-US.msi' },
  ],
}

/** The releases page: where a visitor lands when the file can't be found. */
export const releasesPage = (download: Download) => `https://github.com/${download.repo}/releases/latest`

/** The newest release's file for `download`, or null when GitHub can't say. */
export async function latestAsset(download: Download): Promise<{ url: string; version: string } | null> {
  try {
    let release: Release
    if (process.env.BUILD_LOG_FIXTURE === '1') {
      release = FIXTURE
    } else {
      const token = process.env.GITHUB_TOKEN
      const res = await fetch(`https://api.github.com/repos/${download.repo}/releases/latest`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'n8builds-web',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // An hour, like the build log: a new release is picked up within the hour.
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return null
      release = (await res.json()) as Release
    }
    const file = release.assets.find((a) => download.asset.test(a.name))
    return file ? { url: file.browser_download_url, version: release.tag_name } : null
  } catch {
    return null
  }
}
