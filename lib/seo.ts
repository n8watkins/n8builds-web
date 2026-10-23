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

/**
 * Shorten text for a share card (previews show about 120 characters): whole
 * sentences while they fit, so the card never ends mid-thought. Falls back to
 * a word-boundary cut when even the first sentence is too long.
 */
export function shareSummary(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  // A sentence ends at . ! or ? followed by a space, so "n8builds.dev" stays whole.
  let out = ''
  for (const sentence of clean.split(/(?<=[.!?])\s+/)) {
    const next = out ? `${out} ${sentence}` : sentence
    if (next.length > max) break
    out = next
  }
  return out || summarize(clean, max)
}

/** Absolute URL for a site-relative path. */
export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString()

// Structured data (schema.org JSON-LD), rendered by components/JsonLd.tsx.
// The person and the site have stable @ids so every page can reference them.
const PERSON_ID = `${SITE_URL}/#person`
const WEBSITE_ID = `${SITE_URL}/#website`

export const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: SITE_URL,
      name: SITE_NAME,
      description: 'Building software in public: apps, AI tools, Chrome extensions, and build logs.',
      inLanguage: 'en-US',
      publisher: { '@id': PERSON_ID },
    },
    {
      '@type': 'Person',
      '@id': PERSON_ID,
      name: 'Nathan Watkins',
      alternateName: 'n8',
      url: SITE_URL,
      image: absoluteUrl('/tab/n8-icon.png'),
      jobTitle: 'Software developer',
      sameAs: [
        'https://github.com/n8watkins',
        'https://x.com/n8watkins',
        'https://www.linkedin.com/in/n8watkins',
        'https://youtube.com/@n8watkins',
        'https://twitch.tv/n8watkins',
        'https://portfolio.n8builds.dev',
        'https://appturnity.com',
      ],
    },
  ],
}

export function blogPostingJsonLd(post: {
  title: string
  description: string
  path: string
  image: string
  publishedAt: string
  updatedAt?: string
}) {
  const url = absoluteUrl(post.path)
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: url,
    image: absoluteUrl(post.image),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: 'en-US',
    author: { '@type': 'Person', '@id': PERSON_ID, name: 'Nathan Watkins', url: SITE_URL },
    publisher: { '@id': PERSON_ID },
    isPartOf: { '@type': 'Blog', name: 'N8 Notions', url: absoluteUrl('/blog') },
  }
}
