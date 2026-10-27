import { LuFlaskConical } from 'react-icons/lu'
import { cn } from '@/lib/utils'

/**
 * The Lab's flask, percolating: three small bubbles rise from the liquid in
 * the bowl and fade before the neck, staggered so one is always on its way.
 * CSS only (.flask-bubble in globals.css); still and hidden under reduced
 * motion. Size it with className (the icon fills the box).
 */
export default function BubblingFlask({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-block shrink-0', className)} aria-hidden="true">
      <LuFlaskConical className="size-full" />
      {[
        { left: '42%', delay: '0s' },
        { left: '54%', delay: '0.8s' },
        { left: '47%', delay: '1.6s' },
      ].map((b) => (
        <span
          key={b.delay}
          className="flask-bubble absolute bottom-[20%] size-[11%] rounded-full bg-current"
          style={{ left: b.left, animationDelay: b.delay }}
        />
      ))}
    </span>
  )
}
