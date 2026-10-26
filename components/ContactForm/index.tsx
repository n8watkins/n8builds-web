'use client'

import React, { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import FadeIn from '@/components/ui/FadeIn'
import { loadContactResolver, useContactFormSubmit } from './useContactFormSubmit'
import { ContactFormFields } from './ContactFormFields'

import { SendingFallback, SuccessFallback } from './ContactFormFallbacks'
import { trackContactEvent } from '@/lib/analytics'

// The sending and success screens (and their motion animations) and the
// validation are not part of the page's first JavaScript: they load once the
// form scrolls into view (preloadScreens), so they are ready well before a
// message is sent. Each
// holds the form's height while it loads, so the card doesn't collapse, and
// if its chunk is gone (a deploy since the page was opened) a plain version
// still tells the visitor their message went out.
const screenPlaceholder = () => <div className="min-h-[370px]" />
const loadSending = () => import('./ContactFormLoading')
const loadSuccess = () => import('./ContactFormSuccess')
const preloadScreens = () =>
  Promise.all([loadContactResolver(), loadSending(), loadSuccess(), import('@/lib/motion-features')]).catch(() => {})
const ContactFormLoading = dynamic(
  () => loadSending().then((mod) => mod.ContactFormLoading, () => SendingFallback),
  { ssr: false, loading: screenPlaceholder }
)
const ContactFormSuccess = dynamic(
  () => loadSuccess().then((mod) => mod.ContactFormSuccess, () => SuccessFallback),
  { ssr: false, loading: screenPlaceholder }
)

interface ContactFormProps {
  className?: string
}

export default function ContactForm({ className }: ContactFormProps) {
  // Under `next dev` the server skips Turnstile, and the production site key
  // rejects localhost (Cloudflare error 110200), so don't render the widget.
  const turnstileSiteKey =
    process.env.NODE_ENV === 'development' ? '' : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

  if (!turnstileSiteKey && process.env.NODE_ENV === 'production') {
    console.error('Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY')
  }

  const {
    submissionState,
    setSubmissionState,
    errorMessage,
    isVerifying,
    liveRegionMessage,
    showConfetti,
    setShowConfetti,
    confettiKey,
    setConfettiKey,
    form,
    handleFormSubmit,
    onTurnstileToken,
    onTurnstileExpire,
  } = useContactFormSubmit()

  // Track form view when component mounts
  useEffect(() => {
    trackContactEvent('view')
  }, [])

  // Fetch the sending and success screens once the form is near the screen.
  const sentinel = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const form = sentinel.current?.parentElement
    if (!form || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        preloadScreens()
      },
      { rootMargin: '400px' }
    )
    observer.observe(form)
    return () => observer.disconnect()
  }, [])

  // Auto-reset state after timeout (30 seconds)
  useEffect(() => {
    if (submissionState === 'success' || submissionState === 'error') {
      const timeoutId = setTimeout(() => {
        setSubmissionState('idle')
        // Note: liveRegionMessage is managed by the hook and will be cleared on next submission
      }, 30000)

      return () => clearTimeout(timeoutId)
    }
  }, [submissionState, setSubmissionState])

  if (submissionState === 'submitting') {
    return <ContactFormLoading />
  }

  if (submissionState === 'success') {
    return (
      <ContactFormSuccess
        showConfetti={showConfetti}
        confettiKey={confettiKey}
        onSendAnother={() => {
          setSubmissionState('idle')
          setShowConfetti(false)
        }}
      />
    )
  }

  return (
    <FadeIn className={className}>
      <span ref={sentinel} hidden />
      {/* Accessibility: Live region for screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveRegionMessage}
      </div>

      <ContactFormFields
        form={form}
        submissionState={submissionState}
        errorMessage={errorMessage}
        isVerifying={isVerifying}
        onSubmit={handleFormSubmit}
        onTurnstileToken={onTurnstileToken}
        onTurnstileExpire={onTurnstileExpire}
        turnstileSiteKey={turnstileSiteKey}
      />
    </FadeIn>
  )
}
