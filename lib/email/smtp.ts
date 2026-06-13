import nodemailer, { type Transporter } from 'nodemailer'

// Public-facing address shown in emails and used as the From identity.
// Gmail SMTP only honors this From if it's registered as a "Send mail as"
// alias on the GMAIL_USER account (Gmail rewrites it to GMAIL_USER otherwise);
// receiving requires the Cloudflare Email Routing rule contact@ → Gmail.
const publicEmail = process.env.CONTACT_EMAIL_FROM || 'contact@n8builds.dev'

export const EMAIL_CONFIG = {
  // IMPORTANT: notifications must go straight to the Gmail inbox, NOT to
  // contact@n8builds.dev — that address forwards back to this same Gmail
  // account, and Gmail dedupes mail it already has in Sent, so submissions
  // would never surface in the inbox.
  to: process.env.CONTACT_EMAIL_TO || 'nathancwatkins23@gmail.com',
  from: `Nathan Watkins <${publicEmail}>`,
  siteUrl: process.env.SITE_URL || 'https://n8builds.dev',
  siteDomain: process.env.SITE_DOMAIN || 'n8builds.dev',
  linkedinUrl: process.env.LINKEDIN_URL || 'https://www.linkedin.com/in/n8watkins/',
  githubUrl: process.env.GITHUB_URL || 'https://github.com/n8watkins',
  xUrl: process.env.X_URL || 'https://x.com/n8watkins',
  appturnityUrl: process.env.APPTURNITY_URL || 'https://appturnity.com',
  calUrl: process.env.CAL_URL || 'https://cal.com/n8watkins/intro',
  contactEmail: publicEmail,
} as const

let transporter: Transporter | null = null

/**
 * Lazily create the Gmail SMTP transport so importing this module (e.g.
 * during `next build`) doesn't require credentials — only sending does.
 * Auth uses a Gmail app password (myaccount.google.com/apppasswords).
 */
export function getTransporter(): Transporter {
  if (!transporter) {
    const user = process.env.GMAIL_USER
    const pass = process.env.GMAIL_APP_PASSWORD

    if (!user || !pass) {
      throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set in environment variables')
    }

    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    })
  }

  return transporter
}
