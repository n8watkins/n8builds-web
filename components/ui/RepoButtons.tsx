import { FiGithub, FiStar } from 'react-icons/fi'
import { formatStars, repoFromUrl, repoStars } from '@/lib/github-stars'

/**
 * A repo's two links as one split control: "Star" (amber, like StarButton) and
 * "GitHub", joined. Both open the repo; starring happens there. Each half has
 * its own accessible name ("Star <name> on GitHub", "<name> on GitHub"). The
 * Star half shows the repo's live star count when GitHub reports one (cached
 * hourly on the server, lib/github-stars.ts); otherwise just "Star".
 *
 * A server component: rendered with the page, no client JS.
 */
export default async function RepoButtons({ href, name, className = '' }: { href: string; name: string; className?: string }) {
  const repo = repoFromUrl(href)
  const stars = repo ? await repoStars(repo) : null
  const half =
    'inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap px-3.5 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300'
  return (
    <div role="group" aria-label={`${name} on GitHub`} className={`inline-flex items-stretch rounded-xl ${className}`}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`group/star ${half} rounded-l-xl border border-amber-300/35 bg-amber-300/[0.08] text-amber-200 hover:border-amber-300/55 hover:bg-amber-300/[0.15]`}
      >
        <FiStar className="h-3.5 w-3.5 shrink-0 transition-[fill] group-hover/star:fill-current" />
        <span>
          Star<span className="sr-only"> {name} on GitHub (opens in a new tab)</span>
        </span>
        {stars !== null && stars > 0 ? (
          <span aria-hidden="true" className="rounded-md bg-amber-300/15 px-1.5 text-xs tabular-nums text-amber-100">
            {formatStars(stars)}
          </span>
        ) : null}
      </a>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${half} -ml-px rounded-r-xl border border-white/12 bg-white/4 text-slate-300 hover:bg-white/8 hover:text-slate-100`}
      >
        <FiGithub className="h-3.5 w-3.5 shrink-0" />
        <span>
          <span className="sr-only">{name} on </span>GitHub<span className="sr-only"> (opens in a new tab)</span>
        </span>
      </a>
    </div>
  )
}
