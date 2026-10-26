import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { IconType } from 'react-icons'
import {
  FiActivity,
  FiArrowLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiCheck,
  FiCheckCircle,
  FiEdit3,
  FiFilter,
  FiGitMerge,
  FiGitPullRequest,
  FiGithub,
  FiImage,
  FiLayers,
  FiLock,
  FiRadio,
  FiShield,
  FiTag,
} from 'react-icons/fi'
import type { Build } from '@/data/builds'
import type { LogEntry } from '@/lib/build-log'
import Reveal from '@/components/ui/Reveal'
import RepoButtons from '@/components/ui/RepoButtons'
import LogEntryItem, { Timeline } from '@/components/log/LogEntryItem'
import { E2E_PROJECTS, FEATURES, SPEED, SPEED_MORE, STACK, WORKFLOW, type FeatureIcon, type SpeedResult } from './content'
import styles from './CaseStudy.module.css'

/**
 * The case study for this site (/builds/n8builds). Its readers come from the
 * homepage's "Use this as a template": developers deciding whether to fork
 * the site, and people curious how it is built and tested. So it leads with
 * what a fork gets, shows the CI pipeline and the real speed numbers, and
 * ends on forking it. A server component; the only client code is the shared
 * scroll reveal, which starts the CSS animations in CaseStudy.module.css.
 */

const ICONS: Record<FeatureIcon, IconType> = {
  layers: FiLayers,
  edit: FiEdit3,
  shield: FiShield,
  lock: FiLock,
  image: FiImage,
  tag: FiTag,
  activity: FiActivity,
  radio: FiRadio,
}

const vars = (v: Record<string, string | number>) => v as CSSProperties

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">{children}</p>
}

function SectionHeading({ id, eyebrow, title, lead }: { id: string; eyebrow: string; title: ReactNode; lead?: ReactNode }) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="mt-2 text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
        {title}
      </h2>
      {lead && <p className="mt-3 text-lg leading-relaxed text-slate-400">{lead}</p>}
    </div>
  )
}

const Accent = ({ children }: { children: ReactNode }) => (
  <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{children}</span>
)

/** A screenshot in a window frame, labelled by what it shows (never a URL). */
function Shot({ src, alt, label, width, height, sizes, priority, className = '' }: {
  src: string
  alt: string
  label: string
  width: number
  height: number
  sizes: string
  priority?: boolean
  className?: string
}) {
  return (
    <figure className={`overflow-hidden rounded-2xl border border-white/10 bg-[#0b1120] shadow-2xl shadow-black/50 ${className}`}>
      <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.03] px-4 py-2.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 truncate font-mono text-xs text-slate-450">{label}</span>
      </div>
      <Image src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} className="block h-auto w-full" />
    </figure>
  )
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                            */
/* ------------------------------------------------------------------ */

/** A connector between pipeline stages: horizontal from lg, vertical below. */
const Line = ({ i }: { i: number }) => (
  <div
    aria-hidden="true"
    style={vars({ '--i': i })}
    className={`${styles.line} mx-auto h-6 w-px shrink-0 lg:mx-0 lg:h-0.5 lg:w-auto lg:min-w-6 lg:flex-1`}
  />
)

function Node({ i, icon: Icon, title, note, className = '' }: { i: number; icon: IconType; title: string; note: string; className?: string }) {
  return (
    <div
      style={vars({ '--i': i })}
      className={`${styles.stage} ${className} flex items-center gap-3 rounded-xl border px-4 py-3 lg:w-32 lg:shrink-0 lg:flex-col lg:items-start lg:gap-2 lg:py-4`}
    >
      <Icon className="h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
      <div>
        <p className="text-sm font-bold text-slate-50">{title}</p>
        <p className="mt-0.5 text-xs leading-snug text-slate-400">{note}</p>
      </div>
    </div>
  )
}

function Lane({ i, title, note, children }: { i: number; title: string; note: string; children?: ReactNode }) {
  return (
    <li style={vars({ '--i': i })} className={`${styles.stage} rounded-xl border px-4 py-3`}>
      <div className="flex items-center gap-2">
        <FiCheckCircle style={vars({ '--i': i })} className={`${styles.tick} h-4 w-4 shrink-0`} aria-hidden="true" />
        <p className="text-sm font-bold text-slate-50">{title}</p>
      </div>
      <p className="mt-1 text-xs leading-snug text-slate-400">{note}</p>
      {children}
    </li>
  )
}

function Pipeline() {
  return (
    <Reveal>
      <figure aria-label="The CI pipeline every pull request runs" className="rounded-3xl border border-white/8 bg-white/[0.02] p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center">
          <Node i={0} icon={FiGitPullRequest} title="Pull request" note="Or a push to main" />
          <Line i={1} />
          <Node i={1} icon={FiFilter} title="What changed?" note="Docs only: the browser jobs skip" />
          <Line i={2} />
          <ol className="flex flex-col gap-3 lg:w-[28rem] lg:shrink-0" aria-label="Jobs that run in parallel">
            <Lane i={2} title="Lint, types, unit tests" note="ESLint at zero warnings, tsc, and 200+ Vitest tests" />
            <Lane i={2.4} title="E2E, one job per project" note="450+ Playwright tests, with axe, security-header and CSP checks">
              <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Playwright projects">
                {E2E_PROJECTS.map((p, k) => (
                  <li
                    key={p}
                    style={vars({ '--i': 2.4 + k * 0.22 })}
                    className={`${styles.stage} inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.7rem] font-semibold text-slate-200`}
                  >
                    <FiCheck style={vars({ '--i': 2.4 + k * 0.22 })} className={`${styles.tick} h-3 w-3`} aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </Lane>
            <Lane i={3.4} title="Lighthouse budgets" note="Median of 5 runs on 5 pages (desktop) and 3 on 3 pages (mobile)" />
          </ol>
          <Line i={4.6} />
          <Node i={4.6} icon={FiCheckCircle} title="CI result" note="The one required check" />
          <Line i={5.4} />
          <div
            style={vars({ '--i': 5.4 })}
            className={`${styles.stage} ${styles.merged} flex items-center justify-center gap-2 self-center rounded-full border border-emerald-400/50 px-5 py-2.5 lg:shrink-0`}
          >
            <FiGitMerge className="h-4 w-4 text-emerald-300" aria-hidden="true" />
            <span className="text-sm font-bold text-emerald-200">Merged</span>
          </div>
        </div>
        <figcaption className="mt-6 border-t border-white/8 pt-4 text-sm leading-relaxed text-slate-400">
          From <code className="font-mono text-slate-300">.github/workflows/ci.yml</code>. The three lanes run in parallel, and WebKit and
          iPhone 14 are split into two shards each. A nightly run repeats everything against main, since blog posts change
          without a commit.
        </figcaption>
      </figure>
    </Reveal>
  )
}

/* ------------------------------------------------------------------ */
/* Speed                                                               */
/* ------------------------------------------------------------------ */

function Count({ result }: { result: SpeedResult }) {
  const { from, to, prefix = '', suffix = '', pad } = result.count
  return (
    <>
      <span className="sr-only">{result.after}</span>
      <span aria-hidden="true">
        {prefix}
        <span className={styles.count} data-pad={pad ? '' : undefined} style={vars({ '--from': from, '--to': to })} />
        {suffix}
        {result.rest}
      </span>
    </>
  )
}

function SpeedCard({ result, delay }: { result: SpeedResult; delay: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className="flex h-full flex-col rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        <p className="text-sm font-bold text-slate-100">{result.label}</p>
        <p className="text-xs text-slate-450">{result.where}</p>
        <p className="mt-4 text-3xl font-bold tracking-tight text-cyan-300 tabular-nums">
          <Count result={result} />
        </p>
        <p className="mt-1 text-sm text-slate-400">
          from <span className="font-semibold text-slate-300 tabular-nums">{result.before}</span>
          {result.lowerIsBetter ? ' (lower is better)' : ''}
        </p>
        <div className="mt-auto space-y-1.5 pt-5" aria-hidden="true">
          <div className="h-1.5 rounded-full bg-white/[0.04]">
            <div className="h-full rounded-full bg-slate-500/60" style={{ width: `${result.bars.before * 100}%` }} />
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.04]">
            <div
              className={`${styles.bar} h-full rounded-full bg-linear-to-r from-cyan-400 to-blue-500`}
              style={{ width: `${Math.max(result.bars.after * 100, 0)}%` }}
            />
          </div>
        </div>
        <p className="mt-3 text-[0.7rem] text-slate-475">{result.source}</p>
      </div>
    </Reveal>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CaseStudy({ build, activity }: { build: Build; activity: LogEntry[] }) {
  const repo = build.github ?? 'https://github.com/n8watkins/n8builds-web'
  const [hero, lighthouse, actions] = [
    build.images.find((i) => i.src.endsWith('home-hero.webp'))!,
    build.images.find((i) => i.src.endsWith('lighthouse.webp'))!,
    build.images.find((i) => i.src.endsWith('ci-checks.webp'))!,
  ]

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-screen overflow-x-clip bg-darkBlue text-slate-100 focus:outline-none">
      {/* Ambient glow behind the hero: a gradient, not a blur filter. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] bg-[radial-gradient(60%_50%_at_75%_30%,rgb(34_211_238/0.12),transparent_70%),radial-gradient(40%_40%_at_10%_10%,rgb(59_130_246/0.10),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-8 md:pt-32">
        <Link
          href="/#template"
          className="-my-2.5 inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Use as a template
        </Link>

        {/* Hero */}
        <header className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
          <div>
            <Eyebrow>Open source · MIT · fork it</Eyebrow>
            <h1 className="mt-3 text-5xl font-bold tracking-tight md:text-6xl">
              <Accent>{build.name}</Accent>
            </h1>
            <p className="mt-3 text-xl font-semibold text-slate-200">{build.tagline}</p>
            <p className="mt-4 max-w-xl leading-relaxed text-slate-400">
              The whole site is public: the Lab, the build log, the N8&apos;s Notions blog and the Loadout. Fork it and you get the
              pages and the safety net behind them, a test suite and speed budgets that hold every merge until they pass.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <RepoButtons href={repo} name="n8builds-web" />
              {build.liveSite && (
                <a
                  href={build.liveSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:from-cyan-400 hover:to-blue-500"
                >
                  Visit live site
                  <FiArrowUpRight className="h-4 w-4" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
            <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 border-t border-white/8 pt-6 sm:grid-cols-4">
              {[
                ['450+', 'Playwright tests'],
                ['200+', 'unit tests'],
                ['6', 'test projects'],
                ['0', 'layout shift'],
              ].map(([n, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-2xl font-bold tabular-nums text-slate-50">{n}</dd>
                  <dd className="text-xs text-slate-450" aria-hidden="true">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="[perspective:1600px]">
            <Shot
              src={hero.src}
              alt={hero.alt}
              label="n8builds.dev"
              width={1280}
              height={720}
              priority
              sizes="(max-width: 1024px) 100vw, 600px"
              className={styles.heroShot}
            />
          </div>
        </header>

        {/* What you get */}
        <section aria-labelledby="fork-gets" className="mt-24 md:mt-32">
          <Reveal>
            <SectionHeading
              id="fork-gets"
              eyebrow="What you get"
              title={
                <>
                  If you fork it, <Accent>you start with</Accent>
                </>
              }
              lead="Not a starter with placeholders: the site that runs n8builds.dev, with everything below already wired and tested."
            />
          </Reveal>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, k) => {
              const Icon = ICONS[f.icon]
              return (
                <li key={f.title}>
                  <Reveal delay={(k % 4) * 0.07} className="h-full">
                    <div className={`${styles.card} flex h-full gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:block sm:p-5`}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10">
                        <Icon className="h-4.5 w-4.5 text-cyan-300" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-50 sm:mt-4">{f.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-400 sm:mt-1.5">{f.body}</p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              )
            })}
          </ul>
          <Reveal>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tech stack">
              {STACK.map((s) => (
                <li key={s} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* How it's tested */}
        <section aria-labelledby="tested" className="mt-24 md:mt-32">
          <Reveal>
            <SectionHeading
              id="tested"
              eyebrow="How it's tested"
              title={
                <>
                  Nothing merges <Accent>until it&apos;s green</Accent>
                </>
              }
              lead="Every pull request runs the whole suite. Branch protection waits on one check, and that check passes only when every job does."
            />
          </Reveal>
          <div className="mt-8">
            <Pipeline />
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Reveal>
              <Shot src={actions.src} alt={actions.alt} label="GitHub Actions: a green run" width={1280} height={720} sizes="(max-width: 768px) 100vw, 540px" />
            </Reveal>
            <Reveal delay={0.08}>
              <Shot src={lighthouse.src} alt={lighthouse.alt} label="Lighthouse: the homepage, from CI" width={1280} height={646} sizes="(max-width: 768px) 100vw, 540px" />
            </Reveal>
          </div>
        </section>

        {/* Speed */}
        <section aria-labelledby="speed" className="mt-24 md:mt-32">
          <Reveal>
            <SectionHeading
              id="speed"
              eyebrow="Speed first"
              title={
                <>
                  Measured, <Accent>then made faster</Accent>
                </>
              }
              lead="Animations are CSS, the homepage is server components with small client islands, and Sentry waits until the page is idle. The numbers, before and after:"
            />
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SPEED.map((r, k) => (
              <SpeedCard key={r.label} result={r} delay={k * 0.07} />
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <Reveal>
              <div className="h-full rounded-2xl border border-cyan-400/15 bg-linear-to-br from-cyan-500/[0.07] to-blue-600/[0.07] p-5 sm:p-6">
                <p className="text-sm font-bold text-cyan-300">The layout shift hunt</p>
                <p className="mt-2 leading-relaxed text-slate-300">
                  The nightly Lighthouse run failed the homepage at CLS 0.29. A 6x slower CPU made it 0.91: the browser painted the
                  centred hero before the page finished streaming in, and it re-centred as it grew. Top-aligning the hero and mounting its glows after hydration fixed it,
                  and CLS now measures 0.000 at 1x, 4x and 6x slowdown.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="h-full rounded-2xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
                <p className="text-sm font-bold text-slate-100">Also from the same work</p>
                <ul className="mt-3 space-y-2.5 text-sm">
                  {SPEED_MORE.map((m) => (
                    <li key={m.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                      <span className="text-slate-400">{m.label}</span>
                      <span className="tabular-nums text-slate-300">
                        {m.before} <FiArrowRight className="inline h-3 w-3 text-slate-500" aria-label="to" />{' '}
                        <span className="font-semibold text-cyan-300">{m.after}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-slate-450">
                  Mobile Lighthouse, run locally in CI&apos;s settings. Desktop stays at 1.00 on all five audited pages. What is left on
                  phones is mostly downloading React and Next themselves.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* How it's built */}
        <section aria-labelledby="built" className="mt-24 md:mt-32">
          <Reveal>
            <SectionHeading
              id="built"
              eyebrow="How it's built"
              title={
                <>
                  Claude Code <Accent>as the pair programmer</Accent>
                </>
              }
            />
          </Reveal>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((s, k) => (
              <li key={s.title}>
                <Reveal delay={k * 0.07} className="h-full">
                  <div className="flex h-full gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:block sm:p-5">
                    <span className="pt-0.5 font-mono text-xs font-bold text-cyan-400">0{k + 1}</span>
                    <div>
                      <h3 className="font-bold text-slate-50 sm:mt-2">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400 sm:mt-1.5">{s.body}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* Fork it */}
        <section id="fork" aria-labelledby="fork-heading" className="mt-24 md:mt-32">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-linear-to-br from-cyan-500/[0.08] via-blue-600/[0.05] to-transparent p-6 sm:p-10">
              <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div>
                  <Eyebrow>MIT licensed</Eyebrow>
                  <h2 id="fork-heading" className="mt-2 text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
                    Fork it, <Accent>make it yours</Accent>
                  </h2>
                  <p className="mt-3 leading-relaxed text-slate-300">
                    Keep the tests and the pipeline, swap in your builds and your words. The README lists every environment variable,
                    and the contact form works in dev with only Gmail set.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <RepoButtons href={repo} name="n8builds-web" />
                    <a
                      href={`${repo}#readme`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="-my-2.5 inline-flex items-center gap-1.5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:text-cyan-300"
                    >
                      Read the README
                      <FiArrowUpRight className="h-4 w-4" />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </div>
                </div>
                <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#070b16]">
                  <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                    <span className="ml-2 font-mono text-xs text-slate-450">terminal</span>
                  </div>
                  <pre className="whitespace-pre-wrap p-4 font-mono text-[0.8rem] leading-7 text-slate-300 [overflow-wrap:anywhere] sm:p-5">
                    <code>
                      <span className="text-cyan-400">$</span> git clone https://github.com/n8watkins/n8builds-web.git{'\n'}
                      <span className="text-cyan-400">$</span> cd n8builds-web && npm install{'\n'}
                      <span className="text-cyan-400">$</span> cp .env.example .env.local{'\n'}
                      <span className="text-cyan-400">$</span> npm run dev{'\n'}
                      <span className="text-slate-500"># then: npm test, npm run lighthouse</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Recent activity, from the build log */}
        {activity.length > 0 && (
          <section className="mt-24" aria-labelledby="activity-heading">
            <Reveal>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 id="activity-heading" className="text-2xl font-bold tracking-tight">
                  Recent <Accent>activity</Accent>
                </h2>
                <Link
                  href={`/builds?build=${build.slug}#activity`}
                  className="-my-2.5 inline-flex items-center gap-1.5 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
                >
                  Full log for {build.name}
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <Timeline className="mt-6 max-w-4xl">
                {activity.map((entry) => (
                  <LogEntryItem key={entry.id} entry={entry} buildName={build.name} showBuild={false} />
                ))}
              </Timeline>
            </Reveal>
          </section>
        )}

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-8">
          <Link
            href="/#lab"
            className="-my-2.5 inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
          >
            <FiArrowLeft className="h-4 w-4" />
            All builds
          </Link>
          <a
            href="https://github.com/n8watkins"
            target="_blank"
            rel="noopener noreferrer"
            className="-my-2.5 inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
          >
            <FiGithub className="h-4 w-4" />
            github.com/n8watkins
          </a>
        </footer>
      </div>
    </main>
  )
}
