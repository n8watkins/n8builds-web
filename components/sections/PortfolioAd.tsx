import Image from 'next/image'
import { FiArrowUpRight } from 'react-icons/fi'

/**
 * An ad for the developer portfolio, right after the Lab: someone who liked
 * the builds and is hiring gets the hire-me page in one click. (The portfolio
 * runs the mirror image: a card selling how n8builds is built.)
 */
const PORTFOLIO = 'https://portfolio.n8builds.dev'

/** A project's page on the portfolio, inline in the ad's sentence. */
const ProjectLink = ({ slug, children }: { slug: string; children: React.ReactNode }) => (
  <a
    href={`${PORTFOLIO}/projects/${slug}`}
    target="_blank"
    rel="noopener noreferrer"
    className="font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 transition-colors hover:text-cyan-200 hover:decoration-cyan-200"
  >
    {children}
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
)

const PortfolioAd = () => (
  <section aria-labelledby="portfolio-ad-heading" className="py-10">
    <div className="grid items-center gap-8 overflow-hidden rounded-2xl border border-cyan-400/20 bg-linear-to-br from-cyan-500/[0.06] to-blue-600/[0.08] p-6 sm:p-8 md:grid-cols-2">
      <div>
        <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">Hiring?</p>
        <h2 id="portfolio-ad-heading" className="text-[1.65rem] font-bold tracking-tight text-slate-50 sm:text-3xl lg:whitespace-nowrap">
          The developer behind the build
        </h2>
        <p className="mt-3 leading-relaxed text-[#9cadc5]">
          AI projects with live demos: <ProjectLink slug="echo">a realtime voice agent</ProjectLink>,{' '}
          <ProjectLink slug="scout">a research agent</ProjectLink> and{' '}
          <ProjectLink slug="geminigpt">a chat platform with retrieval</ProjectLink>. Plus the client sites I&apos;ve shipped and my
          experience.
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
      <a
        href={PORTFOLIO}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-[1280/620] overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/40 transition-transform duration-300 hover:scale-[1.01]"
      >
        <Image
          src="/ads/dev-portfolio.webp"
          alt=""
          fill
          sizes="(min-width: 768px) 540px, 100vw"
          className="object-cover"
        />
      </a>
    </div>
  </section>
)

export default PortfolioAd
