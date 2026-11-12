import Image from 'next/image'
import Link from 'next/link'
import { FiBookOpen, FiDownload, FiExternalLink } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import RepoButtons from '@/components/ui/RepoButtons'
import ActionLabel from '@/components/ui/ActionLabel'
import { ClipSlot, ClipTurns, ProjectGallery, ProjectTour, type GalleryImage, type ProjectTourVideo } from '@/components/sections/FeaturedProjectIslands'
import { getBuild, type BuildAction } from '@/data/builds'
import LabSubheader from '@/components/sections/LabSubheader'
import { StarIcon } from '@/components/ui/PartIcons'
import { scribeDownloads } from '@/lib/downloads'
import ScribeActions from '@/components/sections/ScribeActions'

/**
 * Each row's main action takes its product's colour, so the rows don't read as
 * one repeated block: Scribe's sky blue, OpenPing's uptime green, Solara's sun
 * orange. Every pairing passes WCAG AA: white on blue-600 or darker (5.2:1 and
 * up), dark text on the light fills.
 */
const accents = {
  scribe: {
    // Near-solid blue: a slight shift into sky, darker on hover, so the white label stays above 5:1.
    primary: 'bg-linear-to-r from-blue-600 to-sky-700 text-white hover:from-blue-700 hover:to-sky-800',
  },
  openping: {
    primary: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300',
  },
  solara: {
    // Mostly solid orange with a slight warm shift; orange into amber was too loud.
    primary: 'bg-linear-to-r from-orange-500 to-orange-400 text-slate-950 hover:from-orange-400 hover:to-orange-300',
  },
} satisfies Record<string, { primary: string }>

/**
 * A Lab row says what the build is and invites you to try it, nothing more
 * (owner, 2026-11-08): its icon, name, tagline, a sentence or two, and three
 * buttons. The stack, the features and every other way in live on the build's
 * full story page (/builds/<slug>), one click away.
 */
interface FeaturedProject {
  title: string
  /** The app's own icon, shown left of its name. */
  icon: string
  /**
   * Where the row lives: the owner's daily drivers, leading "Tools I built
   * and use" (Scribe), or the Lab's featured builds.
   */
  group: 'daily' | 'featured'
  /** A few words. */
  subtitle: string
  /** What it is, in a sentence or two; the features and the tech are on its full story page. */
  description: string
  /** The screenshots, first one shown; the gallery steps through the rest. */
  images: GalleryImage[]
  /**
   * A looping tour of the app's own screens, shown instead of the screenshots
   * (Scribe: a desktop app, where a picture of its landing page shows nothing
   * of the app; round 4 of 2026-11-02).
   */
  tour?: ProjectTourVideo
  github?: string
  /** Its page on this site (/builds/<slug>) and its data, in data/builds.tsx: the primary action is its `tryIt`. */
  buildSlug: string
  /** object-position for the images, when the top-centre crop cuts the art. */
  imagePosition?: string
  /** The product's colour, for its main action. */
  accent: keyof typeof accents
}

// Scribe, the owner's daily driver, leads "Tools I built and use" on /loadout
// and in the homepage's Loadout (the owner's call, 2026-11-01); the rest are the Lab's featured builds,
// OpenPing first. Portfolio Rank left the Lab on 2026-11-08 for the developer
// portfolio; its page (/builds/portfolio-rank) stays. n8builds itself is not a
// row: how it is built and tested lives in the Lab's template part, right after
// these rows (UseAsTemplate.tsx).
const featured: FeaturedProject[] = [
  {
    title: 'Scribe',
    icon: '/builds/scribe/app-icon.png',
    group: 'daily',
    subtitle: 'Speech-to-text for Windows, Mac and Linux',
    description:
      'I dictate with Scribe every day: hold a hotkey, talk and let go, and your words land at the cursor. Your audio never leaves your PC.',
    // The app itself, not its landing page (round 4 of 2026-11-02): since
    // round 5 a real screen recording of someone using it, from its own UI
    // (scripts/scribe-tour/record.mjs and build-video.sh).
    images: [],
    tour: {
      webm: '/builds/scribe/tour.webm',
      mp4: '/builds/scribe/tour.mp4',
      poster: '/builds/scribe/tour-poster.webp',
      alt: 'A tour of the Scribe app, recorded as someone uses it: starting a dictation and watching the words appear live, then History, the Dictation, Words, Models and Hotkeys settings, and switching to the Emerald theme',
    },
    github: 'https://github.com/n8watkins/scribe',
    buildSlug: 'scribe',
    accent: 'scribe',
  },
  {
    title: 'OpenPing',
    icon: '/builds/openping/icon.svg',
    group: 'featured',
    subtitle: 'Uptime monitoring on your own Cloudflare',
    description:
      'Know the moment your site goes down, and share a status page, all from your own Cloudflare account. I check it every day.',
    images: [
      { src: '/builds/openping/landing.webp', alt: 'OpenPing: uptime monitoring that runs entirely in your own cloud' },
      { src: '/builds/openping/status.webp', alt: 'An OpenPing public status page: all systems operational, with 90 days of uptime bars per service' },
      { src: '/builds/openping/tools.webp', alt: "OpenPing's free tools: is it down, uptime calculator, subnet calculator, cron tester, DNS and MX lookup" },
    ],
    github: 'https://github.com/n8watkins/open-ping',
    buildSlug: 'openping',
    accent: 'openping',
  },
  {
    title: 'Solara',
    icon: '/builds/solara/icon.png',
    group: 'featured',
    subtitle: 'Personal UV planner',
    description:
      'See when you can be outside without burning: Solara turns live UV, your skin type and your sunscreen into a plan for each activity.',
    // A wide social card: anchor left so the cover crop keeps the sun.
    images: [{ src: '/builds/solara/og-image.png', alt: 'Solara: know your sun window' }],
    imagePosition: 'object-left',
    github: 'https://github.com/n8watkins/solara',
    buildSlug: 'solara',
    accent: 'solara',
  },
]

/** A Lab button. None of them grows on hover: the row's buttons sit level. */
const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200'

/**
 * The row's buttons where their columns are narrow (the `lab-tight` variant,
 * app/globals.css): tighter padding and gap and 13px labels, so every label
 * stays on one line.
 */
const tightButton = 'lab-tight:gap-1.5 lab-tight:px-2.5 lab-tight:text-[0.8125rem]'

/** The quiet look of Full story (and of a Windows download elsewhere). */
const outline = 'border-white/12 bg-white/4 text-slate-200 hover:bg-white/8 hover:text-slate-50'

/** The row's one primary button, to the live thing, in the product's colour. */
const PrimaryButton = ({ project, action, captionId }: { project: FeaturedProject; action: BuildAction; captionId?: string }) => {
  const external = action.href.startsWith('http')
  return (
    <a
      href={action.href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...(captionId ? { 'aria-describedby': captionId } : {})}
      className={`${buttonBase} ${tightButton} btn-shimmer border border-transparent ${accents[project.accent].primary}`}
    >
      {action.download ? <FiDownload className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      <ActionLabel label={action.label} />
      {external ? <FiExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  )
}

const slugOf = (project: FeaturedProject) => project.buildSlug

const ProjectRow = async ({ project, flipped }: { project: FeaturedProject; flipped: boolean }) => {
  const build = getBuild(project.buildSlug)
  const action = build?.tryIt
  // A desktop app's download (Scribe) offers the file for the visitor's OS, in beta
  // on Mac and Linux, and leads with Full story on a phone (ScribeActions, 2026-11-09).
  const downloads = action?.download === 'scribe' ? await scribeDownloads() : undefined
  const lead = (
    <>
      {action ? (
        <div className="col-span-2 grid @[31rem]/lab-actions:col-span-1">
          <PrimaryButton project={project} action={action} />
        </div>
      ) : null}
      <Link
        href={`/builds/${project.buildSlug}`}
        className={`${buttonBase} ${tightButton} border ${outline}`}
      >
        <FiBookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Full story<span className="sr-only"> of {project.title}</span>
      </Link>
    </>
  )
  // Its own tour (Scribe's), else its build's usage clip (OpenPing's and Solara's,
  // scripts/product-clips/; owner, round 7 of 2026-11-09), else its screenshots.
  const tour = project.tour ?? getBuild(project.buildSlug)?.clip
  return (
    <Reveal className={`flex flex-col ${flipped ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-6 md:gap-12`}>
      {tour ? (
        <ProjectTour title={project.title} tour={tour} />
      ) : (
        <ProjectGallery
          title={project.title}
          images={project.images}
          imageClassName={`object-cover ${project.imagePosition ?? 'object-top'} transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none`}
        />
      )}

      <div className="flex w-full flex-col md:w-1/2">
        <div className="flex items-center gap-3">
          <Image
            src={project.icon}
            alt=""
            width={44}
            height={44}
            unoptimized={project.icon.endsWith('.svg')}
            className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-white/10 sm:h-11 sm:w-11"
          />
          <div className="min-w-0">
            <h3 id={`${slugOf(project)}-title`} className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
              {project.title}
            </h3>
            <p className="text-sm font-semibold text-blue-300">{project.subtitle}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#9cadc5] sm:text-[0.95rem]">{project.description}</p>

        {/* One button rule for every row (owner, 2026-11-08): the primary
            action to the live thing, in the product's colour, then "Full
            story" (its build page), then the Star | GitHub split button. One
            line where the column is wide enough for all three (from 31rem in
            the size container `lab-actions`); below that the primary takes the first
            line and the other two share the next. A column is never narrower
            than its button. */}
        {downloads ? (
          <>
            <div className="mt-5">
              <ScribeActions downloads={downloads} story={`/builds/${project.buildSlug}`} />
            </div>
            {project.github && (
              <RepoButtons href={project.github} name={project.title} className="mt-1 w-full" />
            )}
          </>
        ) : (
          <div className="@container/lab-actions mt-5">
            <div className="grid grid-cols-[repeat(2,minmax(max-content,1fr))] gap-2 @[31rem]/lab-actions:grid-cols-[minmax(max-content,1.25fr)_repeat(2,minmax(max-content,1fr))]">
              {lead}
              {project.github && (
                <RepoButtons href={project.github} name={project.title} halfClassName={tightButton} className="w-full" />
              )}
            </div>
          </div>
        )}
      </div>
    </Reveal>
  )
}

/**
 * A featured build (owner, round 8 of 2026-11-09: "Featured gets its own
 * bigger design"; round 9: the big cards were too big, so the two sit side by
 * side from 1024px, stacked on phones and tablets): its usage clip across the
 * card, and under it its icon, name and tagline, a sentence or two, and the
 * same three buttons as every row (the primary action, Full story, Star |
 * GitHub). Each card is in its product's colour, a glow behind it. The two
 * clips take turns (ClipTurns): one plays through, then the other, round and
 * round; pointing at one makes it the one playing. The other rests on its
 * poster with a play button.
 */
const FeaturedCard = ({ project, slot }: { project: FeaturedProject; slot: number }) => {
  const build = getBuild(project.buildSlug)
  const action = build?.tryIt
  const clip = project.tour ?? build?.clip
  return (
    <ClipSlot slot={slot} className="h-full">
      <Reveal className="relative flex h-full flex-col rounded-[1.5rem] border border-white/10 bg-[#081120]/80 p-2.5 shadow-2xl shadow-black/30 transition-colors duration-300 hover:border-[rgb(var(--lab-from)/0.4)] sm:p-3">
        {/* Its colour, a soft glow behind the card. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 -z-10 h-2/3 rounded-full bg-[radial-gradient(closest-side,rgb(var(--lab-from)/0.14),transparent)] blur-2xl"
        />
        {clip ? (
          <ProjectTour
            title={project.title}
            tour={clip}
            noun="clip"
            className="w-full"
            frameClassName="rounded-[1.1rem] border border-white/8"
            sizes="(min-width: 1024px) 560px, 100vw"
          />
        ) : (
          <ProjectGallery
            title={project.title}
            images={project.images}
            imageClassName={`object-cover ${project.imagePosition ?? 'object-top'}`}
          />
        )}
        <div data-featured-text className="flex flex-1 flex-col gap-5 px-2 pt-4 pb-2 sm:px-3 sm:pt-5">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Image
                src={project.icon}
                alt=""
                width={44}
                height={44}
                unoptimized={project.icon.endsWith('.svg')}
                className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-white/10 sm:h-11 sm:w-11"
              />
              <div className="min-w-0">
                <h3 id={`${slugOf(project)}-title`} className="text-2xl leading-tight font-bold tracking-tight text-slate-50 sm:text-[1.75rem]">
                  {project.title}
                </h3>
                <p className="text-sm font-semibold text-balance text-[rgb(var(--lab-from))]">{project.subtitle}</p>
              </div>
            </div>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-pretty text-[#9cadc5]">{project.description}</p>
          </div>
          {/* The same buttons as every row: one line where they fit, else the primary over the other two. */}
          <div className="@container/lab-actions mt-auto w-full">
            <div className="grid grid-cols-[repeat(2,minmax(max-content,1fr))] gap-2 @[31rem]/lab-actions:grid-cols-[minmax(max-content,1.25fr)_repeat(2,minmax(max-content,1fr))]">
              {action ? (
                <div className="col-span-2 grid @[31rem]/lab-actions:col-span-1">
                  <PrimaryButton project={project} action={action} />
                </div>
              ) : null}
              <Link href={`/builds/${project.buildSlug}`} className={`${buttonBase} ${tightButton} border ${outline}`}>
                <FiBookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Full story<span className="sr-only"> of {project.title}</span>
              </Link>
              {project.github && <RepoButtons href={project.github} name={project.title} halfClassName={tightButton} className="w-full" />}
            </div>
          </div>
        </div>
      </Reveal>
    </ClipSlot>
  )
}

/** The Lab's content width, inside its full-bleed part and row washes. */
const container = 'mx-auto max-w-site px-5 sm:px-8'

// Each row sits in its own full-bleed wash in its product's colour, a glow from
// the page edge on its screenshot's side (`.lab-row-wash` in app/globals.css). The
// washes fade out at their edges, so the rows' padding doubles as the gap between them.
// `bleed` off: a row inside a page's own content column (the homepage's
// Loadout), with no wash, since a glow cut off at the column's edge would show a seam.
// Since round 8 of 2026-11-09 only Scribe's row (/loadout) is a row; the featured builds are cards (FeaturedCard).
const Rows = ({ group, bleed = true }: { group: FeaturedProject['group']; bleed?: boolean }) => (
  <div className="flex flex-col">
    {featured
      .filter((p) => p.group === group)
      .map((p, i) => {
        // Screenshot right for the first row (text first), then alternating.
        const flipped = i % 2 === 0
        return (
          // An article named by its title, so each row is one landmark-like unit for screen readers.
          <article
            key={p.title}
            aria-labelledby={`${slugOf(p)}-title`}
            className={bleed ? `lab-row-wash lab-accent-${p.accent} py-6 md:py-8 ${flipped ? '[--lab-x:100%]' : '[--lab-x:0%]'}` : undefined}
          >
            {bleed ? (
              <div className={container}>
                <ProjectRow project={p} flipped={flipped} />
              </div>
            ) : (
              <ProjectRow project={p} flipped={flipped} />
            )}
          </article>
        )
      })}
  </div>
)

/** The Lab's featured builds, the first part under its intro. */
const FeaturedProjects = () => {
  return (
    <section id="featured" aria-label="Featured" className="lab-accent-featured py-10">
      <Reveal className={`${container} pb-4`}>
        {/* "Featured" (owner, 2026-11-09; "Featured builds" before), with no blurb: the
            open-source checks sit once under "The Lab" now (components/HomePage.tsx). */}
        <LabSubheader title="Featured" icon={<StarIcon />} />
      </Reveal>
      {/* Side by side from 1024px, OpenPing first (round 9 of 2026-11-09), stacked below that;
          their clips take turns. Two cards since 2026-11-11; an odd one out, should a
          third join, sits centred under the pair at the same width. */}
      <ClipTurns count={featured.filter((p) => p.group === 'featured').length}>
        <div className={`${container} grid gap-5 py-3 lg:grid-cols-2 lg:gap-6`}>
          {featured
            .filter((p) => p.group === 'featured')
            .map((p, i) => (
              <article
                key={p.title}
                aria-labelledby={`${slugOf(p)}-title`}
                className={`lab-accent-${p.accent} relative isolate lg:odd:last:col-span-2 lg:odd:last:mx-auto lg:odd:last:w-[calc(50%-0.75rem)]`}
              >
                <FeaturedCard project={p} slot={i} />
              </article>
            ))}
        </div>
      </ClipTurns>
    </section>
  )
}

/**
 * The owner's daily drivers (Scribe) as Lab rows, leading "Tools I built and
 * use". On /loadout they are full-bleed (each row's wash reaches the page
 * edge), so the page renders them outside its content column and each row
 * sets the same column inside; `bleed={false}` puts them in a column as they
 * are, with no wash (the homepage's Loadout).
 */
export const DailyDriverRows = ({ bleed = true }: { bleed?: boolean }) => <Rows group="daily" bleed={bleed} />

export default FeaturedProjects
