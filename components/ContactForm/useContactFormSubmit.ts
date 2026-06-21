import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactFormSchema, ContactFormData } from '@/lib/validations/contact'
import { trackContactEvent } from '@/lib/analytics'
import { logger } from '@/lib/logger'

export type SubmissionState = 'idle' | 'submitting' | 'success' | 'error'

interface UseContactFormSubmitReturn {
  submissionState: SubmissionState
  setSubmissionState: (state: SubmissionState) => void
  liveRegionMessage: string
  setLiveRegionMessage: (message: string) => void
  showConfetti: boolean
  setShowConfetti: (show: boolean) => void
  confettiKey: number
  setConfettiKey: (key: number) => void
  form: ReturnType<typeof useForm<ContactFormData>>
  handleFormSubmit: () => Promise<void>
}

export function useContactFormSubmit(): UseContactFormSubmitReturn {
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')
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
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: undefined,
      message: '',
      turnstile: '',
      honeypot: '',
    },
  })

  const { handleSubmit, setValue, reset } = form

  const onSubmit = async (data: ContactFormData) => {
    try {
      if (!isMountedRef.current) return

      setSubmissionState('submitting')
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
        const errorData = await response.json()

        // Check mount status again after another async operation
        if (!isMountedRef.current) return

        logger.error('Form submission error:', errorData)

        if (response.status === 429 || errorData.type === 'rate_limit') {
          setLiveRegionMessage(errorData.error || 'Rate limit exceeded. Please try again later or email me directly.')
        }

        throw new Error(errorData.error || 'Failed to send message')
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
      setSubmissionState('error')
      setLiveRegionMessage('Failed to send message. Please try again or email me directly.')
      trackContactEvent('submit_error', undefined, { error: String(error) })
    }
  }

  const handleFormSubmit = async () => {
    // Turnstile runs invisibly via the <Turnstile> widget rendered in the form,
    // writing its token into the `turnstile` field via onSuccess. In development,
    // or when no site key is configured (pre-launch), the widget is not rendered,
    // so we fall back to a dev-bypass token so submission still works
    // (protected only by honeypot + rate limiting until keys are added).
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    if (isDevelopment) {
      setValue('turnstile', 'dev_bypass_token')
    }

    // Trigger form validation and submission
    handleSubmit(onSubmit)()
  }

  return {
    submissionState,
    setSubmissionState,
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
