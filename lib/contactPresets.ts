import type { ContactFormData } from '@/lib/validations/contact'

/**
 * Ways into the contact form with the topic picked and a message started,
 * from a link elsewhere on the site: `/?inquiry=<id>#contact`, or, on the
 * page that has the form, the `contact:preset` event (ContactPresetLink),
 * so the form fills in without a reload. A preset never overwrites a message
 * the visitor has already typed.
 */
export const CONTACT_PRESET_EVENT = 'contact:preset'

export type ContactPreset = { subject: ContactFormData['subject']; message: string }

export const CONTACT_PRESETS = {
  // The Tech for Pros ad's old "Request a quote" (owner, 2026-11-02); its "Get a quote" goes to the quote field now (round 5), and this keeps old links working.
  // "New project" is the closest topic.
  'techforpros-quote': {
    subject: 'project_opportunity',
    message: "I'd like a quote from Tech for Pros.\n\nMy business and what we do: \nWhere we work: \nWhat I need (a website, the follow-up, or both): ",
  },
} as const satisfies Record<string, ContactPreset>

export type ContactPresetId = keyof typeof CONTACT_PRESETS

export const isContactPresetId = (id: unknown): id is ContactPresetId =>
  typeof id === 'string' && Object.prototype.hasOwnProperty.call(CONTACT_PRESETS, id)
