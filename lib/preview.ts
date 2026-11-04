import { draftMode } from 'next/headers'

/**
 * Draft previews (docs/SANITY.md): the Studio's "Preview" button opens
 * /api/draft-mode/enable with a one-hour secret it wrote into the dataset;
 * the site checks it with its read token and switches on Next's draft mode
 * for that browser. While it's on, Sanity reads include drafts, nothing is
 * cached, and pages say "noindex".
 */

/** Whether this request is a draft preview. False outside a request (the build). */
export async function isPreview(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled
  } catch {
    return false
  }
}

/**
 * A site path to send the previewer to, or /blog: only same-site paths, so the
 * preview links can't be used to redirect anyone elsewhere.
 */
export function safePreviewPath(path: string | null | undefined): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return '/blog'
  try {
    const url = new URL(path, 'https://n8builds.dev')
    if (url.origin !== 'https://n8builds.dev') return '/blog'
    return `${url.pathname}${url.search}`
  } catch {
    return '/blog'
  }
}
