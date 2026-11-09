'use client'

import BubblingFlask from '@/components/ui/BubblingFlask'
import { PotIcon, PuzzleIcon, StarIcon } from '@/components/ui/PartIcons'
import SectionRail, { type RailPart } from '@/components/ui/SectionRail'

/**
 * The Lab's parts: the nav lists the ones found on the page, in document
 * order. To add a part, add a row here. Anything between two parts that is not
 * listed (the "Use mine as a template" offer, #template, after Featured) counts
 * as the part above it: a part stays current until the next one's top passes
 * the middle of the window.
 */
const SECTIONS: readonly RailPart[] = [
  // Each part's animated icon (components/ui/PartIcons.tsx), which plays as its
  // part becomes the current one. The build log sits above the Lab since
  // 2026-11-08, so it is not a part here.
  { id: 'featured', label: 'Featured', icon: StarIcon },
  // Shortened to "Extensions" on screen where the gutter is too narrow for
  // the full label on one line (1440-1535px); its accessible name stays whole.
  {
    id: 'extensions',
    label: 'Chrome Extensions',
    short: 'Extensions',
    icon: PuzzleIcon,
  },
  // What's next (components/sections/UpcomingStrip.tsx); "Upcoming" where the gutter is narrow.
  { id: 'upcoming', label: "What's cookin'", short: 'Upcoming', icon: PotIcon },
]

const HEADING = { icon: <BubblingFlask className="size-7 text-cyan-300" />, title: 'The Lab' }

/**
 * The Lab's floating side nav (components/ui/SectionRail.tsx): "The Lab",
 * with the Lab's flask, over Featured, Chrome Extensions and What's cookin'. Desktop
 * only (from 1280px), in the left gutter beside the Lab's content column.
 */
export default function LabSectionNav() {
  return (
    <SectionRail
      parts={SECTIONS}
      containerId="lab"
      label="Lab contents"
      heading={HEADING}
      testId="lab-section-nav"
    />
  )
}
