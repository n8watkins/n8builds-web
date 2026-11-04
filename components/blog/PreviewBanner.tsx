import { isPreview } from '@/lib/preview'

/**
 * Shown only in a draft preview (lib/preview.ts): says that drafts are
 * showing, keeps the page out of search engines, and ends the preview.
 */
export default async function PreviewBanner({ path }: { path: string }) {
  if (!(await isPreview())) return null
  return (
    <>
      {/* React hoists this into <head>; the Worker also sends X-Robots-Tag. */}
      <meta name="robots" content="noindex, nofollow" />
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-60 flex justify-center px-4">
        <div
          role="status"
          className="pointer-events-auto flex items-center gap-3 rounded-full border border-amber-300/30 bg-[#1b1608] py-2 pl-4 pr-2 text-sm text-amber-100 shadow-[0_8px_30px_rgb(0_0_0/0.45)]"
        >
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-amber-300" />
          <span>
            <span className="font-semibold">Preview.</span> Drafts are showing.
          </span>
          <a
            href={`/api/draft-mode/disable?path=${encodeURIComponent(path)}`}
            className="rounded-full bg-amber-300/15 px-3 py-1.5 font-semibold text-amber-50 transition-colors hover:bg-amber-300/25"
          >
            Exit preview
          </a>
        </div>
      </div>
    </>
  )
}
