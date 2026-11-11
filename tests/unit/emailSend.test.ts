import { beforeEach, describe, expect, it, vi } from 'vitest'

const send = vi.fn()
let env: Record<string, unknown> = {}

vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: () => ({ env }) }))
vi.mock('@/lib/security/testMode', () => ({ isContactTestMode: () => false }))

const { sendEmail, EmailRefusedError } = await import('@/lib/email/send')

const email = {
  kind: 'contact-reply' as const,
  to: 'visitor@example.com',
  replyTo: 'contact@n8builds.dev',
  subject: 'Thanks',
  html: '<p>Thanks</p>',
  text: 'Thanks',
  images: ['logo' as const],
}

beforeEach(() => {
  send.mockReset()
  env = { MAILROOM: { send } }
})

describe('sendEmail (mailroom)', () => {
  it('sends through MAILROOM with the kind, a fresh key and the inline icons', async () => {
    send.mockResolvedValue({ ok: true, messageId: 'm-1' })
    await expect(sendEmail(email)).resolves.toBe('m-1')
    expect(send).toHaveBeenCalledTimes(1)
    const request = send.mock.calls[0][0]
    expect(request).toMatchObject({
      kind: 'contact-reply',
      to: 'visitor@example.com',
      replyTo: 'contact@n8builds.dev',
      subject: 'Thanks',
      text: 'Thanks',
      html: '<p>Thanks</p>',
      fromName: 'Nathan Watkins',
    })
    expect(request.key).toMatch(/^contact-reply-[0-9a-f-]{36}$/)
    expect(request.attachments).toEqual([expect.objectContaining({ contentId: 'icon-logo', disposition: 'inline' })])
    // The sender is mailroom's own for the app: contact@n8builds.dev.
    expect(request).not.toHaveProperty('from')
  })

  it('treats a refusal as a failure and never retries it', async () => {
    send.mockResolvedValue({ ok: false, code: 'cap_app_day', retryable: true, message: 'cap' })
    await expect(sendEmail(email)).rejects.toBeInstanceOf(EmailRefusedError)
    await expect(sendEmail(email)).rejects.toMatchObject({ code: 'cap_app_day' })
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('fails closed without the binding', async () => {
    env = {}
    await expect(sendEmail(email)).rejects.toThrow('MAILROOM binding is missing')
  })
})
