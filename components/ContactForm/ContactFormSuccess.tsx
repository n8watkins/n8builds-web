'use client'

import React, { lazy, Suspense, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

// lottie-web is ~74 KB gzipped and only needed after a successful send, so the
// player and the confetti data load on demand instead of with the homepage.
// ContactFormLoading calls preloadConfetti() so both are ready by the time
// the success screen appears. React.lazy rather than next/dynamic: this screen
// only renders client-side, and next/dynamic here made Turbopack dev emit a
// preload link for a chunk it never serves (a 404 on every page load).
export function preloadConfetti() {
  // Never shown with reduced motion (see below), so don't fetch it either.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // Best effort: if the chunk can't load, ConfettiBoundary drops the confetti.
  // Unhandled, the rejection would surface as an uncaught error (and a Sentry
  // report) for something the visitor never notices.
  import('./ConfettiPlayer').catch(() => {})
}

const Confetti = lazy(() => import('./ConfettiPlayer'))

/**
 * The confetti is decoration. If its chunk fails to load (a deploy since the
 * page was opened, a flaky network), drop it instead of letting the error
 * reach ContactFormErrorBoundary, which would hide the success message for a
 * message that was in fact sent.
 */
class ConfettiBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

interface ContactFormSuccessProps {
  showConfetti: boolean
  confettiKey: number
  onSendAnother: () => void
}

export function ContactFormSuccess({ showConfetti, confettiKey, onSendAnother }: ContactFormSuccessProps) {
  // lottie-web ignores MotionConfig and the global reduced-motion CSS, so skip
  // the confetti entirely for visitors who asked for less motion.
  const reduceMotion = usePrefersReducedMotion()
  // The form that had focus is gone; move focus to the result so keyboard and
  // screen-reader users land on (and hear) it instead of the page body.
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center py-12 relative min-h-[600px] flex flex-col items-center justify-center"
    >
      {/* Confetti Animation */}
      {showConfetti && !reduceMotion && (
        <motion.div
          key={confettiKey}
          aria-hidden
          data-confetti
          className="absolute inset-0 pointer-events-none z-10 flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          <ConfettiBoundary>
            <Suspense fallback={null}>
              <Confetti />
            </Suspense>
          </ConfettiBoundary>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="relative z-20"
      >
        <motion.div
          className="text-6xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          🚀
        </motion.div>
        <motion.h3
          ref={heading}
          tabIndex={-1}
          className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2 focus:outline-none"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          Message sent successfully!
        </motion.h3>
        <motion.p
          className="text-slate-600 dark:text-slate-400 mb-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          I&apos;ll get back to you within 24 hours.
        </motion.p>
        <motion.button
          onClick={onSendAnother}
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors duration-200"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Send another message →
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
