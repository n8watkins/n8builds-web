import Navbar from '@/components/layout/Navbar'
import FadeIn from '@/components/ui/FadeIn'
import NewsletterLinkAction from '@/components/blog/NewsletterLinkAction'
import { pageMetadata } from '@/lib/seo'

export const metadata = {
  ...pageMetadata({
    title: 'Unsubscribe | n8builds',
    description: "Unsubscribe from N8's Notions by email.",
    path: '/newsletter/unsubscribe',
  }),
  // A page for the link in one email, not for search.
  robots: { index: false, follow: false },
}

export default function NewsletterUnsubscribePage() {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="relative min-h-[80vh] bg-darkBlue text-slate-100 focus:outline-none">
        <FadeIn className="relative mx-auto max-w-xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
          <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em] text-cyan-400">N8&apos;s Notions by email</p>
          <h1 className="mt-3 mb-6 text-4xl font-extrabold tracking-tight text-slate-50">Unsubscribe</h1>
          <NewsletterLinkAction mode="unsubscribe" />
        </FadeIn>
      </main>
    </>
  )
}
