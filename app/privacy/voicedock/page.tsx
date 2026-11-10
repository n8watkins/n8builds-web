import Link from 'next/link'
import type { ReactNode } from 'react'
import Navbar from '@/components/layout/Navbar'
import { pageMetadata } from '@/lib/seo'
import FadeIn from '@/components/ui/FadeIn'

export const metadata = pageMetadata({
  title: 'VoiceDock Privacy Policy | n8builds',
  description:
    'What the VoiceDock Chrome extension reads, where the text goes, what it keeps on your device, and what it never does.',
  path: '/privacy/voicedock',
})

// The source of this policy is PRIVACY.md in github.com/n8watkins/voicedock;
// keep the two in step (this is the URL the Chrome Web Store listing links to).
const UPDATED = 'November 9, 2026'
const VERSION = '1.2.0'

const link = 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
const code = 'font-mono text-[0.85em] text-slate-200'

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-slate-100">{title}</h2>
      {children}
    </section>
  )
}

function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-5 space-y-2 marker:text-cyan-400/60">{children}</ul>
}

export default function VoiceDockPrivacyPolicy() {
  return (
    <>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative w-full min-h-screen bg-linear-to-b from-darkBlue via-[#06101f] to-darkBlue text-slate-300 focus:outline-none"
      >
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 pt-28 pb-24">
          <FadeIn>
            <p className="text-sm font-semibold tracking-wide text-cyan-400">
              <Link href="/builds/voicedock" className="hover:text-cyan-300">
                VoiceDock
              </Link>{' '}
              · Chrome extension
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-50">
              VoiceDock Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-slate-450">
              Last updated: {UPDATED} (extension v{VERSION})
            </p>
          </FadeIn>

          <FadeIn delay={0.05} className="mt-10 space-y-8 leading-relaxed text-[0.95rem]">
            <div className="space-y-3">
              <p>VoiceDock is a Chrome extension that reads the text you select aloud.</p>
              <p>
                It has no developer server, no accounts, no analytics, no tracking and no telemetry.
                Nothing VoiceDock handles is ever sent to the developer.
              </p>
            </div>

            <Section title="What VoiceDock reads">
              <List>
                <li>
                  <strong className="text-slate-100">The text you ask it to read.</strong> When you
                  choose &ldquo;Read selected text aloud&rdquo; in the right-click menu or press the
                  read shortcut, VoiceDock takes the text you selected on that page. The test
                  buttons and the Get started page read a fixed sample sentence instead.
                </li>
                <li>
                  <strong className="text-slate-100">Only the page you read from.</strong> VoiceDock
                  has no script on the sites you visit. When you use the right-click menu or the
                  shortcut, Chrome gives VoiceDock access to that one tab (the{' '}
                  <code className={code}>activeTab</code> permission), and VoiceDock adds a small
                  script to it. That script reads the current selection and shows the player bar and
                  short notes such as &ldquo;Select text first&rdquo;. It does not read anything
                  else on the page, and it stops when you leave or reload the page.
                </li>
              </List>
            </Section>

            <Section title="Where the text goes">
              <p>It depends on the voice your profile uses.</p>
              <List>
                <li>
                  <strong className="text-slate-100">Piper or Kokoro (local voices).</strong> The
                  text is sent to VoiceDock&rsquo;s local server on your own computer, at{' '}
                  <code className={code}>http://127.0.0.1:7477</code>, which reads it with Piper or
                  passes it to Kokoro on the same computer.{' '}
                  <code className={code}>127.0.0.1</code> is your computer&rsquo;s loopback address:
                  the request never leaves the machine. You install and run these servers yourself;
                  they are open source, in the same repository as the extension. They turn the text
                  into audio and send it back; they keep no copy of the text and do not log it. The
                  Piper server writes each piece of audio to a temporary file in its own folder and
                  deletes it as soon as it has been sent; the Kokoro server keeps audio in memory
                  only. The servers are local web servers, not Chrome native messaging hosts, and
                  they only answer requests from Chrome extensions or from programs on your
                  computer, never from web pages.
                </li>
                <li>
                  <strong className="text-slate-100">
                    The Basic voice (Chrome&rsquo;s built-in speech).
                  </strong>{' '}
                  The text is passed to Chrome&rsquo;s own text-to-speech (
                  <code className={code}>chrome.tts</code>). VoiceDock asks Chrome for a voice that
                  runs on your device (one of your operating system&rsquo;s voices). Only when your
                  system has no on-device voice does Chrome use its default voice; in Google Chrome
                  that can be an online Google voice, in which case Chrome sends the text to Google
                  to speak it, under{' '}
                  <Ext href="https://policies.google.com/privacy">
                    Google&rsquo;s privacy policy
                  </Ext>
                  . This is the voice a new install uses, and the fallback when Piper or Kokoro
                  isn&rsquo;t running (you can turn the fallback off in Settings).
                </li>
              </List>
              <p>
                VoiceDock makes no other network requests. Its only requests go to{' '}
                <code className={code}>127.0.0.1</code> (to check whether Piper and Kokoro are
                running, list, delete and open their voices on the Voices tab, and read text), and
                it loads no remote code. Links in its pages (the setup guide, Node.js, credits) open
                only when you click them.
              </p>
            </Section>

            <Section title="Data stored on your device">
              <p>
                VoiceDock stores these settings in{' '}
                <code className={code}>chrome.storage.local</code>, on your device only:
              </p>
              <List>
                <li>
                  Your profiles: each one&rsquo;s name, voice engine, voice, speed and volume, and
                  which profile is active.
                </li>
                <li>
                  Favorite voices for Piper and Kokoro, voices you deleted, and whether to show
                  favorites only.
                </li>
                <li>Whether the Basic voice fallback is on, and a settings version number.</li>
              </List>
              <p>
                VoiceDock does not store the text you read, a reading history, or the pages you read
                from. Uninstalling VoiceDock removes all of its storage from your Chrome profile.
              </p>
            </Section>

            <Section title="What VoiceDock does not do">
              <List>
                <li>
                  It does not collect, sell or share personal data, and does not use data for
                  advertising, profiling, creditworthiness or lending.
                </li>
                <li>It does not track your browsing or run on pages you have not read from.</li>
                <li>
                  It does not send anything to the developer or to any server other than the ones
                  described above.
                </li>
              </List>
            </Section>

            <Section title="Chrome Web Store User Data Policy">
              <p>
                VoiceDock&rsquo;s use of the information it handles complies with the{' '}
                <Ext href="https://developer.chrome.com/docs/webstore/program-policies/">
                  Chrome Web Store User Data Policy
                </Ext>
                , including its Limited Use requirements. It uses the text you select only to read
                it aloud, and transfers it only to the speech engine your profile uses: a server on
                your own computer, or Chrome&rsquo;s built-in speech.
              </p>
            </Section>

            <Section title="Permissions">
              <List>
                <li>
                  <code className={code}>activeTab</code>: access to the tab you read from, only
                  after you use the right-click menu or the shortcut there.
                </li>
                <li>
                  <code className={code}>scripting</code>: adds VoiceDock&rsquo;s page script
                  (selection, player bar and notes) to that tab.
                </li>
                <li>
                  <code className={code}>contextMenus</code>: the &ldquo;Read selected text
                  aloud&rdquo;, &ldquo;Read as&hellip;&rdquo; and &ldquo;Stop reading&rdquo; menu
                  items.
                </li>
                <li>
                  <code className={code}>tts</code>: the Basic voice, Chrome&rsquo;s built-in
                  speech.
                </li>
                <li>
                  <code className={code}>offscreen</code>: a hidden extension page that plays the
                  audio Piper and Kokoro return, because an extension&rsquo;s background worker
                  can&rsquo;t play audio.
                </li>
                <li>
                  <code className={code}>storage</code>: the settings listed above.
                </li>
                <li>
                  <code className={code}>alarms</code>: a check-in with VoiceDock&rsquo;s local
                  server once a minute while Chrome runs, so it can stop the voice engines soon after
                  Chrome closes. Only sent when a profile uses Piper or Kokoro; it carries the
                  extension&rsquo;s version, which engine the active profile uses and whether it is
                  reading, never any text.
                </li>
                <li>
                  <code className={code}>http://127.0.0.1:7477/*</code>: VoiceDock&rsquo;s local
                  server on your own computer, which runs Piper and Kokoro.
                </li>
              </List>
            </Section>

            <Section title="Contact">
              <p>
                Questions or concerns: email{' '}
                <a href="mailto:contact@n8builds.dev" className={link}>
                  contact@n8builds.dev
                </a>{' '}
                or open an issue at{' '}
                <Ext href="https://github.com/n8watkins/voicedock/issues">
                  github.com/n8watkins/voicedock/issues
                </Ext>
                .
              </p>
            </Section>

            <Section title="Changes">
              <p>
                Material changes to this policy will be published here with a new date. The same
                policy is kept in the extension&rsquo;s repository as{' '}
                <Ext href="https://github.com/n8watkins/voicedock/blob/master/PRIVACY.md">
                  PRIVACY.md
                </Ext>
                . The privacy policy for this website is{' '}
                <Link href="/privacy" className={link}>
                  here
                </Link>
                .
              </p>
            </Section>
          </FadeIn>
        </div>
      </main>
    </>
  )
}
