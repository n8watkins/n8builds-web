import Image from 'next/image'
import { FiExternalLink } from 'react-icons/fi'
import { ProjectTour, type ProjectTourVideo } from '@/components/sections/FeaturedProjectIslands'
import ScribeActions from '@/components/sections/ScribeActions'
import RepoButtons from '@/components/ui/RepoButtons'
import Reveal from '@/components/ui/Reveal'
import { scribeDownloads } from '@/lib/downloads'

/** The tour of the app itself (scripts/scribe-tour/), the same one as the Lab's Scribe row. */
const TOUR: ProjectTourVideo = {
  webm: '/builds/scribe/tour.webm',
  mp4: '/builds/scribe/tour.mp4',
  poster: '/builds/scribe/tour-poster.webp',
  alt: 'A tour of the Scribe app, recorded as someone uses it: starting a dictation and watching the words appear live, then History, the Dictation, Words, Models and Hotkeys settings, and switching to the Emerald theme',
}

const quiet =
  'inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/12 bg-white/4 px-3.5 text-sm font-semibold text-slate-200 transition-colors duration-200 hover:border-white/20 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300'

/**
 * Scribe in the homepage's "Tools I built and use" (owner, 2026-11-08): the
 * tour of the app beside its name, tagline and one line on what it does, then
 * its buttons. No tech pills or feature checks here: its build page ("Full
 * story") has those. The download for the visitor's OS leads on a computer,
 * the full story anywhere else (ScribeActions). /loadout keeps the Lab's full Scribe row.
 */
export default async function ScribeToolRow() {
  const downloads = await scribeDownloads()
  return (
    <article aria-labelledby="scribe-title" className="group/scribe">
      <Reveal className="flex flex-col items-center gap-6 md:flex-row md:gap-12">
        <ProjectTour
          title="Scribe"
          tour={TOUR}
          frameClassName="rounded-2xl border border-white/8 transition-colors duration-200 group-hover/scribe:border-sky-300/30"
        />
        <div className="flex w-full flex-col md:w-1/2">
          <div className="flex items-center gap-3">
            <Image
              src="/builds/scribe/app-icon.png"
              alt=""
              width={44}
              height={44}
              className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-white/10 sm:h-11 sm:w-11"
            />
            <div className="min-w-0">
              <h5 id="scribe-title" className="text-2xl font-bold tracking-tight text-slate-50 transition-colors duration-200 group-hover/scribe:text-sky-100 sm:text-3xl">
                Scribe
              </h5>
              <p className="text-sm font-semibold text-blue-300">Speech-to-text for Windows, Mac and Linux</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-pretty text-[#9cadc5] sm:text-[0.95rem]">
            I dictate with Scribe every day: hold a hotkey, talk and let go, and your words land at the cursor. Your audio
            never leaves your PC.
          </p>
          <div className="mt-5">
            <ScribeActions downloads={downloads} story="/builds/scribe" />
          </div>
          {/* The landing page and the repo, in even halves under the main two where they fit. */}
          <div className="@container mt-3">
            <div className="grid gap-2 @[21rem]:grid-cols-2">
              <a href="https://scribe.n8builds.dev" target="_blank" rel="noopener noreferrer" className={quiet}>
                <FiExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Landing page
                <span className="sr-only"> of Scribe (opens in a new tab)</span>
              </a>
              <RepoButtons href="https://github.com/n8watkins/scribe" name="Scribe" className="w-full" halfClassName="h-10" />
            </div>
          </div>
        </div>
      </Reveal>
    </article>
  )
}
