import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiGitPullRequest, FiPackage, FiPlusSquare } from 'react-icons/fi'
import { LuExternalLink, LuGlobe, LuUsers } from 'react-icons/lu'
import { SiGithub, SiSubstack, SiX, SiYoutube } from 'react-icons/si'
import {
  devSetup,
  honorableMentions,
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
import Reveal from '@/components/ui/Reveal'

/**
 * The dev-tool parts of /loadout (2026-11-01): my dev setup, the tools I
 * built, the tools I use (each credited to its maker) and honorable
 * mentions; and the parts the homepage shows (components/sections/
 * HomePeople.tsx, HomeToolsIBuilt.tsx): the people I follow, The Pull
 * Request Post and the tool cards. Each reads its list from
 * data/loadout.tsx, so adding a tool or a person is one entry there.
 * Server components: RepoButtons fetches its star count on the server. Out
 * of the app's IconContext, so every icon is aria-hidden by hand.
 */

// A section's small mono path and title, left-aligned over its content.
export const SectionHead = ({
  id,
  path,
  title,
  children,
}: {
  id?: string
  path: string
  title: string
  children?: ReactNode
}) => (
  <div className="mb-6 flex flex-col gap-1.5">
    <span className="font-mono text-xs text-slate-475">{path}</span>
    <h2 id={id} className="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">
      {title}
    </h2>
    {children && (
      <p className="max-w-[620px] text-[15px] leading-relaxed text-[#9cadc5]">{children}</p>
    )}
  </div>
)

const textLink =
  'font-semibold text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 transition-colors hover:text-cyan-200 hover:decoration-cyan-200/60'

const External = ({ link }: { link: NamedLink }) => (
  <a href={link.href} target="_blank" rel="noopener noreferrer" className={textLink}>
    {link.name}
  </a>
)

// A secondary button: a person's links, a tool's live demo.
const linkButton =
  'inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-3.5 py-2 text-sm font-semibold text-slate-300 transition-colors duration-200 hover:border-cyan-300/35 hover:bg-white/8 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 [&_svg]:h-3.5 [&_svg]:w-3.5'

const iconChip =
  'flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#081427] text-cyan-300 transition-transform duration-200 group-hover:scale-105'

/** One tool I built: the pitch first, then how, the credit for a fork, and its repo. */
const BuiltToolCard = ({ tool }: { tool: BuiltTool }) => (
  <article
    id={tool.id}
    aria-labelledby={`${tool.id}-title`}
    className="group relative flex h-full scroll-mt-24 flex-col gap-4 overflow-hidden rounded-3xl border border-white/8 bg-linear-to-b from-white/[0.045] to-white/[0.01] p-6 transition-[border-color,translate] duration-300 hover:-translate-y-1 hover:border-cyan-300/30 motion-reduce:hover:translate-y-0"
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-cyan-400 opacity-[0.05] blur-3xl transition-opacity duration-300 group-hover:opacity-[0.12]"
    />
    <div className="relative flex items-center gap-4">
      <span aria-hidden="true" className={`${iconChip} h-12 w-12 p-3 [&_svg]:h-full [&_svg]:w-full`}>{tool.icon}</span>
      <div className="min-w-0">
        <h3
          id={`${tool.id}-title`}
          className="font-mono text-xl font-bold tracking-tight text-slate-50"
        >
          {tool.name}
        </h3>
        <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label={`${tool.name} is built with`}>
          {tool.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.7rem] font-semibold text-slate-300"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </div>
    <p className="relative text-lg leading-snug font-semibold text-slate-100">{tool.pitch}</p>
    <p className="relative text-[15px] leading-relaxed text-[#9cadc5]">{tool.detail}</p>
    {tool.credit && (
      <p className="relative text-sm leading-relaxed text-slate-300" data-credit>
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
    <div className="relative mt-auto flex flex-wrap gap-2 pt-1">
      <RepoButtons href={tool.github} name={tool.name} className="w-full sm:w-auto" />
      {tool.demo && (
        <a
          href={tool.demo}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkButton} w-full justify-center sm:w-auto`}
        >
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

/**
 * The tool cards; `tools` picks which (all by default). Two to a row from md
 * up, or three from lg up for a set of three, so no card sits alone.
 */
export const BuiltToolsGrid = ({ tools = toolsIBuilt }: { tools?: BuiltTool[] }) => (
  <ul className={`grid gap-5 ${tools.length % 2 === 0 ? 'md:grid-cols-2' : 'lg:grid-cols-3'}`}>
    {tools.map((tool) => (
      <li key={tool.id}>
        <BuiltToolCard tool={tool} />
      </li>
    ))}
  </ul>
)

export const TOOLS_I_BUILT_BLURB = 'Small open-source tools I made because I wanted them. All MIT-licensed.'

export const ToolsIBuilt = () => (
  <Reveal>
    <section id="tools-i-built" aria-labelledby="tools-i-built-title" className="scroll-mt-24">
      <SectionHead id="tools-i-built-title" path="~/loadout/built" title="Tools I built">
        {TOOLS_I_BUILT_BLURB}
      </SectionHead>
      <BuiltToolsGrid />
    </section>
  </Reveal>
)

const makerLink = 'font-medium text-slate-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-cyan-200'

/**
 * One tool someone else made: "no-mistakes, by Kun Chen". The tool links to
 * its page; a maker in People I follow links to their card on the homepage
 * (People I follow moved there on 2026-11-01), any other maker to their own
 * profile.
 */
const ToolItem = ({ tool }: { tool: UsedTool }) => {
  const person = tool.by ? people.find((p) => p.id === tool.by) : undefined
  return (
    <li
      id={tool.id}
      className="group flex scroll-mt-24 items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-colors duration-200 target:border-cyan-300/40 hover:border-cyan-300/30 hover:bg-white/[0.04]"
    >
      <span aria-hidden="true" className={`${iconChip} h-11 w-11 p-2.5 [&_svg]:h-full [&_svg]:w-full`}>
        {tool.icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-[15px] text-slate-450">
          <a
            href={tool.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono font-bold text-slate-100 underline decoration-white/0 underline-offset-4 transition-colors hover:text-cyan-200 hover:decoration-cyan-200/50"
          >
            {tool.name}
            <span className="sr-only">{tool.href.startsWith('https://github.com/') ? ' on GitHub' : ''} (opens in a new tab)</span>
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
              </a>
            </>
          )}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-[#9cadc5]">{tool.whatFor}</p>
      </div>
    </li>
  )
}

export const ToolsIUse = () => (
  <Reveal>
    <section id="tools-i-use" aria-labelledby="tools-i-use-title" className="scroll-mt-24">
      <SectionHead id="tools-i-use-title" path="~/loadout/tools" title="Tools I use">
        What I add on top of Claude Code and Codex, so the agents can check their own work.
      </SectionHead>
      <ul className="grid gap-4 md:grid-cols-2">
        {toolsIUse.map((tool) => (
          <ToolItem key={tool.id} tool={tool} />
        ))}
      </ul>
    </section>
  </Reveal>
)

export const HonorableMentions = () => (
  <Reveal>
    <section id="honorable-mentions" aria-labelledby="honorable-mentions-title" className="scroll-mt-24">
      <SectionHead id="honorable-mentions-title" path="~/loadout/mentions" title="Honorable mentions">
        Other people&apos;s tools I recommend.
      </SectionHead>
      <ul className="grid gap-4 md:grid-cols-2">
        {honorableMentions.map((tool) => (
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
      <span className="font-semibold text-slate-100">{entry.name}</span>
      {entry.note && <span className="text-slate-450">{entry.note}</span>}
    </>
  )
  const chip = 'inline-flex flex-wrap items-baseline gap-x-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-sm'
  if (!entry.href) return <span className={chip}>{body}</span>
  const linked = `${chip} transition-colors hover:border-cyan-300/40 hover:bg-white/[0.06] [&>span:first-child]:underline [&>span:first-child]:decoration-white/20 [&>span:first-child]:underline-offset-4`
  return entry.href.startsWith('/') ? (
    <Link href={entry.href} className={linked}>
      {body}
    </Link>
  ) : (
    <a href={entry.href} className={linked}>
      {body}
    </a>
  )
}

/** My dev setup: what I work on and with, grouped so it scans in seconds. */
export const DevSetup = () => (
  <section id="dev-setup" aria-labelledby="dev-setup-title" className="scroll-mt-24">
    <SectionHead id="dev-setup-title" path="~/loadout/dev-setup" title="My dev setup">
      Windows 11 with WSL2, Claude Code and Codex, and the tools around them.
    </SectionHead>
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {devSetup.map((group) => (
        <li
          key={group.id}
          className={`rounded-2xl border border-white/8 bg-white/[0.02] p-5 ${group.wide ? 'lg:col-span-2' : ''}`}
        >
          <div className={group.code ? 'grid gap-4 sm:grid-cols-2' : ''}>
            <div>
              <h3 id={`setup-${group.id}-title`} className="font-mono text-xs font-bold tracking-[0.16em] text-cyan-300 uppercase">
                {group.title}
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.items.map((entry) => (
                  <li key={entry.name}>
                    <SetupChip entry={entry} />
                  </li>
                ))}
              </ul>
            </div>
            {group.code && (
              <figure className="min-w-0">
                <figcaption className="font-mono text-xs text-slate-475">{group.code.label}</figcaption>
                <pre className="mt-1.5 overflow-x-auto rounded-xl border border-white/8 bg-[#050b17] px-4 py-3 font-mono text-[0.8rem] leading-snug text-slate-300">
                  <code>{group.code.text}</code>
                </pre>
              </figure>
            )}
          </div>
        </li>
      ))}
    </ul>
  </section>
)

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
    className="flex h-full scroll-mt-24 flex-col gap-4 rounded-3xl border border-white/8 bg-linear-to-b from-white/[0.045] to-white/[0.01] p-6 target:border-cyan-300/40"
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
    <p className="text-[15px] leading-relaxed text-pretty text-[#9cadc5]">{person.note}</p>
    {person.howTheyWork && (
      <p className="-mt-1 text-sm leading-relaxed text-slate-400">
        {person.howTheyWork.summary}{' '}
        <a href={person.howTheyWork.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold whitespace-nowrap text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 hover:text-cyan-200">
          <span aria-hidden="true" className="[&_svg]:h-3.5 [&_svg]:w-3.5">
            <SiYoutube />
          </span>
          How he works
          <span className="sr-only"> (a video, opens in a new tab)</span>
        </a>
      </p>
    )}
    <RecentActivity person={person} />
    <ul className="mt-auto flex flex-wrap gap-2" aria-label={`${person.name} online`}>
      {person.links.map((link) => {
        const { label, icon } = LINKS[link.kind]
        return (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkButton}
            >
              <span aria-hidden="true">{icon}</span>
              {link.label ?? label}
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
 * cards' style, with a front page from its live demo beside the copy. The
 * picture is public/projects/pr-post-edition.webp (a 1280x800 capture of the
 * demo, resized to 1200x750); recapture it when the paper's design changes.
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
    {/* A second way to the demo, not a separate stop for keyboard and
        screen-reader users (the Live demo button says it). */}
    <a
      href={prPost.demo}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={-1}
      aria-hidden="true"
      className="relative block overflow-hidden rounded-xl border border-white/12 bg-[#0b1424] shadow-2xl shadow-black/50 ring-1 ring-black/40 transition-transform duration-300 ease-out group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
    >
      <span className="flex h-7 items-center gap-1.5 border-b border-white/8 bg-[#0e192c] px-3">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="ml-2 truncate rounded-md bg-white/6 px-2 py-0.5 text-[0.62rem] font-medium text-slate-400">
          n8watkins.github.io/pr-post
        </span>
      </span>
      <Image
        src="/projects/pr-post-edition.webp"
        alt=""
        width={1200}
        height={750}
        sizes="(min-width: 1280px) 560px, (min-width: 1024px) 46vw, 90vw"
        className="block h-auto w-full"
      />
    </a>
  </article>
)
