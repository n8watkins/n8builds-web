import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEV_BYPASS_TOKEN, TURNSTILE_WAIT_MS, TurnstileGate } from '@/lib/security/turnstileGate'

function setup(enabled = true) {
  const mount = vi.fn()
  const onToken = vi.fn()
  const gate = new TurnstileGate(enabled, { mount, onToken })
  const widget = { execute: vi.fn(), reset: vi.fn() }
  return { gate, mount, onToken, widget }
}

describe('TurnstileGate: Turnstile runs only on intent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('mounts nothing and runs nothing until asked', () => {
    const { mount, widget } = setup()
    expect(mount).not.toHaveBeenCalled()
    expect(widget.execute).not.toHaveBeenCalled()
  })

  it('the first intent mounts the widget, which runs once it has rendered', () => {
    const { gate, mount, widget } = setup()
    gate.request()
    expect(mount).toHaveBeenCalledOnce()
    gate.loaded(widget)
    expect(widget.execute).toHaveBeenCalledOnce()
    expect(widget.reset).not.toHaveBeenCalled()
  })

  it('more intent while a challenge runs or a token is ready runs nothing more', () => {
    const { gate, widget, onToken } = setup()
    gate.request()
    gate.loaded(widget)
    gate.request()
    gate.request()
    expect(widget.execute).toHaveBeenCalledOnce()
    gate.succeeded('tok')
    gate.request()
    expect(widget.execute).toHaveBeenCalledOnce()
    expect(onToken).toHaveBeenCalledOnce()
    expect(gate.hasToken()).toBe(true)
  })

  it('a send with a token ready gets it at once', async () => {
    const { gate, widget } = setup()
    gate.request()
    gate.loaded(widget)
    gate.succeeded('tok')
    await expect(gate.getToken()).resolves.toBe('tok')
  })

  it('a send before any intent asks for a token and waits for it', async () => {
    const { gate, mount, widget } = setup()
    const token = gate.getToken()
    expect(mount).toHaveBeenCalledOnce()
    gate.loaded(widget)
    expect(widget.execute).toHaveBeenCalledOnce()
    gate.succeeded('tok')
    await expect(token).resolves.toBe('tok')
  })

  it('a send gives up with null when no token comes in time', async () => {
    const { gate } = setup()
    const token = gate.getToken()
    vi.advanceTimersByTime(TURNSTILE_WAIT_MS)
    await expect(token).resolves.toBeNull()
  })

  it('a spent token is never reused: the next request resets the widget and runs it again', async () => {
    const { gate, widget } = setup()
    gate.request()
    gate.loaded(widget)
    gate.succeeded('first')
    gate.spend()
    expect(gate.hasToken()).toBe(false)
    expect(widget.execute).toHaveBeenCalledOnce() // nothing in the background

    const next = gate.getToken()
    expect(widget.reset).toHaveBeenCalledOnce()
    expect(widget.execute).toHaveBeenCalledTimes(2)
    gate.succeeded('second')
    await expect(next).resolves.toBe('second')
  })

  it('an expired token is replaced on the next intent, not in the background', () => {
    const { gate, widget } = setup()
    gate.request()
    gate.loaded(widget)
    gate.succeeded('tok')
    gate.expired()
    expect(gate.hasToken()).toBe(false)
    expect(widget.execute).toHaveBeenCalledOnce()
    gate.request()
    expect(widget.reset).toHaveBeenCalledOnce()
    expect(widget.execute).toHaveBeenCalledTimes(2)
  })

  it('a token that expires while a send waits is replaced straight away', async () => {
    const { gate, widget } = setup()
    const token = gate.getToken()
    gate.loaded(widget)
    gate.expired()
    expect(widget.execute).toHaveBeenCalledTimes(2)
    gate.succeeded('fresh')
    await expect(token).resolves.toBe('fresh')
  })

  it('after an error the next request starts afresh', () => {
    const { gate, widget } = setup()
    gate.request()
    gate.loaded(widget)
    gate.failed()
    gate.request()
    expect(widget.reset).toHaveBeenCalledOnce()
    expect(widget.execute).toHaveBeenCalledTimes(2)
  })

  it('a widget that re-renders (its form came back after a send) runs only if a token is wanted', () => {
    const { gate, widget } = setup()
    gate.request()
    gate.loaded(widget)
    gate.succeeded('tok')
    gate.spend()
    gate.unloaded()

    const again = { execute: vi.fn(), reset: vi.fn() }
    gate.loaded(again)
    expect(again.execute).not.toHaveBeenCalled()

    // A retry asked for before the new widget rendered runs once it has.
    gate.unloaded()
    gate.request()
    const third = { execute: vi.fn(), reset: vi.fn() }
    gate.loaded(third)
    expect(third.execute).toHaveBeenCalledOnce()
    expect(third.reset).not.toHaveBeenCalled()
  })

  it('without a site key (next dev) it sends the bypass token and mounts nothing', async () => {
    const { gate, mount } = setup(false)
    gate.request()
    expect(mount).not.toHaveBeenCalled()
    expect(gate.hasToken()).toBe(true)
    await expect(gate.getToken()).resolves.toBe(DEV_BYPASS_TOKEN)
  })
})
