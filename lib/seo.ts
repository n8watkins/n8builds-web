import type { Metadata } from 'next'

/**
 * Per-page search and share metadata.
 *
 * Next.js merges metadata shallowly: a page that sets `openGraph` or `twitter`
 * replaces the layout's object entirely, image included. So every page builds
 * its metadata here, which always fills in the canonical URL, og:url, the site
 * name and a preview image (the site-wide one unless the page has its own).
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://n8builds.dev'
export const SITE_NAME = 'n8builds'

export type PreviewImage = { url: string; width?: number; height?: number; alt?: string }

export const DEFAULT_PREVIEW: PreviewImage = {
  url: '/tab/preview.png',
  width: 1200,
  height: 630,
  alt: 'n8builds: building software in public',
}

export function pageMetadata({
  title,
  description,
  path,
  shareDescription = description,
  image = DEFAULT_PREVIEW,
  article,
}: {
  title: string
  description: string
  /** Site-relative path of the page, e.g. `/blog`. Becomes the canonical URL. */
  path: string
  /** Shorter description for share cards, if the meta description is long. */
  shareDescription?: string
  image?: PreviewImage
  article?: { publishedTime?: string; authors?: string[] }
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: shareDescription,
      url: path,
      siteName: SITE_NAME,
      locale: 'en_US',
      images: [image],
      ...(article ? { type: 'article', ...article } : { type: 'website' }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: shareDescription,
      images: [image],
      creator: '@n8watkins',
    },
  }
}

/** Shorten text for a meta description at a word boundary, with an ellipsis. */
export function summarize(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.—-]+$/, '')}…`
}
