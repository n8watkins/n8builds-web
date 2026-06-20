import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import CoverBanner from '@/components/blog/CoverBanner'
import { formatPostDate } from '@/lib/blog-utils'
import type { Post } from '@/lib/sanity'

// Blog post card — cover banner on top (real image or themed fallback), then
// date / title / excerpt / topics. Matches the BuildCard visual language.
export default function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug.current}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.04]"
    >
      <CoverBanner
        coverUrl={post.coverUrl}
        coverAlt={post.coverAlt}
        seed={post.slug.current}
        topic={post.topics?.[0]}
      />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <time
          dateTime={post.publishedAt}
          className="font-mono text-[0.7rem] uppercase tracking-wider text-slate-500"
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
                className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[0.68rem] text-slate-400"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <span className="mt-auto flex items-center gap-1 border-t border-white/[0.06] pt-3 font-mono text-[0.7rem] text-slate-600 transition-colors group-hover:text-cyan-400">
          read
          <FiArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  )
}
