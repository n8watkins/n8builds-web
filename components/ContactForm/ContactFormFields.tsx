'use client'

import React, { useEffect, useRef } from 'react'
import { UseFormReturn } from 'react-hook-form'
import FadeIn from '@/components/ui/FadeIn'
import { Turnstile } from '@marsidev/react-turnstile'
import { ContactInput } from '@/components/ui/ContactInput'
import { ContactTopicCards } from '@/components/ui/ContactTopicCards'
import { ContactTextarea } from '@/components/ui/ContactTextarea'
import type { ContactFormData } from '@/lib/validations/contact'
import { subjectOptions } from '@/lib/validations/contactOptions'
import { CONTACT_PRESETS, CONTACT_PRESET_EVENT, isContactPresetId } from '@/lib/contactPresets'
import { trackContactEvent } from '@/lib/analytics'
import { useHydrated } from '@/hooks/useHydrated'
import { useNearViewport } from '@/hooks/useNearViewport'
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
    setValue,
    getValues,
    formState: { errors, isSubmitting, isSubmitted },
  } = form

  const charCount = watch('message')?.length || 0
  const isBusy = isSubmitting || isVerifying
  // The server-rendered button has no click handler until hydration, so a
  // click before then would be silently lost.
  const hydrated = useHydrated()
  // Turnstile loads once the form is near the screen, not with the page, as
  // the waitlist and quote forms do (useNearViewport): its challenge ran about
  // a second of script on a phone at every homepage load, for a form at the
  // bottom of the page. A Send before it has a token waits for one.
  const [formRef, near] = useNearViewport<HTMLFormElement>()

  // The topic radios are uncontrolled (ContactTopicCards): one picked before
  // hydration, on a slow connection, is only in the DOM, so adopt it.
  const topicsRef = useRef<HTMLFieldSetElement>(null)
  useEffect(() => {
    const picked = topicsRef.current?.querySelector<HTMLInputElement>('input:checked')?.value
    if (picked) setValue('subject', picked as ContactFormData['subject'])
  }, [setValue])
  // A preset from a link (lib/contactPresets.ts): `?inquiry=<id>` on arrival,
  // or the contact:preset event from a link on this page. It picks the topic
  // and starts the message, unless the visitor has already typed one.
  useEffect(() => {
    const apply = (id: unknown) => {
      if (!isContactPresetId(id)) return
      const preset = CONTACT_PRESETS[id]
      const radio = topicsRef.current?.querySelector<HTMLInputElement>(`input[value="${preset.subject}"]`)
      if (radio) radio.checked = true
      setValue('subject', preset.subject, { shouldDirty: true })
      if (!getValues('message')?.trim()) setValue('message', preset.message, { shouldDirty: true })
    }
    const url = new URL(window.location.href)
    const inquiry = url.searchParams.get('inquiry')
    if (inquiry) {
      apply(inquiry)
      // Read once: the address bar goes back to the plain page.
      url.searchParams.delete('inquiry')
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    }
    const onPreset = (e: Event) => apply((e as CustomEvent<unknown>).detail)
    window.addEventListener(CONTACT_PRESET_EVENT, onPreset)
    return () => window.removeEventListener(CONTACT_PRESET_EVENT, onPreset)
  }, [setValue, getValues])

  const pickTopic = (value: string) =>
    setValue('subject', value as ContactFormData['subject'], { shouldDirty: true, shouldValidate: isSubmitted })

  const handleFieldFocus = (fieldName: string) => {
    trackContactEvent('field_focus', fieldName)
  }

  return (
    <form
      ref={formRef}
      // Send is a real submit button, so Enter (or Go on a phone keyboard)
      // submits too. Before hydration the button is disabled and React isn't
      // listening yet, so nothing can be lost.
      onSubmit={(e) => {
        e.preventDefault()
        if (hydrated && !isBusy) onSubmit()
      }}
      id="contact-form"
      className="space-y-5 min-h-[370px]"
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

      {/* The fields fade up in a stagger, in CSS (FadeIn), so the form
          needs no animation library. */}
      <FadeIn delay={0.1} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FadeIn delay={0.2}>
          <ContactInput
            {...register('name')}
            id="name"
            label="Name"
            placeholder="Jane Smith"
            error={errors.name?.message}
            onFocus={() => handleFieldFocus('name')}
            autoComplete="name"
            disabled={isSubmitting}
          />
        </FadeIn>

        <FadeIn delay={0.25}>
          <ContactInput
            {...register('email')}
            id="email"
            type="email"
            label="Email"
            placeholder="jane@company.com"
            error={errors.email?.message}
            onFocus={() => handleFieldFocus('email')}
            autoComplete="email"
            disabled={isSubmitting}
          />
        </FadeIn>
      </FadeIn>

      <FadeIn delay={0.3}>
        <ContactTopicCards
          ref={topicsRef}
          id="subject"
          name="subject"
          onChange={pickTopic}
          label="Topic"
          options={subjectOptions}
          error={errors.subject?.message}
          onFocus={() => handleFieldFocus('subject')}
          disabled={isSubmitting}
        />
      </FadeIn>

      <FadeIn delay={0.4}>
        <ContactTextarea
          {...register('message')}
          id="message"
          label="Message"
          placeholder="What are you building, and where can I help?"
          rows={4}
          maxChars={1000}
          charCount={charCount}
          error={errors.message?.message}
          onFocus={() => handleFieldFocus('message')}
          disabled={isSubmitting}
        />
      </FadeIn>

      {submissionState === 'error' && (
        <div
          className="fade-in bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <p className="text-sm leading-relaxed text-red-800 dark:text-red-200 flex items-start gap-3">
            <span aria-hidden="true" className="text-base leading-snug">😅</span>
            <span>{errorMessage}</span>
          </p>
        </div>
      )}

      <FadeIn delay={0.45} className="flex flex-col items-center gap-3 pt-1">
        {/*
          Invisible Cloudflare Turnstile widget.
          appearance: 'interaction-only' keeps it hidden unless a challenge is
          truly required. On success it hands its token to the form, which
          waits for one if the visitor clicks Send first. Only rendered when a
          site key is configured; otherwise useContactFormSubmit falls back to a
          placeholder token.
        */}
        {turnstileSiteKey && near && (
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
          className={`relative inline-flex h-12 w-full sm:w-60 shrink-0 overflow-hidden rounded-lg p-px focus:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all duration-200 ${
            isBusy ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#A5F3FC_0%,#2563EB_50%,#A5F3FC_100%)]" />
          <span className="inline-flex h-full w-full items-center justify-center whitespace-nowrap rounded-lg bg-slate-950 px-7 text-sm font-medium text-white backdrop-blur-3xl gap-2 pointer-events-none">
            {isVerifying ? "Verifying... 🛡️" : isSubmitting ? "Sending... 🚀" : "Send Message 🚀"}
          </span>
        </button>
        <p className="text-center text-sm text-balance text-slate-600 dark:text-slate-400">
          Prefer email?{' '}
          <a
            href="mailto:contact@n8builds.dev"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
          >
            contact@n8builds.dev
          </a>
        </p>
      </FadeIn>

    </form>
  )
}
