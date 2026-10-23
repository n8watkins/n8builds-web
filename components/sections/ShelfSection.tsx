'use client'
import React from 'react'
import BuildCard from '@/components/sections/BuildCard'
import LabSubheader from '@/components/sections/LabSubheader'
import { buildsForShelf, shelfMeta, type Shelf } from '@/data/shelves'

// A card-grid part of the homepage Lab (the tools). The navbar's Lab menu
// scrolls here by anchor (id = shelf slug).
const ShelfSection = ({ shelf }: { shelf: Shelf }) => {
  const meta = shelfMeta[shelf]
  const all = buildsForShelf(shelf)
  if (all.length === 0) return null

  return (
    <section id={meta.slug} aria-label={meta.heading} className="py-10">
      <LabSubheader eyebrow={meta.eyebrow} eyebrowClass="text-teal-400" title={meta.heading} blurb={meta.blurb} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((b, i) => (
          <BuildCard key={b.slug} build={b} index={i} />
        ))}
      </div>
    </section>
  )
}

export default ShelfSection
