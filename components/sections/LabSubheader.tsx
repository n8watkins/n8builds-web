// Header for a part of the homepage Lab (Build log, Featured, the template offer, Chrome extensions, What's cookin').
// One level below the Lab's own h2, so the parts read as parts of one section.
// Its bar takes the part's colours (`.lab-sub-bar` in app/globals.css).
export default function LabSubheader({
  id,
  eyebrow,
  eyebrowClass,
  title,
  icon,
  kicker,
  blurb,
}: {
  /** The title's id, for a part labelled by it. */
  id?: string
  /** Optional small label above the title. */
  eyebrow?: string
  /** Text colour class for the eyebrow, e.g. 'text-blue-400'. */
  eyebrowClass?: string
  /** Usually a string; a part may set its own lines (the template part's two-line prompt). */
  title: React.ReactNode
  /**
   * The part's animated icon (components/ui/PartIcons.tsx), in a chip in the
   * part's colour before the title (owner, 2026-11-08).
   */
  icon?: React.ReactNode
  /** A short line right under the title, in the part's colour (the build log's month). */
  kicker?: React.ReactNode
  blurb?: React.ReactNode
}) {
  return (
    <div className="relative mb-8 pl-4">
      <span aria-hidden="true" className="lab-sub-bar absolute inset-y-0.5 left-0 w-[3px] rounded-full" />
      {eyebrow && <p className={`mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] ${eyebrowClass ?? ''}`}>{eyebrow}</p>}
      {icon ? (
        <div className="flex items-center gap-3">
          {/* data-part-icon: the side rail lights this part as this icon passes the middle of the window. */}
          <span data-part-icon className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--lab-from,34_211_238)/0.1)] text-[rgb(var(--lab-from,34_211_238))] ring-1 ring-[rgb(var(--lab-from,34_211_238)/0.3)] sm:size-10 [&_svg]:size-5 sm:[&_svg]:size-[1.375rem]">
            {icon}
          </span>
          <h3 id={id} className="text-2xl font-bold tracking-tight text-slate-50 sm:text-[1.75rem]">{title}</h3>
        </div>
      ) : (
        <h3 id={id} className="text-2xl font-bold tracking-tight text-slate-50 sm:text-[1.75rem]">{title}</h3>
      )}
      {kicker && <p className="mt-0.5 text-base font-semibold sm:text-lg">{kicker}</p>}
      {blurb && <p className="mt-1.5 max-w-[560px] text-pretty text-[#9cadc5]">{blurb}</p>}
    </div>
  )
}
