import Image from 'next/image'
import Link from 'next/link'
import { FiBookOpen, FiDownload, FiExternalLink } from 'react-icons/fi'
import Reveal from '@/components/ui/Reveal'
import RepoButtons from '@/components/ui/RepoButtons'
import ActionLabel from '@/components/ui/ActionLabel'
import { PlatformGroup, ProjectGallery, ProjectTour, type GalleryImage, type ProjectTourVideo } from '@/components/sections/FeaturedProjectIslands'
import { getBuild, type BuildAction } from '@/data/builds'
import LabSubheader from '@/components/sections/LabSubheader'
import { StarIcon } from '@/components/ui/PartIcons'
import { downloadCaption } from '@/lib/downloads'

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
    subtitle: 'Speech-to-text for Windows',
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

/**
 * A Windows-only app's row away from Windows (PlatformGroup, owner,
 * 2026-11-08): the download turns quiet and Full story takes Scribe's solid
 * blue. Only colours change, so nothing moves.
 */
const awayDownload =
  'group-data-[platform=other]/platform:bg-none group-data-[platform=other]/platform:border-white/12 group-data-[platform=other]/platform:bg-white/4 group-data-[platform=other]/platform:text-slate-200 group-data-[platform=other]/platform:hover:bg-white/8'
const awayStory =
  'group-data-[platform=other]/platform:border-transparent group-data-[platform=other]/platform:bg-linear-to-r group-data-[platform=other]/platform:from-blue-600 group-data-[platform=other]/platform:to-sky-700 group-data-[platform=other]/platform:text-white group-data-[platform=other]/platform:hover:from-blue-700 group-data-[platform=other]/platform:hover:to-sky-800'

/** The row's one primary button, to the live thing, in the product's colour. */
const PrimaryButton = ({ project, action, captionId }: { project: FeaturedProject; action: BuildAction; captionId?: string }) => {
  const external = action.href.startsWith('http')
  return (
    <a
      href={action.href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...(captionId ? { 'aria-describedby': captionId } : {})}
      className={`${buttonBase} ${tightButton} btn-shimmer border border-transparent ${accents[project.accent].primary} ${action.download ? awayDownload : ''}`}
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
  const caption = action?.download ? await downloadCaption(action.download) : undefined
  const captionId = caption ? `${slugOf(project)}-download-facts` : undefined
  // The primary, what a download fetches, and Full story: for a Windows-only
  // download, marked with the visitor's platform (PlatformGroup).
  const lead = (
    <>
      {action ? (
        <div className="col-span-2 grid @[31rem]/lab-actions:col-span-1">
          <PrimaryButton project={project} action={action} captionId={captionId} />
        </div>
      ) : null}
      {/* What a download fetches, close under it: on its own line under the
          primary on narrow columns, under the whole row on wide ones. Away
          from Windows it says the app is for Windows for now. */}
      {caption ? (
        <p
          id={captionId}
          className="col-span-2 -mt-1 text-xs text-slate-400 @[31rem]/lab-actions:order-last @[31rem]/lab-actions:col-span-3"
        >
          <span className="group-data-[platform=other]/platform:hidden">{caption}</span>
          <span className="hidden group-data-[platform=other]/platform:inline">Windows app. Mac and Linux coming.</span>
        </p>
      ) : null}
      <Link
        href={`/builds/${project.buildSlug}`}
        className={`${buttonBase} ${tightButton} border ${outline} ${action?.download ? awayStory : ''}`}
      >
        <FiBookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Full story<span className="sr-only"> of {project.title}</span>
      </Link>
    </>
  )
  return (
    <Reveal className={`flex flex-col ${flipped ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-6 md:gap-12`}>
      {project.tour ? (
        <ProjectTour title={project.title} tour={project.tour} />
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
        <div className="@container/lab-actions mt-5">
          <div className="grid grid-cols-[repeat(2,minmax(max-content,1fr))] gap-2 @[31rem]/lab-actions:grid-cols-[minmax(max-content,1.25fr)_repeat(2,minmax(max-content,1fr))]">
            {action?.download ? <PlatformGroup>{lead}</PlatformGroup> : lead}
            {project.github && (
              <RepoButtons href={project.github} name={project.title} halfClassName={tightButton} className="w-full" />
            )}
          </div>
        </div>
      </div>
    </Reveal>
  )
}

/** The Lab's content width, inside its full-bleed part and row washes. */
const container = 'mx-auto max-w-site px-5 sm:px-8'

// Each row sits in its own full-bleed wash in its product's colour, a glow from
// the page edge on its screenshot's side (`.lab-row-wash` in app/globals.css). The
// washes fade out at their edges, so the rows' padding doubles as the gap between them.
// `bleed` off: a row inside a page's own content column (the homepage's
// Loadout), with no wash, since a glow cut off at the column's edge would show a seam.
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
      <Rows group="featured" />
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
