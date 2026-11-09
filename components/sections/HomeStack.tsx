import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import { LuBackpack } from 'react-icons/lu'
import SectionMark from '@/components/ui/SectionMark'
import AITechStack from '@/components/features/AITechStack'
import { buildStacks } from '@/data/buildStacks'
import HomeToolsIBuilt from '@/components/sections/HomeToolsIBuilt'

// Homepage "stack" section, the homepage's Loadout: first the one-line teaser
// for my dev setup on /loadout (at the top since round 3 of 2026-11-02), then
// the AI kit, the default build stack with one line on why each piece is in
// it, then the tools I built and use (2026-11-01). The full generic
// tech marquee lives on /loadout.

// Why each tool is in the default stack. Keep these true to the loadout
// (data/loadout.tsx) and the builds that use them (data/builds.tsx).
const WHY: Record<string, { icon: string; reason: string }> = {
  'Next.js': { icon: 'next.svg', reason: 'Every web app I make starts here: server components, and Vercel ships it.' },
  TypeScript: { icon: 'ts.svg', reason: 'Strict mode everywhere. If it compiles, half my bugs never happened.' },
  Turso: { icon: 'turso.svg', reason: 'SQLite at the edge, with a generous free tier: one small database that scales globally.' },
  Drizzle: { icon: 'drizzle.png', reason: 'A type-safe ORM, so queries are checked against the schema.' },
  'Cloudflare R2': { icon: 'cloudflare.svg', reason: 'File storage with no egress fees (where Portfolio Rank keeps its screenshots).' },
  Vercel: { icon: 'vercel.png', reason: 'It gets new Next.js releases first, and a push to main ships itself.' },
}
export default function HomeStack() {
  const turso = buildStacks.find((s) => s.name === 'The Turso Stack') ?? buildStacks[0]

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
      {/* My dev setup first (round 3 of 2026-11-02): a one-line teaser for it on /loadout, in a quiet bar. */}
      <p
        id="my-setup"
        className="mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3.5 text-center text-sm text-[#9cadc5]"
        data-setup-teaser
      >
        <span className="font-mono text-[0.68rem] font-bold tracking-[0.16em] text-cyan-400 uppercase">My dev setup</span>
        {/* Each pair stays on one line; the dots between them are where it wraps. */}
        <span>
          {['Windows 11 + WSL2', 'Claude Code + Codex', 'herdr + tmux'].map((pair, i) => (
            <span key={pair}>
              {i > 0 && ' · '}
              <span className="whitespace-nowrap">{pair}</span>
            </span>
          ))}
        </span>
        <Link
          href="/loadout#dev-setup"
          className="group inline-flex items-center gap-1 font-semibold text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 transition-colors hover:text-cyan-200"
        >
          See my dev setup
          <FiArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </p>

      <div id="ai-kit">
        <AITechStack dino />
      </div>

      {/* My default stack, and why each piece is in it. */}
      <div
        id="default-stack"
        role="group"
        aria-labelledby="default-stack-title"
        className="mt-6 rounded-2xl border border-white/8 bg-linear-to-br from-cyan-500/6 via-white/2 to-transparent p-4 sm:p-6"
      >
        <div className="border-l-2 border-cyan-400/40 pl-4">
          <p className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-cyan-400">My default stack</p>
          <h3 id="default-stack-title" className="text-2xl font-bold tracking-tight text-slate-50">
            {turso.name}
          </h3>
          <p className="mt-0.5 text-sm font-semibold text-blue-300">My first pick for new web apps</p>
        </div>
        <ul className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* The code and where it runs: hosting is part of the stack (round 5 of 2026-11-02). */}
          {[...turso.tools, ...turso.hosting].map((tool) => {
            const why = WHY[tool]
            return (
              // A light hover on each piece: its icon grows a touch and lights up, its name turns cyan.
              <li key={tool} className="group -m-2 flex items-start gap-3 rounded-xl p-2 transition-colors duration-200 hover:bg-white/[0.03]">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#0a1428] p-2 transition-all duration-200 group-hover:scale-110 group-hover:border-cyan-300/40 group-hover:shadow-[0_0_14px_-2px_rgba(34,211,238,0.35)]">
                  {why && (
                    <span className="relative h-full w-full">
                      <Image
                        src={`/projectIcons/${why.icon}`}
                        alt=""
                        fill
                        sizes="40px"
                        // The image optimizer doesn't take SVGs: serve those as they are.
                        unoptimized={why.icon.endsWith('.svg')}
                        style={{ objectFit: 'contain' }}
                      />
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100 transition-colors duration-200 group-hover:text-cyan-200">{tool}</p>
                  {why && <p className="mt-0.5 text-sm leading-snug text-[#9cadc5]">{why.reason}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      <HomeToolsIBuilt />

    </section>
  )
}
