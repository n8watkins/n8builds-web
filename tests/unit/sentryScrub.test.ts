import { describe, expect, it } from 'vitest'
import type { ErrorEvent } from '@sentry/nextjs'
import { scrubContactBody } from '@/lib/sentry-scrub'

const event = (url: string) =>
  ({ type: undefined, request: { url, data: '{"email":"a@b.co"}', cookies: { a: '1' } } }) as ErrorEvent

describe('scrubContactBody', () => {
  it('drops the body and cookies of contact submissions', () => {
    const scrubbed = scrubContactBody(event('https://n8builds.dev/api/contact'))
    expect(scrubbed.request?.data).toBeUndefined()
    expect(scrubbed.request?.cookies).toBeUndefined()
    expect(scrubbed.request?.url).toBe('https://n8builds.dev/api/contact')
  })

  it('leaves other events alone', () => {
    expect(scrubContactBody(event('https://n8builds.dev/blog')).request?.data).toBeDefined()
  })
})
