import { describe, expect, it } from 'vitest'
import { createAutoReplyHtml, createContactEmailHtml, greetingName } from '@/lib/email/templates'
import { contactFormSchema } from '@/lib/validations/contact'
import type { ContactFormData } from '@/lib/validations/contact'

const hostile: ContactFormData = {
  name: "O'Brien",
  email: 'a"onmouseover="alert(1)@example.com',
  subject: 'consulting',
  message: '<script>alert(1)</script><img src=x onerror=alert(2)> & "quotes"',
  turnstile: 'token',
  honeypot: '',
}

describe('email templates escape user input', () => {
  it('escapes the message, email and name in the notification email', () => {
    const html = createContactEmailHtml(hostile)

    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('&amp; &quot;quotes&quot;')
    expect(html).toContain('a&quot;onmouseover=&quot;alert(1)@example.com')
    expect(html).toContain('O&#39;Brien')
  })

  it('never puts markup from the name into the auto-reply', () => {
    const html = createAutoReplyHtml({ ...hostile, name: '<b>Eve</b>' })

    expect(html).not.toContain('<b>Eve</b>')
    expect(html).toContain('Hey there,')
  })

  it('escapes names exactly once (no double-encoded apostrophes)', () => {
    const html = createAutoReplyHtml({ ...hostile, name: "O'Brien Smith" })

    expect(html).toContain('Hey O&#39;Brien,')
    expect(html).not.toContain('&amp;#39;')
  })

  it('never echoes the visitor message into the auto-reply', () => {
    const html = createAutoReplyHtml(hostile)
    expect(html).not.toContain('alert(1)')
  })
})

describe('greetingName', () => {
  it('greets real first names', () => {
    expect(greetingName('John Doe')).toBe('John')
    expect(greetingName("O'Brien")).toBe("O'Brien")
    expect(greetingName('Jean-Luc Picard')).toBe('Jean-Luc')
    expect(greetingName('Zoë')).toBe('Zoë')
  })

  it('falls back to "there" for anything a mail client could link or misread', () => {
    expect(greetingName('www.evil-payday.com Offer')).toBe('there')
    expect(greetingName('J. Smith')).toBe('there')
    expect(greetingName('-')).toBe('there')
    expect(greetingName('')).toBe('there')
  })
})

describe('contact name validation', () => {
  const parse = (name: string) =>
    contactFormSchema.shape.name.safeParse(name).success

  it('accepts names with accents, apostrophes, hyphens and initials', () => {
    for (const name of ['José Núñez', "O'Brien", 'Jean-Luc', 'J. R. Smith']) expect(parse(name), name).toBe(true)
  })

  it('rejects newlines, tabs and the punctuation an old character range let through', () => {
    for (const name of ['Bob\nBcc', 'Bob\tX', 'Bob (admin)', 'a*b', 'a+b', 'a,b']) expect(parse(name), name).toBe(false)
  })
})
