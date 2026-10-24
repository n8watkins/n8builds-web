/** The navbar's "live now" dot on a platform link. Static under reduced motion. */
export default function NavLiveDot() {
  return (
    <span data-nav-live-dot className="relative ml-0.5 flex size-2 shrink-0">
      <span aria-hidden className="absolute inline-flex size-full rounded-full bg-red-400 opacity-75 motion-safe:animate-ping" />
      <span aria-hidden className="relative inline-flex size-2 rounded-full bg-red-500" />
      <span className="sr-only">(live now)</span>
    </span>
  )
}
