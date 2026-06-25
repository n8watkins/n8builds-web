'use client'
import React from 'react'
import BuildCard from '@/components/sections/BuildCard'
import { buildsForShelf, shelfMeta, type Shelf } from '@/data/shelves'

// An inline homepage section for a shelf — renders the full set of cards. Part of
// the one big "Lab" block; the nav scrolls here by anchor (id = shelf slug).
// Pass anchorId={null} to suppress the id (when an outer wrapper owns the anchor).
const ShelfSection = ({ shelf, anchorId }: { shelf: Shelf; anchorId?: string | null }) => {
  const meta = shelfMeta[shelf]
  const all = buildsForShelf(shelf)
  if (all.length === 0) return null

  const id = anchorId === null ? undefined : (anchorId ?? meta.slug)

  return (
    <section id={id} aria-label={meta.heading} className="py-16">
      <div className="mb-8">
        <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-teal-400">{meta.eyebrow}</p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">{meta.heading}</h2>
        <p className="mt-2 max-w-[560px] text-[#9cadc5]">{meta.blurb}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((b, i) => (
          <BuildCard key={b.slug} build={b} index={i} />
        ))}
      </div>
    </section>
  )
}

export default ShelfSection
