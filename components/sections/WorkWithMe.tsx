import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Reveal from '@/components/ui/Reveal'
import PauseOffscreen from '@/components/ui/PauseOffscreen'
import { FiArrowUpRight, FiCheck, FiCode } from 'react-icons/fi'
import styles from './WorkWithMe.module.css'
import { isOutbound, refHref } from '@/lib/referrals'

/** One highlight line: an optional bold lead-in, then what it is. */
interface Point {
  lead?: string
  text: string
}

/** A screenshot: when it is taller than its frame it scrolls (see the CSS module). */
interface Shot {
  src: string
  alt: string
  width: number
  height: number
  /** seconds for one pass down (or up) */
  duration?: number
}

interface Door {
  id: string
  eyebrow: string
  /** A brand name: keep its own casing, set larger, instead of an uppercase eyebrow. */
  wordmark?: boolean
  title: string
  blurb: React.ReactNode
  pointsLabel?: string
  points: Point[]
  /** planned features, shown as "Coming soon" chips */
  soon?: string[]
  cta: { label: string; href: string }
  secondary?: { label: string; href: string }
  icon: React.ReactNode
  desktop: Shot
  phone: Shot
  accent: {
    /** eyebrow text gradient */
    eyebrow: string
    check: string
    button: string
    glow: string
    ring: string
  }
}

const BROWSER_ASPECT = 16 / 10
const PHONE_ASPECT = 9 / 19.5

/** The screen inside a frame: a fixed aspect ratio, and a tall shot scrolls in it. */
const Screen = ({ shot, aspect, sizes }: { shot: Shot; aspect: number; sizes: string }) => {
  // How much of the image the frame shows, as a share of the image's height.
  const shown = shot.width / aspect / shot.height
  const scrolls = shown < 0.98
  return (
    <div className="relative overflow-hidden [transform:translateZ(0)]" style={{ aspectRatio: aspect }}>
      <Image
        src={shot.src}
        alt={shot.alt}
        width={shot.width}
        height={shot.height}
        sizes={sizes}
        className={`block h-auto w-full ${scrolls ? styles.scroll : ''}`}
        style={
          scrolls
            ? {
                ['--travel' as string]: `${(-(1 - shown) * 100).toFixed(3)}%`,
                ['--duration' as string]: `${shot.duration ?? 30}s`,
              }
            : undefined
        }
      />
    </div>
  )
}

/** A browser window and a phone, mostly side by side with a small overlap. */
const Showcase = ({ desktop, phone }: { desktop: Shot; phone: Shot }) => (
  <PauseOffscreen className="relative flex items-center">
    <div className="w-[78%] overflow-hidden rounded-xl border border-white/10 bg-[#0a1322] shadow-2xl shadow-black/40">
      <div aria-hidden className="flex items-center gap-1.5 border-b border-white/8 bg-white/4 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
      </div>
      <Screen shot={desktop} aspect={BROWSER_ASPECT} sizes="(max-width: 1024px) 72vw, 400px" />
    </div>
    <div className="relative -ml-[4%] w-[26%] shrink-0 overflow-hidden rounded-[1rem] border-[4px] border-[#0b1220] bg-[#0b1220] shadow-2xl shadow-black/60 ring-1 ring-white/12">
      <div className="overflow-hidden rounded-[0.7rem]">
        <Screen shot={phone} aspect={PHONE_ASPECT} sizes="(max-width: 1024px) 26vw, 140px" />
      </div>
    </div>
  </PauseOffscreen>
)

// Two doors off the workshop. n8builds is the top of the funnel; it feeds the
// portfolio (developer work) and Appturnity (client work), never replaces
// them. Copy is grounded in the portfolio's projects and Appturnity's own
// offer (docs/strategy/OFFER.md in its repo); planned features say so.
const doors: Door[] = [
  {
    // The second hiring door (the first is PortfolioAd, right after the Lab,
    // which lists the projects). This one closes the page: the visitor has
    // seen the builds, so it offers to build theirs.
    id: 'developer',
    eyebrow: 'Need a developer?',
    title: 'Like the builds? I can build yours.',
    blurb:
      'Everything on this page I designed, built, tested and shipped myself. If your team needs the same, full-stack with AI where it earns its place, my portfolio has the case studies and my experience.',
    points: [
      { lead: 'Full-stack', text: 'React, Next.js, TypeScript, Node, Workers, Firebase and SQL' },
      { lead: 'AI that ships', text: 'live demos of realtime voice, research agents and RAG chat' },
      { lead: 'Client work', text: 'healthcare, HVAC and golf sites, built and launched' },
      { lead: 'QA', text: 'tests, speed budgets and error monitoring' },
    ],
    cta: { label: 'See my portfolio', href: 'https://portfolio.n8builds.dev' },
    secondary: { label: 'Or send me a message', href: '/#contact' },
    icon: <FiCode className="h-5 w-5" />,
    // The portfolio's Projects section, captured full length from the live site.
    desktop: {
      src: '/work/portfolio-projects-desktop.webp',
      alt: 'The projects on my developer portfolio',
      width: 900,
      height: 1893,
      duration: 24,
    },
    phone: {
      src: '/work/portfolio-projects-mobile.webp',
      alt: 'My developer portfolio on a phone',
      width: 320,
      height: 3191,
      duration: 30,
    },
    accent: {
      eyebrow: 'from-emerald-300 to-cyan-300',
      check: 'text-emerald-400',
      button: 'from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400',
      glow: 'from-emerald-500/[0.09]',
      ring: 'hover:border-emerald-300/25',
    },
  },
  {
    id: 'appturnity',
    eyebrow: 'Appturnity',
    // A brand name, so it keeps the brand's own casing (no uppercase eyebrow).
    wordmark: true,
    title: 'Run a service business? We help!',
    blurb:
      'Appturnity is my company. We launch pool, HVAC, landscaping and other service businesses a modern website for free, then build the AI automations that take busywork off their plate.',
    pointsLabel: 'Today',
    // The owner's call (2026-10-27): booking, reminders and follow-up are live today.
    points: [
      { text: 'A website built and launched for you, free' },
      { text: 'Online booking and appointment reminders' },
      { text: 'Lead and quote follow-up' },
      { text: 'Paid plans add your own domain and Google Business Profile help' },
    ],
    soon: ['AI phone receptionist', 'Missed-call text-back', 'Online payments'],
    cta: { label: 'Claim your free website', href: refHref('appturnity', 'card', 'free-website') },
    secondary: { label: 'See the plans', href: refHref('appturnity', 'card', 'pricing') },
    icon: <Image src="/brands/appturnity.png" alt="" width={152} height={177} className="h-5 w-auto" />,
    // Appturnity's own template shots (its apps/hub/public/example-shots).
    desktop: {
      src: '/work/landscaping-verdant.webp',
      alt: "Appturnity's landscaping website template",
      width: 1200,
      height: 750,
    },
    phone: {
      src: '/work/landscaping-verdant-mobile.webp',
      alt: "Appturnity's landscaping template on a phone",
      width: 320,
      height: 7136,
      duration: 40,
    },
    accent: {
      // Appturnity's brand: white to light blue, and its own blue (#1066f4) on the button.
      eyebrow: 'from-white to-sky-300',
      check: 'text-sky-300',
      button: 'from-[#1066f4] to-[#1066f4] hover:from-[#3b82f6] hover:to-[#3b82f6]',
      glow: 'from-sky-400/[0.09]',
      ring: 'hover:border-sky-300/25',
    },
  },
]

const SECONDARY =
  'inline-flex items-center gap-1 text-sm font-semibold text-slate-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60'

const External = ({ href, className, children }: { href: string; className: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
    {children}
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
)

// Cards stack, and the screenshots alternate sides from lg up: right on the
// first card, left on the second. On phones they sit above the copy.
const DoorCard = ({ door, index }: { door: Door; index: number }) => {
  const flip = index % 2 === 1
  return (
    <Reveal delay={index * 0.08}>
      <article
        aria-labelledby={`door-${door.id}`}
        className={`group relative grid items-center gap-7 overflow-hidden rounded-3xl border border-white/8 bg-white/2 p-5 transition-colors duration-200 sm:p-7 ${flip ? 'lg:grid-cols-[0.85fr_1.2fr]' : 'lg:grid-cols-[1.2fr_0.85fr]'} lg:gap-10 lg:px-10 lg:py-8 ${door.accent.ring}`}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute -top-24 h-72 w-72 rounded-full bg-radial ${door.accent.glow} to-transparent to-70% ${flip ? '-right-20' : '-left-20'}`}
        />

        {/* Screenshots */}
        <a
          href={door.cta.href}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={-1}
          aria-hidden
          className={`relative block transition-transform duration-500 group-hover:-translate-y-1 ${flip ? 'lg:order-first' : 'lg:order-last'}`}
        >
          <Showcase desktop={door.desktop} phone={door.phone} />
        </a>

        {/* Copy */}
        <div className="relative flex flex-col">
          {door.wordmark ? (
            // A brand: its own wordmark (as on the What I'm working on card), not styled text.
            <Image src="/brands/appturnity-wordmark-light.png" alt={door.eyebrow} width={623} height={130} className="h-7 w-auto self-start" />
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-slate-200">
                {door.icon}
              </span>
              <p className={`bg-linear-to-r ${door.accent.eyebrow} bg-clip-text text-sm font-bold uppercase tracking-[0.14em] text-transparent sm:text-base`}>
                {door.eyebrow}
              </p>
            </div>
          )}

          <h3
            id={`door-${door.id}`}
            className="mt-4 text-balance text-2xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-[1.75rem]"
          >
            {door.title}
          </h3>
          <p className="mt-2.5 text-[15px] leading-relaxed text-[#9cadc5]">{door.blurb}</p>

          {door.pointsLabel && (
            <p className="mt-4 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-slate-450">{door.pointsLabel}</p>
          )}
          <ul className={`${door.pointsLabel ? 'mt-2' : 'mt-4'} flex flex-col gap-1.5`}>
            {door.points.map((p) => (
              <li key={p.lead ?? p.text} className="flex items-start gap-2.5 text-sm leading-snug text-slate-300">
                <FiCheck aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${door.accent.check}`} />
                <span>
                  {p.lead && <strong className="font-semibold text-slate-100">{p.lead}</strong>}
                  {p.lead && ' - '}
                  {p.text}
                </span>
              </li>
            ))}
          </ul>

          {door.soon && (
            <>
              <p className="mt-4 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-slate-450">Coming soon</p>
              <ul aria-label="Coming soon" className="mt-2 flex flex-wrap gap-1.5">
                {door.soon.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-dashed border-white/15 bg-white/3 px-2.5 py-0.5 text-xs font-medium text-slate-300"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <External
              href={door.cta.href}
              className={`inline-flex items-center gap-2 rounded-xl bg-linear-to-r ${door.accent.button} px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400`}
            >
              {door.cta.label}
              <FiArrowUpRight aria-hidden className="h-4 w-4" />
            </External>
            {door.secondary &&
              (!isOutbound(door.secondary.href) ? (
                <Link href={door.secondary.href} className={SECONDARY}>
                  {door.secondary.label}
                </Link>
              ) : (
                <External href={door.secondary.href} className={SECONDARY}>
                  {door.secondary.label}
                  <FiArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                </External>
              ))}
          </div>
        </div>
      </article>
    </Reveal>
  )
}

const WorkWithMe = () => {
  return (
    <section id="work-with-me" aria-label="Work with me" className="py-16">
      <div className="mb-8 max-w-[640px]">
        <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">Work with me</p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">Two ways to put me to work</h2>
        <p className="mt-2 text-[#9cadc5]">
          This is where I build in public. If you like what you see, here&apos;s where it goes next:
          hire me, or let Appturnity put your business online.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {doors.map((d, i) => (
          <DoorCard key={d.id} door={d} index={i} />
        ))}
      </div>
    </section>
  )
}

export default WorkWithMe
