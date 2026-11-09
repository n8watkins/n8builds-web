import { BuiltToolsGrid, TOOLS_I_BUILT_BLURB, TOOLS_I_BUILT_TITLE } from '@/components/sections/LoadoutDevTools'
import ScribeToolRow from '@/components/sections/ScribeToolRow'
import { HammerIcon } from '@/components/ui/PartIcons'

/**
 * "Tools I built and use" on the homepage, inside its Loadout (the owner's
 * call, 2026-11-01), after the default stacks: Scribe's compact row
 * (ScribeToolRow, since 2026-11-08), then the same
 * cards as on /loadout, in the same groups (round 3 of 2026-11-02). Not pr-post
 * (round 5): The Pull Request Post's card under People I follow, higher on
 * the page, is its one place. Headed by its hammer, hammering (HammerIcon),
 * with no "Built by me" eyebrow and no accent bar (round 8 of 2026-11-09).
 */
export default function HomeToolsIBuilt() {
  return (
    <section id="tools-i-built" aria-labelledby="tools-i-built-title" className="mt-14">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300 ring-1 ring-amber-300/30 sm:size-10 [&_svg]:size-5 sm:[&_svg]:size-[1.375rem]"
        >
          <HammerIcon />
        </span>
        <div className="min-w-0">
          <h3 id="tools-i-built-title" className="text-2xl font-bold tracking-tight text-slate-50">
            {TOOLS_I_BUILT_TITLE}
          </h3>
          <p className="mt-0.5 text-sm font-semibold text-blue-300">{TOOLS_I_BUILT_BLURB}</p>
        </div>
      </div>
      <div className="mt-8">
        <BuiltToolsGrid heading="h4" lead={<ScribeToolRow />} />
      </div>
    </section>
  )
}
