import { FiRss } from 'react-icons/fi'
import Navbar from '@/components/layout/Navbar'
import NotionsList from '@/components/blog/NotionsList'
import { getAllPosts } from '@/lib/sanity'
import { pageMetadata } from '@/lib/seo'
import { FEED_PATH } from '@/lib/rss'
import FadeIn from '@/components/ui/FadeIn'
import PreviewBanner from '@/components/blog/PreviewBanner'
import NewsletterSignup from '@/components/blog/NewsletterSignup'
import { turnstileSiteKey } from '@/lib/security/turnstileSiteKey'

export const revalidate = 3600

export const metadata = pageMetadata({
  title: "N8's Notions | n8builds",
  description: 'Notes, essays, and build logs from n8 on building software with AI.',
  path: '/blog',
})

export default async function BlogIndexPage() {
  const posts = await getAllPosts()

  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="relative min-h-screen bg-darkBlue text-slate-100 focus:outline-none">
        {/* Ambient glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-0 h-128 w-lg scale-[1.6] bg-radial from-cyan-500/6 to-transparent to-70%" />
          <div className="absolute right-[-10%] top-[28%] h-120 w-120 scale-[1.6] bg-radial from-blue-600/6 to-transparent to-70%" />
        </div>

        <div className="relative mx-auto max-w-site px-5 pb-24 pt-28 sm:px-8 md:pt-36">
          {/* Above the fold: a CSS fade, so the heading never waits on hydration. */}
          <FadeIn as="header">
            {/* Nothing above the title (owner, round 9 of 2026-11-09: no "The Build Log" label). */}
            <h1 className="text-[2.6rem] font-extrabold leading-[1.03] tracking-tight text-slate-50 sm:text-6xl/none">
              <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                N8&apos;s Notions
              </span>
            </h1>
            <p className="mt-4 max-w-[600px] text-base leading-relaxed text-[#9cadc5] sm:text-lg/7">
              Notes, essays, and lessons from building software in public.
            </p>
            {/* A real button, in RSS orange (round 8 of 2026-11-09: the quiet mono link was easy to miss). */}
            <a
              href={FEED_PATH}
              data-rss-subscribe
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-orange-400/35 bg-orange-400/[0.08] px-4 py-2 text-sm font-semibold text-orange-100 transition-colors hover:border-orange-300/60 hover:bg-orange-400/[0.15] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
            >
              <FiRss aria-hidden className="h-4 w-4 text-orange-400" />
              Subscribe with RSS
            </a>
          </FadeIn>

          <NotionsList posts={posts} />

          <div className="max-w-3xl">
            <NewsletterSignup variant="index" turnstileSiteKey={turnstileSiteKey()} />
          </div>
        </div>
      </main>
      <PreviewBanner path="/blog" />
    </>
  )
}
