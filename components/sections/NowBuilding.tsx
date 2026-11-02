import Image from 'next/image'
import Link from 'next/link'
import { FiArrowRight, FiArrowUpRight, FiFileText } from 'react-icons/fi'
import { MdRadioButtonChecked } from 'react-icons/md'
import { nowItems, type NowState } from '@/data/now'
import NowCarousel from '@/components/sections/NowCarousel'
import NowDetails from '@/components/sections/NowDetails'
import TemplateCarousel from '@/components/sections/TemplateCarousel'
import ContactPresetLink from '@/components/ui/ContactPresetLink'

const statusStyles: Record<NowState['status'], string> = {
  prototype: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  active: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  polishing: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  shipping: 'text-green-400 border-green-400/30 bg-green-400/10',
}

const slugOf = (now: NowState) => now.project.toLowerCase().replace(/[^a-z0-9]+/g, '-')

const DetailsHeader = ({ now }: { now: NowState }) => (
  <>
    {now.mark && <span className="h-9 w-9 shrink-0 sm:h-11 sm:w-11">{now.mark}</span>}
    <div className="min-w-0 flex-1">
      <h4 id={`${slugOf(now)}-now-title`} className="text-xl font-bold sm:text-2xl tracking-tight text-slate-50">
        What&apos;s new at {now.project}
      </h4>
      <p className="mt-0.5 text-sm text-blue-300">{now.tagline}</p>
    </div>
  </>
)

const DetailsBody = ({ now }: { now: NowState }) => (
  <>
    <div className="mt-6 grid gap-5">
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">Right now</p>
        <p className="mt-1.5 leading-relaxed text-slate-200">{now.focus}</p>
      </div>
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-slate-450">The goal</p>
        <p className="mt-1.5 leading-relaxed text-[#9cadc5]">{now.goal}</p>
      </div>
    </div>

    {now.updates.length > 0 && (
      <>
        <p className="mt-7 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-slate-450">Recent activity</p>
        <ol className="mt-4 space-y-4 border-l border-white/8 pl-5">
          {now.updates.map((u, i) => (
            <li key={i} className="relative">
              <span aria-hidden className="absolute left-[-1.42rem] top-1.5 h-2 w-2 rounded-full bg-cyan-400/80 ring-4 ring-[#0a1220]" />
              <p className="font-mono text-[0.68rem] uppercase tracking-wider text-slate-475">{u.date}</p>
              <p className="mt-0.5 leading-relaxed text-[#9cadc5]">{u.text}</p>
            </li>
          ))}
        </ol>
      </>
    )}

    <p className="mt-7 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-slate-450">Built with</p>
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {now.stack.map((s) => (
        <li key={s} className="rounded-md border border-white/8 bg-white/3 px-2 py-0.5 font-mono text-[0.7rem] text-slate-400">
          {s}
        </li>
      ))}
    </ul>

    {now.buildSlug && (
      <Link
        href={`/builds/${now.buildSlug}`}
        className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
      >
        <FiFileText className="h-3.5 w-3.5" /> Full story and build log
      </Link>
    )}
  </>
)

/**
 * One now-item as an ad: brand, headline, pitch, the service's features and
 * its buttons on the left (What's new at the end of their row); its templates
 * one after another on the right (2026-11-02). The build detail (what is
 * shipping, recent activity) sits behind What's new.
 */
const Card = ({ now }: { now: NowState }) => (
  <div>
    <div className="grid content-start gap-5 lg:grid-cols-[1.1fr_1fr] lg:gap-x-12">
      <div className="flex flex-wrap items-center gap-3 lg:col-start-1">
        {now.wordmark ? (
          <h3>
            <Image src={now.wordmark.src} alt={now.project} width={now.wordmark.width} height={now.wordmark.height} className="h-8 w-auto sm:h-9" />
          </h3>
        ) : (
          <>
            {now.mark && <span className="h-9 w-9 shrink-0 sm:h-10 sm:w-10">{now.mark}</span>}
            <h3 className="text-[1.4rem] font-extrabold sm:text-2xl tracking-tight text-slate-50">{now.title ?? now.project}</h3>
          </>
        )}
        {now.badge && (
          <span className={`rounded-full border px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider ${statusStyles[now.status]}`}>
            {now.badge}
          </span>
        )}
      </div>

      <div className="lg:col-start-1">
        <p className="text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-50 sm:text-4xl lg:text-[2.6rem]">
          {now.headline.lead}{' '}
          <span className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">{now.headline.accent}</span>
        </p>
        <p className="mt-4 max-w-xl leading-relaxed text-pretty text-[#9cadc5] md:text-lg">{now.pitch}</p>
      </div>

      {/* The templates, one after another (TemplateCarousel): beside the copy from lg up. */}
      {now.templates && (
        <div className="my-2 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:my-0 lg:self-center">
          <TemplateCarousel slides={now.templates} />
        </div>
      )}

      {/* What the service does: a compact set of features, two by two from small screens up. */}
      <ul className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:col-start-1" aria-label={`What ${now.project} does`}>
        {now.features.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5 text-[0.94rem] text-slate-200">
            <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
              <Icon className="h-3.5 w-3.5" />
            </span>
            {text}
          </li>
        ))}
      </ul>

      {/* The buttons, and What's new (the build detail) at the far
          right of the same row, which spans the card from lg up. */}
      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center lg:col-span-2 lg:col-start-1">
        {now.ctas?.map((cta, i) => {
          const away = !cta.href.startsWith('/')
          return (
            <ContactPresetLink
              key={cta.href}
              href={cta.href}
              className={
                i === 0
                  ? 'flex items-center justify-center gap-2 rounded-xl border border-transparent bg-origin-border bg-linear-to-r from-blue-600 to-cyan-500 px-4 sm:px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-950/50 transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400 motion-reduce:hover:scale-100'
                  : 'flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8 motion-reduce:hover:scale-100'
              }
            >
              {cta.label}
              {away ? (
                <>
                  <FiArrowUpRight className="h-4 w-4" aria-hidden />
                  <span className="sr-only"> (opens in a new tab)</span>
                </>
              ) : (
                <FiArrowRight className="h-4 w-4" aria-hidden />
              )}
            </ContactPresetLink>
          )
        })}
        <div className="sm:ml-auto">
          <NowDetails project={now.project} labelledBy={`${slugOf(now)}-now-title`} header={<DetailsHeader now={now} />}>
            <DetailsBody now={now} />
          </NowDetails>
        </div>
      </div>
    </div>
  </div>
)

/**
 * "What I'm working on", rendered on the server; the cards rotate in a small
 * client carousel (NowCarousel), which gets them already rendered.
 */
const NowBuilding = () => (
  <section id="now" aria-label="What I'm working on" className="pt-14 pb-14 md:pt-4 md:pb-16">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">
          <MdRadioButtonChecked className="h-3 w-3 animate-pulse text-green-400" /> Currently building
        </p>
        <h2 className="text-[2rem] font-extrabold tracking-tight text-balance text-slate-50 sm:text-[2.6rem]/tight">What I&apos;m working on</h2>
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
