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
    slug: 'feelium',
    name: 'Feelium',
    tagline: 'What did I do, how did I feel, and are they connected?',
    category: 'Upcoming',
    color: 'from-neutral-400/20 to-neutral-600/20',
    github: 'https://github.com/n8watkins/feelium',
    repo: 'n8watkins/feelium',
    href: '/upcoming#feelium',
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
    slug: 'cutelyaskme',
    name: 'Cutely Ask Me',
    tagline: 'Send a cute ask, they pick the vibe, you plan the date',
    category: 'Upcoming',
    color: 'from-pink-400/20 to-rose-600/20',
    github: 'https://github.com/n8watkins/cutelyaskme',
    repo: 'n8watkins/cutelyaskme',
    href: '/upcoming#cutelyaskme',
  },
  {
    slug: 'fitflow7',
    name: 'FitFlow 7',
    tagline: 'The no-excuses 7-minute workout timer',
    category: 'Upcoming',
    color: 'from-cyan-400/20 to-sky-600/20',
    github: 'https://github.com/n8watkins/fitflow7',
    repo: 'n8watkins/fitflow7',
    href: '/upcoming#fitflow7',
  },
  {
    slug: 'pivot',
    name: 'Pivot',
    tagline: 'A pause button for everyday urges',
    category: 'Upcoming',
    color: 'from-emerald-500/20 to-green-700/20',
    github: 'https://github.com/n8watkins/pivot',
    repo: 'n8watkins/pivot',
    href: '/upcoming#pivot',
  },
  {
    slug: 'whoami',
    name: 'Who Am I?',
    tagline: 'A two-player guessing game: only your opponent sees who you are',
    category: 'Upcoming',
    color: 'from-violet-500/20 to-indigo-600/20',
    github: 'https://github.com/n8watkins/who-am-i',
    repo: 'n8watkins/who-am-i',
    href: '/upcoming#whoami',
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
