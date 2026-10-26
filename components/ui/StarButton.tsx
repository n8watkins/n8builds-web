import { FiStar } from 'react-icons/fi'

/**
 * The site's one "Star on GitHub" button, used by the Lab rows and the Chrome
 * extensions. Amber-tinted rather than filled, so it stands out without
 * competing with a row's primary button. Its accessible name says which repo
 * it stars, so a screen reader's link list can tell the rows apart.
 */
export default function StarButton({ href, name, className = '' }: { href: string; name: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/star inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-amber-300/35 bg-amber-300/[0.08] px-4 py-2 text-sm font-semibold text-amber-200 transition-all duration-200 hover:scale-[1.02] hover:border-amber-300/55 hover:bg-amber-300/[0.15] motion-reduce:hover:scale-100 ${className}`}
    >
      <FiStar className="h-3.5 w-3.5 transition-[fill] group-hover/star:fill-current" />
      {/* Read aloud as "Star <name> on GitHub (opens in a new tab)". On the
          narrowest phones, where the full label can't fit its half of the row,
          only "Star" shows; the rest stays in the name. */}
      <span>
        Star<span className="sr-only"> {name}</span>
        <span className="max-[359px]:sr-only"> on GitHub</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </span>
    </a>
  )
}
