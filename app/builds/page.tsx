import { FiGithub } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import JsonLd from '@/components/JsonLd'
import BuildIndex from '@/components/log/BuildIndex'
import LogFeed from '@/components/log/LogFeed'
import BuildLogMonths, { LogMonthProvider } from '@/components/sections/BuildLogMonths'
import { getLogMonths } from '@/components/sections/BuildLogStrip'
import FadeIn from '@/components/ui/FadeIn'
import Reveal from '@/components/ui/Reveal'
import { builds } from '@/data/builds'
import { getBuildLog } from '@/lib/build-log'
import { BUILD_ICONS, logKind } from '@/lib/build-meta'
import { absoluteUrl, pageMetadata } from '@/lib/seo'

// Rebuilt at most hourly from GitHub (lib/build-log.ts). A revalidation that
// can't reach GitHub keeps serving the last good page.
export const revalidate = 3600

const DESCRIPTION =
  'What shipped across every n8builds project, month by month: releases and changes pulled from GitHub, plus the occasional note.'

export const metadata = pageMetadata({
  title: 'The build log | n8builds',
  description: DESCRIPTION,
  shareDescription:
    'What shipped across every n8builds project, month by month, straight from GitHub.',
  path: '/builds',
  image: {
    url: '/builds/og.png',
    width: 1200,
    height: 630,
    alt: 'The build log: what shipped across every n8builds project',
  },
})

export default async function BuildLogPage() {
  const log = await getBuildLog()
  // The homepage's month card (owner, round 3 of 2026-11-08): this month's count,
  // day bars and figures, with arrows back through the year. Left out if it can't load.
  const months = await getLogMonths()
  // The year at a glance, over the feed's own 12-month window.
  const recent = log.entries.filter((e) => !log.recentFrom || e.month >= log.recentFrom)
  const figures = [
    { value: log.activity.length, label: 'builds tracked' },
    { value: recent.length, label: 'updates in 12 months' },
    { value: recent.filter((e) => e.kind === 'release').length, label: 'releases in 12 months' },
  ]

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'n8builds builds, most recently active first',
    url: absoluteUrl('/builds'),
    numberOfItems: log.activity.length,
    itemListElement: log.activity.map((build, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: build.name,
      url: absoluteUrl(build.href),
    })),
  }

  return (
    <>
      <Navbar />
      <JsonLd data={itemList} />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative min-h-screen bg-darkBlue text-slate-100 focus:outline-none"
      >
        {/* Ambient glows. Placed in rem, not % of <main>: a percentage moves while
            the long page is still parsing, which counts as a layout shift. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-0 h-128 w-lg scale-[1.6] bg-radial from-cyan-500/6 to-transparent to-70%" />
          <div className="absolute right-[-10%] top-[120rem] h-120 w-120 scale-[1.6] bg-radial from-blue-600/6 to-transparent to-70% md:top-[99rem] lg:top-[93rem]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8 md:pt-36">
          {/* It fades in on load, a step at a time (owner, round 3 of 2026-11-08: "the
              build log should have animations on load"): CSS only, so nothing waits on
              JavaScript, and reduced motion shows it all at once. Below the fold the
              sections fade up as they scroll in. */}
          <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-12">
            <div>
              <FadeIn
                as="p"
                className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em] text-cyan-400"
              >
                Shipping, from GitHub
              </FadeIn>
              <FadeIn
                as="h1"
                delay={0.06}
                className="mt-3 text-[2.6rem] font-extrabold leading-[1.03] tracking-tight text-slate-50 sm:text-6xl/none"
              >
                <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  The build log
                </span>
              </FadeIn>
              <FadeIn
                as="p"
                delay={0.12}
                className="mt-4 max-w-[640px] text-base leading-relaxed text-[#9cadc5] sm:text-lg/7"
              >
                What shipped across every build, pulled from GitHub releases and commits every hour,
                plus the occasional note from me.
              </FadeIn>
              {/* release-kit makes the releases; this log shows them. Separate projects, linked. */}
              <FadeIn as="p" delay={0.16} className="mt-3 max-w-[640px] text-sm text-slate-450">
                Releases follow{' '}
                <a
                  href="https://github.com/n8watkins/release-kit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-cyan-200"
                >
                  {/* GitHub's mark: that is where it goes (round 4 of 2026-11-08). */}
                  <FiGithub className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  release-kit
                  <span className="sr-only"> on GitHub (opens in a new tab)</span>
                </a>
                , my release standard, as each project adopts it.
              </FadeIn>
              <FadeIn as="dl" delay={0.22} className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
                {figures.map((f) => (
                  <div
                    key={f.label}
                    className="rounded-2xl border border-white/8 bg-linear-to-br from-cyan-500/[0.07] to-blue-600/[0.04] px-4 py-3.5"
                  >
                    <dt className="sr-only">{f.label}</dt>
                    <dd className="text-2xl font-bold tabular-nums text-slate-50 sm:text-3xl">
                      {f.value}
                    </dd>
                    <dd
                      aria-hidden
                      className="mt-0.5 text-xs leading-snug text-[#9cadc5] sm:text-sm"
                    >
                      {f.label}
                    </dd>
                  </div>
                ))}
              </FadeIn>
            </div>
            {months && (
              <FadeIn delay={0.3} className="lab-accent-buildlog">
                <LogMonthProvider>
                  <BuildLogMonths months={months.map((m) => ({ ...m, rows: [] }))} rows={false} />
                </LogMonthProvider>
              </FadeIn>
            )}
          </header>

          <section className="mt-12 md:mt-14" aria-labelledby="builds-heading">
            <Reveal>
              <h2 id="builds-heading" className="text-2xl font-bold tracking-tight">
                Builds{' '}
                <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  by latest activity
                </span>
              </h2>
              <BuildIndex activity={log.activity} />
            </Reveal>
          </section>

          <section
            id="activity"
            className="mt-20 max-w-3xl scroll-mt-6"
            aria-labelledby="activity-heading"
          >
            <Reveal>
              <h2 id="activity-heading" className="text-2xl font-bold tracking-tight">
                Activity{' '}
                <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  by month
                </span>
              </h2>
              <LogFeed
                entries={log.entries}
                builds={log.activity.map((b) => ({
                  slug: b.slug,
                  name: b.name,
                  href: b.href,
                  kind: logKind(builds.find((x) => x.slug === b.slug) ?? b),
                  icon: BUILD_ICONS[b.slug],
                }))}
                months={log.months}
              />
            </Reveal>
          </section>
        </div>
      </main>
    </>
  )
}
