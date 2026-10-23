// Header for a part of the homepage Lab (Featured, Chrome extensions, Tools).
// One level below the Lab's own h2, so the three read as parts of one section.
export default function LabSubheader({
  eyebrow,
  eyebrowClass,
  title,
  blurb,
}: {
  eyebrow: string
  /** Text colour class for the eyebrow, e.g. 'text-blue-400'. */
  eyebrowClass: string
  title: string
  blurb?: React.ReactNode
}) {
  return (
    <div className="mb-8 border-l-2 border-white/10 pl-4">
      <p className={`mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] ${eyebrowClass}`}>{eyebrow}</p>
      <h3 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-[1.75rem]">{title}</h3>
      {blurb && <p className="mt-1.5 max-w-[560px] text-[#9cadc5]">{blurb}</p>}
    </div>
  )
}
