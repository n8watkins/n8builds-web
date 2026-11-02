import WaitlistForm from '@/components/upcoming/WaitlistForm'
import { isWaitlistOpen } from '@/lib/waitlist/store'

/**
 * "Join the waitlist": the heading and the form, or how to reach me while the
 * waitlist is closed. Shared by /upcoming and the homepage's What's cookin'
 * (owner, 2026-11-02), so both pick projects the same way. Server-rendered;
 * the caller wraps it in the section the cards' Join buttons scroll to.
 */
export default function WaitlistPanel({ heading: Heading = 'h2' }: { heading?: 'h2' | 'h4' }) {
  const open = isWaitlistOpen()
  // As the contact form: under `next dev` the server skips Turnstile.
  const turnstileSiteKey = process.env.NODE_ENV === 'development' ? '' : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

  return (
    <div className="rounded-2xl border border-white/8 bg-linear-to-br from-cyan-500/[0.06] to-blue-600/[0.03] p-6 sm:p-8">
      {/* h4 on the homepage, under the Lab's h3 "What's cookin'". */}
      <Heading className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
        Join the <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">waitlist</span>
      </Heading>
      {open ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
            Pick the projects you want to hear about. I&rsquo;ll email a link to confirm, so nobody can sign you up but you.
          </p>
          <div className="mt-6">
            <WaitlistForm turnstileSiteKey={turnstileSiteKey} />
          </div>
        </>
      ) : (
        <div data-waitlist-closed className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300 sm:text-base">
          <p className="font-semibold text-slate-100">The waitlist opens soon.</p>
          <p>
            Until it does, email me at{' '}
            <a href="mailto:contact@n8builds.dev" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
              contact@n8builds.dev
            </a>{' '}
            with the project you&rsquo;re interested in, and I&rsquo;ll let you know when there is something to try.
          </p>
        </div>
      )}
    </div>
  )
}
