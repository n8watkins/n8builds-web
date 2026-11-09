import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import { LuBackpack, LuServer, LuSparkles, LuSquareTerminal } from 'react-icons/lu'
import { SiCloudflare } from 'react-icons/si'
import SectionMark from '@/components/ui/SectionMark'
import AITechStack from '@/components/features/AITechStack'
import { buildStacks, stackRoles, stackToolIcons, type BuildStack } from '@/data/buildStacks'
import { devSetup, devSetupVideo } from '@/data/loadout'
import { SiYoutube } from 'react-icons/si'
import HomeToolsIBuilt from '@/components/sections/HomeToolsIBuilt'
import LoadoutPartHeading, { HOME_PART_ACCENTS } from '@/components/sections/LoadoutPartHeading'
import DevSetupShare from '@/components/sections/DevSetupShare'


// Homepage "stack" section, the homepage's Loadout: first a condensed version
// of my dev setup on /loadout, with each piece's mark (round 8 of 2026-11-09;
// a one-line teaser before), then the AI kit, my two default stacks with what
// each piece does, then the tools I built and use (2026-11-01). The full
// generic tech marquee lives on /loadout.

/**
 * The dev setup at a glance: the pieces I touch all day, by their name in My
 * dev setup (data/loadout.tsx, which gives each its mark), with a shorter
 * label where the full one is long. Keep these in that list.
 */
const SETUP_AT_A_GLANCE: { name: string; label?: string }[] = [
  { name: 'Windows 11 Pro', label: 'Windows 11' },
  { name: 'Ubuntu 24.04', label: 'WSL2 Ubuntu' },
  { name: 'Windows Terminal' },
  { name: 'zsh + oh-my-zsh', label: 'zsh' },
  { name: 'tmux' },
  { name: 'herdr' },
  { name: 'Neovim' },
  { name: 'VS Code' },
  { name: 'Claude Code' },
  { name: 'Codex' },
]

const setupItems = devSetup.flatMap((tile) => tile.groups.flatMap((group) => group.items))
const atAGlance = SETUP_AT_A_GLANCE.map(({ name, label }) => {
  const item = setupItems.find((i) => i.name === name)
  if (!item) throw new Error(`${name} is not in My dev setup (data/loadout.tsx)`)
  return { name: label ?? name, icon: item.icon }
})

/** The Quick stack and the Production stack (data/buildStacks.tsx). */
const defaults = buildStacks.filter((s) => s.id === 'quick' || s.id === 'production')

const ACCENT: Record<BuildStack['accent'], string> = {
  cyan: '#22d3ee',
  blue: '#60a5fa',
  sky: '#38bdf8',
  teal: '#2dd4bf',
  orange: '#fb923c',
}

/** One piece of a stack: its mark, its name and what it does there. */
function StackPiece({ name, role, icon }: { name: string; role?: string; icon?: ReactNode }) {
  return (
    <li className="flex min-w-0 items-center gap-2 text-sm sm:gap-2.5" data-default-tool>
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0a1428] sm:size-8 [&_img]:size-4 [&_svg]:size-4"
      >
        {icon}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block font-semibold text-slate-100">{name}</span>
        {role && <span className="block text-[0.8rem] text-[#9cadc5]">{role}</span>}
      </span>
    </li>
  )
}

/**
 * One of my tech stacks: its name and what it is for, then each piece with its
 * mark and what it does there. A stack on one provider (the Production stack,
 * all Cloudflare) says so beside its name, lists each service with what it
 * does in plain words, and names its code on one line under them (round 9 of
 * 2026-11-09).
 */
function TechStack({ stack }: { stack: BuildStack }) {
  return (
    <article
      aria-labelledby={`default-${stack.id}-title`}
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-linear-to-b from-white/[0.04] to-white/[0.01] p-5 sm:p-6"
      style={{ '--accent': ACCENT[stack.accent] } as CSSProperties}
    >
      {/* Its colour along the top edge, as on /loadout's stack cards. */}
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-(--accent)/0 via-(--accent)/70 to-(--accent)/0" />
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h4 id={`default-${stack.id}-title`} className="text-xl font-bold tracking-tight whitespace-nowrap text-slate-50">
          {stack.name}
        </h4>
        {stack.services && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#f38020]/35 bg-[#f38020]/10 px-2.5 py-0.5 text-xs font-semibold text-orange-200" data-stack-provider>
            <SiCloudflare aria-hidden="true" className="size-4 text-[#f38020]" />
            All on {stack.services.provider}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm font-semibold text-(--accent)">{stack.tagline}</p>
      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-5" aria-label={`${stack.name}: what it is made of`}>
        {stack.services
          ? stack.services.items.map((service) => (
              <StackPiece key={service.name} name={service.name} role={service.purpose} icon={stackToolIcons[service.name]} />
            ))
          : [...stack.tools, ...stack.hosting].map((tool) => (
              <StackPiece key={tool} name={tool} role={stackRoles[tool]} icon={stackToolIcons[tool]} />
            ))}
      </ul>
      {stack.services && (
        <p className="mt-auto pt-4 text-[0.8rem] text-[#9cadc5]" data-stack-code>
          The code: {stack.tools.slice(0, -1).join(', ')} and {stack.tools.at(-1)}.
        </p>
      )}
    </article>
  )
}

export default function HomeStack() {
  return (
    <section id="loadout" aria-label="My stack" className="py-16">
      <SectionMark
        icon={<LuBackpack aria-hidden="true" />}
        title="My Loadout"
        action={
          <Link
            href="/loadout"
            className="group flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8"
          >
            See the full loadout
            <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        }
      >
        The AI kit and stack I build with, and the tools I built for myself, all in daily use.
      </SectionMark>

      {/* Each part's id is a rail stop (components/sections/HomeLoadoutNav.tsx). */}
      {/* My dev setup first (round 3 of 2026-11-02), condensed with its marks (round 8 of 2026-11-09). */}
      <div id="my-setup" role="group" aria-labelledby="my-setup-title" data-setup-teaser>
        <LoadoutPartHeading
          id="my-setup-title"
          icon={<LuSquareTerminal />}
          title="Dev setup"
          blurb="Windows 11 with WSL2, and Claude Code and Codex running side by side in herdr."
          accent={HOME_PART_ACCENTS.setup}
          action={
            <Link
              href="/loadout#dev-setup"
              className="group inline-flex items-center gap-1 text-sm font-semibold text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 transition-colors hover:text-cyan-200 sm:mt-2"
            >
              See my dev setup
              <FiArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          }
        />
        <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:p-5">
        <ul className="flex flex-wrap gap-2" aria-label="My dev setup at a glance">
          {atAGlance.map((item) => (
            <li
              key={item.name}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-sm font-semibold text-slate-100"
            >
              <span aria-hidden="true" className="flex h-5 min-w-4 items-center justify-center text-slate-300 [&_img]:size-4 [&_img]:rounded-[3px] [&_svg]:size-4">
                {item.icon}
              </span>
              <span className="whitespace-nowrap">{item.name}</span>
            </li>
          ))}
        </ul>
        {/* The video I recommend for setting up your own (round 8 of 2026-11-09), also under /loadout's setup. */}
        <p className="mt-4 border-t border-white/6 pt-3 text-sm text-[#9cadc5]">
          Setting up your own?{' '}
          <a
            href={devSetupVideo.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-slate-200 underline decoration-white/20 underline-offset-4 transition-colors hover:text-cyan-200"
          >
            <SiYoutube aria-hidden="true" className="size-3.5 shrink-0 text-[#ff4d6d]" />
            Watch Kun Chen build his from scratch
            <span className="sr-only"> (a video, opens in a new tab)</span>
          </a>
        </p>
        {/* Sharing (round 9 of 2026-11-09): the dotfiles to take home, and Scribe's download. */}
        <DevSetupShare className="mt-4 border-t border-white/6 pt-4" />
        </div>
      </div>

      <div id="ai-kit" role="group" aria-labelledby="ai-kit-title" className="mt-14">
        <LoadoutPartHeading
          id="ai-kit-title"
          icon={<LuSparkles />}
          title="AI kit"
          blurb="The agents, models and tools I build with, in daily use."
          accent={HOME_PART_ACCENTS.aiKit}
        />
        <div className="mt-6">
          <AITechStack dino />
        </div>
      </div>

      {/* My two tech stacks (round 8 of 2026-11-09; "My tech stacks" since round 9): what each piece does in it. */}
      <div id="default-stack" role="group" aria-labelledby="default-stack-title" className="mt-14">
        <LoadoutPartHeading
          id="default-stack-title"
          icon={<LuServer />}
          title="My tech stacks"
          blurb="One to get something up fast, and the one my live apps run on."
          accent={HOME_PART_ACCENTS.stacks}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {defaults.map((stack) => (
            <TechStack key={stack.id} stack={stack} />
          ))}
        </div>
      </div>
      <HomeToolsIBuilt />
    </section>
  )
}
