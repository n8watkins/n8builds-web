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
  /** The homepage's narrow cards: "See the landing page" where four share a row. */
  compact?: boolean
}) {
  return (
    <a
      href={project.landing}
      target="_blank"
      rel="noopener noreferrer"
      style={{ '--accent': project.accent } as CSSProperties}
      className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-(--accent) px-3 text-sm font-bold whitespace-nowrap text-slate-950 transition-[filter] duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
    >
      {compact ? (
        // Four cards across (1024px up) leave too little width for the full label to breathe.
        <>
          <span className="lg:hidden">Check out the landing page</span>
          <span className="hidden lg:inline">See the landing page</span>
        </>
      ) : (
        'Check out the landing page'
      )}
      <span className="sr-only"> for {project.name} (opens in a new tab)</span>
      <FiArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
    </a>
  )
}

/** "View the code" on GitHub, for a project whose repository is public; nothing otherwise. */
export function CodeLink({ project }: { project: UpcomingProject }) {
  if (!project.repo) return null
  return (
    <a
      href={`https://github.com/${project.repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-cyan-200"
    >
      <FiGithub aria-hidden="true" className="h-4 w-4" />
      View the code
      <span className="sr-only"> of {project.name} on GitHub (opens in a new tab)</span>
      <FiArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
    </a>
  )
}
