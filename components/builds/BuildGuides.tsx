import Image from 'next/image'
import { FiArrowUpRight, FiGithub } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import type { BuildGuide, BuildGuideItem } from '@/data/builds'

/** Words with `backticks` as code, the way a build's guides and process notes write file names and calls. */
export function WithCode({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code key={i} className="rounded bg-white/8 px-1 py-px font-mono text-[0.85em] text-slate-100">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  )
}

const STATUS_STYLE: Record<NonNullable<BuildGuideItem['status']>, string> = {
  Live: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  'In progress': 'border-amber-300/30 bg-amber-300/10 text-amber-200',
  Planned: 'border-white/15 bg-white/5 text-slate-300',
}

function Status({ status }: { status: NonNullable<BuildGuideItem['status']> }) {
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>{status}</span>
  )
}

/** An excerpt from the source: the file it is from, linked on GitHub, over the code. */
function Excerpt({ code }: { code: NonNullable<BuildGuideItem['code']> }) {
  return (
    <figure className="mt-4 overflow-hidden rounded-xl border border-white/8 bg-[#050b16]">
      <figcaption className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-2 text-xs text-slate-400">
        <span className="min-w-0 truncate font-mono">{code.file}</span>
        <a
          href={code.href}
          target="_blank"
          rel="noopener noreferrer"
          className="-my-2 inline-flex shrink-0 items-center gap-1 py-2 font-semibold text-slate-300 transition-colors hover:text-cyan-200"
        >
          <FiGithub aria-hidden className="h-3.5 w-3.5" />
          Source
          <span className="sr-only"> of {code.file} on GitHub (opens in a new tab)</span>
        </a>
      </figcaption>
      {/* Long lines scroll inside the box, never the page. */}
      <pre tabIndex={0} aria-label={code.file} className="overflow-x-auto p-4 font-mono text-[0.8rem] leading-relaxed text-slate-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-300">
        <code>{code.text}</code>
      </pre>
    </figure>
  )
}

function Links({ links }: { links: NonNullable<BuildGuideItem['links']> }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="-my-1 inline-flex items-center gap-1 py-1 text-sm font-semibold text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 hover:text-cyan-200"
          >
            {link.label}
            <FiArrowUpRight aria-hidden className="h-3.5 w-3.5" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/** A numbered path, one step under another (the n8games kit). */
function Steps({ guide }: { guide: BuildGuide }) {
  return (
    <ol className="mx-auto mt-8 max-w-3xl space-y-8">
      {guide.items.map((item, i) => (
        <li key={item.title} className="flex gap-4">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-xs font-bold text-cyan-300">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-slate-50">{item.title}</h3>
            <p className="mt-1.5 leading-relaxed text-slate-300">
              <WithCode text={item.body} />
            </p>
            {item.code && <Excerpt code={item.code} />}
            {item.links && <Links links={item.links} />}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** A grid of cards, each with its picture, its name, where it stands and a few words (the pieces). */
function Cards({ guide }: { guide: BuildGuide }) {
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {guide.items.map((item) => (
        <li key={item.title} className="flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/3">
          {item.image && (
            <div className="relative flex h-40 items-end justify-center bg-radial-[at_50%_85%] from-amber-300/12 to-transparent to-70% pt-4">
              <Image
                src={item.image.src}
                alt={item.image.alt}
                width={item.image.width}
                height={item.image.height}
                sizes="144px"
                className="h-36 w-auto"
              />
            </div>
          )}
          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-50">{item.title}</h3>
              {item.status && <Status status={item.status} />}
            </div>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-300">
              <WithCode text={item.body} />
            </p>
            {item.links && <Links links={item.links} />}
          </div>
        </li>
      ))}
    </ul>
  )
}

/** A build's guides, after "How it's built" (BuildGuide in data/builds.tsx). */
export default function BuildGuides({ guides }: { guides: BuildGuide[] }) {
  return (
    <>
      {guides.map((guide) => (
        <Reveal key={guide.id}>
          <section id={guide.id} className="mt-16 scroll-mt-24" aria-labelledby={`${guide.id}-heading`}>
            <h2 id={`${guide.id}-heading`} className="text-center text-3xl font-bold tracking-tight text-balance">
              {guide.heading.lead}{' '}
              <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{guide.heading.accent}</span>
            </h2>
            {guide.intro && <p className="mx-auto mt-3 max-w-2xl text-center leading-relaxed text-slate-400">{guide.intro}</p>}
            {guide.layout === 'steps' ? <Steps guide={guide} /> : <Cards guide={guide} />}
          </section>
        </Reveal>
      ))}
    </>
  )
}
