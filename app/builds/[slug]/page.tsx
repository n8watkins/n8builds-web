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
import { downloadCaption } from '@/lib/downloads'
import { getRecentActivity } from '@/lib/build-log'
import N8buildsCaseStudy from '@/components/builds/n8builds/CaseStudy'
import { LightboxGallery, LightboxThumb } from '@/components/builds/Lightbox'
import MoreBuilds from '@/components/builds/MoreBuilds'
import FadeIn from '@/components/ui/FadeIn'
import FeatureShots, { type Feature } from '@/components/builds/FeatureShots'
import StackTabs from '@/components/builds/StackTabs'
import { ProjectTour } from '@/components/sections/FeaturedProjectIslands'
import { BUILD_ICONS } from '@/lib/build-meta'
import { TechGlyph } from '@/lib/tech-icons'

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
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-28 pb-10 md:pt-32 md:pb-16">
          {/* Top nav */}
          <Link
            href={shelf.href}
            className="-my-2.5 inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to {shelf.label}
          </Link>

          <LightboxGallery images={build.images} title={build.name}>
            {/* Header (owner, 2026-11-08: clearer hierarchy): the kind as a quiet
                line over the name, the name and tagline, then the actions with
                room around them; the build itself on the right. The stack's
                pills live in Stack & choices. Above the fold, so it fades in
                with CSS on load (FadeIn), never Reveal. */}
            <header
              className={`mt-10 grid items-center gap-10 ${build.images.length > 0 ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12' : ''}`}
            >
              <FadeIn>
                <p className="font-mono text-xs font-semibold tracking-[0.16em] text-cyan-300/90 uppercase">
                  {build.category}
                  {build.status ? <span className="text-slate-450"> · {build.status}</span> : null}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  {icon && (
                    <Image
                      src={icon}
                      alt=""
                      width={64}
                      height={64}
                      unoptimized={icon.endsWith('.svg')}
                      className="h-14 w-14 shrink-0 rounded-2xl ring-1 ring-white/10 sm:h-16 sm:w-16"
                    />
                  )}
                  <div className="min-w-0">
                    <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                      <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        {build.name}
                      </span>
                    </h1>
                    <p className="mt-1.5 text-lg text-slate-300">{build.tagline}</p>
                  </div>
                </div>

                <BuildActions build={build} caption={caption} />
              </FadeIn>

              {build.clip ? (
                // The product in use, a few silent seconds on a loop (scripts/product-clips/).
                <FadeIn delay={0.12}>
                  <ProjectTour
                    title={build.name}
                    tour={build.clip}
                    className="w-full"
                    frameClassName="rounded-2xl border border-white/10 shadow-2xl shadow-black/40"
                    sizes="(max-width: 1024px) 100vw, 560px"
                    noun="clip"
                  />
                </FadeIn>
              ) : build.images.length > 0 ? (
                <FadeIn delay={0.12}>
                  <LightboxThumb index={0} label={build.images[0].alt} className={`w-full rounded-2xl border border-white/8 bg-linear-to-br ${build.color}`}>
                    <span className="relative block aspect-video">
                      <Image
                        src={build.images[0].src}
                        alt={build.images[0].alt}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 560px"
                        className="object-contain p-3 transition-transform duration-500 group-hover/shot:scale-[1.02] motion-reduce:transition-none md:p-4"
                      />
                    </span>
                  </LightboxThumb>
                </FadeIn>
              ) : null}
            </header>

            {/* What it does: each feature beside its own screenshot (owner, 2026-11-08) */}
            {features.length > 0 && (
              <Reveal>
                <section aria-labelledby="highlights-heading" className="mt-14">
                  <h2 id="highlights-heading" className="sr-only">
                    What {build.name} does
                  </h2>
                  <FeatureShots features={features} images={build.images} />
                </section>
              </Reveal>
            )}
          </LightboxGallery>

          {/* Problem / Solution */}
          <Reveal>
            <section className="mt-12 grid md:grid-cols-2 gap-5" aria-label="Problem and solution">
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
                        <span className="sr-only"> (opens in a new tab)</span>
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
              <section className="mt-16" aria-labelledby="how-built-heading">
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
            <section className="mt-16" aria-label="Process notes">
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

          {/* Its whole build log, by month */}
          <BuildPageLog name={build.name} entries={activity} className="mt-16" />

          {/* The next builds to look at */}
          <MoreBuilds current={build.slug} />

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
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </footer>
        </div>
      </main>
    </>
  )
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
 * a line of its own, larger; the rest share the next line, quieter.
 */
async function BuildActions({ build, caption }: { build: Build; caption?: string }) {
  const main = build.tryIt
  const quiet = (build.moreActions ?? []).filter((a) => a.quiet)
  const more = (build.moreActions ?? []).filter((a) => !a.quiet)
  const sameAs = (a: string, b: string) => a.replace(/\/$/, '') === b.replace(/\/$/, '')
  const live =
    build.liveSite && !(main && sameAs(main.href, build.liveSite)) ? build.liveSite : undefined
  return (
    <div className="mt-8">
      {main ? (
        // A download carries what it fetches close under it.
        <div className="flex max-w-full flex-col items-start gap-1.5">
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
      <div className={`flex flex-wrap items-center gap-2.5 ${main ? 'mt-4' : ''}`}>
        {more.map((action) => (
          <a key={action.href} href={action.href} {...away(action.href)} className={outline}>
            {action.label}
            <FiArrowUpRight aria-hidden className="h-4 w-4" />
            {/^https?:/.test(action.href) && <span className="sr-only"> (opens in a new tab)</span>}
          </a>
        ))}
        {live ? (
          <a href={live} {...away(live)} className={outline}>
            {build.liveSiteIsLanding ? 'Visit the landing page' : 'Visit live site'}
            <FiArrowUpRight aria-hidden className="h-4 w-4" />
            {/^https?:/.test(live) && <span className="sr-only"> (opens in a new tab)</span>}
          </a>
        ) : null}
        {build.github ? (
          <RepoButtons href={build.github} name={build.name} className="[&>a]:py-2.5" />
        ) : null}
      </div>
      {quiet.map((action) => (
        <a
          key={action.href}
          href={action.href}
          {...away(action.href)}
          className="mt-3 inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-slate-300 transition-colors hover:text-cyan-200"
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
  )
}
