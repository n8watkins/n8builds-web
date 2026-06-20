'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import PostCard from '@/components/blog/PostCard'
import type { Post } from '@/lib/sanity'

// Homepage "Latest from N8 Notions" strip. Lives inside the client home page, so
// it fetches the 3 newest posts from the server route (keeps the Sanity SDK off
// the homepage bundle). The canonical, SSR'd content lives at /blog.
const NotionsStrip = () => {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/notions/recent')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setPosts(d.posts ?? [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (posts.length === 0) return null

  return (
    <section id="notions" aria-label="N8 Notions" className="py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">
            The Log
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
            N8 Notions
          </h2>
          <p className="mt-2 max-w-[520px] text-[#9cadc5]">
            Notes, essays, and lessons from building in public.
          </p>
        </div>
        <Link
          href="/blog"
          className="group flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/[0.08]"
        >
          Read all notes
          <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p._id} post={p} />
        ))}
      </div>
    </section>
  )
}

export default NotionsStrip
