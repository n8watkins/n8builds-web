import type { CSSProperties } from 'react'
import Reveal from '@/components/ui/Reveal'
import { buildStacks, hosts, layers, stackToolIcons, type BuildStack } from '@/data/buildStacks'

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

/** Tools as chips, each with its own mark (a tool without one shows its name alone). */
const Chips = ({ label, tools }: { label: string; tools: string[] }) => (
  <ul className="flex flex-wrap gap-2" aria-label={label}>
    {tools.map((tool) => (
      <li
        key={tool}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-sm font-semibold text-slate-100"
      >
        {stackToolIcons[tool] && (
          <span
            aria-hidden="true"
            data-stack-icon
            className="flex size-4 shrink-0 items-center justify-center [&_img]:size-4 [&_svg]:size-4"
          >
            {stackToolIcons[tool]}
          </span>
        )}
        <span data-stack-tool className="whitespace-nowrap">
          {tool}
        </span>
      </li>
    ))}
  </ul>
)

const StackCard = ({ stack }: { stack: BuildStack }) => (
  <article
    aria-labelledby={`stack-${stack.accent}-title`}
    className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border border-white/8 bg-linear-to-b from-white/[0.045] to-white/[0.01] p-6 transition-[border-color,translate] duration-300 hover:-translate-y-1 hover:border-(--accent)/35 motion-reduce:hover:translate-y-0"
    style={{ '--accent': ACCENT[stack.accent] } as CSSProperties}
  >
    {/* Its colour along the top edge, and glowing in from the corner on hover */}
    <span
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-(--accent)/0 via-(--accent)/70 to-(--accent)/0"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-(--accent) opacity-[0.06] blur-3xl transition-opacity duration-300 group-hover:opacity-[0.14]"
    />
    <div className="relative">
      <h3
        id={`stack-${stack.accent}-title`}
        className="text-xl font-extrabold tracking-tight text-slate-50"
      >
        {stack.name}
      </h3>
      <p className="mt-0.5 text-sm font-semibold text-(--accent)">{stack.tagline}</p>
    </div>
    <p className="relative text-[15px] leading-relaxed text-pretty text-[#b4c2d6]" data-stack-about>
      {stack.about}
    </p>
    {/* The combo: each tool as a chip with its own mark, then where it runs, at the card's foot. */}
    <div className="relative mt-auto space-y-3 border-t border-white/6 pt-4">
      <Chips label={`${stack.name} tools`} tools={stack.tools} />
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <span className="font-mono text-[0.68rem] font-bold tracking-[0.14em] text-(--accent) uppercase">
          Runs on
        </span>
        <Chips label={`${stack.name} hosting`} tools={stack.hosting} />
      </div>
    </div>
  </article>
)

/**
 * Under the stacks (round 5 of 2026-11-02, the owner's ask: hosting is part of
 * the loadout, and the other layers a builder's loadout shows): where my
 * projects run, every host with what lives there, and the layers every stack
 * shares, a row of chips each. Only what the projects really use (see
 * data/buildStacks.tsx).
 */
function AcrossStacks() {
  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Reveal className="h-full">
        <section
          aria-labelledby="where-it-runs"
          className="h-full rounded-3xl border border-white/8 bg-white/[0.02] p-6"
        >
          <h3 id="where-it-runs" className="text-lg font-extrabold tracking-tight text-slate-50">
            Where it runs
          </h3>
          <ul className="mt-4 space-y-3">
            {hosts.map((host) => (
              <li key={host.name} className="flex items-start gap-2.5 text-sm" data-host>
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-4 shrink-0 items-center justify-center [&_svg]:size-4"
                >
                  {stackToolIcons[host.name]}
                </span>
                <span className="leading-snug text-[#9cadc5]">
                  <span className="font-semibold text-slate-100">{host.name}</span> - {host.what}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
      <Reveal delay={0.08} className="h-full">
        <section
          aria-labelledby="across-stacks"
          className="h-full rounded-3xl border border-white/8 bg-white/[0.02] p-6"
        >
          <h3 id="across-stacks" className="text-lg font-extrabold tracking-tight text-slate-50">
            Across every stack
          </h3>
          <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            {layers.map((layer) => (
              <div key={layer.name} className="contents" data-layer>
                <dt className="font-mono text-[0.68rem] font-bold tracking-[0.14em] text-cyan-400 uppercase">
                  {layer.name}
                </dt>
                <dd className="mb-2 sm:mb-0">
                  <Chips label={`${layer.name} tools`} tools={layer.tools} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>
    </div>
  )
}

/** The stacks, each rising in a beat after the one before, then what runs them and what they share. */
export default function BuildStacks() {
  const odd = buildStacks.length % 2 === 1
  return (
    <>
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-6">
        {buildStacks.map((stack, i) => {
          // The first two are the widest stacks; on tablets an odd last card spans the row.
          const wide = i < 2
          const spansTablet = odd && i === buildStacks.length - 1
          return (
            <li
              key={stack.name}
              className={`${wide ? 'lg:col-span-3' : 'lg:col-span-2'} ${spansTablet ? 'md:col-span-2 lg:col-span-2' : ''}`}
            >
              <Reveal delay={Math.min(i * 0.08, 0.24)} className="h-full">
                <StackCard stack={stack} />
              </Reveal>
            </li>
          )
        })}
      </ul>
      <AcrossStacks />
    </>
  )
}
