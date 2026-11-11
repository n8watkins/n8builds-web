import { EMAIL_CONFIG } from '@/lib/email/config'
import { sendEmail } from '@/lib/email/send'
import {
  autoReplySubject,
  contactEmailSubject,
  createAutoReplyHtml,
  createAutoReplyText,
  createContactEmailHtml,
  createContactEmailText,
} from '@/lib/email/templates'
import type { ContactFormData } from '@/lib/validations/contact'
import { logger } from '@/lib/logger'

/**
 * Email sending result
 */
export interface EmailResult {
  success: boolean
  notificationId?: string
  autoReplyId?: string
  error?: string
}

/**
 * Send contact form notification and auto-reply emails
 * Handles both notification (to site owner) and auto-reply (to submitter)
 *
 * @param data - Validated contact form data
 * @param options.autoReply - false sends only the owner notification (the
 *   recipient has already had an auto-reply today)
 * @param options.country - the sender's ISO country code from Cloudflare's
 *   request geolocation, shown in the owner notification only (never the IP)
 * @returns EmailResult with success status and email IDs or error message
 *
 * @example
 * ```ts
 * const result = await sendContactEmails(validatedData)
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: 500 })
 * }
 * ```
 */
export async function sendContactEmails(
  data: ContactFormData,
  { autoReply = true, country }: { autoReply?: boolean; country?: string } = {}
): Promise<EmailResult> {
  try {
    const receivedAt = new Date()

    // ========================================
    // STEP 1: Send notification email to site owner
    // ========================================
    logger.info('📧 Sending notification email')
    logger.info('   From:', EMAIL_CONFIG.from)
    logger.info('   To:', EMAIL_CONFIG.to)

    // The emails' images ride along as inline CID attachments, so they render
    // without depending on the deployed site or on remote-image loading.
    const notificationId = await sendEmail({
      kind: 'contact-notice',
      to: EMAIL_CONFIG.to,
      replyTo: data.email,
      subject: contactEmailSubject(data),
      html: createContactEmailHtml(data, { autoReply, receivedAt, country }),
      text: createContactEmailText(data, { autoReply, receivedAt, country }),
      images: ['logo'],
    })

    logger.info('✅ Notification email sent successfully')

    if (!autoReply) {
      return { success: true, notificationId }
    }

    // ========================================
    // STEP 2: Send auto-reply email to submitter
    // ========================================
    logger.info('📧 Sending auto-reply email')
    logger.info('   From:', EMAIL_CONFIG.from)
    logger.info('   To:', data.email)

    const autoReplyId = await sendEmail({
      kind: 'contact-reply',
      to: data.email,
      replyTo: EMAIL_CONFIG.contactEmail,
      subject: autoReplySubject(data),
      html: createAutoReplyHtml(data),
      text: createAutoReplyText(data),
      images: ['logo', 'lab', 'portfolio', 'techforpros', 'github', 'linkedin', 'x'],
    })

    logger.info('✅ Auto-reply email sent successfully')

    return { success: true, notificationId, autoReplyId }
  } catch (error) {
    logger.error('❌ Email sending error:', error)
    return {
      success: false,
      error: 'Failed to send email. Please try again later.',
    }
  }
}
