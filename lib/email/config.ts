import { LINKEDIN_URL } from '@/lib/links'
// Public-facing address shown in emails and used as the From identity. It
// sends through Cloudflare Email Service (lib/email/send.ts), which signs mail
// for n8builds.dev; receiving needs the Cloudflare Email Routing rule
// contact@ → Gmail.
const publicEmail = process.env.CONTACT_EMAIL_FROM || 'contact@n8builds.dev'

export const EMAIL_CONFIG = {
  // IMPORTANT: notifications must go straight to the Gmail inbox, NOT to
  // contact@n8builds.dev - that address forwards back to this same Gmail
  // account, and Gmail dedupes mail it already has in Sent, so submissions
  // would never surface in the inbox.
  to: process.env.CONTACT_EMAIL_TO || 'nathancwatkins23@gmail.com',
  fromName: 'Nathan Watkins',
  from: publicEmail,
  siteUrl: process.env.SITE_URL || 'https://n8builds.dev',
  siteDomain: process.env.SITE_DOMAIN || 'n8builds.dev',
  linkedinUrl: process.env.LINKEDIN_URL || LINKEDIN_URL,
  githubUrl: process.env.GITHUB_URL || 'https://github.com/n8watkins',
  xUrl: process.env.X_URL || 'https://x.com/n8watkins',
  calUrl: process.env.CAL_URL || 'https://cal.com/n8watkins/intro',
  contactEmail: publicEmail,
} as const
