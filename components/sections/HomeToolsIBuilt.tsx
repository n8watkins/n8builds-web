import { DailyDriverRows } from '@/components/sections/FeaturedProjects'
import { BuiltToolsGrid, TOOLS_I_BUILT_BLURB, TOOLS_I_BUILT_TITLE } from '@/components/sections/LoadoutDevTools'

/**
 * "Tools I built and use" on the homepage, inside its Loadout (the owner's
 * call, 2026-11-01), after the default stack: Scribe's row, then the same
 * cards as on /loadout. Every tool, pr-post included: The Pull Request Post's
 * card under People I follow is a section away now. Headed like "My default
 * stack" above it, so it reads as a part of the Loadout, not its own section.
 */
export default function HomeToolsIBuilt() {
  return (
    <section id="tools-i-built" aria-labelledby="tools-i-built-title" className="mt-14 scroll-mt-20">
      <div className="border-l-2 border-cyan-400/40 pl-4">
        <p className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-cyan-400">Built by me</p>
        <h3 id="tools-i-built-title" className="text-2xl font-bold tracking-tight text-slate-50">
          {TOOLS_I_BUILT_TITLE}
        </h3>
        <p className="mt-0.5 text-sm font-semibold text-blue-300">{TOOLS_I_BUILT_BLURB}</p>
      </div>
      <div className="mt-4 mb-6">
        <DailyDriverRows bleed={false} />
      </div>
      <BuiltToolsGrid />
    </section>
  )
}
