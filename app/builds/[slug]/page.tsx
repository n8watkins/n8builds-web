import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCheck, FiDownload, FiGithub } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import { builds, getBuild } from '@/data/builds'
import { shelfMeta, getShelf } from '@/data/shelves'
import { pageMetadata, summarize } from '@/lib/seo'
import Reveal from '@/components/ui/Reveal'
import LogEntryItem, { Timeline } from '@/components/log/LogEntryItem'
import { getRecentActivity } from '@/lib/build-log'
import N8buildsCaseStudy from '@/components/builds/n8builds/CaseStudy'
import TechStackCycle from '@/components/Projects/TechStackCycle'
import { projects } from '@/data/projects'
import { BUILD_ICONS } from '@/lib/build-meta'
import { TECH, TechGlyph, type TechKey } from '@/lib/tech-icons'

interface BuildPageProps {
  params: Promise<{ slug: string }>
}

// The builds list is static: any other slug is a plain 404.
export const dynamicParams = false

// "Recent activity" comes from the build log (GitHub), refreshed hourly.
export const revalidate = 3600

export function generateStaticParams() {
  return builds.map(b => ({ slug: b.slug }))
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
    image: { url: `/builds/${slug}/og.png`, width: 1200, height: 630, alt: `${build.name}: ${build.tagline}` },
  })
}

export default async function BuildPage({ params }: BuildPageProps) {
  const { slug } = await params
  const build = getBuild(slug)
  if (!build) notFound()

  const shelf = shelfMeta[getShelf(build)]
  const activity = await getRecentActivity(slug)
  // The tech pills: every technology on the Stack cards, in order, once.
  const techs = [...new Set(build.stack.flatMap((item) => item.tech ?? []))] as TechKey[]
  // The same "how it's built" explainer as the Lab's Details dialog (data/projects.tsx).
  const technologies = projects.find((p) => p.title === build.name)?.technologies
  const icon = BUILD_ICONS[build.slug]
  const download = build.cta?.href.startsWith('/download/') ? build.cta : undefined

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
      <main id="main-content" tabIndex={-1} className="relative min-h-screen bg-darkBlue text-slate-100 focus:outline-none">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-28 pb-10 md:pt-32 md:pb-16">
          {/* Top nav */}
          <Link
            href={`/#${shelf.slug}`}
            className="-my-2.5 inline-flex items-center gap-2 py-2.5 text-sm font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to {shelf.label}
          </Link>

          {/* Header: who it is on the left, the build itself on the right */}
          <header className={`mt-8 grid items-center gap-8 ${build.images.length > 0 ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]' : ''}`}>
            <div>
              <div className="flex items-center gap-4">
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
                    <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{build.name}</span>
                  </h1>
                  <p className="mt-1.5 text-lg text-slate-300">{build.tagline}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-300">{build.category}</span>
                {build.status && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-400">{build.status}</span>
                )}
              </div>

              {techs.length > 0 && (
                <ul aria-label={`${build.name} is built with`} className="mt-3 flex flex-wrap gap-1.5">
                  {techs.map((t) => (
                    <li
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-xs font-semibold text-slate-300"
                    >
                      <TechGlyph tech={t} className="h-3.5 w-3.5" />
                      {TECH[t].label}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {download && (
                  <a
                    href={download.href}
                    className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400"
                  >
                    <FiDownload className="h-4 w-4" />
                    {download.label}
                  </a>
                )}
                {build.github && (
                  <a
                    href={build.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
                  >
                    <FiGithub className="h-4 w-4" />
                    View source
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
                {/* No screenshot to sit beside: the live site goes with the other actions. */}
                {build.liveSite && build.images.length === 0 && <LiveSite href={build.liveSite} />}
              </div>
            </div>

            {build.images.length > 0 && (
              <div className={`relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-br ${build.color}`}>
                <div className="relative aspect-video">
                  <Image
                    src={build.images[0].src}
                    alt={build.images[0].alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="object-contain p-3 md:p-4"
                  />
                </div>
                {/* The live site, on the right of the picture of it. */}
                {build.liveSite && (
                  <div className="absolute top-3 right-3">
                    <LiveSite href={build.liveSite} />
                  </div>
                )}
              </div>
            )}
          </header>

          {/* What it does, as a checklist */}
          {build.highlights && build.highlights.length > 0 && (
            <section aria-labelledby="highlights-heading" className="mt-10">
              <h2 id="highlights-heading" className="sr-only">
                What {build.name} does
              </h2>
              <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {build.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[0.95rem] leading-snug text-slate-200">
                    <FiCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* The other screenshots */}
          {build.images.length > 1 && (
            <section className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3" aria-label="More screenshots">
              {build.images.slice(1).map((img) => (
                <div key={img.src} className="relative aspect-video overflow-hidden rounded-xl border border-white/8 bg-white/3">
                  <Image src={img.src} alt={img.alt} fill sizes="(max-width: 768px) 50vw, 360px" className="object-contain p-2" />
                </div>
              ))}
            </section>
          )}

          {/* Problem / Solution */}
          <Reveal>
            <section className="mt-12 grid md:grid-cols-2 gap-5" aria-label="Problem and solution">
              <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-450">The problem</h2>
                <p className="mt-3 text-slate-300 leading-relaxed">{build.problem}</p>
              </div>
              <div className="rounded-2xl border border-cyan-400/15 bg-linear-to-br from-cyan-500/[0.07] to-blue-600/[0.07] p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400">The build</h2>
                <p className="mt-3 text-slate-300 leading-relaxed">{build.solution}</p>
              </div>
            </section>
          </Reveal>

          {/* An invitation to the visitor, when the build has one (a download is already up top) */}
          {build.cta && !download && (
            <Reveal>
              <section
                aria-labelledby="cta-heading"
                className="mt-6 flex flex-col gap-4 rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 id="cta-heading" className="text-lg font-bold text-slate-50">{build.cta.heading}</h2>
                  <p className="mt-1 text-slate-300">{build.cta.body}</p>
                </div>
                <a
                  href={build.cta.href}
                  // An outside site opens in a new tab; a download (/download/...) starts here.
                  {...(build.cta.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400"
                >
                  {build.cta.label}
                  {build.cta.href.startsWith('http') ? (
                    <>
                      <FiArrowUpRight className="h-4 w-4" />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </>
                  ) : (
                    <FiDownload className="h-4 w-4" />
                  )}
                </a>
              </section>
            </Reveal>
          )}

          {/* Who the build stands on */}
          {build.credits && build.credits.length > 0 && (
            <Reveal>
              <section className="mt-6 rounded-2xl border border-white/8 bg-white/3 p-6" aria-labelledby="credits-heading">
                <h2 id="credits-heading" className="text-sm font-bold uppercase tracking-widest text-slate-450">Credits</h2>
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

          {/* How it's built: the Details dialog's explainer, front to back */}
          {technologies && (
            <Reveal>
              <section className="mt-12" aria-labelledby="how-built-heading">
                <h2 id="how-built-heading" className="text-2xl font-bold tracking-tight">
                  How it&apos;s{' '}
                  <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">built</span>
                </h2>
                <div className="mt-5 rounded-2xl border border-white/8 bg-linear-to-br from-blue-500/[0.06] to-cyan-500/[0.04] p-5 sm:p-6">
                  <TechStackCycle technologies={technologies} />
                </div>
              </section>
            </Reveal>
          )}

          {/* Stack */}
          <Reveal>
            <section className="mt-12" aria-label="Tech stack">
              <h2 className="text-2xl font-bold tracking-tight">
                Stack{' '}
                <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  &amp; choices
                </span>
              </h2>
              <ul className="mt-5 grid sm:grid-cols-2 gap-3">
                {build.stack.map(item => (
                  <li key={item.name} className="flex gap-3.5 rounded-xl border border-white/8 bg-white/3 p-4 transition-colors hover:border-white/15 hover:bg-white/5">
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
            </section>
          </Reveal>

          {/* Process notes */}
          <Reveal>
            <section className="mt-12" aria-label="Process notes">
              <h2 className="text-2xl font-bold tracking-tight">
                Process{' '}
                <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  notes
                </span>
              </h2>
              <ol className="mt-5 space-y-4">
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

          {/* Recent activity, from the build log */}
          {activity.length > 0 && (
            <Reveal>
              <section className="mt-12" aria-labelledby="activity-heading">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <h2 id="activity-heading" className="text-2xl font-bold tracking-tight">
                    Recent{' '}
                    <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      activity
                    </span>
                  </h2>
                  <Link
                    href={`/builds?build=${build.slug}#activity`}
                    className="-my-2.5 inline-flex items-center gap-1.5 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
                  >
                    Full log for {build.name}
                    <FiArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <Timeline className="mt-6">
                  {activity.map((entry) => (
                    <LogEntryItem key={entry.id} entry={entry} buildName={build.name} showBuild={false} />
                  ))}
                </Timeline>
              </section>
            </Reveal>
          )}

          {/* Footer nav */}
          <footer className="mt-16 pt-8 border-t border-white/8 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/#lab"
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

/** "Visit live site", opening in a new tab. */
function LiveSite({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/30 transition-all duration-200 hover:scale-[1.02] hover:from-cyan-400 hover:to-blue-500"
    >
      Visit live site
      <FiArrowUpRight className="h-4 w-4" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
