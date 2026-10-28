import { describe, expect, it } from 'vitest'
import {
  autoReplySubject,
  contactEmailSubject,
  createAutoReplyHtml,
  createAutoReplyText,
  createContactEmailHtml,
  createContactEmailText,
  countryFor,
  greetingName,
} from '@/lib/email/templates'
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
    expect(html).toContain('Got your message <span')
  })

  it('escapes names exactly once (no double-encoded apostrophes)', () => {
    const html = createAutoReplyHtml({ ...hostile, name: "O'Brien Smith" })

    expect(html).toContain('Got your message, O&#39;Brien')
    expect(html).not.toContain('&amp;#39;')
  })

  it('never echoes the visitor message into the auto-reply, in HTML or text', () => {
    expect(createAutoReplyHtml(hostile)).not.toContain('alert(1)')
    expect(createAutoReplyText(hostile)).not.toContain('alert(1)')
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

describe('email subjects and plain text', () => {
  const maya: ContactFormData = { ...hostile, name: 'Maya Lin', email: 'maya@example.com', subject: 'project_opportunity', message: 'Hello\nthere' }

  it("leads the owner's subject with the topic and the sender", () => {
    expect(contactEmailSubject(maya)).toBe('🚀 New project: Maya Lin')
    expect(contactEmailSubject({ ...maya, subject: 'consulting' })).toBe('🎯 Consulting: Maya Lin')
    expect(contactEmailSubject({ ...maya, subject: 'networking' })).toBe('🤝 Networking: Maya Lin')
  })

  it("greets by first name in the auto-reply's subject, only when it's a plain word", () => {
    expect(autoReplySubject(maya)).toBe('👋 Got your message, Maya')
    expect(autoReplySubject({ ...maya, name: 'www.evil.com Offer' })).toBe('👋 Got your message')
  })

  it('gives both emails a plain-text version with the essentials', () => {
    const owner = createContactEmailText(maya, { autoReply: false, receivedAt: new Date('2026-10-28T23:12:00Z') })
    expect(owner).toContain('Email:   maya@example.com')
    expect(owner).toContain('Hello\nthere')
    expect(owner).toContain('Oct 28, 2026, 4:12 PM PDT')
    expect(owner).toContain('already got one today')
    const visitor = createAutoReplyText(maya)
    expect(visitor).toContain('Hey Maya,')
    expect(visitor).toContain('within 24 hours')
  })

  it('shows the time in Pacific and says whether an auto-reply went out', () => {
    const html = createContactEmailHtml(maya, { receivedAt: new Date('2026-10-28T23:12:00Z') })
    expect(html).toContain('Oct 28, 2026, 4:12 PM PDT')
    expect(html).toContain('An auto-reply went to maya@example.com.')
    // Addressed, titled with the topic, and greeted: "Hi Maya," and a blank line.
    expect(html).toContain('mailto:maya@example.com?subject=Re%3A%20New%20project%20opportunity&amp;body=Hi%20Maya%2C%0A%0A')
  })

  it('never uses an em dash in either email', () => {
    for (const out of [createContactEmailHtml(maya), createContactEmailText(maya), createAutoReplyHtml(maya), createAutoReplyText(maya)]) {
      expect(out).not.toContain('\u2014')
    }
  })

  it('loads no remote images: only inline attachments', () => {
    for (const html of [createContactEmailHtml(maya), createAutoReplyHtml(maya)]) {
      for (const [, src] of html.matchAll(/<img[^>]+src="([^"]+)"/g)) expect(src).toMatch(/^cid:icon-/)
    }
  })
})

describe("the sender's country, in the owner notification only", () => {
  const data: ContactFormData = { ...hostile, name: 'Maya Lin', email: 'maya@example.com', subject: 'consulting', message: 'Hi' }

  it('shows a flag and the English name for a valid code, in HTML and text', () => {
    expect(countryFor('GB')).toEqual({ flag: '🇬🇧', name: 'United Kingdom' })
    expect(createContactEmailHtml(data, { country: 'GB' })).toContain('🇬🇧 United Kingdom</td>')
    expect(createContactEmailText(data, { country: 'GB' })).toContain('Country: 🇬🇧 United Kingdom')
  })

  it('leaves the row out when the code is missing, unknown or malformed', () => {
    for (const country of [undefined, '', 'XX', 'gb', 'GBR', 'G1', '<b>', 'ZZ']) {
      expect(countryFor(country), String(country)).toBeNull()
      expect(createContactEmailHtml(data, { country })).not.toContain('>Country<')
      expect(createContactEmailText(data, { country })).not.toContain('Country:')
    }
  })

  it('never reaches the auto-reply', () => {
    expect(createAutoReplyHtml(data)).not.toContain('Country')
  })
})

describe("the auto-reply's cards", () => {
  for (const subject of ['project_opportunity', 'consulting', 'networking'] as const) {
    it(`link through n8builds.dev's counted links, with icons (${subject})`, () => {
      const html = createAutoReplyHtml({ ...hostile, name: 'Maya', subject })
      expect(html).toContain('href="https://n8builds.dev/portfolio?from=email"')
      expect(html).toContain('href="https://n8builds.dev/appturnity?from=email"')
      expect(html).toContain('href="https://n8builds.dev/?utm_source=contact-email&utm_medium=email"')
      for (const icon of ['lab', 'portfolio', 'appturnity', 'logo', 'github']) expect(html).toContain(`cid:icon-${icon}`)
      expect(createAutoReplyText({ ...hostile, name: 'Maya', subject })).toContain('https://n8builds.dev/appturnity?from=email')
    })
  }

  it('greets "there" in the reply button when the name is not a plain word', () => {
    expect(createContactEmailHtml({ ...hostile, name: 'www.evil.com Offer' })).toContain('body=Hi%20there%2C%0A%0A')
  })
})
