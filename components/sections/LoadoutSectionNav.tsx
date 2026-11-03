'use client'

import { LuBackpack } from 'react-icons/lu'
import { loadoutParts } from '@/data/loadout'
import SectionRail from '@/components/ui/SectionRail'

const HEADING = {
  icon: <LuBackpack className="size-7 text-cyan-300" aria-hidden="true" />,
  title: 'Loadout',
}

/**
 * The Loadout's floating side nav (components/ui/SectionRail.tsx), like the
 * Lab's: "Loadout", with the page's backpack, over its parts (loadoutParts in
 * data/loadout.tsx, the same list as the pills under the header). Desktop
 * only (from 1280px), in the left gutter beside the page's content column;
 * on phones and tablets the pills do the job. A part stays current until the
 * next one's top passes the middle of the window.
 */
export default function LoadoutSectionNav() {
  return (
    <SectionRail
      parts={loadoutParts}
      containerId="main-content"
      label="Loadout contents"
      heading={HEADING}
      testId="loadout-section-nav"
    />
  )
}
