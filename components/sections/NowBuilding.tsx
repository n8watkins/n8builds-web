import { FiArrowRight, FiArrowUpRight } from 'react-icons/fi'
import { MdRadioButtonChecked } from 'react-icons/md'
import { nowItems, type NowState } from '@/data/now'
import NowCarousel from '@/components/sections/NowCarousel'
import TemplateCarousel from '@/components/sections/TemplateCarousel'
import ContactPresetLink from '@/components/ui/ContactPresetLink'

/**
 * One now-item as an ad (round 3 of 2026-11-02, the original layout): brand,
 * headline, pitch and buttons on the left; its templates in a browser window,
 * one after another, with a phone in front, on the right.
 */
const Card = ({ now }: { now: NowState }) => (
  // One grid: from lg up the copy sits in the left column, centred against
  // the picture (the empty first and last rows share the spare height);
  // below lg the picture comes between the copy and the buttons.
  <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:grid-rows-[1fr_auto_auto_auto_1fr] lg:gap-x-12">
    <div className="flex flex-wrap items-center gap-3 lg:col-start-1 lg:row-start-2">
      {now.mark && <span className="h-9 w-9 shrink-0 sm:h-10 sm:w-10">{now.mark}</span>}
      <h3 className="text-[1.4rem] font-extrabold sm:text-2xl tracking-tight text-slate-50">
        {now.title ?? now.project}
      </h3>
    </div>

    <div className="lg:col-start-1 lg:row-start-3">
      <p className="text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-50 sm:text-4xl lg:text-[2.6rem]">
        {now.headline.lead}{' '}
        <span className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          {now.headline.accent}
        </span>
      </p>
      <p className="mt-4 max-w-xl leading-relaxed text-pretty text-[#9cadc5] md:text-lg">
        {now.pitch}
      </p>
    </div>

    <div className="my-2 lg:col-start-2 lg:row-span-5 lg:row-start-1 lg:my-0 lg:self-center">
      <TemplateCarousel slides={now.templates} phone={now.phone} />
    </div>

    {/* The buttons: under the copy from lg up, under the picture below that. */}
    <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center lg:col-start-1 lg:row-start-4 lg:mt-2">
      {now.ctas.map((cta, i) => {
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
          <MdRadioButtonChecked className="h-3 w-3 animate-pulse text-green-400" /> Currently
          building
        </p>
        <h2 className="text-[2rem] font-extrabold tracking-tight text-balance text-slate-50 sm:text-[2.6rem]/tight">
          What I&apos;m working on
        </h2>
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
