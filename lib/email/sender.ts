import { getTransporter, EMAIL_CONFIG } from '@/lib/email/smtp'
import {
  autoReplySubject,
  contactEmailSubject,
  createAutoReplyHtml,
  createAutoReplyText,
  createContactEmailHtml,
  createContactEmailText,
} from '@/lib/email/templates'
import { EMAIL_ICONS } from '@/lib/email/icons'
import type { ContactFormData } from '@/lib/validations/contact'
import { logger } from '@/lib/logger'

/**
 * The emails' images ride along as inline CID attachments, so they render
 * without depending on the deployed site or on remote-image loading.
 */
function inlineImages(names: (keyof typeof EMAIL_ICONS)[]) {
  return names.map((name) => ({
    filename: `${name}.png`,
    content: Buffer.from(EMAIL_ICONS[name], 'base64'),
    contentType: 'image/png',
    cid: `icon-${name}`,
    contentDisposition: 'inline' as const,
  }))
}

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
  { autoReply = true }: { autoReply?: boolean } = {}
): Promise<EmailResult> {
  try {
    const transporter = getTransporter()

    const receivedAt = new Date()

    // ========================================
    // STEP 1: Send notification email to site owner
    // ========================================
    logger.info('📧 Sending notification email')
    logger.info('   From:', EMAIL_CONFIG.from)
    logger.info('   To:', EMAIL_CONFIG.to)

    const notificationResult = await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.to,
      replyTo: data.email,
      subject: contactEmailSubject(data),
      html: createContactEmailHtml(data, { autoReply, receivedAt }),
      text: createContactEmailText(data, { autoReply, receivedAt }),
      attachments: inlineImages(['logo']),
    })

    logger.info('✅ Notification email sent successfully')
    logger.info('   Message ID:', notificationResult.messageId)

    if (!autoReply) {
      return { success: true, notificationId: notificationResult.messageId }
    }

    // ========================================
    // STEP 2: Send auto-reply email to submitter
    // ========================================
    logger.info('📧 Sending auto-reply email')
    logger.info('   From:', EMAIL_CONFIG.from)
    logger.info('   To:', data.email)

    const autoReplyResult = await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: data.email,
      replyTo: EMAIL_CONFIG.contactEmail,
      subject: autoReplySubject(data),
      html: createAutoReplyHtml(data),
      text: createAutoReplyText(data),
      attachments: inlineImages(['logo', 'github', 'linkedin', 'x']),
    })

    logger.info('✅ Auto-reply email sent successfully')
    logger.info('   Message ID:', autoReplyResult.messageId)

    return {
      success: true,
      notificationId: notificationResult.messageId,
      autoReplyId: autoReplyResult.messageId,
    }
  } catch (error) {
    logger.error('❌ Email sending error:', error)
    return {
      success: false,
      error: 'Failed to send email. Please try again later.',
    }
  }
}
