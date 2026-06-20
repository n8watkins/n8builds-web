import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import { formatPostDate } from '@/lib/blog-utils'
import type { Post } from '@/lib/sanity'

// Blog post card — matches the BuildCard visual language (dark glass card,
// cyan hover, mono metadata). Plain component (no hooks) so it works in both
// server and client trees without pulling @sanity/client into the bundle.
export default function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug.current}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/[0.04]"
    >
      <time
        dateTime={post.publishedAt}
        className="font-mono text-[0.7rem] uppercase tracking-wider text-slate-500"
      >
        {formatPostDate(post.publishedAt)}
      </time>

      <div>
        <h3 className="text-lg font-bold leading-tight text-slate-50">{post.title}</h3>
        {post.excerpt && (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-[#9cadc5]">
            {post.excerpt}
          </p>
        )}
      </div>

      {post.topics && post.topics.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5">
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

      <div className="mt-1 flex items-center justify-end border-t border-white/[0.06] pt-3">
        <span className="flex items-center gap-1 font-mono text-[0.7rem] text-slate-600 transition-colors group-hover:text-cyan-400">
          read
          <FiArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  )
}
