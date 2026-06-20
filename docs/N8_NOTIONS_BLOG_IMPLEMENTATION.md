# N8 Notions — Blog Implementation Plan (UI)

Status: **planned, not built**. Scope: **UI / read-only frontend only.** Posts are
authored in the **Sanity Studio** (hosted at `n8builds.sanity.studio`); this work
only adds the pages that *display* those posts on n8builds.dev.

## TL;DR

Add a **read-only blog** ("N8 Notions") as a feature inside this repo
(`n8builds-web`) that reads the existing Sanity dataset. No standalone app, no
monorepo, no CMS code in this repo beyond a read client.

- **Brand / display name:** N8 Notions
- **Route:** `/blog` (list) + `/blog/[slug]` (post). *(URL `/blog` for SEO; the
  visible label everywhere is "N8 Notions". Easy to switch to `/notions` later —
  it's one constant.)*
- **Homepage:** a "Latest from N8 Notions" strip (3 newest posts) on `/`.
- **Content source:** existing Sanity project `it7x216y`, dataset `production`
  (already has the posts; nothing to migrate). Read-only, public CDN, **no token
  needed**.
- **Authoring:** unchanged — Nathan writes in the Sanity Studio. This plan adds
  **zero** auth/admin/AI code.

## Why this shape (architecture decision)

- `n8builds-web` is a **single Next.js app, not a monorepo** (no workspaces),
  single deploy (Vercel `n8builds-web`), single author. A monorepo would add
  tooling cost for no benefit.
- The content lives in **Sanity's cloud**, not in any repo. The site just *reads*
  the same dataset the Studio writes to. Sanity is multi-consumer by design.
- An earlier standalone blog app was **retired** in favor of this `/blog` feature;
  we lifted only its read-path code as reference and dropped its admin,
  AI-generate, and newsletter paths.

## Stack reality check (this repo)

- Next.js **16** (App Router) · React **19** · TypeScript **5** — aligns with the
  source blog app, so route/component patterns port cleanly.
- **Tailwind v3** (`tailwind.config.ts` + PostCSS `@tailwind` directives) — the
  source blog app is Tailwind v4. **Do NOT copy its config or `globals.css`.**
  Re-express styles in v3 using this site's existing tokens.
- Design language (from `app/builds/[slug]/page.tsx`): dark `bg-[#050812]`,
  `text-slate-100` / muted `text-slate-400`, cyan+blue accents, gradient text
  `from-cyan-400 to-blue-500 bg-clip-text text-transparent`, cards
  `rounded-2xl border border-white/8 bg-white/[0.03]`, pills
  `border-cyan-400/20 bg-cyan-400/10 text-cyan-300`. Icons: `react-icons/fi`.
- `cn()` already exists at `@/lib/utils` (clsx + tailwind-merge) — reuse it; do
  **not** port the blog app's `cn`.
- **No `@tailwindcss/typography`** here, and the site hand-styles content (see the
  builds page). So we **drop the `prose` wrapper** and style Portable Text blocks
  with explicit per-element classes (no new plugin needed).
- Path alias is only `@/* -> ./*`. Dev server runs on **port 1337**. Build uses
  `next build --webpack`. Husky + lint-staged run on commit, so code must pass
  `eslint` and be Prettier-clean.

## Dependencies to add

```bash
# from ~/n8builds/n8builds-web
npm install @sanity/client @portabletext/react
# next-sanity is OPTIONAL (only for the `groq` template tag and the revalidate
# webhook). We can inline GROQ strings and skip it. Add only if porting the webhook.
```

Do **not** add: `@google/genai`, `next-auth`, `drizzle-orm`, `resend`,
`@sanity/image-url` (no image field in the schema yet), or `@tailwindcss/typography`.

## Environment

Add to `.env.local` and to Vercel (Project Settings → Environment Variables):

```
NEXT_PUBLIC_SANITY_PROJECT_ID=it7x216y
```

That's it for the read path. `dataset='production'` and `apiVersion='2024-07-01'`
are hardcoded in the client. No `SANITY_API_TOKEN` (public CDN read).

## File-by-file plan

### 1. `lib/sanity.ts` (new) — trimmed read client + queries

Port from the blog app's `lib/sanity.ts` but drop `sanityWrite` and the
newsletter/page queries. Inline the GROQ (no `next-sanity` dependency):

```ts
import { createClient } from '@sanity/client'

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set')
}

export const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-07-01',
  useCdn: true,
  stega: false,
})

const POST_CARD = `_id, title, slug, publishedAt, topics, excerpt`

export type Post = {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  topics?: string[]
  excerpt?: string
  body?: any[]
}

export const getAllPosts = () =>
  sanity.fetch<Post[]>(`*[_type == "post"] | order(publishedAt desc){ ${POST_CARD} }`)

export const getRecentPosts = (limit = 3) =>
  sanity.fetch<Post[]>(`*[_type == "post"] | order(publishedAt desc)[0...${limit}]{ ${POST_CARD} }`)

export const getPostBySlug = (slug: string) =>
  sanity.fetch<Post | null>(
    `*[_type == "post" && slug.current == $slug][0]{ ${POST_CARD}, body }`, { slug })

export const getRelatedPosts = (currentSlug: string) =>
  sanity.fetch<Post[]>(
    `*[_type == "post" && slug.current != $currentSlug] | order(publishedAt desc)[0...3]{ ${POST_CARD} }`,
    { currentSlug })
```

Post schema contract (from `studio/schemas/post.ts`): `title`, `slug`,
`publishedAt` (required); `topics` enum = **ai / growth / predictions / startup**;
`excerpt`; `body` (Portable Text: styles normal/h1–h4/blockquote, **bullet lists
only**, marks strong/em/link).

### 2. `components/blog/portable-text.tsx` (new) — re-themed renderer

Port the blog app's renderer, **remove the `prose` wrapper**, and re-theme to the
dark palette:

```tsx
import { PortableText } from '@portabletext/react'

const components = {
  block: {
    normal: ({ children }: any) => <p className="mb-5 text-slate-300 leading-relaxed">{children}</p>,
    h1: ({ children }: any) => <h2 className="mt-10 mb-4 text-3xl font-bold tracking-tight text-slate-100">{children}</h2>,
    h2: ({ children }: any) => <h2 className="mt-10 mb-4 text-2xl font-bold tracking-tight text-slate-100">{children}</h2>,
    h3: ({ children }: any) => <h3 className="mt-8 mb-3 text-xl font-bold tracking-tight text-slate-100">{children}</h3>,
    h4: ({ children }: any) => <h4 className="mt-6 mb-3 text-lg font-semibold text-slate-100">{children}</h4>,
    blockquote: ({ children }: any) => (
      <blockquote className="my-6 border-l-2 border-cyan-400/50 pl-4 italic text-slate-400">{children}</blockquote>
    ),
  },
  list: { bullet: ({ children }: any) => <ul className="mb-5 ml-5 list-disc space-y-2 text-slate-300">{children}</ul> },
  listItem: { bullet: ({ children }: any) => <li className="leading-relaxed">{children}</li> },
  marks: {
    strong: ({ children }: any) => <strong className="font-semibold text-slate-100">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
    link: ({ children, value }: any) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer"
        className="text-cyan-300 underline-offset-4 hover:underline">{children}</a>
    ),
  },
}

export function PortableTextRenderer({ value }: { value: any[] }) {
  return <PortableText value={value} components={components} />
}
```

### 3. `app/blog/page.tsx` (new) — N8 Notions index

Server component. `getAllPosts()`, `export const revalidate = 3600`, dark theme,
header gradient title "N8 Notions", a post-card grid, and a topic filter using the
existing tag-chip pattern from `components/sections/Shelf.tsx` (topics:
all/ai/growth/predictions/startup). Card links to `/blog/${slug}`. Render
`<Navbar />` at top + a "Back to home" or the site footer (see Chrome note).
Add static `export const metadata = { title: 'N8 Notions — Nate Builds', ... }`.

### 4. `app/blog/[slug]/page.tsx` (new) — single post

Model on `app/builds/[slug]/page.tsx`:

- `params: Promise<{ slug: string }>`; `generateStaticParams` from
  `getAllPosts()` slugs; async `generateMetadata` → `${title} — Nate Builds`,
  `openGraph` type `article` with `publishedTime`, canonical `/blog/${slug}`.
- `export const revalidate = 3600`.
- `getPostBySlug(slug)` → `notFound()` if null.
- Layout: `<main className="relative min-h-screen bg-[#050812] text-slate-100">`,
  `max-w-3xl` container, "← N8 Notions" back link, header (topic pills + gradient
  title + formatted `publishedAt` + reading time optional), then
  `<PortableTextRenderer value={post.body} />`, then a small "More notes" list
  from `getRelatedPosts`.
- **Strip** the blog app's author avatar (random Unsplash), the "Nathan Watkins"
  bio block, the newsletter CTA, `ui/separator` (use a `border-t border-white/8`),
  and `components/footer` (use this site's footer or none).

### 5. `components/sections/NotionsStrip.tsx` (new) — homepage strip

`app/page.tsx` is a **client** component, so this strip fetches client-side via
the public CDN client (read-only, fine for a teaser; the canonical SEO content is
the SSR `/blog` pages). Render 3 newest posts as cards matching `ShelfSection`,
with a "Read all notes →" link to `/blog`. Mount it in `app/page.tsx` (e.g. right
after `<ShelfSection shelf="lab" />`) inside a `<SectionErrorBoundary>`, using
`dynamic(() => import('@/components/sections/NotionsStrip'))` like the other
sections.

> Alt (better SEO, more work): make the strip a server component and lift the
> fetch — but `app/page.tsx` is `'use client'`, so client-fetch is the pragmatic
> choice for a homepage teaser.

### 6. `components/layout/Navbar.tsx` (edit) — nav link

Add to the `navLinks` array (lines 18–23), which drives **both** desktop and
mobile menus:

```ts
const navLinks = [
  { label: 'Lab', href: '/lab' },
  { label: 'N8 Notions', href: '/blog' },   // ← add
  { label: 'Extensions', href: '/extensions' },
  { label: 'Tools', href: '/tools' },
  { label: 'Loadout', href: '/loadout' },
]
```

**Do NOT touch the existing `ViBlog` / VibeLog social link** (line 27) — VibeLog
is a **separate product**, not this blog. (Its label/href may need its own fix,
but that's out of scope here.) Just add the N8 Notions link to `navLinks`. Ignore
`data/navigation.tsx` and `FloatingNav.tsx` — dead code, not wired into the live
header.

### 7. `app/sitemap.ts` (edit) — add blog URLs

Make it `async`, add `/blog`, and append post slugs:

```ts
import { getAllPosts } from '@/lib/sanity'
// ...
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://n8builds.dev'
  const posts = await getAllPosts()
  return [
    /* existing home + shelfRoutes + builds entries */
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...posts.map(p => ({
      url: `${baseUrl}/blog/${p.slug.current}`,
      lastModified: new Date(p.publishedAt),
      changeFrequency: 'monthly' as const, priority: 0.7,
    })),
  ]
}
```

`public/robots.txt` already allows all + points at the sitemap — no change.

### 8. `next.config.mjs` (edit, only when needed)

The current schema has **no image field**, so no change is required now. **When**
posts gain images, add `{ protocol: 'https', hostname: 'cdn.sanity.io' }` to
`images.remotePatterns` (and add `@sanity/image-url`).

## Chrome decision

Blog pages do **not** inherit a header/footer (the root `app/layout.tsx` has
none; pages render their own). Recommendation: render `<Navbar />` at the top of
both blog pages (so the nav is present) and either this site's `Footer` or a slim
"← back to n8builds.dev" link, matching the bare-subpage feel of the builds page.

## Out of scope (explicitly NOT in this work)

- Admin login / NextAuth, `/admin`, the Gemini AI-generate+publish pipeline.
- Newsletter (subscribe / confirm / Resend / Drizzle / Neon). If wanted later,
  reuse this site's existing **nodemailer** infra + ContactForm — do not port
  Resend/Drizzle.
- Moving the Sanity Studio into this repo (it stays hosted at
  `n8builds.sanity.studio`; optional later as a `/studio` route).

## Optional follow-up: instant publish

Posts appear within the 1-hour ISR window by default. To make Studio publishes go
live instantly, port `app/api/revalidate/route.ts` from the blog app (a
signature-verified Sanity webhook using `next-sanity/webhook` `parseBody` +
`SANITY_REVALIDATE_SECRET`), revalidating `/`, `/blog`, `/blog/${slug}`, and add a
webhook in sanity.io/manage. Requires adding `next-sanity`.

## Build order (checklist)

1. `git checkout -b feat/n8-notions-blog`
2. `npm install @sanity/client @portabletext/react`
3. Add `NEXT_PUBLIC_SANITY_PROJECT_ID=it7x216y` to `.env.local` (+ Vercel).
4. `lib/sanity.ts` (read client + queries + `Post` type).
5. `components/blog/portable-text.tsx` (re-themed).
6. `app/blog/page.tsx` (list + topic filter).
7. `app/blog/[slug]/page.tsx` (post + metadata + ISR).
8. `components/sections/NotionsStrip.tsx` + mount in `app/page.tsx`.
9. `components/layout/Navbar.tsx` (add link, remove ViBlog placeholder).
10. `app/sitemap.ts` (async + blog URLs).
11. Verify (below). Commit, push, open PR / Vercel preview.

## Verification

```bash
npm run dev          # http://localhost:1337  → /blog lists the existing posts; open one
npm run lint         # must pass (husky/lint-staged gate on commit)
npm run build        # next build --webpack — confirms /blog/[slug] prerenders
```

Acceptance: `/blog` lists every published post; `/blog/<slug>` renders the body in
the dark theme; the homepage shows the 3 newest under "N8 Notions"; the nav link
works on desktop + mobile; `sitemap.xml` includes `/blog` + post URLs; lint +
build green.

## Open decisions

- **URL:** plan uses `/blog` (SEO/convention) with "N8 Notions" as the visible
  brand. Switch to `/notions` by changing the route folder + the `href` constant +
  the canonical/sitemap URLs if preferred.
- **Reading time / dates:** format `publishedAt` (e.g. "Jun 19, 2026"); reading
  time is optional polish.
- **Studio location:** keep hosted at `n8builds.sanity.studio` (recommended) vs.
  embed as `/studio` here later.
