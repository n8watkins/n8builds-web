import { useState, useRef, useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import type { ContactFormData } from '@/lib/validations/contact'
import { trackContactEvent } from '@/lib/analytics'
import { logger } from '@/lib/logger'
import type { TurnstileOnIntent } from '@/hooks/useTurnstileOnIntent'

// The schema (zod) is not in the page's first JavaScript: it loads with the
// form's other on-demand parts once the form scrolls into view
// (components/ContactForm/index.tsx), or at the latest on first validation.
// If it can't load (a deploy since the page was opened removes old chunks),
// the form skips client-side checks: the server validates every message anyway.
export const loadContactResolver = () => import('@/lib/validations/contactResolver')

const lazyResolver: Resolver<ContactFormData> = async (values, context, options) => {
  try {
    const { contactResolver } = await loadContactResolver()
    return contactResolver(values, context, options)
  } catch {
    return { values, errors: {} }
  }
}

export type SubmissionState = 'idle' | 'submitting' | 'success' | 'error'

const DEFAULT_ERROR_MESSAGE = 'Oops! Something went wrong. Please try again or email me directly.'

// Vercel's firewall rate limit answers before the app does, with its own JSON
// body ({ error: { code, message } }), so a 429 without our message gets this.
const RATE_LIMITED_MESSAGE =
  'Too many messages from your connection in the last minute. Please wait a minute and try again, or email me directly at contact@n8builds.dev.'

/** The visitor-facing fields, in form order (their ids match their names). */
const VISIBLE_FIELDS = ['name', 'email', 'subject', 'message'] as const

const VERIFICATION_FAILED_MESSAGE =
  "We couldn't verify your browser (an ad or privacy blocker can cause this). Please refresh and try again, or email me directly at contact@n8builds.dev."

/** An error whose message came from the API and is safe to show the visitor. */
class SubmissionError extends Error {}

interface UseContactFormSubmitReturn {
  submissionState: SubmissionState
  setSubmissionState: (state: SubmissionState) => void
  errorMessage: string
  isVerifying: boolean
  liveRegionMessage: string
  setLiveRegionMessage: (message: string) => void
  showConfetti: boolean
  setShowConfetti: (show: boolean) => void
  confettiKey: number
  setConfettiKey: (key: number) => void
  form: ReturnType<typeof useForm<ContactFormData>>
  handleFormSubmit: () => Promise<void>
}

/** Submission, with Turnstile from `useTurnstileOnIntent` (run on the visitor's first focus or input). */
export function useContactFormSubmit(turnstile: Pick<TurnstileOnIntent, 'getToken' | 'hasToken' | 'spend' | 'prepare'>): UseContactFormSubmitReturn {
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)
  const isMountedRef = useRef(true)

  // Track component mount status to prevent setState on unmounted component
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const form = useForm<ContactFormData>({
    resolver: lazyResolver,
    // We focus the first invalid field ourselves (focusFirstError): the
    // browser's own focus scroll leaves it under the fixed navbar in Safari,
    // which ignores scroll-margin there.
    shouldFocusError: false,
    defaultValues: {
      name: '',
      email: '',
      subject: undefined,
      message: '',
      turnstile: '',
      honeypot: '',
    },
  })

  const { handleSubmit, setValue, trigger, reset } = form

  const onSubmit = async (data: ContactFormData) => {
    try {
      if (!isMountedRef.current) return

      // Turnstile tokens are single-use: this one is spent once sent. A failed
      // send asks for a fresh one straight away (below), as the visitor will retry.
      turnstile.spend()
      setSubmissionState('submitting')
      setErrorMessage('')
      setLiveRegionMessage('Submitting your message...')
      trackContactEvent('submit_attempt')

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      // Check mount status immediately after async operation
      if (!isMountedRef.current) return

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // Check mount status again after another async operation
        if (!isMountedRef.current) return

        logger.error('Form submission error:', errorData)
        // Only our API's own messages are text; anything else (an edge error
        // object, an empty body) gets a fixed message instead of being shown raw.
        const serverMessage = typeof errorData.error === 'string' ? errorData.error : ''
        throw new SubmissionError(
          serverMessage || (response.status === 429 ? RATE_LIMITED_MESSAGE : DEFAULT_ERROR_MESSAGE)
        )
      }

      // Check before success state updates
      if (!isMountedRef.current) return

      setSubmissionState('success')
      setLiveRegionMessage('Message sent successfully! I will get back to you within 24 hours.')
      trackContactEvent('submit_success')

      // Trigger confetti animation
      setShowConfetti(true)
      setConfettiKey(prev => prev + 1)

      reset()

    } catch (error) {
      if (!isMountedRef.current) return

      logger.error('Contact form error:', error)
      // Server messages are written for visitors; network failures etc. are not.
      const message = error instanceof SubmissionError ? error.message : DEFAULT_ERROR_MESSAGE
      setSubmissionState('error')
      setErrorMessage(message)
      setLiveRegionMessage(message)
      trackContactEvent('submit_error', undefined, { error: String(error) })
      turnstile.prepare()
    }
  }

  /** Bring the first invalid field to the middle of the screen and focus it. */
  // Reads the form's live state (getFieldState), not formState: that is a
  // snapshot from the last render, which validation run in this same handler
  // hasn't updated yet.
  const focusFirstError = () => {
    const field = VISIBLE_FIELDS.find((name) => form.getFieldState(name).invalid)
    const el = field && document.getElementById(field)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
    el.focus({ preventScroll: true })
  }

  const handleFormSubmit = async () => {
    if (!turnstile.hasToken()) {
      // No token yet (Turnstile still working, expired, or blocked). Validate the
      // visible fields first so errors show immediately, then wait for the token.
      turnstile.prepare()
      const fieldsValid = await trigger([...VISIBLE_FIELDS])
      if (!fieldsValid) return focusFirstError()
      setIsVerifying(true)
      setLiveRegionMessage('Verifying...')
    }
    const token = await turnstile.getToken()
    if (!isMountedRef.current) return
    setIsVerifying(false)

    if (!token) {
      setSubmissionState('error')
      setErrorMessage(VERIFICATION_FAILED_MESSAGE)
      setLiveRegionMessage(VERIFICATION_FAILED_MESSAGE)
      trackContactEvent('submit_error', undefined, { error: 'turnstile_timeout' })
      return
    }
    setValue('turnstile', token)

    // Validate before handleSubmit: it disables the inputs (isSubmitting) while
    // it runs, and a disabled field can't take focus.
    if (!(await trigger())) return focusFirstError()
    handleSubmit(onSubmit)()
  }

  return {
    submissionState,
    setSubmissionState,
    errorMessage,
    isVerifying,
    liveRegionMessage,
    setLiveRegionMessage,
    showConfetti,
    setShowConfetti,
    confettiKey,
    setConfettiKey,
    form,
    handleFormSubmit,
  }
}
