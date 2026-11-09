import { BuiltToolsGrid, TOOLS_I_BUILT_BLURB, TOOLS_I_BUILT_TITLE } from '@/components/sections/LoadoutDevTools'
import ScribeToolRow from '@/components/sections/ScribeToolRow'
import { HammerIcon } from '@/components/ui/PartIcons'
import LoadoutPartHeading, { HOME_PART_ACCENTS } from '@/components/sections/LoadoutPartHeading'

/**
 * "Tools I've built" (round 9 of 2026-11-09; "Tools I built and use" before) on the homepage, inside its Loadout (the owner's
 * call, 2026-11-01), after the default stacks: Scribe's compact row
 * (ScribeToolRow, since 2026-11-08), then the same
 * cards as on /loadout, in the same groups (round 3 of 2026-11-02). Not pr-post
 * (round 5): The Pull Request Post's card under People I follow, higher on
 * the page, is its one place. Headed by its hammer, hammering (HammerIcon),
 * with no "Built by me" eyebrow and no accent bar (round 8 of 2026-11-09),
 * in the heading every Loadout part shares (LoadoutPartHeading, round 9).
 */
export default function HomeToolsIBuilt() {
  return (
    <section id="tools-i-built" aria-labelledby="tools-i-built-title" className="mt-14">
      <LoadoutPartHeading
        id="tools-i-built-title"
        icon={<HammerIcon />}
        title={TOOLS_I_BUILT_TITLE}
        blurb={TOOLS_I_BUILT_BLURB}
        accent={HOME_PART_ACCENTS.tools}
      />
      <div className="mt-6">
        <BuiltToolsGrid heading="h4" lead={<ScribeToolRow />} />
      </div>
    </section>
  )
}
