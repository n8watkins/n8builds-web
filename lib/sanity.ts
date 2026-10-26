import { cache } from 'react'
import { createClient } from '@sanity/client'

// Read-only client for the N8's Notions blog. Reads the shared Sanity dataset
// (project abgyc32w / production) that the Sanity Studio (n8builds.sanity.studio)
// writes to. Public CDN read - no token needed. Server-only: do not import this
// into client components (keeps @sanity/client out of the browser bundle).
if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set')
}

export const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-07-01',
  useCdn: true,
  stega: false,
})

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

export const getAllPosts = () =>
  sanity.fetch<Post[]>(`*[_type == "post"] | order(publishedAt desc){ ${POST_CARD} }`)

export const getRecentPosts = (limit = 3) =>
  sanity.fetch<Post[]>(`*[_type == "post"] | order(publishedAt desc)[0...${limit}]{ ${POST_CARD} }`)

// cache(): generateMetadata and the page both ask for the post in one request;
// @sanity/client doesn't go through Next's fetch dedupe, so this keeps it to one
// Sanity query (an unknown slug costs one, not two).
export const getPostBySlug = cache((slug: string) =>
  sanity.fetch<Post | null>(
    `*[_type == "post" && slug.current == $slug][0]{
      ${POST_CARD},
      author,
      tags,
      "gallery": gallery[]{ "url": asset->url, "alt": alt },
      "seoDescription": seo.metaDescription,
      "seoShareDescription": seo.shareDescription,
      "seoOgUrl": seo.ogImage.asset->url,
      body[]{
        ...,
        _type == "image" => {
          "url": asset->url,
          "alt": alt,
          "width": asset->metadata.dimensions.width,
          "height": asset->metadata.dimensions.height
        }
      }
    }`,
    { slug }
  )
)

export const getRelatedPosts = (currentSlug: string) =>
  sanity.fetch<Post[]>(
    `*[_type == "post" && slug.current != $currentSlug] | order(publishedAt desc)[0...3]{ ${POST_CARD} }`,
    { currentSlug }
  )
