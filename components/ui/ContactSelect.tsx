import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { CONTROL_SCROLL_MARGIN, controlProps, errorId } from './FieldWrapper'

interface ContactSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  emoji?: string
  options: { value: string; label: string }[]
}

export const ContactSelect = forwardRef<HTMLSelectElement, ContactSelectProps>(
  ({ label, error, emoji, options, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label
          htmlFor={props.id}
          className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1"
        >
          {emoji && <span>{emoji}</span>}
          {label}
        </label>
        <select
          ref={ref}
          className={cn(
            "w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600",
            "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
            "focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
            "transition-all duration-200",
            "hover:border-slate-400 dark:hover:border-slate-500",
            CONTROL_SCROLL_MARGIN,
            // Placeholder still selected: muted, like the other fields' placeholders.
            "has-[option[value='']:checked]:text-slate-500 dark:has-[option[value='']:checked]:text-slate-400",
            error && "border-red-500 dark:border-red-400 focus:ring-red-500",
            className
          )}
          {...controlProps(props.id, error)}
          {...props}
        >
          <option value="" disabled>Select an option...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-slate-900 dark:text-slate-100">
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={props.id && errorId(props.id)} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <span aria-hidden="true">⚠️</span>
            {error}
          </p>
        )}
      </div>
    )
  }
)

ContactSelect.displayName = 'ContactSelect'