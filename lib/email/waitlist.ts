import { UPCOMING, type UpcomingSlug } from '@/data/upcoming'
import { EMAIL_CONFIG, getTransporter } from '@/lib/email/smtp'
import { inlineImages } from '@/lib/email/sender'
import { C, FONT, MONO, brandBar, button, sanitizeHtml, shell } from '@/lib/email/templates'
import { PENDING_DAYS, type WaitlistEntry } from '@/lib/waitlist/store'

/**
 * The waitlist's two emails, in the contact emails' dark navy and cyan:
 * - the confirm email, after joining (the double opt-in), which also carries
 *   the leave link;
 * - the leave link, for someone who asks for it by address on /upcoming/leave.
 * Neither repeats the visitor's note: it would go to whatever address was
 * typed (see the auto-reply's rule in DECISIONS.md).
 */

export const confirmUrl = (token: string) => `${EMAIL_CONFIG.siteUrl}/upcoming/confirm?t=${encodeURIComponent(token)}`
export const leaveUrl = (token: string) => `${EMAIL_CONFIG.siteUrl}/upcoming/leave?t=${encodeURIComponent(token)}`

const names = (slugs: UpcomingSlug[]) => UPCOMING.filter((p) => slugs.includes(p.slug)).map((p) => p.name)

/** "Relink", "Relink and Strollz". */
export const projectList = (slugs: UpcomingSlug[]) => {
  const list = names(slugs)
  return list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list.at(-1)}` : (list[0] ?? '')
}

function card(inner: string): string {
  return `          <tr>
            <td style="border:1px solid ${C.line};border-top:3px solid ${C.cyan};border-radius:16px;background:${C.card};" bgcolor="${C.card}">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
${inner}
              </table>
            </td>
          </tr>`
}

function footnote(text: string): string {
  return `          <tr>
            <td align="center" style="padding:20px 8px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${C.faint};">${text}</td>
          </tr>`
}

const paragraph = (html: string, top = 0) =>
  `<p style="margin:${top}px 0 0;font-family:${FONT};font-size:16px;line-height:26px;color:${C.text};">${html}</p>`

const signOff = `
                <tr>
                  <td class="px" style="padding:4px 36px 34px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid ${C.line};">
                      <tr>
                        <td style="padding-top:22px;font-family:${FONT};">
                          <p style="margin:0;font-size:15px;color:${C.text};">Thanks,</p>
                          <p style="margin:6px 0 0;font-size:17px;font-weight:800;color:${C.white};">Nathan <span style="color:${C.cyan};">"n8"</span> Watkins</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`

export function confirmSubject(entry: WaitlistEntry): string {
  return `Confirm your spot on the ${projectList(entry.requested)} waitlist`
}

export function createConfirmHtml(entry: WaitlistEntry): string {
  const projects = sanitizeHtml(projectList(entry.requested))
  const body = `${brandBar('Waitlist')}
${card(`                <tr>
                  <td class="px" style="padding:34px 36px 8px;">
                    <h1 class="h1" style="margin:0 0 12px;font-family:${FONT};font-size:28px;line-height:34px;font-weight:800;color:${C.white};letter-spacing:-0.6px;">One click to join</h1>
                    ${paragraph(`Someone, hopefully you, asked to join the waitlist for <strong style="color:${C.white};">${projects}</strong> on n8builds.dev. Confirm, and I'll email you when there is something to try. Nothing else: no newsletter.`)}
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:22px 36px 26px;">
                    ${button(confirmUrl(entry.token), 'Confirm my spot')}
                    <p style="margin:14px 0 0;font-family:${MONO};font-size:11px;line-height:17px;color:${C.faint};word-break:break-all;">Or open ${confirmUrl(entry.token)}</p>
                  </td>
                </tr>${signOff}`)}
${footnote(
  `Not you? Ignore this email: nothing changes unless you confirm, and an unconfirmed request is deleted after ${PENDING_DAYS} days.<br>Changed your mind later? <a href="${leaveUrl(entry.token)}" style="color:${C.muted};text-decoration:underline;">Leave the waitlist</a> at any time.`
)}`

  return shell({ title: 'Confirm your spot', preheader: `Confirm to join the ${projects} waitlist.`, body })
}

export function createConfirmText(entry: WaitlistEntry): string {
  return [
    `Someone, hopefully you, asked to join the waitlist for ${projectList(entry.requested)} on n8builds.dev.`,
    "Confirm, and I'll email you when there is something to try. Nothing else: no newsletter.",
    '',
    `Confirm my spot: ${confirmUrl(entry.token)}`,
    '',
    'Thanks,',
    'Nathan "n8" Watkins',
    '',
    `Not you? Ignore this email: nothing changes unless you confirm, and an unconfirmed request is deleted after ${PENDING_DAYS} days.`,
    `Leave the waitlist at any time: ${leaveUrl(entry.token)}`,
  ].join('\n')
}

export const LEAVE_SUBJECT = 'Your link to leave the n8builds waitlist'

export function createLeaveHtml(entry: WaitlistEntry): string {
  const body = `${brandBar('Waitlist')}
${card(`                <tr>
                  <td class="px" style="padding:34px 36px 8px;">
                    <h1 class="h1" style="margin:0 0 12px;font-family:${FONT};font-size:28px;line-height:34px;font-weight:800;color:${C.white};letter-spacing:-0.6px;">Leave the waitlist</h1>
                    ${paragraph('You asked for a link to take this address off the n8builds.dev waitlist. One click removes it and everything stored with it.')}
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:22px 36px 26px;">
                    ${button(leaveUrl(entry.token), 'Remove me')}
                  </td>
                </tr>${signOff}`)}
${footnote("Didn't ask for this? Ignore it, and nothing changes.")}`

  return shell({ title: 'Leave the waitlist', preheader: 'One click removes your address from the waitlist.', body })
}

export function createLeaveText(entry: WaitlistEntry): string {
  return [
    'You asked for a link to take this address off the n8builds.dev waitlist.',
    'One click removes it and everything stored with it:',
    '',
    leaveUrl(entry.token),
    '',
    "Didn't ask for this? Ignore it, and nothing changes.",
  ].join('\n')
}

/** Throws when the message can't be sent. */
async function send(to: string, subject: string, html: string, text: string): Promise<void> {
  await getTransporter().sendMail({
    from: EMAIL_CONFIG.from,
    to,
    replyTo: EMAIL_CONFIG.contactEmail,
    subject,
    html,
    text,
    attachments: inlineImages(['logo']),
  })
}

export const sendConfirmEmail = (entry: WaitlistEntry) =>
  send(entry.email, confirmSubject(entry), createConfirmHtml(entry), createConfirmText(entry))

export const sendLeaveEmail = (entry: WaitlistEntry) =>
  send(entry.email, LEAVE_SUBJECT, createLeaveHtml(entry), createLeaveText(entry))
