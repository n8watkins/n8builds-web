import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FiArrowLeft, FiArrowUpRight, FiCheck, FiDownload, FiGithub } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import { builds, getBuild, type Build } from '@/data/builds'
import { shelfMeta, getShelf } from '@/data/shelves'
import { pageMetadata, summarize } from '@/lib/seo'
import Reveal from '@/components/ui/Reveal'
import BuildPageLog from '@/components/log/BuildPageLog'
import RepoButtons from '@/components/ui/RepoButtons'
import ActionLabel from '@/components/ui/ActionLabel'
import { downloadCaption, scribeDownloads } from '@/lib/downloads'
import PlatformDownload from '@/components/builds/PlatformDownload'
import { getRecentActivity } from '@/lib/build-log'
import N8buildsCaseStudy from '@/components/builds/n8builds/CaseStudy'
import { LightboxGallery, LightboxThumb } from '@/components/builds/Lightbox'
import MoreBuilds from '@/components/builds/MoreBuilds'
import FadeIn from '@/components/ui/FadeIn'
import FeatureShots, { type Feature } from '@/components/builds/FeatureShots'
import StackTabs from '@/components/builds/StackTabs'
import { BUILD_ICONS } from '@/lib/build-meta'
import { TechGlyph, type TechKey } from '@/lib/tech-icons'
import ProductStage from '@/components/builds/ProductStage'
import BuildSidebar, { BuildFactsPanel, type BuildFacts, type PagePart } from '@/components/builds/BuildSidebar'
import { repoFacts, repoFromUrl } from '@/lib/github-stars'
import { LOG_TIME_ZONE, type LogEntry } from '@/lib/build-log'

interface BuildPageProps {
  params: Promise<{ slug: string }>
}

// The builds list is static: any other slug is a plain 404.
export const dynamicParams = false

// "Recent activity" comes from the build log (GitHub), refreshed hourly.
export const revalidate = 3600

export function generateStaticParams() {
  return builds.map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: BuildPageProps): Promise<Metadata> {
  const { slug } = await params
  const build = getBuild(slug)
  if (!build) notFound()

  return pageMetadata({
    title: `${build.name} | n8builds`,
    description: summarize(build.solution),
    shareDescription: build.tagline,
    path: `/builds/${slug}`,
    image: {
      url: `/builds/${slug}/og.png`,
      width: 1200,
      height: 630,
      alt: `${build.name}: ${build.tagline}`,
    },
  })
}

export default async function BuildPage({ params }: BuildPageProps) {
  const { slug } = await params
  const build = getBuild(slug)
  if (!build) notFound()

  const shelf = shelfMeta[getShelf(build)]
  const activity = await getRecentActivity(slug, Infinity)
  // How it's built: the layers this build has, in order.
  const layers = (['Frontend', 'Backend', 'Cloud'] as const).filter((layer) => build.stack.some((item) => item.layer === layer))
  // Its features, each with the index of its screenshot, if it has one.
  const features: Feature[] = (build.highlights ?? []).map((h) =>
    typeof h === 'string' ? { text: h } : { text: h.text, shot: build.images.findIndex((i) => i.src === h.shot) },
  )
  const icon = BUILD_ICONS[build.slug]
  const caption = build.tryIt?.download ? await downloadCaption(build.tryIt.download) : undefined
  const facts = await buildFacts(build, activity)

  // This site's own page is its own layout: a case study for developers
  // deciding whether to fork it (linked from the homepage's "Use as a template").
  if (slug === 'n8builds') {
    return (
      <>
        <Navbar />
        <N8buildsCaseStudy build={build} activity={activity} />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative min-h-screen bg-darkBlue text-slate-100 focus:outline-none"
      >
        <div className="mx-auto max-w-6xl px-5 pt-28 pb-10 sm:px-8 md:pt-32 md:pb-16">
          {/* Top nav */}
          <Link
            href={shelf.href}
            className="-my-2.5 inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to {shelf.label}
          </Link>

          <LightboxGallery images={build.images} title={build.name}>
            {/* Header (owner, 2026-11-09): one column with everything about the
                build (the kind, the name and tagline, the actions, Star |
                GitHub), and the product itself full width under it. Above the
                fold, so it fades in with CSS on load (FadeIn), never Reveal. */}
            <header className="mt-8 text-center md:mt-10">
              <FadeIn>
                <p className="font-mono text-xs font-semibold tracking-[0.16em] text-cyan-300/90 uppercase">
                  {build.category}
                  {build.status ? <span className="text-slate-450"> · {build.status}</span> : null}
                </p>
                <div className="mt-4 flex items-center justify-center gap-4">
                  {icon && (
                    <Image
                      src={icon}
                      alt=""
                      width={64}
                      height={64}
                      unoptimized={icon.endsWith('.svg')}
                      className="h-12 w-12 shrink-0 rounded-2xl ring-1 ring-white/10 sm:h-14 sm:w-14"
                    />
                  )}
                  <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                    <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      {build.name}
                    </span>
                  </h1>
                </div>
                <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-300 md:text-xl">{build.tagline}</p>

                <BuildActions build={build} caption={caption} />
              </FadeIn>
            </header>

            {/* The product, full width: its clip and Try it live (ProductStage),
                or for a build without them its first screenshot, large. */}
            {build.clip ? (
              <FadeIn delay={0.12} className="mt-10 md:mt-12" data-build-picture="">
                <ProductStage name={build.name} clip={build.clip} tryLive={build.tryLive} />
              </FadeIn>
            ) : build.images.length > 0 ? (
              <FadeIn delay={0.12} className="mt-10 md:mt-12" data-build-picture="">
                <LightboxThumb index={0} label={build.images[0].alt} className={`mx-auto w-full max-w-4xl rounded-2xl border border-white/8 bg-linear-to-br ${build.color}`}>
                  <span className="relative block aspect-video">
                    <Image
                      src={build.images[0].src}
                      alt={build.images[0].alt}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 896px"
                      className="object-contain p-3 transition-transform duration-500 group-hover/shot:scale-[1.02] motion-reduce:transition-none md:p-4"
                    />
                  </span>
                </LightboxThumb>
              </FadeIn>
            ) : null}

            <BuildFactsPanel facts={facts} />

            {/* The story, beside the sidebar from 1024px (owner, 2026-11-09). */}
            <div className="lg:mt-16 lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-16">
              <BuildSidebar facts={facts} parts={pageParts(build, features.length > 0, layers.length > 0, activity.length > 0)} />
              <div className="min-w-0">
                {/* What it does: each feature beside its own screenshot (owner, 2026-11-08) */}
                {features.length > 0 && (
                  <Reveal>
                    <section id="features" aria-labelledby="highlights-heading" className="mt-14 scroll-mt-24 lg:mt-0">
                      <h2 id="highlights-heading" className="text-center text-3xl font-bold tracking-tight">
                        <span className="sr-only">What {build.name} does</span>
                        <span aria-hidden>
                          What it{' '}
                          <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">does</span>
                        </span>
                      </h2>
                      <div className="mt-6">
                        <FeatureShots features={features} images={build.images} />
                      </div>
                    </section>
                  </Reveal>
                )}
                <StoryParts build={build} layers={layers} />
                {/* Its whole build log, by month */}
                <div id="log" className="scroll-mt-24">
                  <BuildPageLog name={build.name} entries={activity} className="mt-16" />
                </div>
              </div>
            </div>
          </LightboxGallery>

          {/* The next builds to look at */}
          <div id="more" className="scroll-mt-24">
            <MoreBuilds current={build.slug} />
          </div>

          {/* Footer nav */}
          <footer className="mt-16 pt-8 border-t border-white/8 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/builds"
              className="-my-2.5 inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              All builds
            </Link>
            <a
              href="https://github.com/n8watkins"
              target="_blank"
              rel="noopener noreferrer"
              className="-my-2.5 inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <FiGithub className="w-4 h-4" />
              github.com/n8watkins
            </a>
          </footer>
        </div>
      </main>
    </>
  )
}

/**
 * The build's story under what it does: the problem and the build, any
 * invitation and credits, how it's built (a tab per layer) and the process
 * notes. Ids for the sidebar's links (pageParts).
 */
function StoryParts({ build, layers }: { build: Build; layers: ('Frontend' | 'Backend' | 'Cloud')[] }) {
  return (
    <>
        {/* Problem / Solution */}
        <Reveal>
          <section id="story" className="mt-16 grid scroll-mt-24 gap-5 md:grid-cols-2" aria-label="Problem and solution">
            <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-450">
                The problem
              </h2>
              <p className="mt-3 text-slate-300 leading-relaxed">{build.problem}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-linear-to-br from-cyan-500/[0.07] to-blue-600/[0.07] p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400">
                The build
              </h2>
              <p className="mt-3 text-slate-300 leading-relaxed">{build.solution}</p>
            </div>
          </section>
        </Reveal>

        {/* An invitation to the visitor, for a door the header doesn't already open */}
        {build.cta && (
          <Reveal>
            <section
              aria-labelledby="cta-heading"
              className="mt-6 flex flex-col gap-4 rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 id="cta-heading" className="text-lg font-bold text-slate-50">
                  {build.cta.heading}
                </h2>
                <p className="mt-1 text-slate-300">{build.cta.body}</p>
              </div>
              <a
                href={build.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400"
              >
                {build.cta.label}
                <FiArrowUpRight className="h-4 w-4" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </section>
          </Reveal>
        )}

        {/* Who the build stands on */}
        {build.credits && build.credits.length > 0 && (
          <Reveal>
            <section
              className="mt-6 rounded-2xl border border-white/8 bg-white/3 p-6"
              aria-labelledby="credits-heading"
            >
              <h2
                id="credits-heading"
                className="text-sm font-bold uppercase tracking-widest text-slate-450"
              >
                Credits
              </h2>
              <ul className="mt-3 space-y-2">
                {build.credits.map((credit) => (
                  <li key={credit.href} className="text-slate-300 leading-relaxed">
                    <a
                      href={credit.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 hover:text-cyan-200"
                    >
                      {credit.name}
                    </a>
                    : {credit.note}
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        )}

        {/* How it's built: one section, a tab per layer, each with its stack
            cards and the one-line choice behind each (owner, 2026-11-08) */}
        {layers.length > 0 && (
          <Reveal>
            <section id="built" className="mt-16 scroll-mt-24" aria-labelledby="how-built-heading">
              <h2 id="how-built-heading" className="text-center text-3xl font-bold tracking-tight">
                How it&apos;s{' '}
                <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">built</span>
              </h2>
              <div className="mt-6">
                <StackTabs
                  tabs={layers.map((layer) => ({
                    label: layer,
                    panel: (
                      // A lone card sits centred, not alone in a two-column grid.
                      <ul
                        aria-label={`${build.name}: ${layer}`}
                        className={`grid gap-3 ${build.stack.filter((item) => item.layer === layer).length > 1 ? 'sm:grid-cols-2' : 'mx-auto max-w-xl'}`}
                      >
                        {build.stack
                          .filter((item) => item.layer === layer)
                          .map((item) => (
                            <li
                              key={item.name}
                              className="flex gap-3.5 rounded-xl border border-white/8 bg-white/3 p-4 transition-[border-color,background-color,translate] duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                            >
                              {item.tech && item.tech.length > 0 && (
                                <span aria-hidden className="flex shrink-0 -space-x-1.5 pt-0.5">
                                  {item.tech.slice(0, 3).map((t) => (
                                    <span key={t} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#0a1428]">
                                      <TechGlyph tech={t} className="h-[18px] w-[18px]" />
                                    </span>
                                  ))}
                                </span>
                              )}
                              <span className="min-w-0">
                                <span className="block text-sm font-bold text-slate-100">{item.name}</span>
                                <span className="mt-1 block text-sm leading-relaxed text-slate-400">{item.detail}</span>
                              </span>
                            </li>
                          ))}
                      </ul>
                    ),
                  }))}
                />
              </div>
            </section>
          </Reveal>
        )}

        {/* Process notes */}
        <Reveal>
          <section id="process" className="mt-16 scroll-mt-24" aria-label="Process notes">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Process{' '}
              <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                notes
              </span>
            </h2>
            <ol className="mx-auto mt-6 max-w-3xl space-y-4">
              {build.process.map((note, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-slate-300 leading-relaxed">{note}</p>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>
    </>
  )
}

/** The sidebar's links: the parts this build's page has, in order. */
function pageParts(build: Build, features: boolean, layers: boolean, log: boolean): PagePart[] {
  return [
    build.clip ? { id: 'demo', label: 'See it in use' } : null,
    features ? { id: 'features', label: 'What it does' } : null,
    build.problem ? { id: 'story', label: 'Problem and build' } : null,
    layers ? { id: 'built', label: "How it's built" } : null,
    build.process.length > 0 ? { id: 'process', label: 'Process notes' } : null,
    log ? { id: 'log', label: 'Build log' } : null,
    { id: 'more', label: 'More builds' },
  ].filter((p) => p !== null)
}

const shippedFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: LOG_TIME_ZONE })

/**
 * The sidebar's basics: what it is, where it is live, its stack's marks (each
 * once, in the stack's order), its license (GitHub's), its newest release and
 * when it last shipped anything (its build log).
 */
async function buildFacts(build: Build, activity: LogEntry[]): Promise<BuildFacts> {
  const repo = build.github ? repoFromUrl(build.github) : null
  const { license } = repo ? await repoFacts(repo) : { license: null }
  const release = activity.find((e) => e.kind === 'release')
  const version = release ? /v\d+(?:\.\d+)*\S*/.exec(release.title)?.[0] : undefined
  const newest = activity[0]
  const live = build.liveSite ?? (build.tryIt && /^https?:/.test(build.tryIt.href) ? build.tryIt.href : undefined)
  return {
    name: build.name,
    category: build.category,
    status: build.status,
    live: live ? { href: live, label: new URL(live).host } : undefined,
    tech: [...new Set(build.stack.flatMap((item) => item.tech ?? []))] as TechKey[],
    license: license ?? undefined,
    version,
    lastShipped: newest ? shippedFormat.format(new Date(newest.date)) : undefined,
    repo: build.github && repo ? { href: build.github, label: repo } : undefined,
  }
}

const outline =
  'inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors duration-200 hover:bg-white/10'

/** Opens in a new tab when it leaves the site. */
const away = (href: string) =>
  /^https?:/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {}

/**
 * The page's actions (owner, 2026-11-08): the build's one main action to the
 * live thing (the same as its Lab row's), then every other way in that the row
 * leaves out (OpenPing's free tools and install guide, the landing page beside
 * an app or a download), then the Star | GitHub split button. The live site
 * sits with them, never on the screenshot, where it covered the app's own
 * controls (round 5 of 2026-11-02), and never twice. The main action is on
 * a line of its own, larger; the rest share the next line, quieter. All
 * centred under the tagline since the header became one column (2026-11-09).
 */
async function BuildActions({ build, caption }: { build: Build; caption?: string }) {
  const main = build.tryIt
  const quiet = (build.moreActions ?? []).filter((a) => a.quiet)
  const more = (build.moreActions ?? []).filter((a) => !a.quiet)
  const sameAs = (a: string, b: string) => a.replace(/\/$/, '') === b.replace(/\/$/, '')
  const live =
    build.liveSite && !(main && sameAs(main.href, build.liveSite)) ? build.liveSite : undefined
  // A desktop app with a build per OS (Scribe) leads with the visitor's OS, the others quiet under it.
  const perOs = main?.download === 'scribe' ? await scribeDownloads() : null
  return (
    <div className="mt-8 flex flex-col items-center">
      {perOs ? (
        <PlatformDownload downloads={perOs} />
      ) : main ? (
        // A download carries what it fetches close under it.
        <div className="flex max-w-full flex-col items-center gap-1.5">
          <a
            href={main.href}
            {...away(main.href)}
            {...(caption ? { 'aria-describedby': 'build-download-facts' } : {})}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-700 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-900/30 transition-colors duration-200 hover:from-blue-700 hover:to-cyan-800"
          >
            {main.download ? <FiDownload aria-hidden className="h-4 w-4" /> : null}
            <ActionLabel label={main.label} />
            {/^https?:/.test(main.href) ? (
              <>
                <FiArrowUpRight aria-hidden className="h-4 w-4" />
                <span className="sr-only"> (opens in a new tab)</span>
              </>
            ) : null}
          </a>
          {caption ? (
            <p id="build-download-facts" className="text-xs text-slate-400">
              {caption}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className={`flex flex-wrap items-center justify-center gap-2.5 ${main ? 'mt-4' : ''}`}>
        {more.map((action) => (
          <a key={action.href} href={action.href} {...away(action.href)} className={outline}>
            {action.label}
            <FiArrowUpRight aria-hidden className="h-4 w-4" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ))}
        {live ? (
          <a href={live} {...away(live)} className={outline}>
            {build.liveSiteIsLanding ? 'Visit the landing page' : 'Visit live site'}
            <FiArrowUpRight aria-hidden className="h-4 w-4" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
        {build.github ? (
          <RepoButtons href={build.github} name={build.name} className="[&>a]:py-2.5" />
        ) : null}
      </div>
      {quiet.length > 0 && (
        // The quiet links share one line (Scribe's Mac and Linux betas), wrapping on phones.
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          {quiet.map((action) => (
            <a
              key={action.href}
              href={action.href}
              {...away(action.href)}
              className="inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-slate-300 transition-colors hover:text-cyan-200"
            >
              {/* One underline under the whole label, marks included (a bottom border:
                  a text underline would break at each mark). */}
              <span className="border-b border-white/30 pb-px">
                <ActionLabel label={action.label} />
              </span>
              {/^https?:/.test(action.href) && <span className="sr-only"> (opens in a new tab)</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
