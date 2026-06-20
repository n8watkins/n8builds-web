'use client'
import { useMemo, useState } from 'react'
import PostCard from '@/components/blog/PostCard'
import type { Post } from '@/lib/sanity'

// Client-side topic filtering, mirroring the Shelf tag-chip UX. Posts are fetched
// server-side and passed in; no Sanity SDK in the browser bundle.
export default function NotionsList({ posts }: { posts: Post[] }) {
  const [active, setActive] = useState<string | null>(null)

  const topics = useMemo(() => {
    const set = new Set<string>()
    posts.forEach((p) => p.topics?.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [posts])

  const visible = useMemo(
    () => (active ? posts.filter((p) => p.topics?.includes(active)) : posts),
    [active, posts]
  )

  return (
    <>
      {topics.length > 1 && (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <button onClick={() => setActive(null)} className={chip(active === null)}>
            All<span className="ml-1.5 text-xs opacity-60">{posts.length}</span>
          </button>
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setActive((cur) => (cur === t ? null : t))}
              className={chip(active === t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {visible.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <PostCard key={p._id} post={p} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center font-mono text-sm text-slate-600">
          {'// nothing here yet — more notes soon.'}
        </p>
      )}
    </>
  )
}

function chip(isActive: boolean): string {
  return `rounded-full border px-3 py-1 text-sm font-semibold transition-all ${
    isActive
      ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
      : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
  }`
}
