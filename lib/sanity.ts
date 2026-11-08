import { cache } from 'react'
import { createClient, type QueryParams } from '@sanity/client'
import { sanityTag, type SanityType } from '@/lib/sanity-revalidate'
import { isPreview } from '@/lib/preview'

// Read-only client for the N8's Notions blog. Reads the shared Sanity dataset
// (project abgyc32w / production) that the Sanity Studio (n8builds.sanity.studio)
// writes to. Published documents only, without a token, except in a draft
// preview (sanityFetch). Server-only: do not import this
// into client components (keeps @sanity/client out of the browser bundle).
if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set')
}

// The live API, not the API CDN: every answer is cached by Next (below), so
// Sanity is only asked when a page revalidates, and a publish webhook's
// revalidation must read the new version, which the CDN may not have yet.
export const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-07-01',
  useCdn: false,
  stega: false,
})

/** The fallback refresh, should a publish webhook never arrive. */
export const SANITY_REVALIDATE = 3600

/**
 * Every read goes through here: cached by Next for an hour and tagged with the
 * document type it reads, so publishing one (app/api/sanity/revalidate)
 * refreshes every page that shows it at once.
 */
export async function sanityFetch<T>(type: SanityType, query: string, params: QueryParams = {}): Promise<T> {
  // A draft preview (lib/preview.ts) reads drafts with the site's read token,
  // and never through Next's cache, so a draft can't leak into a public page.
  const token = process.env.SANITY_VIEWER_TOKEN
  if (token && (await isPreview())) {
    return sanity.withConfig({ token, perspective: 'drafts' }).fetch<T>(query, params, { cache: 'no-store' })
  }
  return sanity.fetch<T>(query, params, {
    next: { revalidate: SANITY_REVALIDATE, tags: [sanityTag(type)] },
  })
}

export type Post = {
  _id: string
  _updatedAt: string
  title: string
  slug: { current: string }
  publishedAt: string
  author?: string
  topics?: string[]
  tags?: string[]
  excerpt?: string
  coverUrl?: string
  coverAlt?: string
  gallery?: { url: string; alt?: string }[]
  seoDescription?: string
  seoShareDescription?: string
  seoOgUrl?: string
  body?: any[]
}

// Card fields. The cover image asset is dereferenced to a plain CDN URL in GROQ
// so client components never need @sanity/client or @sanity/image-url.
const POST_CARD = `
  _id, _updatedAt, title, slug, publishedAt, topics, excerpt,
  "coverUrl": coverImage.asset->url,
  "coverAlt": coverImage.alt
`

// The body with its inline images dereferenced to CDN URLs and their sizes.
const POST_BODY = `
  body[]{
    ...,
    _type == "image" => {
      "url": asset->url,
      "alt": alt,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height
    }
  }
`

export const getAllPosts = () =>
  sanityFetch<Post[]>('post', `*[_type == "post"] | order(publishedAt desc){ ${POST_CARD} }`)

export const getRecentPosts = (limit = 3) =>
  sanityFetch<Post[]>('post', `*[_type == "post"] | order(publishedAt desc)[0...${limit}]{ ${POST_CARD} }`)

// cache(): generateMetadata and the page both ask for the post in one request;
// @sanity/client doesn't go through Next's fetch dedupe, so this keeps it to one
// Sanity query (an unknown slug costs one, not two).
export const getPostBySlug = cache((slug: string) =>
  sanityFetch<Post | null>(
    'post',
    `*[_type == "post" && slug.current == $slug][0]{
      ${POST_CARD},
      author,
      tags,
      "gallery": gallery[]{ "url": asset->url, "alt": alt },
      "seoDescription": seo.metaDescription,
      "seoShareDescription": seo.shareDescription,
      "seoOgUrl": seo.ogImage.asset->url,
      ${POST_BODY}
    }`,
    { slug }
  )
)

export const getRelatedPosts = (currentSlug: string) =>
  sanityFetch<Post[]>(
    'post',
    `*[_type == "post" && slug.current != $currentSlug] | order(publishedAt desc)[0...3]{ ${POST_CARD} }`,
    { currentSlug }
  )

// Every post with its full text, for the feed (/blog/rss.xml).
export const getFeedPosts = () =>
  sanityFetch<Post[]>(
    'post',
    `*[_type == "post"] | order(publishedAt desc){
      ${POST_CARD}, author, "seoDescription": seo.metaDescription, ${POST_BODY}
    }`
  )
