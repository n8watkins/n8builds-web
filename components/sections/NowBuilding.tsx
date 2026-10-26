import Image from 'next/image'
import Link from 'next/link'
import { FiActivity, FiArrowUpRight, FiFileText } from 'react-icons/fi'
import { MdRadioButtonChecked } from 'react-icons/md'
import { nowItems, type NowState } from '@/data/now'
import NowCarousel from '@/components/sections/NowCarousel'

const statusStyles: Record<NowState['status'], string> = {
  prototype: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  active: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  polishing: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  shipping: 'text-green-400 border-green-400/30 bg-green-400/10',
}

const Card = ({ now }: { now: NowState }) => (
  <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:gap-10">
    {/* Left: the build */}
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        {now.logo && (
          <Image src={now.logo} alt="" width={40} height={46} className="h-10 w-auto shrink-0" />
        )}
        <h3 className="text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl">{now.project}</h3>
        <span className={`rounded-full border px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider ${statusStyles[now.status]}`}>
          {now.status}
        </span>
      </div>
      <p className="font-mono text-sm text-slate-450 md:text-base">{now.tagline}</p>

      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-wider text-cyan-400">Right now</p>
          <p className="mt-1 text-lg leading-relaxed text-slate-200">{now.focus}</p>
        </div>
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-475">The goal</p>
          <p className="mt-1 text-lg leading-relaxed text-[#9cadc5]">{now.goal}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {now.stack.map((s) => (
          <span key={s} className="rounded-md border border-white/8 bg-white/3 px-2 py-0.5 font-mono text-[0.7rem] text-slate-400">
            {s}
          </span>
        ))}
      </div>

      {(now.ctas?.length || now.buildSlug) && (
        <div className="mt-1 flex flex-wrap gap-3">
          {now.ctas?.map((cta, i) => (
            <a
              key={cta.href}
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className={
                i === 0
                  ? 'flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400'
                  : 'flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8'
              }
            >
              {cta.label}
              <FiArrowUpRight className="h-4 w-4" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ))}
          {now.buildSlug && (
            <Link href={`/builds/${now.buildSlug}`}
              className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8">
              <FiFileText className="h-3.5 w-3.5" /> Build log
            </Link>
          )}
        </div>
      )}
    </div>

    {/* Right: recent activity feed */}
    <div className="self-start rounded-2xl border border-white/6 bg-black/25 p-5 md:p-6">
      <p className="mb-4 flex items-center gap-2 font-mono text-xs text-slate-450">
        <FiActivity className="h-3.5 w-3.5 text-cyan-400" /> recent activity
      </p>
      <ol className="relative space-y-4 border-l border-white/8 pl-5">
        {now.updates.map((u, i) => (
          <li key={i} className="relative">
            <span className="absolute left-[-1.42rem] top-1.5 h-2 w-2 rounded-full bg-cyan-400/80 ring-4 ring-darkBlue" />
            <p className="font-mono text-[0.68rem] uppercase tracking-wider text-slate-475">{u.date}</p>
            <p className="mt-0.5 leading-relaxed text-[#9cadc5]">{u.text}</p>
          </li>
        ))}
      </ol>
    </div>
  </div>
)

/**
 * "What I'm working on", rendered on the server; the cards rotate in a small
 * client carousel (NowCarousel), which gets them already rendered.
 */
const NowBuilding = () => (
  <section id="now" aria-label="What I'm working on" className="py-14 md:py-16">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">
          <MdRadioButtonChecked className="h-3 w-3 animate-pulse text-green-400" /> Currently building
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-50 sm:text-5xl/tight">What I&apos;m working on</h2>
      </div>
    </div>

    <NowCarousel
      labels={nowItems.map((item) => item.project)}
      cards={nowItems.map((item) => (
        <Card key={item.project} now={item} />
      ))}
    />
  </section>
)

export default NowBuilding
