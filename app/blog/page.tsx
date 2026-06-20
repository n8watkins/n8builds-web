import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import NotionsList from '@/components/blog/NotionsList'
import { getAllPosts } from '@/lib/sanity'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'N8 Notions — Nate Builds',
  description: 'Notes, essays, and build logs from n8 — building software in public.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'N8 Notions — Nate Builds',
    description: 'Notes, essays, and build logs from n8 — building software in public.',
    url: '/blog',
    type: 'website',
  },
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts()

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen bg-[#050812] text-slate-100">
        {/* Ambient glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] top-0 h-[32rem] w-[32rem] rounded-full bg-cyan-500/[0.06] blur-[140px]" />
          <div className="absolute -right-[10%] top-[28%] h-[30rem] w-[30rem] rounded-full bg-blue-600/[0.06] blur-[140px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8 md:pt-36">
          <header>
            <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em] text-cyan-400">
              The Build Log
            </p>
            <h1 className="mt-3 text-[2.6rem] font-extrabold leading-[1.03] tracking-tight text-slate-50 sm:text-6xl">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                N8 Notions
              </span>
            </h1>
            <p className="mt-4 max-w-[600px] text-base leading-relaxed text-[#9cadc5] sm:text-lg">
              Notes, essays, and lessons from building software in public.
            </p>
          </header>

          <NotionsList posts={posts} />
        </div>
      </main>
    </>
  )
}
