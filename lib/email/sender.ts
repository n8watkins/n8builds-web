import { getTransporter, EMAIL_CONFIG } from '@/lib/email/smtp'
import { createContactEmailHtml, createAutoReplyHtml, getSubjectSpecificLine } from '@/lib/email/templates'
import { EMAIL_ICONS } from '@/lib/email/icons'
import { subjectOptions, type ContactFormData } from '@/lib/validations/contact'
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
export async function sendContactEmails(data: ContactFormData): Promise<EmailResult> {
  try {
    const transporter = getTransporter()

    // Get subject label for display
    const subjectLabel =
      subjectOptions.find((opt) => opt.value === data.subject)?.label || data.subject

    // ========================================
    // STEP 1: Send notification email to site owner
    // ========================================
    logger.info('📧 Sending notification email')
    logger.info('   From:', EMAIL_CONFIG.from)
    logger.info('   To:', EMAIL_CONFIG.to)

    const contactEmailHtml = createContactEmailHtml(data)

    const notificationResult = await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.to,
      replyTo: data.email,
      subject: `${subjectLabel} — ${data.name}`,
      html: contactEmailHtml,
      text: `
New contact form submission:

From: ${data.name} (${data.email})
Subject: ${subjectLabel}

Message:
${data.message}

---
Sent from your portfolio contact form at ${new Date().toLocaleString()}
      `.trim(),
    })

    logger.info('✅ Notification email sent successfully')
    logger.info('   Message ID:', notificationResult.messageId)

    // ========================================
    // STEP 2: Send auto-reply email to submitter
    // ========================================
    logger.info('📧 Sending auto-reply email')
    logger.info('   From:', EMAIL_CONFIG.from)
    logger.info('   To:', data.email)

    const autoReplyHtml = createAutoReplyHtml(data)

    const autoReplyResult = await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: data.email,
      replyTo: EMAIL_CONFIG.contactEmail,
      subject: '👋 Got your message',
      html: autoReplyHtml,
      // Signature icons ride along as inline images so they render without
      // depending on the deployed site or on remote-image loading.
      attachments: (['linkedin', 'github', 'x'] as const).map(name => ({
        filename: `${name}.png`,
        content: Buffer.from(EMAIL_ICONS[name], 'base64'),
        contentType: 'image/png',
        cid: `icon-${name}`,
        contentDisposition: 'inline' as const,
      })),
      text: `
Hey ${data.name},

Appreciate you reaching out — I normally reply within 24 hours. Excited to hear more.

${getSubjectSpecificLine(data.subject).text}

Looking forward to connecting!

– Nathan "n8" Watkins
Full Stack AI Developer
${EMAIL_CONFIG.contactEmail}
${EMAIL_CONFIG.appturnityUrl} · ${EMAIL_CONFIG.siteUrl}
LinkedIn: ${EMAIL_CONFIG.linkedinUrl}
GitHub: ${EMAIL_CONFIG.githubUrl}
X: ${EMAIL_CONFIG.xUrl}
      `.trim(),
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
