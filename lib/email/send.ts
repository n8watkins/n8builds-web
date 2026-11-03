import { getCloudflareContext } from '@opennextjs/cloudflare'
import { EMAIL_CONFIG } from '@/lib/email/config'
import { EMAIL_ICONS } from '@/lib/email/icons'
import { isContactTestMode } from '@/lib/security/testMode'
import { logger } from '@/lib/logger'

/**
 * Every email the site sends (contact notifications and auto-replies, quote
 * requests, waitlist links) goes through Cloudflare Email Service's Workers
 * binding (`send_email` in wrangler.jsonc), from contact@n8builds.dev.
 * The domain is onboarded for sending, so Cloudflare signs the mail (DKIM)
 * and no API key is involved.
 */

export type EmailImage = keyof typeof EMAIL_ICONS

export interface Email {
  to: string
  replyTo: string
  subject: string
  html: string
  text: string
  /** Icons sent as inline attachments, referenced in the HTML as `cid:icon-<name>`. */
  images: EmailImage[]
}

/** The part of the `send_email` binding this file uses. */
interface EmailBinding {
  send(message: {
    to: string
    from: { email: string; name: string }
    replyTo: string
    subject: string
    html: string
    text: string
    attachments: {
      content: ArrayBuffer
      filename: string
      type: string
      disposition: 'inline'
      contentId: string
    }[]
  }): Promise<{ messageId: string }>
}

function binding(): EmailBinding {
  let email: EmailBinding | undefined
  try {
    email = getCloudflareContext().env.EMAIL as EmailBinding | undefined
  } catch {
    // Not running on Workers (next dev, next start).
  }
  if (!email) {
    throw new Error('The EMAIL binding is missing: email sends only on Cloudflare (or set CONTACT_TEST_MODE=1)')
  }
  return email
}

function icon(name: EmailImage) {
  const bytes = Uint8Array.from(atob(EMAIL_ICONS[name]), (c) => c.charCodeAt(0))
  return {
    content: bytes.buffer,
    filename: `${name}.png`,
    type: 'image/png',
    disposition: 'inline' as const,
    contentId: `icon-${name}`,
  }
}

/** Sends one email and returns its message ID; throws when it can't be sent. */
export async function sendEmail(email: Email): Promise<string> {
  // Test runs send nothing.
  if (isContactTestMode()) return `test-${crypto.randomUUID()}`

  const { messageId } = await binding().send({
    to: email.to,
    from: { email: EMAIL_CONFIG.from, name: EMAIL_CONFIG.fromName },
    replyTo: email.replyTo,
    subject: email.subject,
    html: email.html,
    text: email.text,
    attachments: email.images.map(icon),
  })
  logger.info('   Message ID:', messageId)
  return messageId
}
