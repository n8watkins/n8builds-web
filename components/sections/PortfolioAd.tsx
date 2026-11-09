import { FiArrowUpRight } from 'react-icons/fi'
import { ProjectTour, type ProjectTourVideo } from '@/components/sections/FeaturedProjectIslands'

/**
 * An ad for the developer portfolio, right after the Lab: someone who liked
 * the builds and is hiring gets the hire-me page in one click. (The portfolio
 * runs the mirror image: a card selling how n8builds is built.)
 */
const PORTFOLIO = 'https://portfolio.n8builds.dev'

/** Recorded from the live portfolio with Playwright, like the build pages' clips (scripts/product-clips/). */
const PORTFOLIO_CLIP: ProjectTourVideo = {
  webm: '/ads/dev-portfolio-clip.webm',
  mp4: '/ads/dev-portfolio-clip.mp4',
  poster: '/ads/dev-portfolio-clip-poster.webp',
  alt: "A short clip of the developer portfolio's homepage: the hero with its portrait and terminal, the cards for n8builds.dev and Tech for Pros under the pointer, then a scroll through About me to the tech stack",
}

const PortfolioAd = () => (
  <section aria-labelledby="portfolio-ad-heading" className="py-10">
    <div className="grid items-center gap-8 overflow-hidden rounded-2xl border border-cyan-400/20 bg-linear-to-br from-cyan-500/[0.06] to-blue-600/[0.08] p-6 sm:p-8 md:grid-cols-2">
      <div>
        <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">Hiring?</p>
        <h2 id="portfolio-ad-heading" className="text-[1.65rem] font-bold tracking-tight text-slate-50 sm:text-3xl lg:whitespace-nowrap">
          The developer behind the build
        </h2>
        <p className="mt-3 leading-relaxed text-[#9cadc5]">
          The projects I&apos;ve built, the client sites I&apos;ve shipped and my experience, in one place.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={PORTFOLIO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-cyan-400"
          >
            See my portfolio
            <FiArrowUpRight className="h-4 w-4" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a
            href={`${PORTFOLIO}/#projects`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-white/4 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8"
          >
            Jump to the projects
            <FiArrowUpRight className="h-4 w-4" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
      {/* The portfolio in use, a short muted loop (owner, 2026-11-09: a clip, not a still): its
          hero and About scrolled and hovered on the live site. It plays only on screen, stays
          on its poster under reduced motion, and has a pause button (ProjectTour). */}
      <ProjectTour
        title="portfolio"
        noun="clip"
        tour={PORTFOLIO_CLIP}
        className="w-full shadow-2xl shadow-black/40"
        frameClassName="rounded-xl border border-white/10"
        sizes="(min-width: 1152px) 520px, (min-width: 768px) 45vw, 100vw"
      />
    </div>
  </section>
)

export default PortfolioAd
