import Navbar from '@/components/layout/Navbar'
import { pageMetadata } from '@/lib/seo'
import FadeIn from '@/components/ui/FadeIn'
import Reveal from '@/components/ui/Reveal'
import CookieSettingsButton from '@/components/consent/CookieSettingsButton'
import { CONSENT_STORAGE_KEY } from '@/lib/consent'

export const metadata = pageMetadata({
  title: 'Privacy Policy | n8builds',
  description: 'How n8builds.dev collects, uses, and protects your information.',
  path: '/privacy',
})

const UPDATED = 'October 26, 2026'

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
          {/* The top of the policy is on screen at load, so it fades in with
              CSS (no waiting on hydration); the rest fades up on scroll. */}
          <FadeIn>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-50">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-slate-450">Last updated: {UPDATED}</p>
          </FadeIn>

          <div className="mt-10 space-y-8 leading-relaxed text-[0.95rem]">
            <FadeIn delay={0.05} className="space-y-8">
              <p>
                This Privacy Policy explains how{' '}
                <strong className="text-slate-100">n8builds.dev</strong> (&ldquo;n8builds,&rdquo;
                operated by Nathan Watkins) collects, uses, and protects your information when you
                visit the site or get in touch.
              </p>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-100">Information I collect</h2>
                <ul className="list-disc pl-5 space-y-2 marker:text-cyan-400/60">
                  <li>
                    <span className="text-slate-100">Contact form.</span> When you submit the
                    contact form, I collect your name, email address, and message so I can reply.
                  </li>
                  <li>
                    <span className="text-slate-100">Usage analytics.</span> With your permission
                    where the law requires it, I use Google Analytics to understand how the site is
                    used (pages viewed, device type, approximate location). I look at it in
                    aggregate and don&rsquo;t use it to identify you. The site shows no ads, and
                    Google&rsquo;s advertising features are switched off (see{' '}
                    <a href="#cookies" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                      Cookies and your choices
                    </a>
                    ).
                  </li>
                  <li>
                    <span className="text-slate-100">Bot protection.</span> The contact form is
                    protected by Cloudflare Turnstile, which collects limited device and interaction
                    signals to confirm you are a human and to block automated abuse.
                  </li>
                  <li>
                    <span className="text-slate-100">Error monitoring.</span> To catch and fix bugs,
                    the site uses Sentry. When an error occurs it may capture technical details
                    along with your IP address, browser and device information, and a recording
                    (&ldquo;session replay&rdquo;) of that browsing session. Replays mask text and
                    form inputs by default.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-100">How I use it</h2>
                <p>
                  I use this information to respond to your inquiries, understand and improve the
                  site, and protect it from spam and abuse. I do not sell your personal information.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-100">Third-party services</h2>
                <ul className="list-disc pl-5 space-y-2 marker:text-cyan-400/60">
                  <li>
                    <span className="text-slate-100">Cloudflare Turnstile.</span> This site uses
                    Cloudflare Turnstile to protect against spam and abuse. Turnstile may collect
                    information about your device and behavior to verify that you are human. Your
                    use of Turnstile is governed by Cloudflare&rsquo;s Privacy Policy and the{' '}
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
                    <span className="text-slate-100">Google Analytics.</span> Usage data is
                    processed by Google under the{' '}
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
                    <span className="text-slate-100">Sentry.</span> Error and performance monitoring
                    is processed by Sentry under the{' '}
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
                    <span className="text-slate-100">Email.</span> Contact-form submissions are
                    delivered to me by email so I can respond directly.
                  </li>
                  <li>
                    <span className="text-slate-100">Hosting.</span> The site is hosted on Vercel,
                    which may process basic request logs to serve and secure the site.
                  </li>
                </ul>
              </section>
            </FadeIn>

            <Reveal>
              <section id="cookies" className="scroll-mt-24 space-y-3">
                <h2 className="text-xl font-bold text-slate-100">Cookies and your choices</h2>
                <p>
                  The only cookies this site sets itself are Google Analytics cookies (named{' '}
                  <code className="font-mono text-[0.85em] text-slate-200">_ga</code> and{' '}
                  <code className="font-mono text-[0.85em] text-slate-200">_ga_&lt;id&gt;</code>), which tell
                  repeat visits apart and last up to two years. Whether they are set depends on where you are:
                </p>
                <ul className="list-disc pl-5 space-y-2 marker:text-cyan-400/60">
                  <li>
                    <span className="text-slate-100">In the EEA, the UK and Switzerland</span>, analytics is off
                    until you say yes. If your browser&rsquo;s time zone is in Europe, a banner asks you first,
                    and Google Analytics isn&rsquo;t loaded at all until you accept; if you decline, it never
                    loads. As a backstop, Google&rsquo;s Consent Mode also treats visits from these countries as
                    &ldquo;no analytics cookies&rdquo; unless you have accepted, so if your time zone says
                    otherwise, Google may receive basic, cookieless signals about the visit (such as the page and
                    time) without any cookie or identifier being stored.
                  </li>
                  <li>
                    <span className="text-slate-100">Everywhere else</span>, analytics is on by default, and you
                    can turn it off at any time.
                  </li>
                </ul>
                <p>
                  Your choice is saved in your browser&rsquo;s local storage (
                  <code className="font-mono text-[0.85em] text-slate-200">{CONSENT_STORAGE_KEY}</code>), not
                  in a cookie, and never leaves your device. To change it, use{' '}
                  <CookieSettingsButton className="cursor-pointer text-cyan-400 hover:text-cyan-300 underline underline-offset-2" />{' '}
                  (also in the footer of every page). Declining removes the Google Analytics cookies already
                  set. Advertising signals are always off. You can also block or delete cookies in your
                  browser settings or with an extension without affecting the rest of the site.
                </p>
              </section>
            </Reveal>

            <Reveal>
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-100">Live streams</h2>
                <p>
                  While I&rsquo;m streaming, a small player in the corner of the page shows the
                  stream from Twitch or YouTube. Those players are loaded from Twitch and YouTube
                  only while I&rsquo;m live, and they may set their own cookies and collect viewing
                  data under the{' '}
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
                  . YouTube streams use YouTube&rsquo;s privacy-enhanced (no-cookie) player. X
                  streams are only linked, never embedded. Closing or minimizing the player is
                  remembered in your browser&rsquo;s local storage, which never leaves your device.
                </p>
              </section>
            </Reveal>

            <Reveal>
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-100">
                  Data retention &amp; your choices
                </h2>
                <p>
                  I keep contact-form submissions only as long as needed to respond and maintain our
                  correspondence. To request access to or deletion of your information, email me at{' '}
                  <a
                    href="mailto:contact@n8builds.dev"
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                  >
                    contact@n8builds.dev
                  </a>
                  .
                </p>
              </section>
            </Reveal>

            <Reveal>
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-100">Contact</h2>
                <p>
                  Questions about this policy? Reach me at{' '}
                  <a
                    href="mailto:contact@n8builds.dev"
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                  >
                    contact@n8builds.dev
                  </a>
                  .
                </p>
              </section>
            </Reveal>
          </div>
        </div>
      </main>
    </>
  )
}
