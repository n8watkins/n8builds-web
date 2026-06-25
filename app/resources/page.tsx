import type { Metadata } from 'next'
import Shelf from '@/components/sections/Shelf'
import { shelfMeta, buildsForShelf, tagsForShelf } from '@/data/shelves'

const meta = shelfMeta.resource

export const metadata: Metadata = {
  title: `${meta.heading} — n8builds`,
  description: meta.blurb,
  openGraph: { title: `${meta.heading} — n8builds`, description: meta.blurb },
}

export default function ResourcesPage() {
  return <Shelf meta={meta} builds={buildsForShelf('resource')} tags={tagsForShelf('resource')} />
}
