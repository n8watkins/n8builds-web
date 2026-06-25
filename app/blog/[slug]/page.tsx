import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FiArrowLeft } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import CoverBanner from '@/components/blog/CoverBanner'
import PostCard from '@/components/blog/PostCard'
import { PortableTextRenderer } from '@/components/blog/portable-text'
import { formatPostDate } from '@/lib/blog-utils'
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/sanity'

export const revalidate = 3600

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((p) => ({ slug: p.slug.current }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Not found — n8builds' }

  const title = `${post.title} — n8builds`
  const description =
    post.seoDescription?.slice(0, 200) ?? post.excerpt?.slice(0, 160) ?? 'A note from N8 Notions.'
  const ogImage = post.seoOgUrl ?? post.coverUrl
  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description,
      url: `/blog/${slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author] : undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(slug)

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-[#050812] text-slate-100">
        <article className="mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8 md:pt-32">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
          >
            <FiArrowLeft className="h-4 w-4" />
            All notes
          </Link>

          <header className="mt-8">
            {post.topics && post.topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-[2.75rem]">
              {post.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm text-slate-500">
              <span>By {post.author || 'Nathan "n8" Watkins'}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
            </div>

            {post.excerpt && (
              <p className="mt-4 text-lg leading-relaxed text-[#9cadc5]">{post.excerpt}</p>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-slate-400"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </header>

          <CoverBanner
            coverUrl={post.coverUrl}
            coverAlt={post.coverAlt}
            seed={post.slug.current}
            topic={post.topics?.[0]}
            priority
            className="mt-8 aspect-[2/1] rounded-2xl border border-white/8"
          />

          <div className="mt-10">{post.body && <PortableTextRenderer value={post.body} />}</div>

          {post.gallery && post.gallery.length > 0 && (
            <section className="mt-12" aria-label="Gallery">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">
                Gallery
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {post.gallery.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || ''}
                      fill
                      sizes="(max-width: 768px) 100vw, 600px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        {related.length > 0 && (
          <section className="mx-auto max-w-5xl px-5 pb-24 sm:px-8" aria-label="More notes">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              More notes
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p._id} post={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
