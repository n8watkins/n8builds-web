import type { CSSProperties } from 'react'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import FadeIn from '@/components/ui/FadeIn'
import Reveal from '@/components/ui/Reveal'
import JoinButton from '@/components/upcoming/JoinButton'
import { LandingButton } from '@/components/upcoming/ProjectLinks'
import WaitlistPanel from '@/components/upcoming/WaitlistPanel'
import { STATUS_LABEL, UPCOMING, type UpcomingProject } from '@/data/upcoming'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Upcoming | n8builds',
  description:
    "What I'm building in public: Relink and KeysReady for small businesses; Strollz, Feelium, Cutely Ask Me, FitFlow 7, Pivot and Who Am I? for everyday life; VibeLog and Asset Arsenal for developers and creators. Each has a landing page; join a waitlist to hear what's next.",
  shareDescription:
    "What I'm building in public, from walking loops and a 7-minute workout timer to tools for auto shops and coding streams. Join a waitlist to hear what's next.",
  path: '/upcoming',
})

/** A status pill's tint: green for something you can use now, amber for early access, quiet for the rest. */
const STATUS_TONE: Record<UpcomingProject['status'], string> = {
  'try-it': 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200',
  'early-access': 'border-amber-300/30 bg-amber-300/10 text-amber-200',
  'in-development': 'border-white/12 bg-white/5 text-slate-300',
  concept: 'border-white/12 bg-white/5 text-slate-400',
}

/**
 * One project as a teaser (owner, round 11 of 2026-11-09: "far too much going
 * on"; its only job is to send people to check it out): its landing page's
 * picture, its mark, name and status, one line, then "Check it out" and the
 * waitlist. The full pitch lives on the landing page.
 */
function ProjectCard({ project, index }: { project: UpcomingProject; index: number }) {
  return (
    <FadeIn
      as="article"
      delay={0.05 + (index % 4) * 0.06}
      id={project.slug}
      aria-labelledby={`${project.slug}-name`}
      className="flex scroll-mt-24"
    >
      <div
        style={{ '--accent': project.accent } as CSSProperties}
        className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0a1222]/80 transition-colors hover:border-(--accent)/40"
      >
        {/* A renamed project's old anchor (#rewire) still lands here. */}
        {project.oldIds?.map((id) => (
          <span key={id} id={id} aria-hidden className="absolute -top-24" />
        ))}
        <span aria-hidden className="absolute inset-x-0 top-0 z-10 h-[3px] bg-(--accent)" />
        {/* Its landing page, as a picture: the link below opens the real one. */}
        <div className="relative aspect-16/10 overflow-hidden border-b border-white/8 bg-[#07101d]">
          <Image
            src={project.shot}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <header className="flex items-center gap-3">
            <Image src={project.icon} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-white/10" />
            <h2 id={`${project.slug}-name`} className="min-w-0 flex-1 truncate text-xl font-extrabold tracking-tight text-slate-50">
              {project.name}
            </h2>
            <span data-status={project.status} className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[project.status]}`}>
              {STATUS_LABEL[project.status]}
            </span>
          </header>
          <p className="mt-3 text-[0.95rem] leading-snug text-pretty text-slate-300">{project.tagline}</p>
          <div className="mt-auto flex gap-2 pt-5">
            <LandingButton project={project} />
            <JoinButton slug={project.slug} name={project.name} accent={project.accent} compact />
          </div>
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
            <div className="grid gap-5 sm:grid-cols-2">
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
