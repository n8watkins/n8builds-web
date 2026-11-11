import { EMAIL_CONFIG } from '@/lib/email/config'
import { C, FONT, MONO, brandBar, button, card, footnote, paragraph, sanitizeHtml, shell, signOff } from '@/lib/email/templates'
import { CONFIRM_DAYS } from '@/lib/newsletter/store'

/**
 * The newsletter's two emails, in the other emails' dark navy and cyan
 * (lib/email/templates.ts): the confirm email after signing up (the double
 * opt-in) and the weekly digest. Both carry the address's own unsubscribe
 * link, in the footer and as List-Unsubscribe headers (one click, RFC 8058).
 */

export const NEWSLETTER_NAME = "N8's Notions"

export type DigestPost = { title: string; slug: string; publishedAt: string; excerpt: string }

export const confirmUrl = (token: string) => `${EMAIL_CONFIG.siteUrl}/newsletter/confirm?t=${encodeURIComponent(token)}`
export const unsubscribeUrl = (token: string) => `${EMAIL_CONFIG.siteUrl}/newsletter/unsubscribe?t=${encodeURIComponent(token)}`
/** Where mail clients POST `List-Unsubscribe=One-Click` (app/api/newsletter/unsubscribe). */
export const oneClickUrl = (token: string) => `${EMAIL_CONFIG.siteUrl}/api/newsletter/unsubscribe?t=${encodeURIComponent(token)}`
export const postUrl = (slug: string) => `${EMAIL_CONFIG.siteUrl}/blog/${encodeURIComponent(slug)}`

export function unsubscribeHeaders(token: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${oneClickUrl(token)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

const unsubscribeNote = (token: string) =>
  `<a href="${unsubscribeUrl(token)}" style="color:${C.muted};text-decoration:underline;">Unsubscribe</a> with one click, at any time.`

// ---------------------------------------------------------------------------
// Confirm
// ---------------------------------------------------------------------------

export const CONFIRM_SUBJECT = `Confirm your ${NEWSLETTER_NAME} subscription`

export function createConfirmHtml(confirmToken: string, unsubscribeToken: string): string {
  const url = confirmUrl(confirmToken)
  const body = `${brandBar('Newsletter')}
${card(`                <tr>
                  <td class="px" style="padding:34px 36px 8px;">
                    <h1 class="h1" style="margin:0 0 12px;font-family:${FONT};font-size:28px;line-height:34px;font-weight:800;color:${C.white};letter-spacing:-0.6px;">One click to subscribe</h1>
                    ${paragraph(`Someone, hopefully you, asked for <strong style="color:${C.white};">${NEWSLETTER_NAME}</strong> by email on n8builds.dev. Confirm, and you'll get one short email in any week with a new post. No other email, ever.`)}
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:22px 36px 26px;">
                    ${button(url, 'Confirm my subscription')}
                    <p style="margin:14px 0 0;font-family:${MONO};font-size:11px;line-height:17px;color:${C.faint};word-break:break-all;">Or open ${url}</p>
                  </td>
                </tr>${signOff}`)}
${footnote(
  `Not you? Ignore this email: nothing happens unless you confirm, and the address is deleted after ${CONFIRM_DAYS} days.<br>${unsubscribeNote(unsubscribeToken)}`
)}`
  return shell({ title: 'Confirm your subscription', preheader: `Confirm to get ${NEWSLETTER_NAME} by email.`, body })
}

export function createConfirmText(confirmToken: string, unsubscribeToken: string): string {
  return [
    `Someone, hopefully you, asked for ${NEWSLETTER_NAME} by email on n8builds.dev.`,
    "Confirm, and you'll get one short email in any week with a new post. No other email, ever.",
    '',
    `Confirm my subscription: ${confirmUrl(confirmToken)}`,
    '',
    'Thanks,',
    'Nathan "n8" Watkins',
    '',
    `Not you? Ignore this email: nothing happens unless you confirm, and the address is deleted after ${CONFIRM_DAYS} days.`,
    `Unsubscribe: ${unsubscribeUrl(unsubscribeToken)}`,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Digest
// ---------------------------------------------------------------------------

export function digestSubject(posts: DigestPost[]): string {
  return posts.length === 1 ? `New on ${NEWSLETTER_NAME}: ${posts[0].title}` : `${posts.length} new posts on ${NEWSLETTER_NAME}`
}

const postDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

function postRow(post: DigestPost, last: boolean): string {
  const url = postUrl(post.slug)
  const excerpt = post.excerpt ? paragraph(sanitizeHtml(post.excerpt), 8) : ''
  return `                <tr>
                  <td class="px" style="padding:22px 36px ${last ? 26 : 22}px;">
                    <p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.cyan};">${postDate(post.publishedAt)}</p>
                    <h2 style="margin:8px 0 0;font-family:${FONT};font-size:21px;line-height:28px;font-weight:800;color:${C.white};letter-spacing:-0.3px;"><a href="${url}" style="color:${C.white};text-decoration:none;">${sanitizeHtml(post.title)}</a></h2>
                    ${excerpt}
                    <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;font-weight:700;"><a href="${url}" style="color:${C.cyan};text-decoration:none;">Read the post &rarr;</a></p>
                  </td>
                </tr>${last ? '' : divider}`
}

// Between posts, inset like the sign-off's rule.
const divider = `
                <tr>
                  <td class="px" style="padding:0 36px;"><div style="border-top:1px solid ${C.line};height:0;line-height:0;font-size:0;">&nbsp;</div></td>
                </tr>`

export function createDigestHtml(posts: DigestPost[], unsubscribeToken: string): string {
  const heading = posts.length === 1 ? 'A new post' : `${posts.length} new posts`
  const body = `${brandBar(NEWSLETTER_NAME)}
${card(`                <tr>
                  <td class="px" style="padding:34px 36px 4px;">
                    <h1 class="h1" style="margin:0;font-family:${FONT};font-size:28px;line-height:34px;font-weight:800;color:${C.white};letter-spacing:-0.6px;">${heading} this week</h1>
                  </td>
                </tr>
${posts.map((post, i) => postRow(post, i === posts.length - 1)).join('\n')}${signOff}`)}
${footnote(
  `You get this because you subscribed to ${NEWSLETTER_NAME} at n8builds.dev: at most one email a week, only when there is a new post.<br>${unsubscribeNote(unsubscribeToken)}`
)}`
  return shell({ title: digestSubject(posts), preheader: posts.map((p) => p.title).join(' · '), body })
}

export function createDigestText(posts: DigestPost[], unsubscribeToken: string): string {
  return [
    posts.length === 1 ? 'A new post this week on N8\'s Notions:' : `${posts.length} new posts this week on N8's Notions:`,
    '',
    ...posts.flatMap((post) => [post.title, ...(post.excerpt ? [post.excerpt] : []), postUrl(post.slug), '']),
    'Thanks,',
    'Nathan "n8" Watkins',
    '',
    `You get this because you subscribed to ${NEWSLETTER_NAME} at n8builds.dev: at most one email a week, only when there is a new post.`,
    `Unsubscribe: ${unsubscribeUrl(unsubscribeToken)}`,
  ].join('\n')
}
