import { shareCard } from '@/lib/og-card'
import { getAllPosts, getPostBySlug } from '@/lib/sanity'

// A post's share card: /blog/<slug>/og.png, drawn from its generated cover art.
// Posts with an uploaded cover or SEO image use that instead (see page.tsx).

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
    seed: post.slug.current,
    topic: post.topics?.[0],
    eyebrow: post.topics?.[0]?.replace(/-/g, ' ') ?? 'N8 Notions',
    title: post.title,
    footer: 'N8 Notions · n8builds.dev',
  })
}
