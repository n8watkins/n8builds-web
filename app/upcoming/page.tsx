import type { CSSProperties } from 'react'
import Image from 'next/image'
import { FiArrowUpRight, FiCheck } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import FadeIn from '@/components/ui/FadeIn'
import Reveal from '@/components/ui/Reveal'
import JoinButton from '@/components/upcoming/JoinButton'
import WaitlistForm from '@/components/upcoming/WaitlistForm'
import { UPCOMING, type UpcomingProject } from '@/data/upcoming'
import { pageMetadata } from '@/lib/seo'
import { isWaitlistOpen } from '@/lib/waitlist/store'

export const metadata = pageMetadata({
  title: 'Upcoming | n8builds',
  description:
    "Projects I'm outlining in public: Relink, an open-source 404 safety net; Strollz, walking loops through streets you've never walked; and VibeLog, live telemetry for coding streams. Join a waitlist to hear when there is something to try.",
  shareDescription:
    "What I'm outlining next: Relink, Strollz and VibeLog. Join a waitlist to hear when there is something to try.",
  path: '/upcoming',
})

function ProjectCard({ project, index }: { project: UpcomingProject; index: number }) {
  return (
    <FadeIn
      as="article"
      delay={0.1 + index * 0.08}
      id={project.slug}
      aria-labelledby={`${project.slug}-name`}
      className="flex scroll-mt-24"
    >
      <div
        style={{ '--accent': project.accent } as CSSProperties}
        className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0a1222]/80 p-6 sm:p-7"
      >
        {/* The project's colour: a bar along the top and a faint glow behind the header. */}
        {/* A renamed project's old anchor (#rewire) still lands here. */}
        {project.oldIds?.map((id) => (
          <span key={id} id={id} aria-hidden className="absolute -top-24" />
        ))}
        <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-(--accent)" />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-16 h-56 w-72 bg-radial from-(--accent)/12 to-transparent to-70%"
        />

        <header className="relative flex items-start gap-4">
          <Image src={project.icon} alt="" width={52} height={52} className="h-13 w-13 shrink-0 rounded-xl ring-1 ring-white/10" />
          <div className="min-w-0">
            <h2 id={`${project.slug}-name`} className="text-2xl font-extrabold tracking-tight text-slate-50">
              {project.name}
              {project.nameNote && (
                <span className="ml-2 align-middle text-xs font-medium text-slate-450">({project.nameNote})</span>
              )}
            </h2>
            <p className="mt-0.5 text-[0.95rem] font-medium text-balance text-(--accent)">{project.tagline}</p>
          </div>
        </header>

        <p className="relative mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 font-semibold text-amber-200">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            Status: {project.status}
          </span>
          <span className="text-slate-400">{project.stage}</span>
        </p>

        <p className="relative mt-4 leading-relaxed text-slate-200">{project.what}</p>

        <p className="relative mt-4 text-sm leading-relaxed text-slate-300">
          <span className="font-semibold text-slate-100">Who it&rsquo;s for: </span>
          {project.forWho}
        </p>

        <ul className="relative mt-5 space-y-2.5" aria-label={`${project.name}: key points`}>
          {project.points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm font-medium text-slate-200">
              <FiCheck className="mt-[3px] h-4 w-4 shrink-0 text-(--accent)" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>

        {/* mt-auto keeps the two cards' buttons level when one card's text runs longer. */}
        <div className="relative mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
          <JoinButton slug={project.slug} name={project.name} accent={project.accent} />
          <a
            href={project.landing}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-300 transition-colors hover:text-cyan-200"
          >
            Visit the landing page
            <span className="sr-only"> for {project.name} (opens in a new tab)</span>
            <FiArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </FadeIn>
  )
}

export default function UpcomingPage() {
  const open = isWaitlistOpen()
  // As the contact form: under `next dev` the server skips Turnstile.
  const turnstileSiteKey = process.env.NODE_ENV === 'development' ? '' : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="relative min-h-screen bg-darkBlue text-slate-100 focus:outline-none">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-0 h-128 w-lg scale-[1.6] bg-radial from-cyan-500/6 to-transparent to-70%" />
          <div className="absolute right-[-10%] top-[60rem] h-120 w-120 scale-[1.6] bg-radial from-blue-600/6 to-transparent to-70%" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8 md:pt-36">
          <FadeIn as="header">
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em] text-cyan-400">Upcoming</p>
            <h1 className="mt-3 text-[2.6rem] font-extrabold leading-[1.03] tracking-tight text-slate-50 sm:text-6xl/none">
              What&rsquo;s{' '}
              <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">cookin&rsquo;</span>
            </h1>
            <p className="mt-4 max-w-[640px] text-base leading-relaxed text-[#9cadc5] sm:text-lg/7">
              Things I am outlining in public: plans and landing pages, nothing you can use yet. Join a waitlist and I will email
              you when there is something to try.
            </p>
          </FadeIn>

          <div className="mt-10 grid gap-6 md:mt-12 lg:grid-cols-3">
            {UPCOMING.map((project, index) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>

          <Reveal as="section" id="waitlist" className="mx-auto mt-16 max-w-2xl scroll-mt-24 md:mt-20">
            <div className="rounded-2xl border border-white/8 bg-linear-to-br from-cyan-500/[0.06] to-blue-600/[0.03] p-6 sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                Join the <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">waitlist</span>
              </h2>
              {open ? (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
                    Pick the projects you want to hear about. I&rsquo;ll email a link to confirm, so nobody can sign you up but
                    you.
                  </p>
                  <div className="mt-6">
                    <WaitlistForm turnstileSiteKey={turnstileSiteKey} />
                  </div>
                </>
              ) : (
                <div data-waitlist-closed className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300 sm:text-base">
                  <p className="font-semibold text-slate-100">The waitlist opens soon.</p>
                  <p>
                    Until it does, email me at{' '}
                    <a
                      href="mailto:contact@n8builds.dev"
                      className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
                    >
                      contact@n8builds.dev
                    </a>{' '}
                    with the project you&rsquo;re interested in, and I&rsquo;ll let you know when there is something to try.
                  </p>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </main>
    </>
  )
}
