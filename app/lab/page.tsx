import type { Metadata } from 'next'
import Shelf from '@/components/sections/Shelf'
import { shelfMeta, buildsForShelf, tagsForShelf } from '@/data/shelves'

const meta = shelfMeta.lab

export const metadata: Metadata = {
  title: `${meta.heading} — Nate Builds`,
  description: meta.blurb,
  openGraph: { title: `${meta.heading} — Nate Builds`, description: meta.blurb },
}

export default function LabPage() {
  return <Shelf meta={meta} builds={buildsForShelf('lab')} tags={tagsForShelf('lab')} />
}
