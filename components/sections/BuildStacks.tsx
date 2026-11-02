import type { CSSProperties } from 'react'
import Reveal from '@/components/ui/Reveal'
import { buildStacks, stackToolIcons, type BuildStack } from '@/data/buildStacks'

/**
 * "Stacks I build with" on /loadout: the named stacks (data/buildStacks.tsx),
 * removed in #61 (2026-10-27) and back on 2026-11-02 at the owner's ask, in
 * the page's card style (How I work with AI's steps): each stack's name and
 * what it is for, a paragraph on the logic of it (why these pieces fit
 * together and when I pick it), and its tools as plain chips with their own
 * marks (round 3 of 2026-11-02: no roles, no per-tool notes). A server
 * component; out of the app's IconContext, so every icon is aria-hidden by hand.
 *
 * Five stacks: the two with the most tools (Turso, Cloudflare) share the
 * first row from 1024px, the other three the second; two to a row on
 * tablets, with the last one across both; one column on phones.
 */

// Each stack's accent, for its tagline, its glow and its hover border.
const ACCENT: Record<BuildStack['accent'], string> = {
  cyan: '#22d3ee',
  blue: '#60a5fa',
  sky: '#38bdf8',
  teal: '#2dd4bf',
  orange: '#fb923c',
}

const StackCard = ({ stack }: { stack: BuildStack }) => (
  <article
    aria-labelledby={`stack-${stack.accent}-title`}
    className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border border-white/8 bg-linear-to-b from-white/[0.045] to-white/[0.01] p-6 transition-[border-color,translate] duration-300 hover:-translate-y-1 hover:border-(--accent)/35 motion-reduce:hover:translate-y-0"
    style={{ '--accent': ACCENT[stack.accent] } as CSSProperties}
  >
    {/* Its colour along the top edge, and glowing in from the corner on hover */}
    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-(--accent)/0 via-(--accent)/70 to-(--accent)/0" />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-(--accent) opacity-[0.06] blur-3xl transition-opacity duration-300 group-hover:opacity-[0.14]"
    />
    <div className="relative">
      <h3 id={`stack-${stack.accent}-title`} className="text-xl font-extrabold tracking-tight text-slate-50">
        {stack.name}
      </h3>
      <p className="mt-0.5 text-sm font-semibold text-(--accent)">{stack.tagline}</p>
    </div>
    <p className="relative text-[15px] leading-relaxed text-pretty text-[#b4c2d6]" data-stack-about>
      {stack.about}
    </p>
    {/* The combo: each tool as a chip with its own mark, at the card's foot. */}
    <ul className="relative mt-auto flex flex-wrap gap-2 border-t border-white/6 pt-4" aria-label={`${stack.name} tools`}>
      {stack.tools.map((tool) => (
        <li key={tool} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-sm font-semibold text-slate-100">
          {stackToolIcons[tool] && (
            <span aria-hidden="true" data-stack-icon className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
              {stackToolIcons[tool]}
            </span>
          )}
          <span data-stack-tool className="whitespace-nowrap">
            {tool}
          </span>
        </li>
      ))}
    </ul>
  </article>
)

/** The stacks, each rising in a beat after the one before. */
export default function BuildStacks() {
  const odd = buildStacks.length % 2 === 1
  return (
    <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-6">
      {buildStacks.map((stack, i) => {
        // The first two are the widest stacks; on tablets an odd last card spans the row.
        const wide = i < 2
        const spansTablet = odd && i === buildStacks.length - 1
        return (
          <li key={stack.name} className={`${wide ? 'lg:col-span-3' : 'lg:col-span-2'} ${spansTablet ? 'md:col-span-2 lg:col-span-2' : ''}`}>
            <Reveal delay={Math.min(i * 0.08, 0.24)} className="h-full">
              <StackCard stack={stack} />
            </Reveal>
          </li>
        )
      })}
    </ul>
  )
}
