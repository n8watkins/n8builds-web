import { UPCOMING, type UpcomingProject, type UpcomingSlug } from '@/data/upcoming'
import { EMAIL_CONFIG } from '@/lib/email/config'
import { sendEmail } from '@/lib/email/send'
import { C, FONT, MONO, brandBar, button, card, emailAsset, footnote, paragraph, sanitizeHtml, shell, signOff } from '@/lib/email/templates'
import { PENDING_DAYS, type WaitlistEntry, type WaitlistLinks } from '@/lib/waitlist/store'

/**
 * The waitlist's two emails, in the contact emails' dark navy and cyan:
 * - the confirm email, after joining (the double opt-in), which also carries
 *   the link to manage or leave the waitlist;
 * - the manage link, for someone who asks for it by address on /upcoming/leave.
 * Each shows the projects as small cards (icon, name, what it is). Neither
 * repeats the visitor's note: it would go to whatever address was typed (see
 * the auto-reply's rule in DECISIONS.md). Both carry List-Unsubscribe headers:
 * a mail client's one-click unsubscribe leaves the whole waitlist.
 */

export const confirmUrl = (token: string) => `${EMAIL_CONFIG.siteUrl}/upcoming/confirm?t=${encodeURIComponent(token)}`
/** The manage page: which projects to stay on, or leave them all. */
export const leaveUrl = (token: string) => `${EMAIL_CONFIG.siteUrl}/upcoming/leave?t=${encodeURIComponent(token)}`
/** Where mail clients POST `List-Unsubscribe=One-Click` (RFC 8058): leaves the whole waitlist. */
export const oneClickLeaveUrl = (token: string) => `${EMAIL_CONFIG.siteUrl}/api/waitlist/leave?t=${encodeURIComponent(token)}`

export function leaveHeaders(token: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${oneClickLeaveUrl(token)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

const projectsFor = (slugs: UpcomingSlug[]) => UPCOMING.filter((p) => slugs.includes(p.slug))

/** "Strollz", "KeysReady and Strollz". */
export const projectList = (slugs: UpcomingSlug[]) => {
  const list = projectsFor(slugs).map((p) => p.name)
  return list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list.at(-1)}` : (list[0] ?? '')
}

/** A project's icon for email: its SVG rendered to PNG (scripts/gen-email-icons.mjs). */
export const projectIconUrl = (project: UpcomingProject) =>
  emailAsset(`upcoming/${project.icon.split('/').pop()!.replace(/\.svg$/, '.png')}`)

/** One small card per project: icon, name and the one line on what it is. Stacks for any number. */
export function projectCards(slugs: UpcomingSlug[]): string {
  const rows = projectsFor(slugs).map(
    (p, i) => `                      <tr>
                        <td style="padding-top:${i === 0 ? 0 : 10}px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid ${C.line};border-radius:12px;background:${C.panel};" bgcolor="${C.panel}">
                            <tr>
                              <td valign="top" style="width:40px;padding:14px 0 14px 14px;"><img src="${projectIconUrl(p)}" width="40" height="40" alt="" style="display:block;width:40px;height:40px;border:0;border-radius:10px;"></td>
                              <td valign="middle" style="padding:13px 16px 13px 14px;font-family:${FONT};">
                                <p style="margin:0;font-size:15px;line-height:21px;font-weight:700;color:${C.white};">${sanitizeHtml(p.name)}</p>
                                <p style="margin:3px 0 0;font-size:14px;line-height:20px;color:${C.muted};">${sanitizeHtml(p.tagline)}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>`
  )
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;">
${rows.join('\n')}
                    </table>`
}

export const heading = (text: string) =>
  `<h1 class="h1" style="margin:0 0 14px;font-family:${FONT};font-size:28px;line-height:35px;font-weight:800;color:${C.white};letter-spacing:-0.6px;">${text}</h1>`

export const footLink = (href: string, label: string) => `<a href="${href}" style="color:${C.muted};text-decoration:underline;">${label}</a>`

export function confirmSubject(entry: WaitlistEntry): string {
  return `Confirm your spot on the ${projectList(entry.requested)} waitlist`
}

export function createConfirmHtml(entry: WaitlistEntry, links: WaitlistLinks): string {
  const one = projectsFor(entry.requested).length === 1
  const body = `${brandBar('Waitlist', { logo: 'url' })}
${card(`                <tr>
                  <td class="px" style="padding:38px 40px 6px;">
                    ${heading('One click to join')}
                    ${paragraph(`Someone, hopefully you, asked to join the waitlist for ${one ? 'this project' : 'these projects'} on n8builds.dev. Confirm, and I'll email you when there is something to try. Nothing else: no newsletter.`)}
                    ${projectCards(entry.requested)}
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:28px 40px 30px;">
                    ${button(confirmUrl(links.confirm), 'Confirm my spot')}
                    <p style="margin:16px 0 0;font-family:${MONO};font-size:11px;line-height:18px;color:${C.faint};word-break:break-all;">Or open ${confirmUrl(links.confirm)}</p>
                  </td>
                </tr>${signOff}`)}
${footnote(
  ['Not you? Ignore this email: nothing changes unless you confirm.', `An unconfirmed request is deleted after ${PENDING_DAYS} days.`],
  `Changed your mind later? ${footLink(leaveUrl(links.leave), 'Manage or leave the waitlist')}.`
)}`

  return shell({ title: 'Confirm your spot', preheader: `Confirm to join the ${sanitizeHtml(projectList(entry.requested))} waitlist.`, body })
}

export function createConfirmText(entry: WaitlistEntry, links: WaitlistLinks): string {
  return [
    `Someone, hopefully you, asked to join the waitlist for ${projectList(entry.requested)} on n8builds.dev.`,
    "Confirm, and I'll email you when there is something to try. Nothing else: no newsletter.",
    '',
    ...projectsFor(entry.requested).map((p) => `- ${p.name}: ${p.tagline}`),
    '',
    `Confirm my spot: ${confirmUrl(links.confirm)}`,
    '',
    'Thanks,',
    'Nathan "n8" Watkins',
    '',
    `Not you? Ignore this email. Nothing changes unless you confirm, and an unconfirmed request is deleted after ${PENDING_DAYS} days.`,
    `Manage or leave the waitlist: ${leaveUrl(links.leave)}`,
  ].join('\n')
}

export const LEAVE_SUBJECT = 'Your link to manage your n8builds waitlist'

/** Confirmed projects first, then any still waiting on a confirm link. */
const listedOn = (entry: WaitlistEntry) => [...new Set([...entry.projects, ...entry.requested])]

export function createLeaveHtml(entry: WaitlistEntry, token: string): string {
  const slugs = listedOn(entry)
  const body = `${brandBar('Waitlist', { logo: 'url' })}
${card(`                <tr>
                  <td class="px" style="padding:38px 40px 6px;">
                    ${heading('Manage your waitlist')}
                    ${paragraph(
                      slugs.length
                        ? 'You asked for a link to change what this address is on. Keep the projects you still want to hear about, or leave the waitlist altogether.'
                        : 'You asked for a link to take this address off the n8builds.dev waitlist.'
                    )}
                    ${slugs.length ? projectCards(slugs) : ''}
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:28px 40px 30px;">
                    ${button(leaveUrl(token), 'Manage my waitlist')}
                  </td>
                </tr>${signOff}`)}
${footnote(["Didn't ask for this? Ignore it, and nothing changes.", 'The link works for a year, only for this address.'])}`

  return shell({ title: 'Manage your waitlist', preheader: 'Choose which projects to hear about, or leave the waitlist.', body })
}

export function createLeaveText(entry: WaitlistEntry, token: string): string {
  return [
    'You asked for a link to change what this address is on at the n8builds.dev waitlist.',
    ...listedOn(entry).map((slug) => {
      const p = UPCOMING.find((u) => u.slug === slug)!
      return `- ${p.name}: ${p.tagline}`
    }),
    '',
    `Keep the projects you want, or leave altogether: ${leaveUrl(token)}`,
    '',
    "Didn't ask for this? Ignore it, and nothing changes.",
  ].join('\n')
}

/** Throws when the message can't be sent. */
async function send(to: string, subject: string, html: string, text: string, leaveToken: string): Promise<void> {
  await sendEmail({
    kind: 'waitlist',
    to,
    replyTo: EMAIL_CONFIG.contactEmail,
    subject,
    html,
    text,
    images: [],
    headers: leaveHeaders(leaveToken),
  })
}

export const sendConfirmEmail = (entry: WaitlistEntry, links: WaitlistLinks) =>
  send(entry.email, confirmSubject(entry), createConfirmHtml(entry, links), createConfirmText(entry, links), links.leave)

export const sendLeaveEmail = (entry: WaitlistEntry, token: string) =>
  send(entry.email, LEAVE_SUBJECT, createLeaveHtml(entry, token), createLeaveText(entry, token), token)
