import { ContactFormData } from '@/lib/validations/contact'
import { subjectOptions } from '@/lib/validations/contact'
import { EMAIL_CONFIG } from '@/lib/email/smtp'

// Security: escape ALL markup in user input. Stricter than the previous
// DOMPurify allowlist (which permitted bare <br>), and avoids jsdom -
// whose dependency chain breaks Vercel's serverless runtime
// (ERR_REQUIRE_ESM in html-encoding-sniffer). Newlines in the message
// still render via `white-space: pre-wrap` on the message box.
function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/*
 * Both emails are designed dark, in the site's navy and cyan, and built the
 * way mail clients need: tables, inline styles, a 600px column that shrinks
 * on phones, and images as inline CID attachments (lib/email/icons.ts, sent
 * by lib/email/sender.ts), so nothing depends on remote images loading.
 * The `color-scheme: dark` meta stops Apple Mail and Outlook from inverting
 * them in dark mode.
 */
const C = {
  page: '#050a14',
  card: '#0b1220',
  panel: '#0f1a2e',
  line: '#1e2a40',
  text: '#e2e8f0',
  muted: '#94a3b8',
  faint: '#64748b',
  cyan: '#22d3ee',
  blue: '#3b82f6',
  white: '#ffffff',
}
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"

type Topic = { value: string; label: string; emoji: string; short: string; noun: string }

/** The form's topic as the emails show it ("🚀", "New project", "a new project"). */
export function topicFor(subject: string): Topic {
  const option = subjectOptions.find((o) => o.value === subject)
  const label = option?.label ?? subject
  const [emoji, ...rest] = label.split(' ')
  const name = rest.join(' ')
  switch (subject) {
    case 'project_opportunity':
      return { value: subject, label, emoji, short: 'New project', noun: 'a new project' }
    case 'consulting':
      return { value: subject, label, emoji, short: 'Consulting', noun: 'consulting' }
    case 'networking':
      return { value: subject, label, emoji, short: 'Networking', noun: 'connecting' }
    default:
      return { value: subject, label, emoji: '✉️', short: name || 'Message', noun: 'your message' }
  }
}

/** "Oct 28, 2026, 4:12 PM PDT": the owner reads these in Pacific time. */
function pacificTime(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function shell({ title, preheader, body }: { title: string; preheader: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title}</title>
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    a { text-decoration: none; }
    @media (max-width: 480px) {
      .px { padding-left: 20px !important; padding-right: 20px !important; }
      .h1 { font-size: 24px !important; line-height: 30px !important; }
      .stack, .stack > tbody, .stack > tbody > tr, .stack > tbody > tr > td { display: block !important; width: 100% !important; }
      .meta-label { padding-bottom: 2px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};">${preheader}${'&#847;&zwnj;&nbsp;'.repeat(40)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
${body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** The N8 mark, the site's name, and a right-hand label, above the card. */
function brandBar(right: string): string {
  return `          <tr>
            <td style="padding:0 4px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle" style="width:40px;"><a href="${EMAIL_CONFIG.siteUrl}"><img src="cid:icon-logo" width="32" height="32" alt="N8" style="display:block;border:0;border-radius:8px;"></a></td>
                  <td valign="middle" style="font-family:${FONT};font-size:15px;font-weight:700;color:${C.white};letter-spacing:-0.2px;"><a href="${EMAIL_CONFIG.siteUrl}" style="color:${C.white};text-decoration:none;">n8builds<span style="color:${C.cyan};">.dev</span></a></td>
                  <td valign="middle" align="right" style="font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.faint};">${right}</td>
                </tr>
              </table>
            </td>
          </tr>`
}

function pill(text: string): string {
  return `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#0e2a3a;border:1px solid #155e75;font-family:${FONT};font-size:12px;font-weight:600;color:#a5f3fc;letter-spacing:0.2px;">${text}</span>`
}

/** A bulletproof button: a padded link inside a cell, with a solid fallback under the gradient. */
function button(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td bgcolor="${C.blue}" style="border-radius:12px;background:${C.blue};background-image:linear-gradient(135deg,#06b6d4,#2563eb);">
                    <a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:700;color:${C.white};text-decoration:none;border-radius:12px;">${label}</a>
                  </td>
                </tr>
              </table>`
}

function socials(): string {
  const icon = (href: string, cid: string, alt: string) =>
    `<td style="padding:0 7px;"><a href="${href}"><img src="cid:icon-${cid}" width="20" height="20" alt="${alt}" style="display:block;border:0;"></a></td>`
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  ${icon(EMAIL_CONFIG.githubUrl, 'github', 'GitHub')}
                  ${icon(EMAIL_CONFIG.linkedinUrl, 'linkedin', 'LinkedIn')}
                  ${icon(EMAIL_CONFIG.xUrl, 'x', 'X')}
                </tr>
              </table>`
}

// ---------------------------------------------------------------------------
// The owner's notification
// ---------------------------------------------------------------------------

export function contactEmailSubject(data: ContactFormData): string {
  const topic = topicFor(data.subject)
  return `${topic.emoji} ${topic.short}: ${data.name}`
}

export function createContactEmailHtml(
  data: ContactFormData,
  { autoReply = true, receivedAt = new Date() }: { autoReply?: boolean; receivedAt?: Date } = {}
): string {
  const topic = topicFor(data.subject)
  const name = sanitizeHtml(data.name)
  const email = sanitizeHtml(data.email)
  const first = sanitizeHtml(greetingName(data.name) === 'there' ? data.name : greetingName(data.name))
  const replyHref = `mailto:${email}?subject=${encodeURIComponent(`Re: ${topic.short} (n8builds.dev)`)}`
  const row = (label: string, value: string) => `
                <tr>
                  <td class="meta-label" valign="top" style="width:96px;padding:0 12px 10px 0;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.faint};">${label}</td>
                  <td valign="top" style="padding:0 0 10px;font-family:${FONT};font-size:15px;color:${C.text};">${value}</td>
                </tr>`

  const body = `${brandBar('Contact form')}
          <tr>
            <td style="border:1px solid ${C.line};border-top:3px solid ${C.cyan};border-radius:16px;background:${C.card};" bgcolor="${C.card}">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="px" style="padding:30px 36px 8px;">
                    ${pill(`${topic.emoji}&nbsp; ${sanitizeHtml(topic.short)}`)}
                    <h1 class="h1" style="margin:16px 0 6px;font-family:${FONT};font-size:28px;line-height:34px;font-weight:800;color:${C.white};letter-spacing:-0.5px;">New message from ${name}</h1>
                    <p style="margin:0;font-family:${FONT};font-size:14px;color:${C.muted};">${pacificTime(receivedAt)}</p>
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:22px 36px 6px;">
                    <table role="presentation" class="stack" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${row('From', name)}
                      ${row('Email', `<a href="mailto:${email}" style="color:${C.cyan};text-decoration:none;">${email}</a>`)}
                      ${row('Topic', sanitizeHtml(topic.label))}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:10px 36px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="border-left:3px solid ${C.cyan};border-radius:4px 12px 12px 4px;background:${C.panel};padding:18px 22px;font-family:${FONT};font-size:15px;line-height:25px;color:${C.text};white-space:pre-wrap;word-break:break-word;" bgcolor="${C.panel}">${sanitizeHtml(data.message)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:26px 36px 32px;">
              ${button(replyHref, `Reply to ${first} &rarr;`)}
                    <p style="margin:14px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.muted};">Or just hit reply: it goes straight to ${email}.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 8px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${C.faint};">
              ${autoReply ? `An auto-reply went to ${email}.` : `No auto-reply this time: ${email} already got one today.`}<br>
              Sent from the contact form on <a href="${EMAIL_CONFIG.siteUrl}/#contact" style="color:${C.muted};text-decoration:underline;">${EMAIL_CONFIG.siteDomain}</a>
            </td>
          </tr>`

  return shell({
    title: `New message from ${name}`,
    preheader: `${topic.emoji} ${sanitizeHtml(topic.short)} from ${name}: ${sanitizeHtml(data.message.slice(0, 90))}`,
    body,
  })
}

export function createContactEmailText(
  data: ContactFormData,
  { autoReply = true, receivedAt = new Date() }: { autoReply?: boolean; receivedAt?: Date } = {}
): string {
  const topic = topicFor(data.subject)
  return [
    `${topic.emoji} ${topic.short}: new message from ${data.name}`,
    '',
    `From:   ${data.name}`,
    `Email:  ${data.email}`,
    `Topic:  ${topic.label}`,
    `When:   ${pacificTime(receivedAt)}`,
    '',
    data.message,
    '',
    '---',
    autoReply ? `An auto-reply went to ${data.email}.` : `No auto-reply this time: ${data.email} already got one today.`,
    `Reply to this email to answer ${data.name}. Sent from the contact form on ${EMAIL_CONFIG.siteDomain}.`,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// The visitor's auto-reply
// ---------------------------------------------------------------------------

// Per-subject tip in the auto-reply's "what happens next".
export function getSubjectSpecificLine(subject: string): { html: string; text: string } {
  const link = (href: string, label: string) => `<a href="${href}" style="color:${C.cyan};text-decoration:none;">${label}</a>`
  switch (subject) {
    case 'project_opportunity':
      return {
        html: `Got a brief or a Loom? Send it as a reply, and I'll come back with something more useful.`,
        text: `Got a brief or a Loom? Send it as a reply, and I'll come back with something more useful.`,
      }
    case 'consulting':
      return {
        html: `A quick note on your goals and timeline helps me show up prepared. For a feel of how I work, see ${link(EMAIL_CONFIG.appturnityUrl, 'appturnity.com')}.`,
        text: `A quick note on your goals and timeline helps me show up prepared. For a feel of how I work, see appturnity.com.`,
      }
    case 'networking':
      return {
        html: `Always happy to connect. I'm on ${link(EMAIL_CONFIG.linkedinUrl, 'LinkedIn')} and ${link(EMAIL_CONFIG.xUrl, 'X')} if you'd like to stay in touch.`,
        text: `Always happy to connect. I'm on LinkedIn (${EMAIL_CONFIG.linkedinUrl}) and X (${EMAIL_CONFIG.xUrl}) if you'd like to stay in touch.`,
      }
    default:
      return { html: '', text: '' }
  }
}

/**
 * First name for the auto-reply greeting. The auto-reply goes to whatever
 * address was typed, so the name is attacker-controlled text in our mail: a
 * "name" like "www.evil-payday.com Offer" would arrive as a linked domain.
 * Only a plain word (letters, apostrophes, hyphens) is used; otherwise "there".
 */
export function greetingName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? ''
  return /^[\p{L}][\p{L}'-]{0,29}$/u.test(first) ? first : 'there'
}

export function autoReplySubject(data: ContactFormData): string {
  const first = greetingName(data.name)
  return first === 'there' ? '👋 Got your message' : `👋 Got your message, ${first}`
}

const PLACES = [
  {
    href: EMAIL_CONFIG.siteUrl,
    title: 'The Lab',
    domain: 'n8builds.dev',
    text: 'Everything I build, in public: apps, tools and AI experiments.',
  },
  {
    href: 'https://portfolio.n8builds.dev',
    title: 'Developer portfolio',
    domain: 'portfolio.n8builds.dev',
    text: 'My projects, experience and the stack behind them.',
  },
  {
    href: EMAIL_CONFIG.appturnityUrl,
    title: 'Appturnity',
    domain: 'appturnity.com',
    text: 'My company: free websites and AI automations for service businesses.',
  },
]

/**
 * The visitor's message is never echoed here: this mail goes to whatever
 * address was typed, so repeating the text would let anyone send their own
 * words from contact@n8builds.dev. Only the first name (greetingName) and the
 * topic appear.
 */
export function createAutoReplyHtml(data: ContactFormData): string {
  const firstName = greetingName(data.name)
  const greeting = firstName === 'there' ? 'Got your message' : `Got your message, ${sanitizeHtml(firstName)}`
  const topic = topicFor(data.subject)
  const tip = getSubjectSpecificLine(data.subject)
  const step = (n: number, title: string, text: string) => `
                      <tr>
                        <td valign="top" style="width:40px;padding:0 0 18px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" valign="middle" width="28" height="28" style="width:28px;height:28px;border-radius:14px;background:#0e2a3a;border:1px solid #155e75;font-family:${MONO};font-size:12px;font-weight:700;color:${C.cyan};">${n}</td></tr></table>
                        </td>
                        <td valign="top" style="padding:3px 0 18px;font-family:${FONT};">
                          <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:${C.white};">${title}</p>
                          <p style="margin:0;font-size:14px;line-height:22px;color:${C.muted};">${text}</p>
                        </td>
                      </tr>`
  const place = (p: (typeof PLACES)[number]) => `
                      <tr>
                        <td style="padding:0 0 10px;">
                          <a href="${p.href}" style="display:block;text-decoration:none;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid ${C.line};border-radius:12px;background:${C.panel};" bgcolor="${C.panel}">
                              <tr>
                                <td style="padding:14px 18px;font-family:${FONT};">
                                  <p style="margin:0;font-size:15px;font-weight:700;color:${C.white};">${p.title} <span style="font-weight:400;color:${C.cyan};">&rarr;</span></p>
                                  <p style="margin:3px 0 0;font-size:13px;line-height:20px;color:${C.muted};">${p.text}</p>
                                  <p style="margin:5px 0 0;font-family:${MONO};font-size:11px;letter-spacing:0.5px;color:${C.faint};">${p.domain}</p>
                                </td>
                              </tr>
                            </table>
                          </a>
                        </td>
                      </tr>`

  const body = `${brandBar('Message received')}
          <tr>
            <td style="border:1px solid ${C.line};border-top:3px solid ${C.cyan};border-radius:16px;background:${C.card};" bgcolor="${C.card}">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="px" style="padding:34px 36px 6px;">
                    ${pill(`${topic.emoji}&nbsp; ${sanitizeHtml(topic.short)}`)}
                    <h1 class="h1" style="margin:16px 0 10px;font-family:${FONT};font-size:30px;line-height:36px;font-weight:800;color:${C.white};letter-spacing:-0.6px;">${greeting} <span style="font-weight:400;">👋</span></h1>
                    <p style="margin:0;font-family:${FONT};font-size:16px;line-height:26px;color:${C.text};">Thanks for reaching out about ${topic.noun}. I read every message myself, and I normally reply within <strong style="color:${C.white};">24 hours</strong>.</p>
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:26px 36px 4px;">
                    <p style="margin:0 0 16px;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.faint};">What happens next</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${step(1, 'I read it', 'Your message is in my inbox now, not a queue.')}
                      ${step(2, 'I reply within a day', `From <a href="mailto:${EMAIL_CONFIG.contactEmail}" style="color:${C.cyan};text-decoration:none;">${EMAIL_CONFIG.contactEmail}</a>, so keep an eye out for it.`)}
                      ${tip.html ? step(3, 'Want to speed things up?', tip.html) : ''}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:10px 36px 6px;">
                    <p style="margin:0 0 14px;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.faint};">While you wait</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${PLACES.map(place).join('')}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:20px 36px 34px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid ${C.line};">
                      <tr>
                        <td style="padding-top:22px;font-family:${FONT};">
                          <p style="margin:0;font-size:15px;color:${C.text};">Talk soon,</p>
                          <p style="margin:6px 0 0;font-size:17px;font-weight:800;color:${C.white};">Nathan <span style="color:${C.cyan};">"n8"</span> Watkins</p>
                          <p style="margin:3px 0 0;font-size:13px;color:${C.muted};">Full-stack developer &middot; Los Angeles</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 8px 0;">
              ${socials()}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 8px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${C.faint};">
              A one-time email: you used the contact form on <a href="${EMAIL_CONFIG.siteUrl}" style="color:${C.muted};text-decoration:underline;">${EMAIL_CONFIG.siteDomain}</a>. Not a subscription.
            </td>
          </tr>`

  return shell({
    title: 'Got your message',
    preheader: `Thanks for reaching out. I normally reply within 24 hours.`,
    body,
  })
}

export function createAutoReplyText(data: ContactFormData): string {
  const firstName = greetingName(data.name)
  const topic = topicFor(data.subject)
  const tip = getSubjectSpecificLine(data.subject).text
  return [
    `Hey ${firstName},`,
    '',
    `Thanks for reaching out about ${topic.noun}. I read every message myself, and I normally reply within 24 hours, from ${EMAIL_CONFIG.contactEmail}.`,
    ...(tip ? ['', tip] : []),
    '',
    'While you wait:',
    ...PLACES.map((p) => `- ${p.title}: ${p.href}`),
    '',
    'Talk soon,',
    'Nathan "n8" Watkins',
    'Full-stack developer, Los Angeles',
    `GitHub: ${EMAIL_CONFIG.githubUrl}`,
    `LinkedIn: ${EMAIL_CONFIG.linkedinUrl}`,
    `X: ${EMAIL_CONFIG.xUrl}`,
    '',
    `A one-time email: you used the contact form on ${EMAIL_CONFIG.siteDomain}. Not a subscription.`,
  ].join('\n')
}
