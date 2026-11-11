import { UPCOMING, type UpcomingSlug } from '@/data/upcoming'
import { EMAIL_CONFIG } from '@/lib/email/config'
import { sendEmail } from '@/lib/email/send'
import { C, FONT, MONO, brandBar, button, card, footnote, paragraph, sanitizeHtml, shell, signOff } from '@/lib/email/templates'
import { PENDING_DAYS, type WaitlistEntry, type WaitlistLinks } from '@/lib/waitlist/store'

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

export function confirmSubject(entry: WaitlistEntry): string {
  return `Confirm your spot on the ${projectList(entry.requested)} waitlist`
}

export function createConfirmHtml(entry: WaitlistEntry, links: WaitlistLinks): string {
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
                    ${button(confirmUrl(links.confirm), 'Confirm my spot')}
                    <p style="margin:14px 0 0;font-family:${MONO};font-size:11px;line-height:17px;color:${C.faint};word-break:break-all;">Or open ${confirmUrl(links.confirm)}</p>
                  </td>
                </tr>${signOff}`)}
${footnote(
  `Not you? Ignore this email: nothing changes unless you confirm, and an unconfirmed request is deleted after ${PENDING_DAYS} days.<br>Changed your mind later? <a href="${leaveUrl(links.leave)}" style="color:${C.muted};text-decoration:underline;">Leave the waitlist</a> at any time.`
)}`

  return shell({ title: 'Confirm your spot', preheader: `Confirm to join the ${projects} waitlist.`, body })
}

export function createConfirmText(entry: WaitlistEntry, links: WaitlistLinks): string {
  return [
    `Someone, hopefully you, asked to join the waitlist for ${projectList(entry.requested)} on n8builds.dev.`,
    "Confirm, and I'll email you when there is something to try. Nothing else: no newsletter.",
    '',
    `Confirm my spot: ${confirmUrl(links.confirm)}`,
    '',
    'Thanks,',
    'Nathan "n8" Watkins',
    '',
    `Not you? Ignore this email: nothing changes unless you confirm, and an unconfirmed request is deleted after ${PENDING_DAYS} days.`,
    `Leave the waitlist at any time: ${leaveUrl(links.leave)}`,
  ].join('\n')
}

export const LEAVE_SUBJECT = 'Your link to leave the n8builds waitlist'

export function createLeaveHtml(token: string): string {
  const body = `${brandBar('Waitlist')}
${card(`                <tr>
                  <td class="px" style="padding:34px 36px 8px;">
                    <h1 class="h1" style="margin:0 0 12px;font-family:${FONT};font-size:28px;line-height:34px;font-weight:800;color:${C.white};letter-spacing:-0.6px;">Leave the waitlist</h1>
                    ${paragraph('You asked for a link to take this address off the n8builds.dev waitlist. One click removes it and everything stored with it.')}
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:22px 36px 26px;">
                    ${button(leaveUrl(token), 'Remove me')}
                  </td>
                </tr>${signOff}`)}
${footnote("Didn't ask for this? Ignore it, and nothing changes.")}`

  return shell({ title: 'Leave the waitlist', preheader: 'One click removes your address from the waitlist.', body })
}

export function createLeaveText(token: string): string {
  return [
    'You asked for a link to take this address off the n8builds.dev waitlist.',
    'One click removes it and everything stored with it:',
    '',
    leaveUrl(token),
    '',
    "Didn't ask for this? Ignore it, and nothing changes.",
  ].join('\n')
}

/** Throws when the message can't be sent. */
async function send(to: string, subject: string, html: string, text: string): Promise<void> {
  await sendEmail({
    kind: 'waitlist',
    to,
    replyTo: EMAIL_CONFIG.contactEmail,
    subject,
    html,
    text,
    images: ['logo'],
  })
}

export const sendConfirmEmail = (entry: WaitlistEntry, links: WaitlistLinks) =>
  send(entry.email, confirmSubject(entry), createConfirmHtml(entry, links), createConfirmText(entry, links))

export const sendLeaveEmail = (entry: WaitlistEntry, token: string) =>
  send(entry.email, LEAVE_SUBJECT, createLeaveHtml(token), createLeaveText(token))
