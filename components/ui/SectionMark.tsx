import type { ReactNode } from 'react'

/**
 * A homepage section's heading in the Lab's style, so the Lab, N8's Notions
 * and the Loadout read as one family: the section's icon in a cyan chip
 * beside its name, centred, then one line on what's inside and an optional
 * action under it. The Lab's own heading is the same mark at a larger size.
 */
export default function SectionMark({
  id,
  icon,
  title,
  children,
  action,
}: {
  id?: string
  icon: ReactNode
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-10 flex flex-col items-center text-center">
      <div className="flex items-center gap-3.5 sm:gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/30 sm:h-13 sm:w-13 [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-7 sm:[&_svg]:w-7">
          {icon}
        </span>
        <h2 id={id} className="text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">
          {title}
        </h2>
      </div>
      {children && <p className="mt-4 max-w-[560px] text-balance text-[#9cadc5] sm:text-lg">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
