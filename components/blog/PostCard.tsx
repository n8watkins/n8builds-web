import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import CoverBanner from '@/components/blog/CoverBanner'
import { formatPostDate } from '@/lib/blog-utils'
import type { Post } from '@/lib/sanity'

// Blog post card - cover banner on top (real image or themed fallback), then
// date / title / excerpt / topics.
export default function PostCard({ post, priority = false }: { post: Post; priority?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug.current}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/2 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/4"
    >
      <CoverBanner
        coverUrl={post.coverUrl}
        coverAlt={post.coverAlt}
        seed={post.slug.current}
        topic={post.topics?.[0]}
        priority={priority}
      />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <time
          dateTime={post.publishedAt}
          className="font-mono text-[0.7rem] uppercase tracking-wider text-slate-450"
        >
          {formatPostDate(post.publishedAt)}
        </time>

        <div>
          <h3 className="text-lg font-bold leading-tight text-slate-50">{post.title}</h3>
          {post.excerpt && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#9cadc5]">
              {post.excerpt}
            </p>
          )}
        </div>

        {post.topics && post.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.topics.map((t) => (
              <span
                key={t}
                className="rounded-md border border-white/8 bg-white/3 px-2 py-0.5 font-mono text-[0.68rem] text-slate-400"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <span className="mt-auto flex items-center gap-1 border-t border-white/6 pt-3 font-mono text-[0.7rem] text-slate-475 transition-colors group-hover:text-cyan-400">
          read
          <FiArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  )
}

/**
 * The newest note, featured above the rest on the homepage's N8's Notions band
 * (round 3 of 2026-11-02): a wider card with the cover beside the text from
 * 1024px (above it below that), a "Featured" label, a larger title and the
 * whole excerpt.
 */
export function FeaturedPostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug.current}`}
      data-featured-post
      className="group relative grid overflow-hidden rounded-2xl border border-cyan-400/20 bg-linear-to-br from-cyan-500/[0.06] via-white/2 to-blue-600/[0.04] shadow-xl shadow-cyan-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
    >
      <CoverBanner
        coverUrl={post.coverUrl}
        coverAlt={post.coverAlt}
        seed={post.slug.current}
        topic={post.topics?.[0]}
        className="aspect-video lg:aspect-auto lg:h-full lg:min-h-80"
      />

      <div className="flex flex-col gap-4 p-5 sm:p-7 lg:justify-center lg:p-9">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-cyan-300">
            Featured
          </span>
          <time dateTime={post.publishedAt} className="font-mono text-[0.7rem] uppercase tracking-wider text-slate-450">
            {formatPostDate(post.publishedAt)}
          </time>
        </div>

        <div>
          <h3 className="text-2xl font-bold leading-tight tracking-tight text-balance text-slate-50 sm:text-3xl">{post.title}</h3>
          {post.excerpt && <p className="mt-3 text-pretty leading-relaxed text-[#9cadc5] sm:text-lg">{post.excerpt}</p>}
        </div>

        {post.topics && post.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.topics.map((t) => (
              <span key={t} className="rounded-md border border-white/8 bg-white/3 px-2 py-0.5 font-mono text-[0.68rem] text-slate-400">
                {t}
              </span>
            ))}
          </div>
        )}

        <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 transition-colors group-hover:text-cyan-200">
          Read the note
          <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  )
}

/**
 * A note as one compact row (owner, 2026-11-08): a small thumbnail of its
 * cover beside the date, title and a two-line excerpt. The homepage's N8's
 * Notions band lists its notes this way on phones, where a full card each ran
 * to about 2,200px for four.
 */
export function PostRow({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug.current}`}
      className="group flex items-start gap-3.5 rounded-xl border border-white/8 bg-white/2 p-3 transition-[border-color,background-color,translate] duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/4 motion-reduce:hover:translate-y-0"
    >
      <CoverBanner
        coverUrl={post.coverUrl}
        coverAlt={post.coverAlt}
        seed={post.slug.current}
        topic={post.topics?.[0]}
        bare
        sizes="96px"
        className="aspect-[4/3] w-24 shrink-0 rounded-lg ring-1 ring-white/8"
      />
      <div className="min-w-0 flex-1">
        <time dateTime={post.publishedAt} className="font-mono text-[0.65rem] uppercase tracking-wider text-slate-450">
          {formatPostDate(post.publishedAt)}
        </time>
        <h3 className="mt-0.5 line-clamp-2 font-bold leading-snug text-balance text-slate-50 group-hover:text-cyan-100">{post.title}</h3>
        {post.excerpt && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#9cadc5]">{post.excerpt}</p>}
      </div>
    </Link>
  )
}
