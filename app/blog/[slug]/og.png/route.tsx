import { shareCard } from '@/lib/og-card'
import { getAllPosts, getPostBySlug } from '@/lib/sanity'

// A post's share card: /blog/<slug>/og.png, the post title over its uploaded
// SEO image or cover (or the generated cover art when it has neither). The
// title matters: in a feed, a bare illustration doesn't say what the post is.

export const revalidate = 3600

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((p) => ({ slug: p.slug.current }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return new Response('Not found', { status: 404 })

  return shareCard({
    background: await coverDataUrl(post.seoOgUrl || post.coverUrl),
    seed: post.slug.current,
    topic: post.topics?.[0],
    eyebrow: post.topics?.[0]?.replace(/-/g, ' ') ?? "Nate's Notions",
    title: post.title,
    footer: "Nate's Notions · n8builds.dev",
  })
}

/**
 * The uploaded image, cropped to card size by Sanity's CDN, as a data URL.
 * Undefined (so the card falls back to the generated art) when there is no
 * upload or the CDN request fails, so a CDN hiccup never breaks the card.
 */
async function coverDataUrl(url: string | undefined) {
  if (!url) return undefined
  try {
    const response = await fetch(`${url}?w=1200&h=630&fit=crop&fm=jpg`)
    if (!response.ok) return undefined
    return `data:image/jpeg;base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`
  } catch {
    return undefined
  }
}
