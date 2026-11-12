import { UPCOMING, type UpcomingProject } from '@/data/upcoming'
import { C, FONT, brandBar, button, card, footnote, paragraph, sanitizeHtml, shell } from '@/lib/email/templates'
import { footLink, heading, leaveUrl, projectCards } from '@/lib/email/waitlist'

/**
 * The announcement emails (lib/announce/service.ts sends them): the owner
 * picks a template on the admin's Announcements page, edits its fields, and
 * every confirmed person on the project's waitlist gets it, each with their
 * own link to manage or leave the waitlist. They look like the waitlist's
 * emails (lib/email/waitlist.ts): the n8builds mark, the project's card with
 * its icon, a short footer.
 *
 * Every field is plain text: it is escaped, a blank line starts a new
 * paragraph and a single line break stays one.
 */

export const TEMPLATE_IDS = ['open', 'progress', 'launched'] as const
export type TemplateId = (typeof TEMPLATE_IDS)[number]

export type FieldKey = 'subject' | 'title' | 'body' | 'perk' | 'buttonLabel' | 'buttonUrl' | 'selfHost'
export type Fields = Record<FieldKey, string>

export type FieldSpec = { key: FieldKey; label: string; max: number; required: boolean }
export type TemplateSpec = { id: TemplateId; name: string; fields: FieldSpec[] }

const SUBJECT: FieldSpec = { key: 'subject', label: 'Subject', max: 120, required: true }
const TITLE: FieldSpec = { key: 'title', label: 'Title', max: 80, required: true }
const BODY: FieldSpec = { key: 'body', label: 'Body (a blank line starts a paragraph)', max: 800, required: true }
const BUTTON_LABEL: FieldSpec = { key: 'buttonLabel', label: 'Button label', max: 40, required: true }
const BUTTON_URL: FieldSpec = { key: 'buttonUrl', label: 'Button link (https)', max: 300, required: true }
const PERK: FieldSpec = { key: 'perk', label: 'Early sign-up perk (optional)', max: 200, required: false }
const SELF_HOST: FieldSpec = { key: 'selfHost', label: 'Self-host line (optional, links to the repository)', max: 160, required: false }

export const TEMPLATES: TemplateSpec[] = [
  { id: 'open', name: "It's open", fields: [SUBJECT, TITLE, BODY, BUTTON_LABEL, BUTTON_URL] },
  { id: 'progress', name: 'Progress update', fields: [SUBJECT, TITLE, BODY, BUTTON_LABEL, BUTTON_URL] },
  { id: 'launched', name: 'It launched', fields: [SUBJECT, TITLE, BODY, PERK, BUTTON_LABEL, BUTTON_URL, SELF_HOST] },
]

/** What the right of the brand bar says. */
const LABEL: Record<TemplateId, string> = { open: 'Early access', progress: 'Update', launched: 'Launch' }

/** Where the progress template's body asks for the owner's words: start refuses it until replaced. */
export const PLACEHOLDER = /\[\[[^\]]*\]\]/

export const isTemplateId = (value: unknown): value is TemplateId => TEMPLATE_IDS.includes(value as TemplateId)

export const findProject = (slug: unknown): UpcomingProject | undefined => UPCOMING.find((p) => p.slug === slug)

export const repoUrl = (project: UpcomingProject) => (project.repo ? `https://github.com/${project.repo}` : '')

/** Each template's copy for one project, before the owner edits it. */
export function defaultFields(project: UpcomingProject, template: TemplateId): Fields {
  const name = project.name
  const common = { perk: '', selfHost: '', buttonUrl: project.landing }
  switch (template) {
    case 'open':
      return {
        ...common,
        subject: `Early access to ${name} is open`,
        title: `${name}: early access is open`,
        body: `You joined the waitlist for ${name}, and early access is open now.\n\n${project.summary}\n\nIt's early, so tell me what works and what doesn't: just reply to this email.`,
        buttonLabel: `Try ${name}`,
      }
    case 'progress':
      return {
        ...common,
        subject: `${name}: a progress update`,
        title: `Where ${name} stands`,
        body: `You joined the waitlist for ${name}, so here's a short update on where it stands.\n\n[[What changed, and what comes next]]`,
        buttonLabel: `See ${name}`,
      }
    case 'launched':
      return {
        ...common,
        subject: `${name} is open, and your early spot is ready`,
        title: `${name} is ready`,
        body: `You joined the waitlist for ${name}, and it's ready.\n\n${project.summary}`,
        buttonLabel: `Open ${name}`,
        selfHost: project.repo ? 'Rather self-host? It stays free and open source.' : '',
      }
  }
}

export class InvalidAnnouncement extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidAnnouncement'
  }
}

/**
 * The fields an announcement goes out with: the template's defaults for the
 * project, with what the owner sent on top (a key left out keeps its
 * default; an empty optional field turns its line off). Throws
 * InvalidAnnouncement for a field that is too long, a required one left
 * empty, or a button link that isn't https.
 */
export function resolveFields(project: UpcomingProject, template: TemplateId, given: unknown): Fields {
  const fields = defaultFields(project, template)
  const spec = TEMPLATES.find((t) => t.id === template)!
  const input = given && typeof given === 'object' ? (given as Record<string, unknown>) : {}
  for (const field of spec.fields) {
    const value = input[field.key]
    if (value === undefined || value === null) continue
    if (typeof value !== 'string') throw new InvalidAnnouncement(`${field.key} must be text`)
    fields[field.key] = value.replace(/\r\n?/g, '\n').trim()
  }
  // Fields the template doesn't have stay off.
  for (const key of Object.keys(fields) as FieldKey[]) {
    if (!spec.fields.some((f) => f.key === key)) fields[key] = ''
  }
  for (const field of spec.fields) {
    const value = fields[field.key]
    if (field.required && !value) throw new InvalidAnnouncement(`${field.label} is required`)
    if (value.length > field.max) throw new InvalidAnnouncement(`${field.label} is longer than ${field.max} characters`)
    if (field.key !== 'body' && value.includes('\n')) throw new InvalidAnnouncement(`${field.label} must be one line`)
  }
  let url: URL
  try {
    url = new URL(fields.buttonUrl)
  } catch {
    throw new InvalidAnnouncement('The button link is not a URL')
  }
  if (url.protocol !== 'https:') throw new InvalidAnnouncement('The button link must start with https://')
  return fields
}

/** Paragraphs from plain text: a blank line splits them, a single line break stays. */
const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

const htmlParagraphs = (text: string) =>
  paragraphs(text)
    .map((p, i) => paragraph(sanitizeHtml(p).replace(/\n/g, '<br>'), i === 0 ? 0 : 14))
    .join('\n                    ')

/** The announcement's own sign-off: just "Nathan". */
const signedNathan = `
                <tr>
                  <td class="px" style="padding:8px 40px 38px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid ${C.line};">
                      <tr>
                        <td style="padding-top:22px;font-family:${FONT};font-size:17px;font-weight:800;color:${C.white};">Nathan</td>
                      </tr>
                    </table>
                  </td>
                </tr>`

const perkLine = (perk: string) =>
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;">
                      <tr>
                        <td style="padding:12px 16px;border-left:3px solid ${C.cyan};background:${C.panel};border-radius:0 10px 10px 0;font-family:${FONT};font-size:15px;line-height:23px;color:${C.text};" bgcolor="${C.panel}">${sanitizeHtml(perk)}</td>
                      </tr>
                    </table>`

export type Rendered = { subject: string; html: string; text: string }

/** One announcement email, for the person whose manage link `manageUrl` is. */
export function renderAnnouncement(project: UpcomingProject, template: TemplateId, fields: Fields, manageUrl: string): Rendered {
  const repo = repoUrl(project)
  const selfHost = fields.selfHost && repo ? fields.selfHost : ''
  const body = `${brandBar(LABEL[template], { logo: 'url' })}
${card(`                <tr>
                  <td class="px" style="padding:38px 40px 6px;">
                    ${heading(sanitizeHtml(fields.title))}
                    ${htmlParagraphs(fields.body)}
                    ${projectCards([project.slug])}
                    ${fields.perk ? perkLine(fields.perk) : ''}
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding:28px 40px 30px;">
                    ${button(sanitizeHtml(fields.buttonUrl), sanitizeHtml(fields.buttonLabel))}
                    ${selfHost ? `<p style="margin:18px 0 0;font-family:${FONT};font-size:14px;line-height:21px;color:${C.muted};">${footLink(sanitizeHtml(repo), sanitizeHtml(selfHost))}</p>` : ''}
                  </td>
                </tr>${signedNathan}`)}
${footnote(
  `You're getting this because you confirmed a spot on the ${sanitizeHtml(project.name)} waitlist at n8builds.dev.`,
  `${footLink(manageUrl, 'Manage or leave the waitlist')}`
)}`

  const html = shell({ title: sanitizeHtml(fields.title), preheader: sanitizeHtml(paragraphs(fields.body)[0] ?? fields.title), body })

  const text = [
    fields.title,
    '',
    ...paragraphs(fields.body).flatMap((p) => [p, '']),
    `${project.name}: ${project.tagline}`,
    '',
    ...(fields.perk ? [fields.perk, ''] : []),
    `${fields.buttonLabel}: ${fields.buttonUrl}`,
    ...(selfHost ? ['', `${selfHost} ${repo}`] : []),
    '',
    'Nathan',
    '',
    `You're getting this because you confirmed a spot on the ${project.name} waitlist at n8builds.dev.`,
    `Manage or leave the waitlist: ${manageUrl}`,
  ].join('\n')

  return { subject: fields.subject, html, text }
}

/** The manage link previews show: it opens the manage page, which says the link isn't valid. */
export const PREVIEW_MANAGE_URL = leaveUrl('preview')
