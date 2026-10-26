import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react'

/**
 * Fades its content up once, on load, with CSS only (the `fade-up` utility in
 * app/globals.css). For content above the fold: it is in the server HTML and
 * plays without waiting for hydration, so the LCP element is never held back
 * by JavaScript. Below the fold, use Reveal (components/ui/Reveal.tsx), which
 * fades as the content scrolls into view. Reduced motion shows it at once.
 */
export default function FadeIn({
  children,
  className = '',
  delay = 0,
  effect = 'up',
  as: Tag = 'div',
  ...rest
}: Omit<HTMLAttributes<HTMLElement>, 'className' | 'style'> & {
  children: ReactNode
  className?: string
  /** Seconds to wait before fading in, for a stagger. */
  delay?: number
  /** `up` fades and rises (the default); `in` only fades. */
  effect?: 'up' | 'in'
  as?: ElementType
}) {
  const style: CSSProperties | undefined = delay ? { animationDelay: `${delay}s` } : undefined
  return (
    <Tag {...rest} className={`${effect === 'in' ? 'fade-in' : 'fade-up'} ${className}`.trim()} style={style}>
      {children}
    </Tag>
  )
}
