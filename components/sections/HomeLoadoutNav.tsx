'use client'

import { LuBackpack, LuLayers, LuSparkles, LuSquareTerminal } from 'react-icons/lu'
import { HammerIcon } from '@/components/ui/PartIcons'
import SectionRail, { type RailPart } from '@/components/ui/SectionRail'

/**
 * The homepage Loadout's parts (components/sections/HomeStack.tsx), in page
 * order. The ones /loadout also has carry its icons (data/loadout.tsx): the
 * default stack is one of its Stacks I build with, the setup line leads to
 * its Dev setup.
 */
const SECTIONS: readonly RailPart[] = [
  { id: 'my-setup', label: 'Dev setup', icon: LuSquareTerminal },
  { id: 'ai-kit', label: 'AI kit', icon: LuSparkles },
  { id: 'default-stack', label: 'Default stacks', icon: LuLayers },
  { id: 'tools-i-built', label: 'Tools I built and use', short: 'My tools', icon: HammerIcon },
]

const HEADING = { icon: <LuBackpack className="size-7 text-cyan-300" aria-hidden="true" />, title: 'Loadout' }

/**
 * The homepage Loadout's floating side nav (components/ui/SectionRail.tsx),
 * like the Lab's (the owner's ask, 2026-11-02): "Loadout", with its
 * backpack, over the dev setup line, the AI kit, the default stack and Tools
 * I built and use. Desktop only (from 1280px), in the left gutter beside the
 * band's content column. It lives in the Loadout's own band, several bands
 * below the Lab, so it never meets the Lab's rail: each shows only while its
 * own band is on screen and rides out with its foot.
 */
export default function HomeLoadoutNav() {
  return (
    <SectionRail
      parts={SECTIONS}
      containerId="loadout-band"
      label="Loadout contents"
      heading={HEADING}
      testId="home-loadout-nav"
    />
  )
}
