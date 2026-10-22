/**
 * Structured data for search engines. The payload is our own data (plus Sanity
 * text), serialized as JSON with `<` escaped so no string can close the tag.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
