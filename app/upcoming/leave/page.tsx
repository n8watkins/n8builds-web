import Navbar from '@/components/layout/Navbar'
import FadeIn from '@/components/ui/FadeIn'
import WaitlistLinkAction from '@/components/upcoming/WaitlistLinkAction'
import { pageMetadata } from '@/lib/seo'

export const metadata = {
  ...pageMetadata({
    title: 'Leave the waitlist | n8builds',
    description: 'Remove your address from the n8builds waitlist.',
    path: '/upcoming/leave',
  }),
  robots: { index: false, follow: false },
}

export default function LeavePage() {
  // As the contact form: under `next dev` the server skips Turnstile.
  const turnstileSiteKey = process.env.NODE_ENV === 'development' ? '' : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="relative min-h-[80vh] bg-darkBlue text-slate-100 focus:outline-none">
        <FadeIn className="relative mx-auto max-w-xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
          <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em] text-cyan-400">Waitlist</p>
          <h1 className="mt-3 mb-6 text-4xl font-extrabold tracking-tight text-slate-50">Leave the waitlist</h1>
          <WaitlistLinkAction mode="leave" turnstileSiteKey={turnstileSiteKey} />
        </FadeIn>
      </main>
    </>
  )
}
