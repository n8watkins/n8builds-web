import { FaXTwitter } from 'react-icons/fa6'
import Image from 'next/image'
import ContactForm from '@/components/ContactForm'
import { ContactFormErrorBoundary } from '@/components/ContactFormErrorBoundary'
import { FiGithub, FiMail } from 'react-icons/fi'
import { CiLinkedin } from 'react-icons/ci'
import Reveal from '@/components/ui/Reveal'

const Footer = () => {
  return (
    <div className="mx-auto xl:max-w-5xl pt-0 pb-12">
      {/* Background grid */}
      <div className="w-full absolute left-0 1sm:-translate-y-52 -bottom-72 min-h-96 pointer-events-none">
        <Image
          src="/footer-grid.svg"
          alt=""
          className="w-full h-full opacity-50 z-10 pointer-events-none"
          fill
          sizes="100vw"
        />
      </div>

      <div className="flex flex-col items-center pt-14">
        {/* Contact card - branded panel + form, with decorative artifacts.
            The site's scroll reveal; under reduced motion it simply shows. */}
        <Reveal className="w-full max-w-5xl mx-auto mb-12 sm:px-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#08152a] via-[#0a1a33] to-[#07101f] shadow-2xl">
            {/* decorative glows + grid */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
              <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[38px_38px] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]" />
            </div>
            {/* top accent line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-cyan-400 via-blue-500 to-cyan-400" />

            <div className="relative grid gap-8 p-5 sm:p-7 md:grid-cols-[0.9fr_1.1fr] md:p-10">
              {/* Left - branded panel */}
              <div className="flex flex-col gap-5">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/4 px-3 py-1 text-xs font-semibold text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" /> Building in public
                </span>

                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0">
                    <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-cyan-500/30 to-blue-600/30 blur-lg" />
                    <Image
                      src="/hero/portrait.jpg"
                      alt="Nathan Watkins"
                      fill
                      sizes="64px"
                      className="relative rounded-2xl object-cover ring-1 ring-white/15"
                    />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-50">Nathan &quot;n8&quot; Watkins</p>
                    <p className="font-mono text-xs text-cyan-400">building software in public</p>
                  </div>
                </div>

                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-50">
                  Want to work together or{' '}
                  <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    follow the build?
                  </span>
                </h2>
                <p className="text-[#9cadc5] leading-relaxed">
                  Drop a message or connect on socials; I usually reply within a day. Run a local
                  service business?{' '}
                  <a
                    href="https://appturnity.com/#free-website"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline decoration-cyan-400/40 underline-offset-2 transition-colors hover:text-cyan-300 hover:decoration-cyan-300"
                  >
                    Appturnity will build you a free website
                  </a>
                  .
                </p>

                {/* socials */}
                <div className="mt-auto flex items-center gap-2">
                  {[
                    { href: 'https://github.com/n8watkins', label: 'GitHub', icon: <FiGithub className="w-4.5 h-4.5" /> },
                    { href: 'https://x.com/n8watkins', label: 'X (Twitter)', icon: <FaXTwitter className="w-4 h-4" /> },
                    { href: 'https://www.linkedin.com/in/n8watkins/', label: 'LinkedIn', icon: <CiLinkedin className="w-[1.35rem] h-[1.35rem]" /> },
                    { href: 'mailto:contact@n8builds.dev', label: 'Email', icon: <FiMail className="w-4.5 h-4.5" /> },
                  ].map(s => (
                    <a
                      key={s.label}
                      href={s.href}
                      target={s.href.startsWith('http') ? '_blank' : undefined}
                      rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      aria-label={s.label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-slate-400 transition-all duration-200 hover:scale-[1.05] hover:border-cyan-400/30 hover:text-cyan-300"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Right - form */}
              <div className="relative rounded-2xl border border-white/10 bg-[#050c18]/60 p-4 backdrop-blur-xs sm:p-6">
                <ContactFormErrorBoundary>
                  <ContactForm />
                </ContactFormErrorBoundary>
                <div className="mt-3 flex items-center gap-1 text-xs text-slate-450 select-none">
                  <span>🛡️</span>
                  <span>Protected by Cloudflare Turnstile</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

      </div>

    </div>
  )
}

export default Footer
