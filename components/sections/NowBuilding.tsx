import Image from 'next/image'
import Link from 'next/link'
import { FiArrowUpRight, FiCheck, FiFileText } from 'react-icons/fi'
import { MdRadioButtonChecked } from 'react-icons/md'
import { nowItems, type NowShot, type NowState } from '@/data/now'
import NowCarousel from '@/components/sections/NowCarousel'
import NowDetails from '@/components/sections/NowDetails'

const statusStyles: Record<NowState['status'], string> = {
  prototype: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  active: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  polishing: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  shipping: 'text-green-400 border-green-400/30 bg-green-400/10',
}

const slugOf = (now: NowState) => now.project.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/**
 * The ad's picture: a real template page in a browser window, and another on
 * a phone in front of it. Both frames keep their image's aspect ratio, so the
 * box is sized before the (lazy) images arrive and nothing shifts.
 */
const Showcase = ({ desktop, phone }: { desktop: NowShot; phone: NowShot }) => (
  <div className="relative mx-auto w-full max-w-[30rem] pb-[8%] pl-[19%] lg:max-w-[36rem]">
    <div aria-hidden className="pointer-events-none absolute -inset-[12%] bg-[radial-gradient(closest-side,rgba(34,211,238,0.13),transparent)]" />
    {/* Browser window */}
    <div className="relative overflow-hidden rounded-xl border border-white/12 bg-[#0b1424] shadow-2xl shadow-black/50 ring-1 ring-black/40">
      <div className="flex h-7 items-center gap-1.5 border-b border-white/8 bg-[#0e192c] px-3">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="ml-2 truncate rounded-md bg-white/6 px-2 py-0.5 text-[0.62rem] font-medium text-slate-400">
          {desktop.label}
        </span>
      </div>
      <Image
        src={desktop.src}
        alt={`${desktop.label}: an example site Appturnity builds`}
        width={desktop.width}
        height={desktop.height}
        sizes="(min-width: 1280px) 400px, (min-width: 1024px) 34vw, (min-width: 640px) 390px, 75vw"
        className="block h-auto w-full"
      />
    </div>
    {/* Phone */}
    <div className="absolute bottom-0 left-0 w-[24%] rotate-[-4deg]">
      <div className="overflow-hidden rounded-[1.1rem] border-[5px] border-[#0b1220] bg-[#0b1220] shadow-2xl shadow-black/60 ring-1 ring-white/12">
        <Image
          src={phone.src}
          alt={`${phone.label} on a phone`}
          width={phone.width}
          height={phone.height}
          sizes="(min-width: 640px) 140px, 24vw"
          className="block h-auto w-full rounded-[0.7rem]"
        />
      </div>
      <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/12 bg-[#0e192c] px-2 py-0.5 text-[0.6rem] font-medium text-slate-300 shadow-lg shadow-black/40">
        {phone.label}
      </span>
    </div>
  </div>
)

const DetailsHeader = ({ now }: { now: NowState }) => (
  <>
    {now.logo && <Image src={now.logo} alt="" width={40} height={46} className="h-9 w-auto shrink-0 sm:h-11" />}
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
 * One now-item as an ad: brand, headline, pitch, selling points and the two
 * buttons on the left; real template screenshots on the right. The build
 * detail (what is shipping, recent activity) sits behind What's new.
 */
const Card = ({ now }: { now: NowState }) => (
  <div>
    <div className="grid content-start gap-5 lg:grid-cols-[1.1fr_1fr] lg:gap-x-12">
      <div className="flex flex-wrap items-center gap-3 lg:col-start-1">
        {now.logo && <Image src={now.logo} alt="" width={40} height={46} className="h-8 w-auto shrink-0 sm:h-9" />}
        <h3 className="text-[1.4rem] font-extrabold sm:text-2xl tracking-tight text-slate-50">{now.project}</h3>
        <span className={`rounded-full border px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider ${statusStyles[now.status]}`}>
          {now.status}
        </span>
      </div>

      <div className="lg:col-start-1">
        <p className="text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-50 sm:text-4xl lg:text-[2.6rem]">
          {now.headline.lead}{' '}
          <span className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">{now.headline.accent}</span>
        </p>
        <p className="mt-4 max-w-xl leading-relaxed text-[#9cadc5] md:text-lg">{now.pitch}</p>
      </div>

      {now.showcase && (
        <a
          href={now.ctas?.[1]?.href ?? now.ctas?.[0]?.href}
          target="_blank"
          rel="noopener noreferrer"
          // The picture is a second way to the examples, not a separate stop
          // for keyboard and screen-reader users (the buttons say it).
          tabIndex={-1}
          aria-hidden
          className="group my-2 block lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:my-0 lg:self-center"
        >
          <div className="transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            <Showcase desktop={now.showcase.desktop} phone={now.showcase.phone} />
          </div>
        </a>
      )}

      <ul className="grid gap-1.5 lg:col-start-1">
        {now.perks.map((perk) => (
          <li key={perk} className="flex items-center gap-2.5 text-[0.94rem] text-slate-200 sm:text-base">
            <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
              <FiCheck className="h-3 w-3" strokeWidth={3} />
            </span>
            {perk}
          </li>
        ))}
      </ul>

      {now.ctas?.length ? (
        <div className="grid gap-3 sm:flex sm:flex-wrap lg:col-start-1">
          {now.ctas.map((cta, i) => (
            <a
              key={cta.href}
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className={
                i === 0
                  ? 'flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-4 sm:px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-950/50 transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400 motion-reduce:hover:scale-100'
                  : 'flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8 motion-reduce:hover:scale-100'
              }
            >
              {cta.label}
              <FiArrowUpRight className="h-4 w-4" aria-hidden />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ))}
        </div>
      ) : null}
    </div>

    {/* Footer: the build-in-public line, with the detail behind What's new. */}
    <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/8 pt-4">
      <p className="flex items-center gap-2.5 text-sm text-slate-400">
        <span aria-hidden className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400/60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
        </span>
        <span>
          Building now: <span className="font-semibold text-slate-200">{now.building}</span>
        </span>
      </p>
      <NowDetails project={now.project} labelledBy={`${slugOf(now)}-now-title`} header={<DetailsHeader now={now} />}>
        <DetailsBody now={now} />
      </NowDetails>
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
