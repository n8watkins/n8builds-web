import type { Build } from '@/data/builds'

/**
 * A project the build log follows. Every build in data/builds.tsx with a
 * `repo` is one (its name links its build page); the projects below are the
 * others the site features without a build page of their own, so their name
 * in the log links where the site shows them (`href`).
 */
export type LogBuild = Pick<Build, 'slug' | 'name' | 'tagline' | 'category' | 'color' | 'repo' | 'github' | 'log' | 'logHide'> & {
  /** Where the project's name links in the log: its build page (`/builds/<slug>`) unless set. */
  href?: string
}

/**
 * Projects the log follows that have no build page (round 5 of 2026-11-02):
 *
 * - The upcoming projects (data/upcoming.ts), each with a public repo and
 *   adopting release-kit; their name links their card on /upcoming. A repo
 *   with no commits or releases yet just shows "Nothing logged yet".
 * - The tools I built that /loadout and the homepage's Loadout feature
 *   (`toolsIBuilt` in data/loadout.tsx); their name links their card on
 *   /loadout (PR Post's, The Pull Request Post's card on the homepage).
 *   Their tiles are made by scripts/gen-tool-tiles.mjs.
 *
 * The slugs are the projects' anchors on those pages and their `?build=` on
 * /builds. Every `repo` here is also read by scripts/build-log-fixture.mjs
 * and scripts/check-build-repos.mjs (one per line, as written).
 */
export const logOnlyBuilds: LogBuild[] = [
  {
    slug: 'relink',
    name: 'Relink',
    tagline: 'Turns broken links into the right page',
    category: 'Upcoming',
    color: 'from-orange-500/20 to-amber-600/20',
    github: 'https://github.com/n8watkins/deadlink',
    repo: 'n8watkins/deadlink',
    href: '/upcoming#relink',
  },
  {
    slug: 'strollz',
    name: 'Strollz',
    tagline: 'Walk the streets you have never walked',
    category: 'Upcoming',
    color: 'from-emerald-500/20 to-teal-600/20',
    github: 'https://github.com/n8watkins/strollz',
    repo: 'n8watkins/strollz',
    href: '/upcoming#strollz',
  },
  {
    slug: 'keysready',
    name: 'KeysReady',
    tagline: 'Stop answering “Is my car ready?”',
    category: 'Upcoming',
    color: 'from-sky-500/20 to-blue-600/20',
    github: 'https://github.com/n8watkins/keysready',
    repo: 'n8watkins/keysready',
    href: '/upcoming#keysready',
  },
  {
    slug: 'vibelog',
    name: 'VibeLog',
    tagline: 'Live coding telemetry for vibe-coding streams',
    category: 'Upcoming',
    color: 'from-pink-500/20 to-fuchsia-600/20',
    github: 'https://github.com/n8watkins/vibelog',
    repo: 'n8watkins/vibelog',
    href: '/upcoming#vibelog',
  },
  {
    slug: 'release-kit',
    name: 'release-kit',
    tagline: 'Conventional Commits, SemVer tags and GitHub Releases on any repo',
    category: 'Dev tool',
    color: 'from-cyan-500/20 to-blue-600/20',
    github: 'https://github.com/n8watkins/release-kit',
    repo: 'n8watkins/release-kit',
    href: '/loadout#release-kit',
  },
  {
    slug: 'pass-env',
    name: 'pass-env',
    tagline: 'Your AI agents use your API keys without seeing them',
    category: 'Dev tool',
    color: 'from-cyan-500/20 to-blue-600/20',
    github: 'https://github.com/n8watkins/pass-env',
    repo: 'n8watkins/pass-env',
    href: '/loadout#pass-env',
  },
  {
    slug: 'devguard',
    name: 'devguard',
    tagline: 'Many AI coding agents on one machine, without running out',
    category: 'Dev tool',
    color: 'from-cyan-500/20 to-blue-600/20',
    github: 'https://github.com/n8watkins/devguard',
    repo: 'n8watkins/devguard',
    href: '/loadout#devguard',
  },
  {
    slug: 'pr-post',
    name: 'PR Post',
    tagline: 'Follow what your favorite builders ship',
    category: 'Web tool',
    color: 'from-amber-500/20 to-orange-600/20',
    github: 'https://github.com/n8watkins/pr-post',
    repo: 'n8watkins/pr-post',
    // Its paper's card under People I follow on the homepage, its one placement since round 5.
    href: '/#pr-post-edition',
  },
]
