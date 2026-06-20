import type { Metadata } from 'next'
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
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
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:px-8 md:pt-32">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-cyan-300"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to the bench
          </Link>

          <header className="mt-8">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-cyan-400">
              The Log
            </p>
            <h1 className="mt-3 text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-slate-50 sm:text-5xl">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                N8 Notions
              </span>
            </h1>
            <p className="mt-4 max-w-[600px] text-base leading-relaxed text-[#9cadc5]">
              Notes, essays, and lessons from building software in public.
            </p>
          </header>

          <NotionsList posts={posts} />
        </div>
      </main>
    </>
  )
}
