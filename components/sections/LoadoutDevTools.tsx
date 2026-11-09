import type { CSSProperties, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiGitPullRequest, FiPackage, FiPlusSquare } from 'react-icons/fi'
import { LuExternalLink, LuGlobe, LuUsers } from 'react-icons/lu'
import { SiGithub, SiSubstack, SiX, SiYoutube } from 'react-icons/si'
import {
  devSetup,
  devSetupVideo,
  loadoutPart,
  loadoutParts,
  people,
  toolsIBuilt,
  toolsIUse,
  type BuiltTool,
  type Person,
  type PersonLink,
  type PublicActivity,
  type SetupEntry,
  type UsedTool,
  type NamedLink,
} from '@/data/loadout'
import RepoButtons from '@/components/ui/RepoButtons'
import { ProjectTour } from '@/components/sections/FeaturedProjectIslands'
import Reveal from '@/components/ui/Reveal'
import SetupTilesMotion from '@/components/sections/SetupTilesMotion'

/**
 * The dev-tool parts of /loadout (2026-11-01): my dev setup, the tool
 * cards of "Tools I built and use" and the tools I use (each credited to its
 * maker); and the parts the homepage shows
 * (components/sections/HomePeople.tsx, HomeToolsIBuilt.tsx): the people I
 * follow, The Pull Request Post and the tool cards. Each reads its list from
 * data/loadout.tsx, so adding a tool or a person is one entry there.
 * Server components: RepoButtons fetches its star count on the server. Out
 * of the app's IconContext, so every icon is aria-hidden by hand.
 */

/**
 * A part's heading on /loadout, chapter style (round 3 of 2026-11-02): the
 * part's number, large and faint in its colour behind the heading's right
 * side; the part's icon (the one its pill and the side rail show) in a chip of
 * its colour; its small mono path and its title; then one line on what's
 * inside. `part` is its id in loadoutParts (data/loadout.tsx), which gives
 * the number, icon and colour.
 */
export const SectionHead = ({
  id,
  part,
  path,
  title,
  children,
}: {
  id?: string
  part: string
  path: string
  title: string
  children?: ReactNode
}) => {
  const { icon: Icon, accent } = loadoutPart(part)
  const number = String(loadoutParts.findIndex((p) => p.id === part) + 1).padStart(2, '0')
  return (
    <div className="relative mb-8 md:mb-12" style={{ '--lo': accent } as CSSProperties}>
      <span
        aria-hidden="true"
        data-part-number
        className="pointer-events-none absolute -top-5 right-0 -z-10 bg-linear-to-b from-[rgb(var(--lo)/0.2)] to-[rgb(var(--lo)/0)] bg-clip-text font-mono text-[5.5rem] leading-none font-black tracking-tighter text-transparent select-none sm:-top-8 sm:text-[8rem] lg:-top-10 lg:text-[10rem]"
      >
        {number}
      </span>
      <div className="flex items-center gap-4 sm:gap-5">
        <span
          aria-hidden="true"
          data-part-icon
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--lo)/0.12)] text-[rgb(var(--lo))] ring-1 ring-[rgb(var(--lo)/0.35)] sm:size-14 lg:size-16"
        >
          <Icon className="size-6 sm:size-7 lg:size-8" />
        </span>
        <div className="min-w-0">
          <span className="block font-mono text-xs text-[rgb(var(--lo)/0.85)]">{path}</span>
          <h2 id={id} className="mt-1 text-[1.75rem] leading-tight font-extrabold tracking-tight text-balance text-slate-50 sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h2>
        </div>
      </div>
      {children && <p className="mt-4 max-w-[640px] leading-relaxed text-pretty text-[#9cadc5] md:mt-5 md:text-lg">{children}</p>}
    </div>
  )
}

const textLink =
  'font-semibold text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 transition-colors hover:text-cyan-200 hover:decoration-cyan-200/60'

const External = ({ link }: { link: NamedLink }) => (
  <a href={link.href} target="_blank" rel="noopener noreferrer" className={textLink}>
    {link.name}
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
)

// A secondary button: a person's links, a tool's live demo.
const linkButton =
  'inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-3.5 py-2 text-sm font-semibold text-slate-300 transition-colors duration-200 hover:border-cyan-300/35 hover:bg-white/8 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 [&_svg]:h-3.5 [&_svg]:w-3.5'

/** A person's link: a smaller linkButton, so four fit two columns of a card (PersonCard). */
const personLink =
  'inline-flex w-full min-w-0 items-center gap-1.5 rounded-xl border border-white/12 bg-white/4 px-2 py-1.5 text-xs leading-tight font-semibold text-slate-300 transition-colors duration-200 hover:border-cyan-300/35 hover:bg-white/8 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 min-[360px]:px-2.5 [&_svg]:h-3.5 [&_svg]:w-3.5'

const iconChip =
  'flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#081427] text-cyan-300 transition-transform duration-200 group-hover:scale-105'

/**
 * One thing I built, as a card the size and style of Tools I use's
 * (ToolItem, round 3 of 2026-11-02): its mark, its name (linked to its
 * repo), what it does for you, the credit for a fork, and its buttons
 * pinned to the foot.
 */
const BuiltToolCard = ({ tool, heading: Heading }: { tool: BuiltTool; heading: 'h3' | 'h4' | 'h5' }) => (
  <article
    id={tool.id}
    aria-labelledby={`${tool.id}-title`}
    className="group flex h-full scroll-mt-24 flex-col rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-colors duration-200 target:border-cyan-300/40 hover:border-cyan-300/30 hover:bg-white/[0.04]"
  >
    <div className="flex items-start gap-4">
      <span aria-hidden="true" className={`${iconChip} h-11 w-11 p-2.5 [&_svg]:h-full [&_svg]:w-full`}>
        {tool.icon}
      </span>
      <div className="min-w-0 flex-1">
        <Heading id={`${tool.id}-title`} className="text-[15px]">
          <a href={tool.github} target="_blank" rel="noopener noreferrer" className={builtName}>
            {tool.name}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Heading>
        <p className="mt-1 text-sm leading-relaxed text-pretty text-[#9cadc5]">{tool.pitch}</p>
        {tool.credit && (
          <p className="mt-1.5 text-sm leading-relaxed text-pretty text-slate-400" data-credit>
            Created by <External link={tool.credit.author} />
            {tool.credit.org && (
              <>
                {' '}
                at <External link={tool.credit.org} />
              </>
            )}
            ; {tool.credit.note}
          </p>
        )}
      </div>
    </div>
    {/* Pinned to the card's foot and as wide as the card, so the buttons line
        up across a row and a third of a row still holds two of them. */}
    <div className="mt-auto flex flex-wrap gap-2 pt-4">
      <RepoButtons href={tool.github} name={tool.name} className="w-full sm:w-auto" />
      {tool.demo && (
        <a href={tool.demo} target="_blank" rel="noopener noreferrer" className={`${linkButton} w-full justify-center sm:w-auto`}>
          <span aria-hidden="true">
            <LuExternalLink />
          </span>
          Live demo
          <span className="sr-only"> of {tool.name} (opens in a new tab)</span>
        </a>
      )}
    </div>
  </article>
)

const builtName =
  'font-mono font-bold text-slate-100 underline decoration-white/0 underline-offset-4 transition-colors hover:text-cyan-200 hover:decoration-cyan-200/50'

const BUILT_GROUPS: { id: BuiltTool['group']; title: string }[] = [
  { id: 'dev', title: 'Dev tools I built' },
  { id: 'other', title: 'Other things I built' },
]

/**
 * Tools I built and use's two groups (round 3 of 2026-11-02), each under a
 * small subheading: the dev tools, led by `lead` (Scribe's row), then the
 * other things I built. The cards are Tools I use's (three to a row from lg
 * up, so the three dev tools fill one; one a row below that, as two to a
 * row would leave one alone). `heading` is the subheadings' level;
 * the cards' names sit one below it (h3 and h4 on /loadout, under its h2; h4
 * and h5 on the homepage). `column` wraps the subheadings and cards, for a
 * page that runs `lead` full-bleed outside its content column (/loadout).
 */
export const BuiltToolsGrid = ({
  heading = 'h3',
  lead,
  column = '',
}: {
  heading?: 'h3' | 'h4'
  lead?: ReactNode
  column?: string
}) => {
  const Sub = heading
  const card = heading === 'h3' ? 'h4' : 'h5'
  return (
    <div className="space-y-14 md:space-y-16">
      {BUILT_GROUPS.map((group) => {
        const tools = toolsIBuilt.filter((tool) => tool.group === group.id)
        // A group with nothing in it (Other things I built, since PR Post has its own card) is left out, heading and all.
        if (!tools.length && !(group.id === 'dev' && lead)) return null
        return (
          <div key={group.id} role="group" aria-labelledby={`built-${group.id}-title`} data-built-group={group.id}>
            <div className={column}>
              <Sub
                id={`built-${group.id}-title`}
                // No rule after it (round 8 of 2026-11-09: it read as an underline under the blurb above).
                className="mb-5 font-mono text-xs font-bold tracking-[0.16em] text-cyan-300 uppercase"
              >
                {group.title}
              </Sub>
            </div>
            {group.id === 'dev' && lead && <div className="mb-8 md:mb-10">{lead}</div>}
            <div className={column}>
              <ul className="grid gap-4 lg:grid-cols-3">
                {tools.map((tool) => (
                  <li key={tool.id}>
                    <BuiltToolCard tool={tool} heading={card} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * "Tools I built and use" (the owner's call, 2026-11-01): Scribe's row, then
 * these cards, on /loadout and in the homepage's Loadout. Everything in it is
 * MIT-licensed (Scribe included).
 */
export const TOOLS_I_BUILT_TITLE = 'Tools I built and use'
export const TOOLS_I_BUILT_BLURB = 'Tools I made for myself and use every day. All open source and MIT-licensed.'

const makerLink = 'font-medium whitespace-nowrap text-slate-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-cyan-200'

/**
 * One tool someone else made: "no-mistakes, by Kun Chen", what it is for, and
 * its repo as the Star | GitHub button the tools I built carry (every tool
 * here has a public repo, the owner's ask, 2026-11-02). The name links to the
 * tool's own site where it has one (herdr.dev, also a button), else its repo.
 * A maker in People I follow links to their card on the homepage (People I
 * follow moved there on 2026-11-01), any other maker to their own profile.
 */
const ToolItem = ({ tool }: { tool: UsedTool }) => {
  const person = tool.by ? people.find((p) => p.id === tool.by) : undefined
  return (
    <li
      id={tool.id}
      className="group flex h-full scroll-mt-24 items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-colors duration-200 target:border-cyan-300/40 hover:border-cyan-300/30 hover:bg-white/[0.04]"
    >
      <span aria-hidden="true" className={`${iconChip} h-11 w-11 p-2.5 [&_svg]:h-full [&_svg]:w-full`}>
        {tool.icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col self-stretch">
        <h3 className="text-[15px] text-slate-450">
          <a
            href={tool.site ?? tool.github}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono font-bold text-slate-100 underline decoration-white/0 underline-offset-4 transition-colors hover:text-cyan-200 hover:decoration-cyan-200/50"
          >
            {tool.name}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {person && (
            <>
              , by{' '}
              <a href={`/#${person.id}`} className={makerLink}>
                {person.name}
              </a>
            </>
          )}
          {!person && tool.maker && (
            <>
              , by{' '}
              <a href={tool.maker.href} target="_blank" rel="noopener noreferrer" className={makerLink}>
                {tool.maker.name}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </>
          )}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-pretty text-[#9cadc5]">{tool.whatFor}</p>
        {/* Pinned to the card's foot, so the buttons line up across a row. */}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <RepoButtons href={tool.github} name={tool.name} className="w-full sm:w-auto" />
          {tool.site && (
            <a href={tool.site} target="_blank" rel="noopener noreferrer" className={`${linkButton} w-full justify-center sm:w-auto`}>
              <span aria-hidden="true">
                <LuGlobe />
              </span>
              {new URL(tool.site).hostname}
              <span className="sr-only"> ({tool.name}&apos;s site, opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </li>
  )
}

/**
 * Tools I use: other people's tools, each credited to its maker. The
 * honorable mentions (herdr, firstmate, treehouse, ccusage) joined them on
 * 2026-11-02; /loadout keeps their old #honorable-mentions anchor on this part.
 */
export const ToolsIUse = () => (
  <Reveal>
    <section aria-labelledby="tools-i-use-title">
      <SectionHead id="tools-i-use-title" part="tools-i-use" path="~/loadout/tools" title="Tools I use">
        What I add on top of Claude Code and Codex: where my agents run, and the tools that let them check their own work.
      </SectionHead>
      <ul className="grid gap-4 md:grid-cols-2">
        {toolsIUse.map((tool) => (
          <ToolItem key={tool.id} tool={tool} />
        ))}
      </ul>
    </section>
  </Reveal>
)

/** One item in My dev setup, as a chip: a link when it has a page or a card here. */
const SetupChip = ({ entry }: { entry: SetupEntry }) => {
  const body = (
    <>
      {/* Its own mark, 16px tall and centred on the first line (brand colours
           are set in data/loadout.tsx; plain glyphs are slate). */}
      <span
        aria-hidden="true"
        data-setup-icon
        className="flex h-5 min-w-4 shrink-0 items-center justify-center text-slate-300 [&_img]:size-4 [&_img]:rounded-[3px] [&_svg]:size-4"
      >
        {entry.icon}
      </span>
      {/* Name and note wrap together, so a note on its own line starts under the name, not the mark. */}
      <span className="flex flex-wrap items-baseline gap-x-1.5">
        <span data-setup-name className="font-semibold text-slate-100">
          {entry.name}
        </span>
        {entry.note && <span className="text-slate-450">{entry.note}</span>}
      </span>
    </>
  )
  const chip = 'setup-chip flex items-start gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-sm'
  if (!entry.href) return <span className={chip}>{body}</span>
  const linked = `${chip} transition-colors hover:border-cyan-300/40 hover:bg-white/[0.06] [&_[data-setup-name]]:underline [&_[data-setup-name]]:decoration-white/20 [&_[data-setup-name]]:underline-offset-4`
  return entry.href.startsWith('/') ? (
    <Link href={entry.href} className={linked}>
      {body}
    </Link>
  ) : /^https?:/.test(entry.href) ? (
    <a href={entry.href} target="_blank" rel="noopener noreferrer" className={linked}>
      {body}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : (
    <a href={entry.href} className={linked}>
      {body}
    </a>
  )
}

/**
 * My dev setup: what I work on and with, grouped so it scans in seconds, as a
 * bento: three tiles to a row from xl (1280px), two from md, the machine's
 * tile across the full width (data/loadout.tsx sets the order so each row's
 * tiles hold about as much). A tile with a few groups stacks them. Its tiles rise in one
 * by one, then their chips (`.setup-tile` in app/globals.css,
 * SetupTilesMotion), and lift a little on hover or focus.
 */
export const DevSetup = () => (
  <section aria-labelledby="dev-setup-title">
    <SectionHead id="dev-setup-title" part="dev-setup" path="~/loadout/dev-setup" title="My dev setup">
      One Windows 11 PC doing Linux work in WSL2, with Claude Code and Codex running side by side in herdr. Every piece, grouped:
    </SectionHead>
    <ul id="setup-tiles" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {devSetup.map((tile, i) => {
        // --c: each chip's place in its tile's entrance, counted across the tile's groups.
        let chip = 0
        return (
          <li
            key={tile.id}
            // --d: its place in the entrance (SetupTilesMotion renumbers the tiles still off screen).
            style={{ '--d': i } as CSSProperties}
            className={`setup-tile rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-[border-color,translate] duration-300 hover:-translate-y-1 hover:border-cyan-300/25 focus-within:-translate-y-1 focus-within:border-cyan-300/25 motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0 ${tile.full ? 'md:col-span-2 xl:col-span-3' : ''}`}
          >
            {/* A config file sits beside the groups, under them on a phone. */}
            <div className={tile.code ? 'grid gap-5 sm:grid-cols-[1.4fr_1fr] xl:gap-8' : ''}>
              <div className="flex flex-col gap-5">
                {tile.groups.map((group) => (
                  <div key={group.id}>
                    <h3 id={`setup-${group.id}-title`} className="font-mono text-xs font-bold tracking-[0.16em] text-cyan-300 uppercase">
                      {group.title}
                    </h3>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {group.items.map((entry) => (
                        // Capped, so a long tile doesn't drag.
                        <li key={entry.name} style={{ '--c': Math.min(chip++, 6) } as CSSProperties}>
                          <SetupChip entry={entry} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {tile.code && (
                <figure className="min-w-0">
                  <figcaption className="font-mono text-xs text-slate-475">{tile.code.label}</figcaption>
                  <pre className="mt-1.5 overflow-x-auto rounded-xl border border-white/8 bg-[#050b17] px-4 py-3 font-mono text-[0.8rem] leading-snug text-slate-300">
                    <code>{tile.code.text}</code>
                  </pre>
                </figure>
              )}
            </div>
          </li>
        )
      })}
    </ul>
    <SetupTilesMotion gridId="setup-tiles" />
    <SetupVideo />
  </section>
)

/**
 * Under the setup (owner, round 8 of 2026-11-09): the video I recommend for
 * setting up your own, Kun Chen building his from scratch, as a card with its
 * thumbnail (the whole card is the link, to YouTube in a new tab).
 */
const SetupVideo = () => {
  const by = people.find((p) => p.id === devSetupVideo.by)!
  return (
    <a
      href={devSetupVideo.href}
      target="_blank"
      rel="noopener noreferrer"
      data-setup-video
      className="group mt-6 grid items-center gap-4 rounded-2xl border border-white/8 bg-linear-to-r from-cyan-400/[0.06] via-white/[0.02] to-transparent p-4 transition-colors duration-200 hover:border-cyan-300/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:gap-6 sm:p-5"
    >
      <span className="relative block aspect-video overflow-hidden rounded-xl ring-1 ring-white/10">
        <Image src={devSetupVideo.thumbnail} alt="" fill sizes="(min-width: 640px) 256px, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/0">
          <span className="flex size-11 items-center justify-center rounded-full bg-[#ff0033] text-white shadow-lg shadow-black/40 [&_svg]:size-5">
            <SiYoutube />
          </span>
        </span>
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-xs font-bold tracking-[0.16em] text-cyan-300 uppercase">Setting up your own?</span>
        <span className="mt-1.5 block text-lg leading-snug font-bold text-slate-50 group-hover:text-cyan-100">
          Watch {by.name} build his agentic dev environment from scratch
        </span>
        <span className="mt-1.5 block text-sm leading-relaxed text-pretty text-[#9cadc5]">
          The video I point people to: {devSetupVideo.covers.slice(0, -1).join(', ')} and {devSetupVideo.covers.at(-1)}, step by step, all reproducible.
        </span>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 group-hover:text-cyan-200">
          {devSetupVideo.title}, on YouTube
          <LuExternalLink aria-hidden="true" className="size-3.5" />
        </span>
        <span className="sr-only"> (a video by {by.name}, opens in a new tab)</span>
      </span>
    </a>
  )
}

const LINKS: Record<PersonLink['kind'], { label: string; icon: ReactNode }> = {
  youtube: { label: 'YouTube', icon: <SiYoutube /> },
  x: { label: 'X', icon: <SiX /> },
  substack: { label: 'Substack', icon: <SiSubstack /> },
  github: { label: 'GitHub', icon: <SiGithub /> },
  website: { label: 'Website', icon: <LuGlobe /> },
  community: { label: 'Community', icon: <LuUsers /> },
}

const ACTIVITY: Record<PublicActivity['kind'], { label: string; icon: ReactNode }> = {
  'pull-request': { label: 'Pull request', icon: <FiGitPullRequest /> },
  release: { label: 'Release', icon: <FiPackage /> },
  'new-repo': { label: 'New repo', icon: <FiPlusSquare /> },
}

const activityDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })

/**
 * A person's recent public work, newest first: shown once the feed fills
 * `activity`. Nothing renders while it is empty, so today's cards stay clean.
 */
const RecentActivity = ({ person }: { person: Person }) => {
  const items = person.activity?.slice(0, 3) ?? []
  if (items.length === 0) return null
  return (
    <div className="border-t border-white/6 pt-4">
      <h4 className="font-mono text-[0.68rem] font-bold tracking-[0.16em] text-cyan-300 uppercase">Recently shipped</h4>
      <ul className="mt-2.5 space-y-2" aria-label={`${person.name}'s recent public work`}>
        {items.map((item) => (
          <li key={item.href} className="flex items-start gap-2 text-sm">
            <span aria-hidden="true" className="mt-0.5 shrink-0 text-slate-450 [&_svg]:h-3.5 [&_svg]:w-3.5">{ACTIVITY[item.kind].icon}</span>
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="min-w-0 text-slate-300 transition-colors hover:text-cyan-200">
              <span className="sr-only">{ACTIVITY[item.kind].label}: </span>
              {item.title}
              <span className="ml-1.5 font-mono text-xs text-slate-450">
                {item.repo} · <time dateTime={item.date}>{activityDate(item.date)}</time>
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const PersonCard = ({ person }: { person: Person }) => (
  <article
    id={person.id}
    aria-labelledby={`${person.id}-name`}
    className="flex h-full scroll-mt-24 flex-col gap-4 rounded-3xl border border-white/8 bg-linear-to-b from-white/[0.045] to-white/[0.01] p-5 target:border-cyan-300/40 sm:p-6 lg:p-5 xl:p-6"
  >
    <div className="flex items-center gap-4">
      {/* The photo sits over the initials: if it fails to load, its alt text
           is hidden (transparent, no size) and the initials show through. */}
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-cyan-400/25 to-blue-600/25 font-mono text-lg font-bold text-cyan-100 ring-1 ring-cyan-300/30">
        <span aria-hidden="true">{person.initials}</span>
        {person.avatar && (
          <Image
            src={person.avatar}
            alt={person.name}
            width={56}
            height={56}
            sizes="56px"
            className="absolute inset-0 h-full w-full rounded-full object-cover text-[0px] text-transparent"
          />
        )}
      </span>
      <div className="min-w-0">
        <h3 id={`${person.id}-name`} className="text-xl font-extrabold tracking-tight text-slate-50">
          {person.name}
        </h3>
        <p className="mt-0.5 text-sm leading-snug text-slate-300">{person.role}</p>
      </div>
    </div>
    {/* The same shape on every card (round 8 of 2026-11-09): a short note, then a
        second short paragraph a line apart, four or five lines in all with the role. */}
    <p className="text-[15px] leading-relaxed text-pretty text-[#9cadc5]" data-person-note>
      {person.note}
    </p>
    {person.more && (
      <p className="-mt-1 text-sm leading-relaxed text-pretty text-slate-400" data-person-more>
        {person.more}
      </p>
    )}
    {person.howTheyWork && (
      <p className="-mt-1 text-sm leading-relaxed text-slate-400" data-person-more>
        <a href={person.howTheyWork.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold whitespace-nowrap text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 hover:text-cyan-200">
          <span aria-hidden="true" className="[&_svg]:h-3.5 [&_svg]:w-3.5">
            <SiYoutube />
          </span>
          Check out how he works
          <span className="sr-only"> (a video, opens in a new tab)</span>
        </a>{' '}
        for more on his setup.
      </p>
    )}
    <RecentActivity person={person} />
    {/* Two rows at most (round 3 of 2026-11-02): the links fill two columns,
        top to bottom (YouTube over X, then nateherk.com over AI Automation
        Society), each column as wide as its longest link. In a narrow card a
        long name wraps inside its button, and the buttons in a row share its height. */}
    <ul
      className="mt-auto grid auto-cols-[minmax(min-content,max-content)] grid-flow-col grid-rows-[auto_auto] justify-start gap-1.5 sm:gap-2"
      aria-label={`${person.name} online`}
    >
      {person.links.map((link) => {
        const { label, icon } = LINKS[link.kind]
        return (
          <li key={link.href} className="flex min-w-0">
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={personLink}
            >
              <span aria-hidden="true" className="shrink-0">
                {icon}
              </span>
              <span className="min-w-0 text-balance">{link.label ?? label}</span>
              <span className="sr-only"> ({person.name}, opens in a new tab)</span>
            </a>
          </li>
        )
      })}
    </ul>
  </article>
)

/** The people I follow, as cards (the homepage's People I follow, components/sections/HomePeople.tsx). */
export const PeopleGrid = () => (
  <ul className="grid gap-5 lg:grid-cols-3">
    {people.map((person) => (
      <li key={person.id}>
        <PersonCard person={person} />
      </li>
    ))}
  </ul>
)

const prPost = toolsIBuilt.find((tool) => tool.id === 'pr-post')!

/**
 * The Pull Request Post (2026-11-01): the newspaper pr-post prints from the
 * public GitHub activity of the people above, as a project card in the tool
 * cards' style, with its live front page beside the copy. Since round 5 of
 * 2026-11-02 that is a recording of the live page scrolling from the
 * masthead to the box scores and back (scripts/pr-post-tour/ remakes it; a
 * silent looping video with the same playback rules as Scribe's tour), and
 * this is PR Post's one place on the site: it left Tools I built and use.
 */
export const PrPostCard = () => (
  <article
    id="pr-post-edition"
    aria-labelledby="pr-post-edition-title"
    className="group relative grid scroll-mt-24 items-center gap-6 overflow-hidden rounded-3xl border border-white/8 bg-linear-to-b from-white/[0.045] to-white/[0.01] p-6 transition-[border-color] duration-300 hover:border-cyan-300/30 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:p-8"
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-cyan-400 opacity-[0.05] blur-3xl transition-opacity duration-300 group-hover:opacity-[0.12]"
    />
    <div className="relative flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className={`${iconChip} h-12 w-12 p-3 [&_svg]:h-full [&_svg]:w-full`}>
          {prPost.icon}
        </span>
        <div className="min-w-0">
          <h3 id="pr-post-edition-title" className="text-xl font-extrabold tracking-tight text-slate-50 sm:text-2xl">
            The Pull Request Post
          </h3>
          <p className="mt-0.5 font-mono text-xs text-slate-450">
            built on <span className="text-slate-300">pr-post</span>, open source
          </p>
        </div>
      </div>
      <p className="text-lg leading-snug font-semibold text-slate-100">
        The public GitHub activity of the developers I follow, printed as a newspaper.
      </p>
      <p className="text-[15px] leading-relaxed text-[#9cadc5]">
        Their merged pull requests, releases and new repos become a front page, with back issues to browse. The engine is{' '}
        <span className="whitespace-nowrap">pr-post</span>: give it your own list of builders, and GitHub Actions prints a new edition twice a week.
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        <a href={prPost.demo} target="_blank" rel="noopener noreferrer" className={`${linkButton} w-full justify-center sm:w-auto`}>
          <span aria-hidden="true">
            <LuExternalLink />
          </span>
          Live demo
          <span className="sr-only"> of The Pull Request Post (opens in a new tab)</span>
        </a>
        <RepoButtons href={prPost.github} name="pr-post" className="w-full sm:w-auto" />
      </div>
    </div>
    {/* The live page in a browser window (the Live demo button opens it). */}
    <div
      data-pr-post-window
      className="relative overflow-hidden rounded-xl border border-white/12 bg-[#0b1424] shadow-2xl shadow-black/50 ring-1 ring-black/40"
    >
      <span aria-hidden="true" className="flex h-7 items-center gap-1.5 border-b border-white/8 bg-[#0e192c] px-3">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="ml-2 truncate rounded-md bg-white/6 px-2 py-0.5 text-[0.62rem] font-medium text-slate-400">
          n8watkins.github.io/pr-post
        </span>
      </span>
      <ProjectTour
        // Its pause button: "Pause the Pull Request Post tour".
        title="Pull Request Post"
        className="w-full"
        frameClassName=""
        sizes="(min-width: 1024px) 50vw, 100vw"
        tour={{
          webm: '/projects/pr-post-tour.webm',
          mp4: '/projects/pr-post-tour.mp4',
          poster: '/projects/pr-post-tour-poster.webp',
          alt: "The Pull Request Post's live front page, scrolling from its masthead and lead story down to the box scores and back",
        }}
      />
    </div>
  </article>
)
