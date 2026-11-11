import { z } from 'zod'
import { UPCOMING_SLUGS, interestSlug } from '@/data/upcoming'

// See lib/validations/contact.ts: the CSP forbids eval, which zod's JIT probes for.
z.config({ jitless: true })

export const NOTE_MAX = 500

/** An email address as every list here takes it (the waitlist, the newsletter). */
export const email = z
  .email('Please enter a valid email address')
  .max(100, 'Email must be less than 100 characters')
  .refine((value) => value.split('@')[1]?.includes('.'), 'Please enter a valid email address')

/** Where a sign-up came from: kept with the entry, never shown to anyone but the owner. */
const source = z
  .object({
    // The `interest` query parameter the visitor arrived with (a project's landing page sets it).
    interest: z.string().max(40).optional(),
    // document.referrer on arrival, reduced to origin and path before storing.
    referrer: z.string().max(500).optional(),
  })
  .optional()

export const joinSchema = z.object({
  email,
  projects: z
    .array(z.enum(UPCOMING_SLUGS))
    .min(1, 'Pick at least one project')
    .max(UPCOMING_SLUGS.length)
    .transform((list) => [...new Set(list)]),
  note: z.string().trim().max(NOTE_MAX, `Notes are limited to ${NOTE_MAX} characters`).optional().default(''),
  source,
  turnstile: z.string().min(1),
  // Hidden from people; a bot that fills every field fills this too.
  honeypot: z.string().max(0),
})

export type JoinInput = z.infer<typeof joinSchema>

export const tokenSchema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{20,100}$/) })

/** The manage page: `{ token }` reads what the address is on; with `keep`, it stays on only those. */
export const manageSchema = tokenSchema.extend({
  keep: z
    .array(z.enum(UPCOMING_SLUGS))
    .max(UPCOMING_SLUGS.length)
    .transform((list) => [...new Set(list)])
    .optional(),
})

/** Asking for a removal link by email (when the visitor has no link to hand). */
export const leaveRequestSchema = z.object({
  email,
  turnstile: z.string().min(1),
  honeypot: z.string().max(0),
})

/** The interest a visitor arrived with: a known project (old names mapped to new), or nothing. */
export function cleanInterest(value: string | undefined): string {
  return interestSlug(value) ?? ''
}

/**
 * A referrer reduced to its origin and path (no query string or fragment,
 * which can carry other sites' tokens), or '' when it isn't an http(s) URL.
 */
export function cleanReferrer(value: string | undefined): string {
  if (!value) return ''
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return ''
    return `${url.origin}${url.pathname}`.slice(0, 200)
  } catch {
    return ''
  }
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}
