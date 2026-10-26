// Header for a part of the homepage Lab (My tools, Featured, Chrome extensions, Tools).
// One level below the Lab's own h2, so the parts read as parts of one section.
// Its bar takes the part's colours (`.lab-sub-bar` in app/globals.css).
export default function LabSubheader({
  eyebrow,
  eyebrowClass,
  title,
  blurb,
}: {
  /** Optional small label above the title. */
  eyebrow?: string
  /** Text colour class for the eyebrow, e.g. 'text-blue-400'. */
  eyebrowClass?: string
  /** Usually a string; a part may set its own lines (the template part's two-line prompt). */
  title: React.ReactNode
  blurb?: React.ReactNode
}) {
  return (
    <div className="relative mb-8 pl-4">
      <span aria-hidden="true" className="lab-sub-bar absolute inset-y-0.5 left-0 w-[3px] rounded-full" />
      {eyebrow && <p className={`mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] ${eyebrowClass ?? ''}`}>{eyebrow}</p>}
      <h3 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-[1.75rem]">{title}</h3>
      {blurb && <p className="mt-1.5 max-w-[560px] text-[#9cadc5]">{blurb}</p>}
    </div>
  )
}
