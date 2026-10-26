'use client'
import { useMemo, useState } from 'react'
import PostCard from '@/components/blog/PostCard'
import FadeIn from '@/components/ui/FadeIn'
import Reveal from '@/components/ui/Reveal'
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
        <FadeIn delay={0.05} className="mt-8 flex flex-wrap items-center gap-2">
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
        </FadeIn>
      )}

      {visible.length > 0 ? (
        <>
          {/* Keeps heading levels sequential: page h1 -> list h2 -> card h3. */}
          <h2 className="sr-only">{active ? `Notes tagged ${active}` : 'All notes'}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p, i) => (
              <CardFade key={p._id} index={i}>
                {/* The first card's cover is the page's largest paint: load it now, at high priority. */}
                <PostCard post={p} priority={i === 0} />
              </CardFade>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-16 text-center font-mono text-sm text-slate-475">
          {'// nothing here yet - more notes soon.'}
        </p>
      )}
    </>
  )
}

/** Cards in the first row: they are on screen at load, so they fade with CSS. */
const FIRST_ROW = 3

/**
 * Staggered card fades. The first row fades in on load with CSS (no waiting on
 * hydration above the fold); later cards fade up as they scroll into view,
 * staggered across the row. `grid` lets the card fill its grid cell.
 */
function CardFade({ index, children }: { index: number; children: React.ReactNode }) {
  return index < FIRST_ROW ? (
    <FadeIn delay={index * 0.08} className="grid">
      {children}
    </FadeIn>
  ) : (
    <Reveal delay={(index % FIRST_ROW) * 0.08} className="grid">
      {children}
    </Reveal>
  )
}

function chip(isActive: boolean): string {
  return `rounded-full border px-3 py-1 text-sm font-semibold transition-all ${
    isActive
      ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
      : 'border-white/10 bg-white/3 text-slate-400 hover:bg-white/6 hover:text-slate-200'
  }`
}
