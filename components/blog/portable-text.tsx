import { PortableText } from '@portabletext/react'

// Renders Sanity Portable Text in the n8builds.dev dark theme. Matches the post
// schema exactly: block styles normal/h1-h4/blockquote, bullet lists, and
// strong/em/link marks. No `prose` plugin — every element is hand-styled.
const components = {
  block: {
    normal: ({ children }: any) => (
      <p className="mb-5 leading-relaxed text-slate-300">{children}</p>
    ),
    h1: ({ children }: any) => (
      <h2 className="mb-4 mt-10 text-3xl font-bold tracking-tight text-slate-50">{children}</h2>
    ),
    h2: ({ children }: any) => (
      <h2 className="mb-4 mt-10 text-2xl font-bold tracking-tight text-slate-50">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="mb-3 mt-8 text-xl font-bold tracking-tight text-slate-100">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="mb-3 mt-6 text-lg font-semibold text-slate-100">{children}</h4>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="my-6 border-l-2 border-cyan-400/50 pl-4 italic text-slate-400">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="mb-5 ml-5 list-disc space-y-2 text-slate-300">{children}</ul>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }: any) => (
      <strong className="font-semibold text-slate-100">{children}</strong>
    ),
    em: ({ children }: any) => <em className="italic">{children}</em>,
    link: ({ children, value }: any) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-300 underline-offset-4 hover:underline"
      >
        {children}
      </a>
    ),
  },
}

export function PortableTextRenderer({ value }: { value: any[] }) {
  return <PortableText value={value} components={components} />
}
