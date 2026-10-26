import type { CSSProperties, ElementType, ReactNode } from 'react'

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
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  /** Seconds to wait before fading in, for a stagger. */
  delay?: number
  as?: ElementType
}) {
  const style: CSSProperties | undefined = delay ? { animationDelay: `${delay}s` } : undefined
  return (
    <Tag className={`fade-up ${className}`.trim()} style={style}>
      {children}
    </Tag>
  )
}
