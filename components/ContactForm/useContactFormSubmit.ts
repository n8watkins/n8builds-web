import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactFormSchema, ContactFormData } from '@/lib/validations/contact'
import { trackContactEvent } from '@/lib/analytics'
import { logger } from '@/lib/logger'

export type SubmissionState = 'idle' | 'submitting' | 'success' | 'error'

const DEFAULT_ERROR_MESSAGE = 'Oops! Something went wrong. Please try again or email me directly.'

// How long to wait for Turnstile to issue a token after the visitor clicks Send.
const TURNSTILE_WAIT_MS = 15_000

/** The visitor-facing fields, in form order (their ids match their names). */
const VISIBLE_FIELDS = ['name', 'email', 'subject', 'message'] as const

const VERIFICATION_FAILED_MESSAGE =
  "We couldn't verify your browser (an ad or privacy blocker can cause this). Please refresh and try again, or email me directly at nathancwatkins23@gmail.com."

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
  onTurnstileToken: (token: string) => void
  onTurnstileExpire: () => void
}

export function useContactFormSubmit(): UseContactFormSubmitReturn {
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)
  const isMountedRef = useRef(true)
  const tokenWaiterRef = useRef<((token: string | null) => void) | null>(null)

  // Track component mount status to prevent setState on unmounted component
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
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

  const { handleSubmit, setValue, getValues, trigger, reset } = form

  const onTurnstileToken = useCallback((token: string) => {
    setValue('turnstile', token)
    tokenWaiterRef.current?.(token)
    tokenWaiterRef.current = null
  }, [setValue])

  const onTurnstileExpire = useCallback(() => {
    setValue('turnstile', '')
  }, [setValue])

  /** Resolve with the current Turnstile token, waiting for one if needed. */
  const waitForTurnstileToken = (): Promise<string | null> => {
    const current = getValues('turnstile')
    if (current) return Promise.resolve(current)

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        tokenWaiterRef.current = null
        resolve(null)
      }, TURNSTILE_WAIT_MS)
      tokenWaiterRef.current = (token) => {
        clearTimeout(timer)
        resolve(token)
      }
    })
  }

  const onSubmit = async (data: ContactFormData) => {
    try {
      if (!isMountedRef.current) return

      // Turnstile tokens are single-use: this one is spent once sent. The form
      // remounts after submitting, and the new widget issues a fresh token.
      setValue('turnstile', '')
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
        throw new SubmissionError(errorData.error || DEFAULT_ERROR_MESSAGE)
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
    }
  }

  /** Bring the first invalid field to the middle of the screen and focus it. */
  const focusFirstError = (errors: FieldErrors<ContactFormData>) => {
    const field = VISIBLE_FIELDS.find((name) => errors[name])
    const el = field && document.getElementById(field)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
    el.focus({ preventScroll: true })
  }

  const handleFormSubmit = async () => {
    // Turnstile runs invisibly via the <Turnstile> widget rendered in the form,
    // writing its token into the `turnstile` field via onTurnstileToken. Under
    // `next dev`, or when no site key is configured, the widget is not
    // rendered, so a placeholder token is used (the server skips Turnstile in
    // dev and rejects it everywhere else).
    const widgetDisabled = process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    if (widgetDisabled) {
      setValue('turnstile', 'dev_bypass_token')
    } else if (!getValues('turnstile')) {
      // No token yet (Turnstile still working, or blocked). Validate the visible
      // fields first so errors show immediately, then wait for the token.
      const fieldsValid = await trigger([...VISIBLE_FIELDS])
      if (!fieldsValid) return focusFirstError(form.formState.errors)

      setIsVerifying(true)
      setLiveRegionMessage('Verifying...')
      const token = await waitForTurnstileToken()
      if (!isMountedRef.current) return
      setIsVerifying(false)

      if (!token) {
        setSubmissionState('error')
        setErrorMessage(VERIFICATION_FAILED_MESSAGE)
        setLiveRegionMessage(VERIFICATION_FAILED_MESSAGE)
        trackContactEvent('submit_error', undefined, { error: 'turnstile_timeout' })
        return
      }
    }

    // Validate before handleSubmit: it disables the inputs (isSubmitting) while
    // it runs, and a disabled field can't take focus.
    if (!(await trigger())) return focusFirstError(form.formState.errors)
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
    onTurnstileToken,
    onTurnstileExpire,
  }
}
