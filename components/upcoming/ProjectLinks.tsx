import type { CSSProperties } from 'react'
import { FiArrowUpRight, FiGithub } from 'react-icons/fi'
import type { UpcomingProject } from '@/data/upcoming'

/**
 * An upcoming project's main action (owner, 2026-11-02: "the landing page
 * should be the main thing"): its landing page, in a new tab, as a solid
 * button in the project's colour. "Join the waitlist" (JoinButton) is the
 * second action, and "View the code" a link, only for a public repository.
 * Shared by the homepage's What's cookin' cards and /upcoming. Full width:
 * its row sets the size, so it matches the Join button beside or under it.
 */
export function LandingButton({
  project,
  compact = false,
}: {
  project: UpcomingProject
  /**
   * The homepage's cards: "Landing page", half a row beside "View the code"
   * (round 3 of 2026-11-02; "Live site" until round 4, which named what it opens).
   */
  compact?: boolean
}) {
  return (
    <a
      href={project.landing}
      target="_blank"
      rel="noopener noreferrer"
      style={{ '--accent': project.accent } as CSSProperties}
      className={`inline-flex ${compact ? 'h-10 gap-1 px-1.5 text-[13px]' : 'h-11 gap-1.5 px-3 text-sm'} w-full items-center justify-center rounded-lg bg-(--accent) font-bold whitespace-nowrap text-slate-950 transition-[filter] duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)`}
    >
      {compact ? 'Landing page' : 'Check out the landing page'}
      <span className="sr-only"> for {project.name} (opens in a new tab)</span>
      <FiArrowUpRight aria-hidden="true" className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0`} />
    </a>
  )
}

/**
 * "View the code" on GitHub, for a project whose repository is public; nothing
 * otherwise. A plain link on /upcoming; on the homepage's cards (`button`) a
 * quiet bordered button as tall as "Landing page" beside it.
 */
export function CodeLink({ project, button = false }: { project: UpcomingProject; button?: boolean }) {
  if (!project.repo) return null
  return (
    <a
      href={`https://github.com/${project.repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className={
        button
          ? 'inline-flex h-10 w-full items-center justify-center gap-1 rounded-lg border border-white/12 bg-white/4 px-1.5 text-[13px] font-semibold whitespace-nowrap text-slate-200 transition-colors hover:border-white/20 hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300'
          : 'inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-cyan-200'
      }
    >
      {/* On the homepage's cards the mark gives way below 360px, where "Landing page"
          and "View the code" only fit side by side without it (round 4 of 2026-11-02). */}
      <FiGithub aria-hidden="true" className={`${button ? 'hidden h-3.5 w-3.5 min-[360px]:block' : 'h-4 w-4'} shrink-0`} />
      View the code
      <span className="sr-only"> of {project.name} on GitHub (opens in a new tab)</span>
      {/* The button has GitHub's mark to say where it goes; the plain link keeps its arrow. */}
      {!button && <FiArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
    </a>
  )
}
