import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FiArrowLeft, FiArrowUpRight, FiGithub } from 'react-icons/fi'
import { builds, getBuild } from '@/data/builds'
import { shelfMeta, getShelf } from '@/data/shelves'

interface BuildPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return builds.map(b => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: BuildPageProps): Promise<Metadata> {
  const { slug } = await params
  const build = getBuild(slug)
  if (!build) return { title: 'Build not found — n8builds' }

  const title = `${build.name} — n8builds`
  const description = `${build.tagline}. ${build.solution}`
  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: build.tagline,
      images: build.images[0] ? [{ url: build.images[0].src, alt: build.images[0].alt }] : undefined,
    },
  }
}

export default async function BuildPage({ params }: BuildPageProps) {
  const { slug } = await params
  const build = getBuild(slug)
  if (!build) notFound()

  const shelf = shelfMeta[getShelf(build)]

  return (
    <main className="relative min-h-screen bg-[#050812] text-slate-100">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 md:py-16">
        {/* Top nav */}
        <Link
          href={`/#${shelf.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to {shelf.label}
        </Link>

        {/* Header */}
        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              {build.category}
            </span>
            {build.status && (
              <span className="px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-slate-400">
                {build.status}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {build.name}
            </span>
          </h1>
          <p className="mt-3 text-lg text-slate-400">{build.tagline}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {build.github && (
              <a
                href={build.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold text-slate-200 transition-all duration-200 hover:scale-[1.02]"
              >
                <FiGithub className="w-4 h-4" />
                View source
              </a>
            )}
            {build.liveSite && (
              <a
                href={build.liveSite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02]"
              >
                Visit live site
                <FiArrowUpRight className="w-4 h-4" />
              </a>
            )}
            <div className="flex flex-wrap gap-1.5">
              {build.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Screenshots */}
        {build.images.length > 0 && (
          <section className="mt-12" aria-label="Screenshots">
            <div className={`relative rounded-2xl border border-white/8 bg-gradient-to-br ${build.color} overflow-hidden`}>
              <div className="relative aspect-video">
                <Image
                  src={build.images[0].src}
                  alt={build.images[0].alt}
                  fill
                  priority
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="object-contain p-3 md:p-5"
                />
              </div>
            </div>
            {build.images.length > 1 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {build.images.slice(1).map(img => (
                  <div
                    key={img.src}
                    className="relative aspect-video rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden"
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 768px) 50vw, 290px"
                      className="object-contain p-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Problem / Solution */}
        <section className="mt-12 grid md:grid-cols-2 gap-5" aria-label="Problem and solution">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">The problem</h2>
            <p className="mt-3 text-slate-300 leading-relaxed">{build.problem}</p>
          </div>
          <div className="rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/[0.07] to-blue-600/[0.07] p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400">The build</h2>
            <p className="mt-3 text-slate-300 leading-relaxed">{build.solution}</p>
          </div>
        </section>

        {/* Stack */}
        <section className="mt-12" aria-label="Tech stack">
          <h2 className="text-2xl font-bold tracking-tight">
            Stack{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              &amp; choices
            </span>
          </h2>
          <ul className="mt-5 grid sm:grid-cols-2 gap-3">
            {build.stack.map(item => (
              <li key={item.name} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <span className="block text-sm font-bold text-slate-100">{item.name}</span>
                <span className="mt-1 block text-sm text-slate-400 leading-relaxed">{item.detail}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Process notes */}
        <section className="mt-12" aria-label="Process notes">
          <h2 className="text-2xl font-bold tracking-tight">
            Process{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              notes
            </span>
          </h2>
          <ol className="mt-5 space-y-4">
            {build.process.map((note, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                <p className="text-slate-300 leading-relaxed">{note}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Footer nav */}
        <footer className="mt-16 pt-8 border-t border-white/8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/#lab"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            All builds
          </Link>
          <a
            href="https://github.com/n8watkins"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <FiGithub className="w-4 h-4" />
            github.com/n8watkins
          </a>
        </footer>
      </div>
    </main>
  )
}
