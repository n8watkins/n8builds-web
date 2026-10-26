'use client'

import React, { useEffect, useRef } from 'react'

/**
 * Plain versions of the sending and success screens, for when their own
 * chunks can't load (a deploy since the page was opened removes the old
 * ones): the visitor still learns their message went out.
 */

export function SendingFallback() {
  return (
    <div role="status" className="fade-in flex min-h-[600px] items-center justify-center text-lg font-semibold text-slate-200">
      Sending your message...
    </div>
  )
}

export function SuccessFallback({ onSendAnother }: { onSendAnother: () => void }) {
  // Focus moves to the result, as on the full success screen.
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  return (
    <div className="fade-in flex min-h-[600px] flex-col items-center justify-center py-12 text-center">
      <h3 ref={heading} tabIndex={-1} className="mb-2 text-2xl font-bold text-slate-200 focus:outline-none">
        Message sent successfully!
      </h3>
      <p className="mb-6 text-slate-400">I&apos;ll get back to you within 24 hours.</p>
      <button
        type="button"
        onClick={onSendAnother}
        className="text-cyan-400 underline underline-offset-2 transition-colors duration-200 hover:text-cyan-300"
      >
        Send another message →
      </button>
    </div>
  )
}
