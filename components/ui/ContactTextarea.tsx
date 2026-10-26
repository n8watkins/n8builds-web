import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { FieldWrapper, controlProps } from './FieldWrapper'

interface ContactTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  emoji?: string
  charCount?: number
  maxChars?: number
}

export const ContactTextarea = forwardRef<HTMLTextAreaElement, ContactTextareaProps>(
  ({ label, error, emoji, charCount, maxChars, className, ...props }, ref) => {
    return (
      <FieldWrapper
        label={label}
        error={error}
        emoji={emoji}
        id={props.id}
        charCount={charCount}
        maxChars={maxChars}
      >
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600',
            'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100',
            'placeholder-slate-500 dark:placeholder-slate-400',
            'focus:ring-2 focus:ring-cyan-500 focus:border-transparent',
            'transition-all duration-200 resize-y min-h-[112px]',
            'hover:border-slate-400 dark:hover:border-slate-500',
            error && 'border-red-500 dark:border-red-400 focus:ring-red-500',
            className
          )}
          {...controlProps(props.id, error)}
          maxLength={maxChars}
          {...props}
        />
      </FieldWrapper>
    )
  }
)

ContactTextarea.displayName = 'ContactTextarea'