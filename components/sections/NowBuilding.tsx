import { FiArrowRight, FiArrowUpRight } from 'react-icons/fi'
import { MdRadioButtonChecked } from 'react-icons/md'
import { nowItems, type NowState } from '@/data/now'
import NowCarousel from '@/components/sections/NowCarousel'
import TemplateCarousel from '@/components/sections/TemplateCarousel'
import ContactPresetLink from '@/components/ui/ContactPresetLink'
import QuoteForm from '@/components/sections/QuoteForm'
import { isOutbound } from '@/lib/referrals'

/**
 * One now-item as an ad (round 3 of 2026-11-02, the original layout): brand,
 * headline, pitch, then the quote request (QuoteForm: an email field and "Get
 * my quote", owner, 2026-11-08; a "Get a quote" button down to it before) and
 * any other buttons on the left; its templates in a browser window, one after
 * another, with a phone in front, on the right.
 */
const Card = ({ now, turnstileSiteKey }: { now: NowState; turnstileSiteKey: string }) => (
  // One grid: from lg up the copy sits in the left column from the top (so the
  // first screen's sneak peek shows the title row) and the quote form at its
  // foot, level with the foot of the picture beside it (its chips and "Don't
  // see yours?", round 4 of 2026-11-08); below lg the picture comes between
  // the copy and the form.
  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-12">
    <div className="flex flex-wrap items-center gap-3 lg:col-start-1 lg:row-start-1">
      {now.href ? (
        // The mark and name link the site, in a new tab (owner, round 3 of 2026-11-08).
        <a
          href={now.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group/site flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
        >
          {now.mark && <span className="h-9 w-9 shrink-0 sm:h-10 sm:w-10">{now.mark}</span>}
          <h3 className="flex items-center gap-1.5 text-[1.25rem] font-extrabold tracking-tight text-slate-50 underline decoration-transparent decoration-2 underline-offset-4 transition-colors group-hover/site:decoration-cyan-300/60 min-[360px]:text-[1.4rem] sm:text-2xl">
            {now.title ?? now.project}
            <FiArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover/site:text-cyan-200 sm:h-5 sm:w-5" aria-hidden />
          </h3>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <>
          {now.mark && <span className="h-9 w-9 shrink-0 sm:h-10 sm:w-10">{now.mark}</span>}
          <h3 className="text-[1.4rem] font-extrabold sm:text-2xl tracking-tight text-slate-50">
            {now.title ?? now.project}
          </h3>
        </>
      )}
    </div>

    <div className="lg:col-start-1 lg:row-start-2">
      <p className="text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-50 sm:text-4xl lg:text-[2.6rem]">
        {now.headline.lead}{' '}
        {/* On its own line from 1024px, as the ad has always read there. */}
        <span className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent lg:block">
          {now.headline.accent}
        </span>
      </p>
      <p className="mt-4 max-w-xl leading-relaxed text-pretty text-[#9cadc5] md:text-lg">
        {now.pitch}
      </p>
    </div>

    <div className="my-2 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:my-0 lg:self-end">
      <TemplateCarousel slides={now.templates} phone={now.phone} />
    </div>

    {/* The quote request and any buttons: under the copy from lg up, under the picture below that. */}
    <div className="lg:col-start-1 lg:row-start-3 lg:mt-2 lg:self-end">
      {now.quote && <QuoteForm turnstileSiteKey={turnstileSiteKey} />}
      {now.ctas.length > 0 && (
        <div className={`grid gap-3 sm:flex sm:flex-wrap sm:items-center ${now.quote ? 'mt-4' : ''}`}>
          {now.ctas.map((cta, i) => {
            const away = !cta.href.startsWith('/') || isOutbound(cta.href)
            return (
              <ContactPresetLink
                key={cta.href}
                href={cta.href}
                className={
                  i === 0 && !now.quote
                    ? 'flex items-center justify-center gap-2 rounded-xl border border-transparent bg-origin-border bg-linear-to-r from-blue-600 to-cyan-500 px-4 sm:px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-950/50 transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400 motion-reduce:hover:scale-100'
                    : 'flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8 motion-reduce:hover:scale-100'
                }
              >
                {cta.label}
                {/* ContactPresetLink says "(opens in a new tab)" itself. */}
                {away ? (
                  <FiArrowUpRight className="h-4 w-4" aria-hidden />
                ) : (
                  <FiArrowRight className="h-4 w-4" aria-hidden />
                )}
              </ContactPresetLink>
            )
          })}
        </div>
      )}
    </div>
  </div>
)

/**
 * "What I'm working on", rendered on the server; the cards rotate in a small
 * client carousel (NowCarousel), which gets them already rendered.
 */
const NowBuilding = () => {
  // As the contact form and the waitlist: no widget in development (the server lets it through there).
  const turnstileSiteKey =
    process.env.NODE_ENV === 'development' ? '' : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
  return (
    <section id="now" aria-label="What I'm working on" className="pt-14 pb-4 md:pt-4 md:pb-6">
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
          <Card key={item.project} now={item} turnstileSiteKey={turnstileSiteKey} />
        ))}
      />
    </section>
  )
}

export default NowBuilding
