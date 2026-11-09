import type { CSSProperties } from 'react'
import Image from 'next/image'
import { FiCheck } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import FadeIn from '@/components/ui/FadeIn'
import Reveal from '@/components/ui/Reveal'
import JoinButton from '@/components/upcoming/JoinButton'
import { CodeLink, LandingButton } from '@/components/upcoming/ProjectLinks'
import WaitlistPanel from '@/components/upcoming/WaitlistPanel'
import { UPCOMING, type UpcomingProject } from '@/data/upcoming'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Upcoming | n8builds',
  description:
    "What I'm building in public: Relink and KeysReady for small businesses; Strollz, Feelium, Cutely Ask Me, FitFlow 7, Pivot and Who Am I? for everyday life; VibeLog and Asset Arsenal for developers and creators. Each has a landing page; join a waitlist to hear what's next.",
  shareDescription:
    "What I'm building in public, from walking loops and a 7-minute workout timer to tools for auto shops and coding streams. Join a waitlist to hear what's next.",
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
        className="@container relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0a1222]/80 p-6 sm:p-7"
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

        {/* No status line (owner, round 7 of 2026-11-09): every project has a live landing page. */}
        <p className="relative mt-5 leading-relaxed text-pretty text-slate-200">{project.what}</p>

        <p className="relative mt-4 text-sm leading-relaxed text-pretty text-slate-300">
          <span className="font-semibold text-slate-100">Who it&rsquo;s for: </span>
          {project.forWho}
        </p>

        <ul className="relative mt-5 space-y-2.5" aria-label={`${project.name}: key points`}>
          {project.points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm font-medium text-pretty text-slate-200">
              <FiCheck className="mt-[3px] h-4 w-4 shrink-0 text-(--accent)" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>

        {/* The landing page first, then Join, then the code where the repository is public
             (owner, 2026-11-02): the two buttons side by side, equal widths, where the card
             has room (a container query, as the card's width doesn't follow the window's),
             stacked otherwise. mt-auto keeps side-by-side cards' buttons level. */}
        <div className="relative mt-auto pt-6">
          <div className="flex flex-col gap-3 @md:flex-row">
            <LandingButton project={project} />
            <JoinButton slug={project.slug} name={project.name} accent={project.accent} compact />
          </div>
          {project.repo && (
            <p className="mt-4">
              <CodeLink project={project} />
            </p>
          )}
        </div>
      </div>
    </FadeIn>
  )
}

export default function UpcomingPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="relative min-h-screen bg-darkBlue text-slate-100 focus:outline-none">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-0 h-128 w-lg scale-[1.6] bg-radial from-cyan-500/6 to-transparent to-70%" />
          <div className="absolute right-[-10%] top-[60rem] h-120 w-120 scale-[1.6] bg-radial from-blue-600/6 to-transparent to-70%" />
        </div>

        <div className="relative mx-auto max-w-site px-5 pb-24 pt-28 sm:px-8 md:pt-36">
          <FadeIn as="header">
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em] text-cyan-400">Upcoming</p>
            <h1 className="mt-3 text-[2.6rem] font-extrabold leading-[1.03] tracking-tight text-slate-50 sm:text-6xl/none">
              What&rsquo;s{' '}
              <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">cookin&rsquo;</span>
            </h1>
            <p className="mt-4 max-w-[640px] text-base leading-relaxed text-[#9cadc5] sm:text-lg/7">
              Things I&rsquo;m building in public, each with its own landing page: some are plans, some you can already try.
              Join a waitlist and I&rsquo;ll email you when there&rsquo;s news.
            </p>
          </FadeIn>

          {/* From 1024px the waitlist is a sticky column beside the cards (round 5 of
               2026-11-02: sign up while reading), the cards one to a row beside it;
               below that the cards come first (two by two from 960px, an odd last
               card spanning the row) and the waitlist after them. One form either
               way, so ?interest= and the cards' Join buttons tick the same one. */}
          <div className="mt-10 grid gap-6 md:mt-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="grid gap-6 min-[960px]:max-lg:grid-cols-2 min-[960px]:max-lg:[&>*:nth-child(odd):last-child]:col-span-2">
              {UPCOMING.map((project, index) => (
                <ProjectCard key={project.slug} project={project} index={index} />
              ))}
            </div>

            <Reveal
              as="section"
              id="waitlist"
              className="waitlist-flash mx-auto mt-10 w-full max-w-2xl scroll-mt-24 rounded-2xl md:mt-14 lg:sticky lg:top-24 lg:mt-0 lg:max-h-[calc(100dvh-7rem)] lg:max-w-none lg:overflow-y-auto"
            >
              <WaitlistPanel layout="side" />
            </Reveal>
          </div>
        </div>
      </main>
    </>
  )
}
