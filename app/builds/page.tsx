import Navbar from '@/components/layout/Navbar'
import JsonLd from '@/components/JsonLd'
import BuildIndex from '@/components/log/BuildIndex'
import LogFeed from '@/components/log/LogFeed'
import { getBuildLog } from '@/lib/build-log'
import { absoluteUrl, pageMetadata } from '@/lib/seo'

// Rebuilt at most hourly from GitHub (lib/build-log.ts). A revalidation that
// can't reach GitHub keeps serving the last good page.
export const revalidate = 3600

const DESCRIPTION = 'What shipped across every n8builds project, month by month: releases and changes pulled from GitHub, plus the occasional note.'

export const metadata = pageMetadata({
  title: 'The build log | n8builds',
  description: DESCRIPTION,
  shareDescription: 'What shipped across every n8builds project, month by month, straight from GitHub.',
  path: '/builds',
  image: { url: '/builds/og.png', width: 1200, height: 630, alt: 'The build log: what shipped across every n8builds project' },
})

export default async function BuildLogPage() {
  const log = await getBuildLog()

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
      url: absoluteUrl(`/builds/${build.slug}`),
    })),
  }

  return (
    <>
      <Navbar />
      <JsonLd data={itemList} />
      <main id="main-content" tabIndex={-1} className="relative min-h-screen bg-darkBlue text-slate-100 focus:outline-none">
        {/* Ambient glows. Placed in rem, not % of <main>: a percentage moves while
            the long page is still parsing, which counts as a layout shift. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-0 h-128 w-lg scale-[1.6] bg-radial from-cyan-500/6 to-transparent to-70%" />
          <div className="absolute right-[-10%] top-[120rem] h-120 w-120 scale-[1.6] bg-radial from-blue-600/6 to-transparent to-70% md:top-[99rem] lg:top-[93rem]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8 md:pt-36">
          <header>
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em] text-cyan-400">Shipping, from GitHub</p>
            <h1 className="mt-3 text-[2.6rem] font-extrabold leading-[1.03] tracking-tight text-slate-50 sm:text-6xl/none">
              <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">The build log</span>
            </h1>
            <p className="mt-4 max-w-[640px] text-base leading-relaxed text-[#9cadc5] sm:text-lg/7">
              What shipped across every build, pulled from GitHub releases and commits every hour, plus the occasional note from me.
            </p>
          </header>

          <section className="mt-12 md:mt-14" aria-labelledby="builds-heading">
            <h2 id="builds-heading" className="text-2xl font-bold tracking-tight">
              Builds{' '}
              <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">by latest activity</span>
            </h2>
            <BuildIndex activity={log.activity} />
          </section>

          <section id="activity" className="mt-20 max-w-3xl scroll-mt-6" aria-labelledby="activity-heading">
            <h2 id="activity-heading" className="text-2xl font-bold tracking-tight">
              Activity{' '}
              <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">by month</span>
            </h2>
            <LogFeed
              entries={log.entries}
              builds={log.activity.map((b) => ({ slug: b.slug, name: b.name }))}
              months={log.months}
              recentFrom={log.recentFrom}
            />
          </section>
        </div>
      </main>
    </>
  )
}
