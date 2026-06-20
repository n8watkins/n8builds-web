'use client'
import React from 'react'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import BuildCard from '@/components/sections/BuildCard'
import { buildsForShelf, shelfMeta, type Shelf } from '@/data/shelves'

// An inline homepage section that previews a shelf's cards and links to the full page.
const ShelfSection = ({ shelf, limit = 3 }: { shelf: Shelf; limit?: number }) => {
  const meta = shelfMeta[shelf]
  const all = buildsForShelf(shelf)
  if (all.length === 0) return null

  const shown = all.slice(0, limit)
  const hasMore = all.length > limit

  return (
    <section id={meta.slug} aria-label={meta.heading} className="py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-teal-400">{meta.eyebrow}</p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">{meta.heading}</h2>
          <p className="mt-2 max-w-[520px] text-[#9cadc5]">{meta.blurb}</p>
        </div>
        <Link
          href={`/${meta.slug}`}
          className="group flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/[0.08]"
        >
          {hasMore ? `See all ${all.length}` : 'Open page'}
          <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((b, i) => (
          <BuildCard key={b.slug} build={b} index={i} />
        ))}
      </div>
    </section>
  )
}

export default ShelfSection
