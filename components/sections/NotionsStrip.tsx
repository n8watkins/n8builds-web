import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import { LuNotebookPen } from 'react-icons/lu'
import SectionMark from '@/components/ui/SectionMark'
import PostCard, { FeaturedPostCard, PostRow } from '@/components/blog/PostCard'
import type { Post } from '@/lib/sanity'

// Homepage "Latest from N8's Notions" strip: the newest post featured (round 3
// of 2026-11-02), then the 3 before it as cards, fetched on the server by the
// homepage (app/page.tsx), so they are in its HTML. The full list lives at /blog.
// On phones (below 640px) all four are compact rows instead, a thumbnail beside
// the title and excerpt (owner, 2026-11-08); the cards are hidden there.
const NotionsStrip = ({ posts }: { posts: Post[] }) => {
  if (posts.length === 0) return null
  const [featured, ...rest] = posts

  return (
    <section id="notions" aria-label="N8's Notions" className="py-16">
      <SectionMark
        icon={<LuNotebookPen aria-hidden="true" />}
        title={<>N8&apos;s Notions</>}
        action={
          <Link
            href="/blog"
            className="group flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/8"
          >
            Read all notes
            <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        }
      >
        Notes, essays, and lessons from building in public.
      </SectionMark>

      <ul className="flex flex-col gap-3 sm:hidden">
        {posts.map((p) => (
          <li key={p._id}>
            <PostRow post={p} />
          </li>
        ))}
      </ul>

      <div className="hidden sm:block">
        <FeaturedPostCard post={featured} />

        {rest.length > 0 && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <PostCard key={p._id} post={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default NotionsStrip
