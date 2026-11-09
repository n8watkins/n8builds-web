import Link from 'next/link'
import type { ReactNode } from 'react'
import Navbar from '@/components/layout/Navbar'
import { pageMetadata } from '@/lib/seo'
import FadeIn from '@/components/ui/FadeIn'

export const metadata = pageMetadata({
  title: 'TL;DW Privacy Policy | n8builds',
  description:
    'What the TL;DW Chrome extension sends where, what it keeps on your device, and what it never does.',
  path: '/privacy/tldw',
})

// The source of this policy is PRIVACY.md in github.com/n8watkins/tl-dw; keep
// the two in step (this is the URL the Chrome Web Store listing links to).
const UPDATED = 'November 9, 2026'
const VERSION = '1.2.0'

const link = 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
const code = 'font-mono text-[0.85em] text-slate-200'

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
      {children}
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

export default function TldwPrivacyPolicy() {
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
              <Link href="/builds/tldw" className="hover:text-cyan-300">
                TL;DW
              </Link>{' '}
              · Chrome extension
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-50">
              TL;DW Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-slate-450">
              Last updated: {UPDATED} (extension v{VERSION})
            </p>
          </FadeIn>

          <FadeIn delay={0.05} className="mt-10 space-y-8 leading-relaxed text-[0.95rem]">
            <div className="space-y-3">
              <p>TL;DW summarizes YouTube videos.</p>
              <p>
                It has no developer backend, no accounts, no shared API key, and no analytics,
                tracking or telemetry. Nothing TL;DW handles is ever sent to the developer. Its data
                stays in Chrome&rsquo;s extension storage on your device, except for what it sends
                to the services described below when you use them.
              </p>
            </div>

            <Section title="Without a Gemini API key (the default)">
              <List>
                <li>
                  TL;DW opens the AI site you chose (Gemini by default, or ChatGPT, Claude or
                  NotebookLM) in a tab, under the account you are signed in with there.
                </li>
                <li>
                  It types a prompt into that site&rsquo;s message box: your prompt profile&rsquo;s
                  instructions, the video&rsquo;s title, channel and link, any question you typed,
                  and the video&rsquo;s transcript when it fits the site&rsquo;s message box.
                </li>
                <li>
                  When the transcript is too long for the site&rsquo;s message box, TL;DW sends its
                  start and end with the middle marked as left out, and the summary is labeled so.
                  The Gemini web app gets this right away; for ChatGPT and Claude, TL;DW asks you on
                  the page first and sends only what you choose.
                </li>
                <li>
                  When there is no transcript, the Gemini web app gets the video&rsquo;s link
                  instead. Without your API key Gemini does not watch the video: it can only look up
                  public information about it, and the summary is labeled so.
                </li>
                <li>
                  If you are signed in to Gemini, TL;DW checks the Gemini page for your account
                  button (it reads nothing else about the account) and, for a long video or one
                  whose transcript it couldn&rsquo;t read, sends the video&rsquo;s link and asks
                  Gemini to read the captions through YouTube instead of a shortened transcript.
                </li>
                <li>NotebookLM gets the video&rsquo;s link as a source.</li>
                <li>
                  TL;DW then reads the site&rsquo;s answer in that tab to show the summary on the
                  YouTube page.
                </li>
                <li>That site&rsquo;s own terms and privacy policy apply to what it receives.</li>
              </List>
            </Section>

            <Section title="With your own Gemini API key (Direct API)">
              <List>
                <li>
                  TL;DW sends the prompt and the video&rsquo;s full transcript to Google&rsquo;s
                  Gemini API (<code className={code}>generativelanguage.googleapis.com</code>).
                </li>
                <li>
                  When a video has no transcript, it sends the video&rsquo;s YouTube link instead,
                  and Gemini watches the video (public videos only).
                </li>
                <li>
                  Your key is sent only to that API, in the{' '}
                  <code className={code}>x-goog-api-key</code> request header; never in a URL, and
                  never to the developer.
                </li>
                <li>
                  Checking a newly saved key reads the chosen model&rsquo;s details from the API; it
                  does not send a prompt.
                </li>
                <li>
                  Google&rsquo;s <Ext href="https://aistudio.google.com/docs/terms">Gemini API terms</Ext>{' '}
                  apply. On the free tier (&ldquo;Unpaid Services&rdquo;), Google may use what you
                  send and the responses to provide, improve and develop its products, and human
                  reviewers may read them. Do not use the free tier for anything sensitive. On a
                  paid tier, Google does not use your prompts or responses to improve its products.
                </li>
              </List>
            </Section>

            <Section title="SponsorBlock (off unless you turn it on)">
              <List>
                <li>
                  When you turn on &ldquo;Auto-skip sponsored segments&rdquo; in Settings, Chrome
                  asks you to allow <code className={code}>sponsor.ajay.app</code>.
                </li>
                <li>
                  From then on, TL;DW sends the ID of each YouTube video you open, and nothing else,
                  to the public <Ext href="https://sponsor.ajay.app">SponsorBlock</Ext> API to look
                  up community-reported sponsor segments.
                </li>
                <li>Turning it off stops these requests.</li>
              </List>
            </Section>

            <Section title="Data stored on your device">
              <p>
                TL;DW stores the following in <code className={code}>chrome.storage.local</code>,
                on your device only:
              </p>
              <List>
                <li>Settings, prompt profiles and tags.</li>
                <li>
                  Your Gemini API key, if you add one, with its name and whether it was verified.
                  The key stays in this storage; anyone with access to your Chrome profile could
                  read it, so you can delete it in TL;DW at any time and revoke it in Google AI
                  Studio.
                </li>
                <li>
                  Summary history: the video&rsquo;s link, title and channel, the link to the
                  channel&rsquo;s picture, the prompt profile, a prompt without the transcript, and
                  the time. History is deleted after 30 days by default (configurable).
                </li>
                <li>A cache of parsed summaries, kept for seven days and capped at 300 entries.</li>
                <li>Summary, cache-hit and SponsorBlock counters, and per-day summary activity.</li>
                <li>
                  Direct API usage counters and a call log of video link, title, time, profile,
                  outcome and error category. The full prompt (which includes the transcript TL;DW
                  sent) and Gemini&rsquo;s response are kept only if you turn on full call logging,
                  which is off by default; the log keeps the last 200 calls, and you can clear it in
                  TL;DW&rsquo;s Direct API settings.
                </li>
              </List>
              <p>
                Short-lived hand-off state is kept in{' '}
                <code className={code}>chrome.storage.session</code>, which Chrome holds in memory
                and clears when it closes: the open destination tabs, and the prompt waiting for a
                destination tab. That prompt can include the transcript; TL;DW deletes it once the
                destination has it, and ignores one older than 10 minutes. Apart from those two
                cases, TL;DW does not store a video&rsquo;s transcript. TL;DW never downloads or
                stores a video&rsquo;s audio, video or images.
              </p>
              <p>Uninstalling TL;DW removes all of its storage from your Chrome profile.</p>
            </Section>

            <Section title="What TL;DW does not do">
              <List>
                <li>It does not collect watch time, engagement or ratings.</li>
                <li>
                  It does not sell data, or use it for advertising, profiling, creditworthiness or
                  lending.
                </li>
                <li>It runs no server that receives your data.</li>
                <li>
                  The example summary (&ldquo;See an example summary&rdquo; on the welcome page and
                  in the popup) ships inside TL;DW and sends nothing.
                </li>
              </List>
            </Section>

            <Section title="Chrome Web Store User Data Policy">
              <p>
                TL;DW&rsquo;s use of the information it handles complies with the{' '}
                <Ext href="https://developer.chrome.com/docs/webstore/program-policies/">
                  Chrome Web Store User Data Policy
                </Ext>
                , including its Limited Use requirements. It uses that information only to summarize
                the video you ask about and to show you your own history and settings, transfers it
                only to the AI service you choose (and SponsorBlock, if you turn it on) to do that,
                and never sends it to the developer.
              </p>
            </Section>

            <Section title="Permissions">
              <List>
                <li>
                  <code className={code}>storage</code>: settings, profiles, history, the summary
                  cache, usage counters, the call log and hand-off state.
                </li>
                <li>
                  <code className={code}>contextMenus</code>: the &ldquo;Send to … with…&rdquo;
                  right-click menu on YouTube.
                </li>
                <li>
                  <code className={code}>clipboardWrite</code>: copying a prompt when you ask, or
                  when a site&rsquo;s message box can&rsquo;t be filled.
                </li>
                <li>
                  <code className={code}>scripting</code>: adding TL;DW&rsquo;s prompt filler to
                  ChatGPT, Claude or NotebookLM after you allow that site.
                </li>
                <li>
                  <code className={code}>youtube.com</code>: reading the video&rsquo;s transcript and
                  details, and showing the summary panel.
                </li>
                <li>
                  <code className={code}>gemini.google.com</code>: filling the prompt in the Gemini
                  tab and reading its answer.
                </li>
                <li>
                  <code className={code}>generativelanguage.googleapis.com</code>: the Gemini API,
                  used only with your own key.
                </li>
                <li>
                  Optional, asked for only when you pick them:{' '}
                  <code className={code}>chatgpt.com</code>, <code className={code}>claude.ai</code>{' '}
                  and <code className={code}>notebooklm.google.com</code> (to fill the prompt there
                  and read the answer), and <code className={code}>sponsor.ajay.app</code>{' '}
                  (SponsorBlock). You can remove them any time in Chrome&rsquo;s settings for TL;DW.
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
                <Ext href="https://github.com/n8watkins/tl-dw/issues">github.com/n8watkins/tl-dw/issues</Ext>.
              </p>
            </Section>

            <Section title="Changes">
              <p>
                Material changes to this policy will be published here with a new date. The same
                policy is kept in the extension&rsquo;s repository as{' '}
                <Ext href="https://github.com/n8watkins/tl-dw/blob/master/PRIVACY.md">PRIVACY.md</Ext>
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
