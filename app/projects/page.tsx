import type { Metadata } from 'next'
import Shelf from '@/components/sections/Shelf'
import { shelfMeta, buildsForShelf, tagsForShelf } from '@/data/shelves'

const meta = shelfMeta.project

export const metadata: Metadata = {
  title: `${meta.heading} — Nate Builds`,
  description: meta.blurb,
  openGraph: { title: `${meta.heading} — Nate Builds`, description: meta.blurb },
}

export default function ProjectsPage() {
  return <Shelf meta={meta} builds={buildsForShelf('project')} tags={tagsForShelf('project')} />
}
