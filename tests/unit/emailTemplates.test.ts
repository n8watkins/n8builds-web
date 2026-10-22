import { describe, expect, it } from 'vitest'
import { createAutoReplyHtml, createContactEmailHtml } from '@/lib/email/templates'
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

  it('escapes the name in the auto-reply', () => {
    const html = createAutoReplyHtml({ ...hostile, name: '<b>Eve</b>' })

    expect(html).not.toContain('<b>Eve</b>')
    expect(html).toContain('&lt;b&gt;Eve&lt;/b&gt;')
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
