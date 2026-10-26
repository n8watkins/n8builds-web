'use client'

import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { motion, AnimatePresence } from 'motion/react'
import { Turnstile } from '@marsidev/react-turnstile'
import { ContactInput } from '@/components/ui/ContactInput'
import { ContactSelect } from '@/components/ui/ContactSelect'
import { ContactTextarea } from '@/components/ui/ContactTextarea'
import { ContactFormData, subjectOptions } from '@/lib/validations/contact'
import { trackContactEvent } from '@/lib/analytics'
import { useHydrated } from '@/hooks/useHydrated'
import { SubmissionState } from './useContactFormSubmit'

interface ContactFormFieldsProps {
  form: UseFormReturn<ContactFormData>
  submissionState: SubmissionState
  errorMessage: string
  isVerifying: boolean
  onSubmit: () => Promise<void>
  onTurnstileToken: (token: string) => void
  onTurnstileExpire: () => void
  turnstileSiteKey: string
}

export function ContactFormFields({
  form,
  submissionState,
  errorMessage,
  isVerifying,
  onSubmit,
  onTurnstileToken,
  onTurnstileExpire,
  turnstileSiteKey,
}: ContactFormFieldsProps) {
  const {
    register,
    watch,
    formState: { errors, isSubmitting },
  } = form

  const charCount = watch('message')?.length || 0
  const isBusy = isSubmitting || isVerifying
  // The server-rendered button has no click handler until hydration, so a
  // click before then would be silently lost.
  const hydrated = useHydrated()

  const handleFieldFocus = (fieldName: string) => {
    trackContactEvent('field_focus', fieldName)
  }

  return (
    <form
      // Send is a real submit button, so Enter (or Go on a phone keyboard)
      // submits too. Before hydration the button is disabled and React isn't
      // listening yet, so nothing can be lost.
      onSubmit={(e) => {
        e.preventDefault()
        if (hydrated && !isBusy) onSubmit()
      }}
      className="space-y-4 md:space-y-6 pt-4 md:pt-6 min-h-[600px]"
    >
      {/* Security: Honeypot field - hidden from users */}
      <div className="hidden">
        <input
          type="text"
          {...register('honeypot')}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </div>

      <motion.div
        className="grid grid-cols-1 gap-4 md:gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
        >
          <ContactInput
            {...register('name')}
            id="name"
            label="Name"
            emoji="👤"
            placeholder="Jane Smith"
            error={errors.name?.message}
            onFocus={() => handleFieldFocus('name')}
            autoComplete="name"
            disabled={isSubmitting}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25, ease: "easeOut" }}
        >
          <ContactInput
            {...register('email')}
            id="email"
            type="email"
            label="Email"
            emoji="📧"
            placeholder="jane@company.com"
            error={errors.email?.message}
            onFocus={() => handleFieldFocus('email')}
            autoComplete="email"
            disabled={isSubmitting}
          />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
      >
        <ContactSelect
          {...register('subject')}
          id="subject"
          // Start on the placeholder: without this the browser silently
          // pre-selects the first subject.
          defaultValue=""
          label="Topic"
          emoji="💼"
          options={subjectOptions}
          error={errors.subject?.message}
          onFocus={() => handleFieldFocus('subject')}
          disabled={isSubmitting}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
      >
        <ContactTextarea
          {...register('message')}
          id="message"
          label="Message"
          emoji="💬"
          placeholder="What are you building, and where can I help?"
          rows={5}
          maxChars={1000}
          charCount={charCount}
          error={errors.message?.message}
          onFocus={() => handleFieldFocus('message')}
          disabled={isSubmitting}
        />
      </motion.div>

      <AnimatePresence>
        {submissionState === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <p className="text-sm leading-relaxed text-red-800 dark:text-red-200 flex items-start gap-3">
              <span aria-hidden="true" className="text-base leading-snug">😅</span>
              <span>{errorMessage}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="text-center sm:px-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.45, ease: "easeOut" }}
      >
        {/*
          Invisible Cloudflare Turnstile widget.
          appearance: 'interaction-only' keeps it hidden unless a challenge is
          truly required. On success it hands its token to the form, which
          waits for one if the visitor clicks Send first. Only rendered when a
          site key is configured; otherwise useContactFormSubmit falls back to a
          placeholder token.
        */}
        {turnstileSiteKey && (
          <Turnstile
            siteKey={turnstileSiteKey}
            onSuccess={(token) => {
              onTurnstileToken(token)
              trackContactEvent('turnstile_complete')
            }}
            onExpire={onTurnstileExpire}
            options={{ appearance: 'interaction-only', refreshExpired: 'auto' }}
            className="absolute"
          />
        )}

        <button
          type="submit"
          disabled={!hydrated || isBusy}
          className={`relative inline-flex h-12 w-full md:w-60 overflow-hidden rounded-lg p-px focus:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all duration-200 ${
            isBusy ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#A5F3FC_0%,#2563EB_50%,#A5F3FC_100%)]" />
          <span className="inline-flex h-full w-full items-center justify-center whitespace-nowrap rounded-lg bg-slate-950 px-7 text-sm font-medium text-white backdrop-blur-3xl gap-2 pointer-events-none">
            {isVerifying ? "Verifying... 🛡️" : isSubmitting ? "Sending... 🚀" : "Send Message 🚀"}
          </span>
        </button>
      </motion.div>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400 pb-8">
        Prefer email? Reach me directly at{' '}
        <a
          href="mailto:contact@n8builds.dev"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
        >
          contact@n8builds.dev
        </a>
      </p>
    </form>
  )
}
