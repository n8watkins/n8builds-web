import React, { forwardRef } from 'react'
import type { IconType } from 'react-icons'
import { LuCompass, LuHandshake, LuRocket } from 'react-icons/lu'
import { cn } from '@/lib/utils'
import { controlProps, errorId } from './FieldWrapper'

// The cards' faces, by subject value (the values and the emails' labels live
// in lib/validations/contactOptions.ts). Each topic has its own accent: `icon`
// colours the icon and its tile; `picked` the card's border and tint, and (via
// --dot) the filled mark, once chosen. Spelled out in full so Tailwind finds them.
type Card = { label: string; hint: string; icon: IconType; iconTone: string; picked: string }
const CARDS: Record<string, Card> = {
  project_opportunity: {
    label: 'New project',
    hint: 'Build with me',
    icon: LuRocket,
    iconTone: 'bg-amber-400/12 text-amber-300',
    picked: 'has-checked:border-amber-400 has-checked:bg-amber-400/8 dark:has-checked:border-amber-400 dark:has-checked:bg-amber-400/8 [--dot:var(--color-amber-400)]',
  },
  consulting: {
    label: 'Consulting',
    hint: 'Get advice',
    icon: LuCompass,
    iconTone: 'bg-sky-400/12 text-sky-300',
    picked: 'has-checked:border-sky-400 has-checked:bg-sky-400/8 dark:has-checked:border-sky-400 dark:has-checked:bg-sky-400/8 [--dot:var(--color-sky-400)]',
  },
  networking: {
    label: 'Networking',
    hint: 'Say hi',
    icon: LuHandshake,
    iconTone: 'bg-violet-400/14 text-violet-300',
    picked: 'has-checked:border-violet-400 has-checked:bg-violet-400/8 dark:has-checked:border-violet-400 dark:has-checked:bg-violet-400/8 [--dot:var(--color-violet-400)]',
  },
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
 * The topic as three compact cards, one click each: a native radio group
 * (arrow keys move between them, Tab enters and leaves it), styled like the
 * other fields. The radios are uncontrolled and report changes through
 * onChange, so a card picked before hydration stays picked (the ref on the
 * fieldset lets the form read it).
 */
export const ContactTopicCards = forwardRef<HTMLFieldSetElement, ContactTopicCardsProps>(
  ({ id, name, label, error, options, disabled, className, onFocus, onChange }, ref) => (
    <fieldset ref={ref} className={cn('space-y-2', className)}>
      <legend className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">{label}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option, i) => {
          const card = CARDS[option.value] ?? { ...CARDS.consulting, label: option.label, hint: '' }
          const Icon = card.icon
          return (
            <label
              key={option.value}
              className={cn(
                'group relative flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border py-2 pr-3 pl-2',
                'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800',
                'transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none',
                'hover:border-slate-400 dark:hover:border-slate-500',
                card.picked,
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
                className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', card.iconTone)}
              >
                <Icon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{card.label}</span>
                {card.hint && (
                  <span className="truncate text-xs text-slate-500 dark:text-slate-400">{card.hint}</span>
                )}
              </span>
              {/* The picked mark: a ring that fills with the card's accent. */}
              <span
                aria-hidden="true"
                className={cn(
                  'size-3.5 shrink-0 rounded-full border border-slate-300 dark:border-slate-500',
                  'group-has-checked:border-(--dot) group-has-checked:bg-(--dot) group-has-checked:shadow-[inset_0_0_0_2.5px_#1e293b]',
                  'dark:group-has-checked:border-(--dot)'
                )}
              />
            </label>
          )
        })}
      </div>
      {error && (
        <p id={errorId(id)} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </fieldset>
  )
)

ContactTopicCards.displayName = 'ContactTopicCards'
