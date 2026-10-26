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
import JsonLd from '@/components/JsonLd'
import { getAllPosts, getPostBySlug, getRelatedPosts, type Post } from '@/lib/sanity'
import {
  absoluteUrl,
  blogPostingJsonLd,
  pageMetadata,
  shareSummary,
  summarize,
  type PreviewImage,
} from '@/lib/seo'
import Reveal from '@/components/ui/Reveal'
import FadeIn from '@/components/ui/FadeIn'
import ShareBar from '@/components/blog/ShareBar'

export const revalidate = 3600

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((p) => ({ slug: p.slug.current }))
}

const postSummary = (post: Post) =>
  post.seoDescription || post.excerpt || "A note from Nate's Notions."
const postDescription = (post: Post) => summarize(postSummary(post))

/** The post's share image: its titled card (og.png/route.tsx) over its cover. */
function postPreview(post: Post): PreviewImage {
  return { url: `/blog/${post.slug.current}/og.png`, width: 1200, height: 630, alt: post.title }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  return pageMetadata({
    title: `${post.title} | n8builds`,
    description: postDescription(post),
    shareDescription: post.seoShareDescription || shareSummary(postSummary(post)),
    path: `/blog/${slug}`,
    image: postPreview(post),
    article: { publishedTime: post.publishedAt, authors: post.author ? [post.author] : undefined },
  })
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(slug)

  return (
    <>
      <JsonLd
        data={blogPostingJsonLd({
          title: post.title,
          description: postDescription(post),
          path: `/blog/${slug}`,
          image: postPreview(post).url,
          publishedAt: post.publishedAt,
          updatedAt: post._updatedAt,
        })}
      />
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative min-h-screen bg-darkBlue text-slate-100 focus:outline-none"
      >
        <article className="mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8 md:pt-32">
          {/* The top of the post is on screen at load, so it fades in with CSS
              (no waiting on hydration for the heading or the cover, the LCP).
              The body follows; the gallery and more notes fade in on scroll. */}
          <FadeIn>
            <Link
              href="/blog"
              className="-my-2.5 inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
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

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm text-slate-450">
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
                      className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 font-mono text-xs text-slate-400"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </header>
          </FadeIn>

          <FadeIn className="mt-8">
            <CoverBanner
              coverUrl={post.coverUrl}
              coverAlt={post.coverAlt}
              seed={post.slug.current}
              topic={post.topics?.[0]}
              priority
              className="aspect-2/1 rounded-2xl border border-white/8"
            />
          </FadeIn>

          <FadeIn delay={0.1} className="mt-10">
            {post.body && <PortableTextRenderer value={post.body} />}
          </FadeIn>

          {post.gallery && post.gallery.length > 0 && (
            <Reveal>
              <section className="mt-12" aria-label="Gallery">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-450">
                  Gallery
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {post.gallery.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-4/3 overflow-hidden rounded-xl border border-white/8 bg-white/3"
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
            </Reveal>
          )}

          <ShareBar title={post.title} url={absoluteUrl(`/blog/${slug}`)} />
        </article>

        {related.length > 0 && (
          <section className="mx-auto max-w-5xl px-5 pb-24 sm:px-8" aria-label="More notes">
            <Reveal>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-450">
                More notes
              </h2>
            </Reveal>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <Reveal key={p._id} delay={0.08 + (i % 3) * 0.08} className="grid">
                  <PostCard post={p} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
