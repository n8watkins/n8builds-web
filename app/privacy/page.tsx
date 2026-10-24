import Navbar from '@/components/layout/Navbar'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Privacy Policy | n8builds',
  description: 'How n8builds.dev collects, uses, and protects your information.',
  path: '/privacy',
})

const UPDATED = 'October 23, 2026'

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative w-full min-h-screen bg-linear-to-b from-darkBlue via-[#06101f] to-darkBlue text-slate-300 focus:outline-none"
      >
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 pt-28 pb-24">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-50">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-450">Last updated: {UPDATED}</p>

          <div className="mt-10 space-y-8 leading-relaxed text-[0.95rem]">
            <p>
              This Privacy Policy explains how <strong className="text-slate-100">n8builds.dev</strong>{' '}
              (&ldquo;n8builds,&rdquo; operated by Nathan Watkins) collects, uses, and protects your
              information when you visit the site or get in touch.
            </p>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-100">Information I collect</h2>
              <ul className="list-disc pl-5 space-y-2 marker:text-cyan-400/60">
                <li>
                  <span className="text-slate-100">Contact form.</span> When you submit the contact form,
                  I collect your name, email address, and message so I can reply.
                </li>
                <li>
                  <span className="text-slate-100">Usage analytics.</span> I use Google Analytics to
                  understand how the site is used (pages viewed, device type, approximate location). This
                  data is aggregated and not used to personally identify you.
                </li>
                <li>
                  <span className="text-slate-100">Bot protection.</span> The contact form is protected by
                  Cloudflare Turnstile, which collects limited device and interaction signals to confirm you
                  are a human and to block automated abuse.
                </li>
                <li>
                  <span className="text-slate-100">Error monitoring.</span> To catch and fix bugs, the site
                  uses Sentry. When an error occurs it may capture technical details along with your IP
                  address, browser and device information, and a recording (&ldquo;session replay&rdquo;) of
                  that browsing session. Replays mask text and form inputs by default.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-100">How I use it</h2>
              <p>
                I use this information to respond to your inquiries, understand and improve the site, and
                protect it from spam and abuse. I do not sell your personal information.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-100">Third-party services</h2>
              <ul className="list-disc pl-5 space-y-2 marker:text-cyan-400/60">
                <li>
                  <span className="text-slate-100">Cloudflare Turnstile.</span> This site uses Cloudflare
                  Turnstile to protect against spam and abuse. Turnstile may collect information about your
                  device and behavior to verify that you are human. Your use of Turnstile is governed by
                  Cloudflare&rsquo;s Privacy Policy and the{' '}
                  <a
                    href="https://www.cloudflare.com/turnstile-privacy-policy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                  >
                    Cloudflare Turnstile Privacy Addendum
                  </a>
                  .
                </li>
                <li>
                  <span className="text-slate-100">Google Analytics.</span> Usage data is processed by
                  Google under the{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                  >
                    Google Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <span className="text-slate-100">Sentry.</span> Error and performance monitoring is
                  processed by Sentry under the{' '}
                  <a
                    href="https://sentry.io/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                  >
                    Sentry Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <span className="text-slate-100">Email.</span> Contact-form submissions are delivered to
                  me by email so I can respond directly.
                </li>
                <li>
                  <span className="text-slate-100">Hosting.</span> The site is hosted on Vercel, which may
                  process basic request logs to serve and secure the site.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-100">Cookies</h2>
              <p>
                Google Analytics sets cookies to measure usage. You can block or delete these via your
                browser settings or a browser extension without affecting the rest of the site.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-100">Live streams</h2>
              <p>
                While I&rsquo;m streaming, a small player in the corner of the page shows the stream from
                Twitch or YouTube. Those players are loaded from Twitch and YouTube only while I&rsquo;m live,
                and they may set their own cookies and collect viewing data under the{' '}
                <a
                  href="https://www.twitch.tv/p/legal/privacy-notice/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                >
                  Twitch Privacy Notice
                </a>{' '}
                and the{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                >
                  Google Privacy Policy
                </a>
                . YouTube streams use YouTube&rsquo;s privacy-enhanced (no-cookie) player. X streams are only
                linked, never embedded. Closing or minimizing the player is remembered in your browser&rsquo;s
                local storage, which never leaves your device.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-100">Data retention &amp; your choices</h2>
              <p>
                I keep contact-form submissions only as long as needed to respond and maintain our
                correspondence. To request access to or deletion of your information, email me at{' '}
                <a
                  href="mailto:nathancwatkins23@gmail.com"
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                >
                  nathancwatkins23@gmail.com
                </a>
                .
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-100">Contact</h2>
              <p>
                Questions about this policy? Reach me at{' '}
                <a
                  href="mailto:nathancwatkins23@gmail.com"
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                >
                  nathancwatkins23@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
