import { EMAIL_CONFIG } from '@/lib/email/config'
import { sendEmail } from '@/lib/email/send'
import type { EmailResult } from '@/lib/email/sender'
import { C, FONT, MONO, brandBar, button, countryFor, pacificTime, pill, sanitizeHtml, shell } from '@/lib/email/templates'
import { logger } from '@/lib/logger'

/**
 * A Tech for Pros quote request (round 5 of 2026-11-02): the Work with me
 * card's email field. One email, to the owner only, tagged as a Tech for Pros
 * quote with the visitor's address (reply goes straight to them); nothing is
 * stored, and the visitor gets no auto-reply, so the field can't be used to
 * send mail to anyone else. In the contact emails' style; it moves to
 * techforpros.com once that site has its own form.
 */

export const quoteSubject = (email: string) => `🔧 Tech for Pros quote: ${email}`

type QuoteOptions = { receivedAt?: Date; country?: string }

export function createQuoteEmailHtml(email: string, { receivedAt = new Date(), country }: QuoteOptions = {}): string {
  const address = sanitizeHtml(email)
  const place = countryFor(country)
  const reply = new URLSearchParams({ subject: 'Your Tech for Pros quote', body: 'Hi,\n\nThanks for asking about a quote from Tech for Pros. ' })
  const replyHref = `mailto:${address}?${sanitizeHtml(reply.toString().replace(/\+/g, '%20'))}`
  const row = (label: string, value: string) => `
                <tr>
                  <td class="meta-label" valign="top" style="width:96px;padding:0 12px 10px 0;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.faint};">${label}</td>
                  <td valign="top" style="padding:0 0 10px;font-family:${FONT};font-size:15px;color:${C.text};">${value}</td>
                </tr>`
  const body = `${brandBar('Tech for Pros')}
          <tr>
            <td style="border:1px solid ${C.line};border-top:3px solid ${C.cyan};border-radius:16px;background:${C.card};" bgcolor="${C.card}">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="px" style="padding:30px 36px 8px;">
                    ${pill('🔧&nbsp; Tech for Pros quote')}
                    <h1 class="h1" style="margin:16px 0 6px;font-family:${FONT};font-size:28px;line-height:34px;font-weight:800;color:${C.white};letter-spacing:-0.5px;">A quote request</h1>
                    <p style="margin:0;font-family:${FONT};font-size:14px;color:${C.muted};">${pacificTime(receivedAt)}</p>
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:22px 36px 6px;">
                    <table role="presentation" class="stack" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${row('Email', `<a href="mailto:${address}" style="color:${C.cyan};text-decoration:none;">${address}</a>`)}
                      ${row('Asked for', 'A Tech for Pros quote')}
                      ${place ? row('Country', `${place.flag} ${sanitizeHtml(place.name)}`) : ''}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:20px 36px 32px;">
              ${button(replyHref, 'Reply with a quote &rarr;')}
                    <p style="margin:14px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};">Or just hit reply: it goes straight to ${address}.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 8px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${C.faint};">
              No auto-reply was sent.<br>
              From the Tech for Pros card on <a href="${EMAIL_CONFIG.siteUrl}/#now" style="color:${C.muted};text-decoration:underline;">${EMAIL_CONFIG.siteDomain}</a>
            </td>
          </tr>`
  return shell({ title: 'A Tech for Pros quote request', preheader: `🔧 Tech for Pros quote from ${address}`, body })
}

export function createQuoteEmailText(email: string, { receivedAt = new Date(), country }: QuoteOptions = {}): string {
  const place = countryFor(country)
  return [
    '🔧 Tech for Pros quote: a quote request',
    '',
    `Email:     ${email}`,
    'Asked for: A Tech for Pros quote',
    ...(place ? [`Country:   ${place.name}`] : []),
    `When:      ${pacificTime(receivedAt)}`,
    '',
    `Reply to this email to answer: it goes straight to ${email}.`,
    'No auto-reply was sent.',
    `From the Tech for Pros card on ${EMAIL_CONFIG.siteDomain}`,
  ].join('\n')
}

/** Sends the owner the quote request; the visitor's address is the reply-to. */
export async function sendQuoteEmail(email: string, { country }: { country?: string } = {}): Promise<EmailResult> {
  try {
    const receivedAt = new Date()
    const notificationId = await sendEmail({
      to: EMAIL_CONFIG.to,
      replyTo: email,
      subject: quoteSubject(email),
      html: createQuoteEmailHtml(email, { receivedAt, country }),
      text: createQuoteEmailText(email, { receivedAt, country }),
      images: ['logo'],
    })
    logger.info('✅ Quote request email sent:', notificationId)
    return { success: true, notificationId }
  } catch (error) {
    logger.error('❌ Quote request email error:', error)
    return { success: false, error: 'Failed to send email. Please try again later.' }
  }
}
