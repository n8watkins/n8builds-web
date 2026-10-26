/**
 * The site's scroll reveal: fade up once as it enters the viewport, with the
 * hero's easing curve. Opacity and transform only, so it never shifts layout.
 * Use it through useReveal() (hooks/useReveal.ts), which handles reduced motion.
 * Content above the fold uses the CSS load fade instead (components/ui/FadeIn.tsx).
 */
export const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] },
} as const
