import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import AITechStack from '@/components/features/AITechStack'
import { buildStacks } from '@/data/buildStacks'

// Homepage "stack" section: lead with the AI kit (the differentiator), then the
// default build stack with one line on why each piece is in it. The full
// generic tech marquee lives on /loadout.

// Why each tool is in the default stack. Keep these true to the loadout
// (data/loadout.tsx) and the builds that use them (data/builds.tsx).
const WHY: Record<string, { icon: string; reason: string }> = {
  'Next.js': { icon: 'next.svg', reason: 'Every web app I make starts here: server components, and Vercel ships it.' },
  TypeScript: { icon: 'ts.svg', reason: 'Strict mode everywhere. If it compiles, half my bugs never happened.' },
  Turso: { icon: 'turso.svg', reason: 'SQLite at the edge: one small database that scales globally and is cheap to run.' },
  Drizzle: { icon: 'drizzle.png', reason: 'A type-safe ORM, so queries are checked against the schema.' },
  'Cloudflare R2': { icon: 'cloudflare.svg', reason: 'File storage with no egress fees (where Portfolio Rank keeps its screenshots).' },
  Vercel: { icon: 'vercel.png', reason: 'Push to main and it ships, so I build instead of babysitting infra.' },
}
export default function HomeStack() {
  const turso = buildStacks.find((s) => s.name === 'The Turso Stack') ?? buildStacks[0]

  return (
    <section id="loadout" aria-label="My stack" className="py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">The loadout</p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">The AI kit I build with</h2>
          <p className="mt-2 max-w-[520px] text-[#9cadc5]">
            The agents and tools doing the heavy lifting right now - hover or tap a tile for what I use it for.
          </p>
        </div>
        <Link
          href="/loadout"
          className="group flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8"
        >
          See the full loadout
          <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <AITechStack dino />

      {/* My default stack, and why each piece is in it. */}
      <div
        role="group"
        aria-labelledby="default-stack-title"
        className="mt-6 rounded-2xl border border-white/8 bg-linear-to-br from-cyan-500/6 via-white/2 to-transparent p-5 sm:p-6"
      >
        <div className="border-l-2 border-cyan-400/40 pl-4">
          <p className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-cyan-400">My default stack</p>
          <h3 id="default-stack-title" className="text-2xl font-bold tracking-tight text-slate-50">
            {turso.name}
          </h3>
          <p className="mt-0.5 text-sm font-semibold text-blue-300">My first pick for new web apps</p>
        </div>
        <ul className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {turso.tools.map((tool) => {
            const why = WHY[tool]
            return (
              <li key={tool} className="flex items-start gap-3">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#0a1428] p-2">
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
                  <p className="font-semibold text-slate-100">{tool}</p>
                  {why && <p className="mt-0.5 text-sm leading-snug text-[#9cadc5]">{why.reason}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
