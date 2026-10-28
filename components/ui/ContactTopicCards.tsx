import React, { forwardRef } from 'react'
import type { IconType } from 'react-icons'
import { LuCompass, LuHandshake, LuRocket } from 'react-icons/lu'
import { cn } from '@/lib/utils'
import { controlProps, errorId } from './FieldWrapper'

// The cards' faces, by subject value (the values and the emails' labels live
// in lib/validations/contactOptions.ts).
const CARDS: Record<string, { label: string; hint: string; icon: IconType }> = {
  project_opportunity: { label: 'New project', hint: 'Something to build', icon: LuRocket },
  consulting: { label: 'Consulting', hint: 'Advice or a review', icon: LuCompass },
  networking: { label: 'Networking', hint: 'Just saying hi', icon: LuHandshake },
}

interface ContactTopicCardsProps {
  id: string
  name: string
  label: string
  error?: string
  options: { value: string; label: string }[]
  disabled?: boolean
  className?: string
  onFocus?: () => void
  onChange: (value: string) => void
}

/**
 * The topic as three cards, one click each: a native radio group (arrow keys
 * move between them, Tab enters and leaves it), styled like the other fields.
 * The radios are uncontrolled and report changes through onChange, so a card
 * picked before hydration stays picked (the ref on the fieldset lets the form
 * read it).
 */
export const ContactTopicCards = forwardRef<HTMLFieldSetElement, ContactTopicCardsProps>(
  ({ id, name, label, error, options, disabled, className, onFocus, onChange }, ref) => (
    <fieldset ref={ref} className={cn('space-y-2', className)}>
      <legend className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">{label}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2.5">
        {options.map((option, i) => {
          const card = CARDS[option.value] ?? { label: option.label, hint: '', icon: LuRocket }
          const Icon = card.icon
          return (
            <label
              key={option.value}
              className={cn(
                'group relative flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 sm:flex-col sm:items-start sm:gap-2 sm:px-3.5 sm:py-3',
                'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800',
                'transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none',
                'hover:border-slate-400 dark:hover:border-slate-500',
                'has-checked:border-cyan-400 has-checked:bg-cyan-400/8 dark:has-checked:border-cyan-400 dark:has-checked:bg-cyan-400/8',
                'has-focus-visible:ring-2 has-focus-visible:ring-cyan-400/60',
                'has-disabled:cursor-not-allowed has-disabled:opacity-60',
                error && 'border-red-500 dark:border-red-400'
              )}
            >
              <input
                type="radio"
                // The first radio carries the field's id, so the error message and a
                // focus on the first invalid field land on the group.
                id={i === 0 ? id : `${id}-${option.value}`}
                value={option.value}
                name={name}
                className="peer sr-only"
                disabled={disabled}
                onFocus={onFocus}
                onChange={(e) => e.target.checked && onChange(e.target.value)}
                {...controlProps(id, error)}
              />
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-md',
                  'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300',
                  'transition-colors duration-200 motion-reduce:transition-none',
                  'group-has-checked:bg-cyan-400/15 group-has-checked:text-cyan-300 dark:group-has-checked:bg-cyan-400/15 dark:group-has-checked:text-cyan-300'
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{card.label}</span>
                {card.hint && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">{card.hint}</span>
                )}
              </span>
              {/* The selected mark: a filled dot, top right. */}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-1/2 right-3.5 size-4 -translate-y-1/2 rounded-full border sm:top-3 sm:right-3 sm:translate-y-0',
                  'border-slate-300 dark:border-slate-500',
                  'group-has-checked:border-cyan-400 group-has-checked:bg-cyan-400 group-has-checked:shadow-[inset_0_0_0_3px_#1e293b] dark:group-has-checked:border-cyan-400'
                )}
              />
            </label>
          )
        })}
      </div>
      {error && (
        <p id={errorId(id)} className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <span aria-hidden="true">⚠️</span>
          {error}
        </p>
      )}
    </fieldset>
  )
)

ContactTopicCards.displayName = 'ContactTopicCards'
