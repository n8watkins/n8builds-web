import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import { LuNotebookPen } from 'react-icons/lu'
import SectionMark from '@/components/ui/SectionMark'
import PostCard from '@/components/blog/PostCard'
import type { Post } from '@/lib/sanity'

// Homepage "Latest from N8's Notions" strip: the 3 newest posts, fetched on the
// server by the homepage (app/page.tsx), so they are in its HTML. The full
// list lives at /blog.
const NotionsStrip = ({ posts }: { posts: Post[] }) => {
  if (posts.length === 0) return null

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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p._id} post={p} />
        ))}
      </div>
    </section>
  )
}

export default NotionsStrip
