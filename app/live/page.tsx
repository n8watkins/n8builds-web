import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { SiTwitch, SiYoutube } from 'react-icons/si'
import { FaXTwitter } from 'react-icons/fa6'
import { FiArrowRight, FiCalendar, FiExternalLink } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import FadeIn from '@/components/ui/FadeIn'
import { builds } from '@/data/builds'
import { CHANNELS, LIVE_TEST_COOKIE, getLiveStatus, isLiveTestMode } from '@/lib/live'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Live | n8builds',
  description:
    'Watch Nathan Watkins build software live. This link always goes to wherever the stream is right now: Twitch, YouTube or X.',
  shareDescription: 'Watch me build software live, wherever the stream is right now.',
  path: '/live',
})

/**
 * n8builds.dev/live, the one link to share: a 307 to wherever the stream is
 * right now (the preferred platform when live on several), or, while
 * offline, a small page with the channels, the next scheduled stream and the
 * latest builds.
 */
export default async function LivePage() {
  await connection()
  const testScenario = isLiveTestMode() ? (await cookies()).get(LIVE_TEST_COOKIE)?.value : null
  const status = await getLiveStatus({ testScenario })

  const target = status.streams.find((s) => s.platform === status.preferred) ?? status.streams[0]
  // Outside any try: redirect() works by throwing.
  if (target) redirect(target.url)

  const youtubeChannel = process.env.YOUTUBE_CHANNEL_ID?.trim()
  const channels = [
    {
      ...CHANNELS.twitch,
      handle: 'twitch.tv/n8watkins',
      icon: <SiTwitch className="size-5" />,
      accent: 'group-hover:text-purple-300 group-hover:border-purple-400/40',
    },
    ...(youtubeChannel
      ? [
          {
            label: 'YouTube',
            url: `https://www.youtube.com/channel/${youtubeChannel}`,
            handle: 'YouTube channel',
            icon: <SiYoutube className="size-5" />,
            accent: 'group-hover:text-red-300 group-hover:border-red-400/40',
          },
        ]
      : []),
    {
      ...CHANNELS.x,
      handle: '@n8watkins',
      icon: <FaXTwitter className="size-5" />,
      accent: 'group-hover:text-slate-100 group-hover:border-white/30',
    },
  ]
  const upcoming = status.upcoming
  const latest = builds.slice(0, 3)

  return (
    <>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative min-h-screen w-full bg-linear-to-b from-darkBlue via-[#06101f] to-darkBlue text-slate-300 focus:outline-none"
      >
        {/* A short page that is all on screen at load: CSS fades, staggered,
            so nothing waits on hydration. */}
        <div className="relative z-10 mx-auto max-w-3xl px-5 pt-28 pb-24 sm:px-8">
          <FadeIn>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span className="size-2 rounded-full bg-slate-500" aria-hidden />
              Offline
            </p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
              Not live right now
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-slate-400">
              When I&rsquo;m streaming, this link goes straight to the stream. Follow a channel to
              hear when I go live next.
            </p>
          </FadeIn>

          {upcoming && (
            <FadeIn delay={0.05}>
              <a
                href={upcoming.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-8 flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 transition-colors hover:border-cyan-300/40 hover:bg-cyan-400/10"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <FiCalendar className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-cyan-300/80">
                    Next stream
                  </span>
                  <span className="block truncate font-semibold text-slate-100">
                    {upcoming.title ?? 'Scheduled on YouTube'}
                  </span>
                  <time dateTime={upcoming.scheduledFor} className="block text-sm text-slate-400">
                    {new Intl.DateTimeFormat('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'America/Los_Angeles',
                    }).format(new Date(upcoming.scheduledFor))}{' '}
                    PT
                  </time>
                </span>
                <FiExternalLink className="size-4 shrink-0 text-slate-450 group-hover:text-cyan-200" />
              </a>
            </FadeIn>
          )}

          <FadeIn delay={0.1}>
            <section aria-labelledby="live-channels" className="mt-10">
              <h2
                id="live-channels"
                className="text-sm font-bold uppercase tracking-wider text-slate-475"
              >
                Channels
              </h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {channels.map((channel) => (
                  <li key={channel.label}>
                    <a
                      href={channel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-4 transition-colors hover:bg-white/6"
                    >
                      <span
                        className={`flex size-10 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors ${channel.accent}`}
                      >
                        {channel.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-100">{channel.label}</span>
                        <span className="block truncate text-sm text-slate-450">
                          {channel.handle}
                        </span>
                      </span>
                      <FiExternalLink className="size-4 shrink-0 text-slate-475 transition-colors group-hover:text-slate-200" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </FadeIn>

          <FadeIn delay={0.15}>
            <section aria-labelledby="live-latest" className="mt-10">
              <h2
                id="live-latest"
                className="text-sm font-bold uppercase tracking-wider text-slate-475"
              >
                Latest builds
              </h2>
              <ul className="mt-3 divide-y divide-white/[0.06] rounded-xl border border-white/8 bg-white/2">
                {latest.map((build) => (
                  <li key={build.slug}>
                    <Link
                      href={`/builds/${build.slug}`}
                      className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/4"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-100 transition-colors group-hover:text-cyan-300">
                          {build.name}
                        </span>
                        <span className="block truncate text-sm text-slate-450">
                          {build.tagline}
                        </span>
                      </span>
                      <FiArrowRight className="size-4 shrink-0 text-slate-475 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </FadeIn>
        </div>
      </main>
    </>
  )
}
