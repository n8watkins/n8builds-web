import { LuHammer } from 'react-icons/lu'
import SectionMark from '@/components/ui/SectionMark'
import { BuiltToolsGrid, TOOLS_I_BUILT_BLURB } from '@/components/sections/LoadoutDevTools'
import { toolsIBuilt } from '@/data/loadout'

/**
 * Tools I built, on the homepage too (2026-11-01): the same cards as on
 * /loadout. pr-post sits just above, as The Pull Request Post under People I
 * follow, so it isn't repeated here.
 */
export default function HomeToolsIBuilt() {
  return (
    <section id="tools-i-built" aria-labelledby="tools-i-built-title" className="scroll-mt-20 py-16">
      <SectionMark id="tools-i-built-title" icon={<LuHammer aria-hidden="true" />} title="Tools I built">
        {TOOLS_I_BUILT_BLURB}
      </SectionMark>
      <BuiltToolsGrid tools={toolsIBuilt.filter((tool) => tool.id !== 'pr-post')} />
    </section>
  )
}
