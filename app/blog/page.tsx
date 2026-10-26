import Navbar from '@/components/layout/Navbar'
import NotionsList from '@/components/blog/NotionsList'
import { getAllPosts } from '@/lib/sanity'
import { pageMetadata } from '@/lib/seo'
import FadeIn from '@/components/ui/FadeIn'

export const revalidate = 3600

export const metadata = pageMetadata({
  title: "Nate's Notions | n8builds",
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
          <div className="absolute left-[-10%] top-0 h-128 w-lg rounded-full bg-cyan-500/6 blur-[140px]" />
          <div className="absolute right-[-10%] top-[28%] h-120 w-120 rounded-full bg-blue-600/6 blur-[140px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8 md:pt-36">
          {/* Above the fold: a CSS fade, so the heading never waits on hydration. */}
          <FadeIn as="header">
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em] text-cyan-400">
              The Build Log
            </p>
            <h1 className="mt-3 text-[2.6rem] font-extrabold leading-[1.03] tracking-tight text-slate-50 sm:text-6xl/none">
              <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Nate&apos;s Notions
              </span>
            </h1>
            <p className="mt-4 max-w-[600px] text-base leading-relaxed text-[#9cadc5] sm:text-lg/7">
              Notes, essays, and lessons from building software in public.
            </p>
          </FadeIn>

          <NotionsList posts={posts} />
        </div>
      </main>
    </>
  )
}
