import Link from 'next/link'
import { FiArrowUpRight, FiGithub } from 'react-icons/fi'

/**
 * The end of the homepage: both sites are public and free to reuse. This is
 * where "how n8builds is built and tested" lives now, instead of a featured
 * row advertising the site's own specs (the detail is /builds/n8builds).
 */
const TEMPLATES = [
  {
    name: 'n8builds-web',
    what: 'This site',
    description:
      'Next.js 16 and Sanity. Every pull request runs the Playwright suite on five browsers and the APIs, plus Lighthouse budgets, before anything merges; the contact form fails closed behind Turnstile and rate limits.',
    license: 'MIT',
    repo: 'https://github.com/n8watkins/n8builds-web',
    more: { label: 'How it is built and tested', href: '/builds/n8builds', internal: true },
  },
  {
    name: 'dev-portfolio',
    what: 'My developer portfolio',
    description:
      'Next.js 16 project pages with live demo status from OpenPing, generated share cards, and CI on every pull request. A clean starting point for a portfolio of your own.',
    license: 'MIT (code; my photos and write-ups stay mine)',
    repo: 'https://github.com/n8watkins/dev-portfolio',
    more: { label: 'See it live', href: 'https://portfolio.n8builds.dev', internal: false },
  },
]

const UseAsTemplate = () => (
  <section id="template" aria-labelledby="template-heading" className="py-10">
    <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-teal-400">Open source</p>
    <h2 id="template-heading" className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
      Use this as a template
    </h2>
    <p className="mt-2 max-w-[600px] text-[#9cadc5]">
      Both of my sites are public. Fork either one, keep what helps, and make it yours.
    </p>

    <ul className="mt-6 grid gap-5 md:grid-cols-2">
      {TEMPLATES.map((t) => (
        <li key={t.name} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-slate-450">{t.what}</p>
          <h3 className="mt-1 text-xl font-bold text-slate-50">{t.name}</h3>
          <p className="mt-3 leading-relaxed text-slate-300">{t.description}</p>
          <p className="mt-3 text-sm text-slate-450">License: {t.license}</p>
          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5 text-sm font-semibold">
            <a
              href={t.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-cyan-300 transition-colors hover:text-cyan-200"
            >
              <FiGithub className="h-4 w-4" />
              {t.name} on GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            {t.more.internal ? (
              <Link href={t.more.href} className="inline-flex items-center gap-1 text-slate-300 transition-colors hover:text-cyan-200">
                {t.more.label}
                <FiArrowUpRight className="h-4 w-4" />
              </Link>
            ) : (
              <a
                href={t.more.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-300 transition-colors hover:text-cyan-200"
              >
                {t.more.label}
                <FiArrowUpRight className="h-4 w-4" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>

    <p className="mt-5 text-sm text-slate-450">
      This site&apos;s releases follow{' '}
      <a
        href="https://github.com/n8watkins/release-kit"
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-cyan-200"
      >
        release-kit
      </a>
      , a release standard you can apply to any repo.
    </p>
  </section>
)

export default UseAsTemplate
