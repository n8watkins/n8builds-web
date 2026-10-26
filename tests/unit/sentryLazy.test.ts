import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * lib/sentry/lazy.ts: the browser SDK loads after the page is idle, and errors
 * raised before that are queued and sent once it is up, so none are lost.
 */
const captureException = vi.fn()
const captureRouterTransitionStart = vi.fn()
vi.mock('@/lib/sentry/init', () => ({ Sentry: { captureException, captureRouterTransitionStart } }))

async function freshModule() {
  vi.resetModules()
  return import('@/lib/sentry/lazy')
}

describe('lazy Sentry', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://key@o1.ingest.sentry.io/1')
    captureException.mockClear()
    captureRouterTransitionStart.mockClear()
  })
  afterEach(() => vi.unstubAllEnvs())

  it('queues errors raised before the SDK loads and sends them, in order, once it does', async () => {
    const { captureError, loadSentry } = await freshModule()
    const first = new Error('first')
    captureError(first, { tags: { where: 'boundary' } })
    captureError('second')
    expect(captureException).not.toHaveBeenCalled()

    await loadSentry()
    expect(captureException.mock.calls).toEqual([
      [first, { tags: { where: 'boundary' } }],
      ['second', undefined],
    ])
  })

  it('sends straight away once loaded, and loads only once', async () => {
    const { captureError, loadSentry } = await freshModule()
    const a = loadSentry()
    const b = loadSentry()
    expect(a).toBe(b)
    await a
    captureError('later')
    expect(captureException).toHaveBeenCalledWith('later', undefined)
  })

  it('does nothing without a DSN, so nothing piles up', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '')
    const { captureError, loadSentry } = await freshModule()
    captureError(new Error('ignored'))
    await loadSentry()
    expect(captureException).not.toHaveBeenCalled()
  })

  it('ignores router transitions until the SDK is up, then forwards them', async () => {
    const { captureRouterTransitionStart: forward, loadSentry } = await freshModule()
    forward('/blog', 'push')
    expect(captureRouterTransitionStart).not.toHaveBeenCalled()
    await loadSentry()
    forward('/blog', 'push')
    expect(captureRouterTransitionStart).toHaveBeenCalledWith('/blog', 'push')
  })
})
