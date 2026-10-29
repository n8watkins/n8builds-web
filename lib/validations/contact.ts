import { z } from 'zod'

// Zod JIT-compiles object parsers with new Function() after probing whether
// eval is allowed. Our Content-Security-Policy forbids eval, so the probe would
// log a violation on every page that loads this schema. Jitless parsing is
// plenty fast for a five-field form.
z.config({ jitless: true })

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    // Letters, spaces, and the punctuation real names use (O'Brien, Jean-Luc,
    // J. Smith). Plain spaces only: no newlines or tabs.
    .regex(/^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF '.-]+$/, 'Name contains invalid characters'),

  email: z
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters')
    .refine((email) => {
      const parts = email.split('@')
      return parts.length === 2 && parts[1].includes('.')
    }, 'Please enter a valid email address'),

  subject: z.enum(['project_opportunity', 'consulting', 'networking'], {
    error: 'Please choose a topic',
  }),

  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),

  turnstile: z
    .string()
    .min(1, 'Please complete the Turnstile verification'),

  // Security: Honeypot field
  honeypot: z.string().max(0, 'Bot detected'),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

// The topics live in their own module, without zod, so the contact form's
// first JavaScript doesn't include the schema (it loads on first validation).
export { subjectOptions } from './contactOptions'
