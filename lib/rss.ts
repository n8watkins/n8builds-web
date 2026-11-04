import { toHTML, uriLooksSafe } from '@portabletext/to-html'
import type { Post } from '@/lib/sanity'
import { SITE_URL, absoluteUrl } from '@/lib/seo'

/**
 * The N8's Notions feed (/blog/rss.xml): RSS 2.0 with every post's full text,
 * so a reader app shows the whole note, not a teaser.
 *
 * Pure: the route fetches the posts and hands them here, and the unit tests
 * check the XML without Sanity.
 */

export const FEED_PATH = '/blog/rss.xml'
export const FEED_TITLE = "N8's Notions"
export const FEED_DESCRIPTION = 'Notes, essays, and lessons from building software in public.'
const AUTHOR = 'Nathan "n8" Watkins'

/** Escape text for an XML element or attribute. */
export function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Wrap HTML in CDATA, splitting any `]]>` inside it so the section can't end early. */
const cdata = (html: string) => `<![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`

/** A site link made absolute, so it still works when a reader shows the post elsewhere. */
const absolute = (href: string) => (href.startsWith('/') ? absoluteUrl(href) : href)

/** A post body as plain, unstyled HTML for feed readers. */
export function bodyToHtml(body: Post['body']): string {
  if (!body?.length) return ''
  return toHTML(body, {
    components: {
      types: {
        image: ({ value }) =>
          value?.url
            ? `<figure><img src="${xmlEscape(`${value.url}?w=1400&q=80&auto=format`)}" alt="${xmlEscape(value.alt || '')}"${
                value.width && value.height ? ` width="${value.width}" height="${value.height}"` : ''
              } />${value.alt ? `<figcaption>${xmlEscape(value.alt)}</figcaption>` : ''}</figure>`
            : '',
      },
      marks: {
        link: ({ children, value }) => {
          const href = absolute(String(value?.href ?? ''))
          return uriLooksSafe(href) ? `<a href="${xmlEscape(href)}">${children}</a>` : children
        },
      },
    },
    onMissingComponent: false,
  })
}

/** RFC 822 dates, as RSS 2.0 requires. */
const rfc822 = (iso: string) => new Date(iso).toUTCString()

export function buildFeed(posts: Post[]): string {
  const feedUrl = absoluteUrl(FEED_PATH)
  const blogUrl = absoluteUrl('/blog')
  const lastEdit = posts.map((p) => p._updatedAt).sort().at(-1)

  const items = posts.map((post) => {
    const url = absoluteUrl(`/blog/${post.slug.current}`)
    const summary = post.seoDescription || post.excerpt
    const html = bodyToHtml(post.body)
    return [
      '    <item>',
      `      <title>${xmlEscape(post.title)}</title>`,
      `      <link>${xmlEscape(url)}</link>`,
      `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
      `      <pubDate>${rfc822(post.publishedAt)}</pubDate>`,
      `      <dc:creator>${xmlEscape(post.author || AUTHOR)}</dc:creator>`,
      ...(post.topics ?? []).map((topic) => `      <category>${xmlEscape(topic)}</category>`),
      ...(summary ? [`      <description>${xmlEscape(summary)}</description>`] : []),
      ...(html ? [`      <content:encoded>${cdata(html)}</content:encoded>`] : []),
      ...(post.coverUrl
        ? [`      <media:content url="${xmlEscape(`${post.coverUrl}?w=1200&h=630&fit=crop&fm=jpg`)}" medium="image" type="image/jpeg" />`]
        : []),
      '    </item>',
    ].join('\n')
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">',
    '  <channel>',
    `    <title>${xmlEscape(FEED_TITLE)}</title>`,
    `    <link>${blogUrl}</link>`,
    `    <description>${xmlEscape(FEED_DESCRIPTION)}</description>`,
    '    <language>en-us</language>',
    `    <copyright>${xmlEscape(`Copyright ${new Date().getUTCFullYear()} Nathan Watkins`)}</copyright>`,
    ...(lastEdit ? [`    <lastBuildDate>${rfc822(lastEdit)}</lastBuildDate>`] : []),
    '    <generator>n8builds.dev</generator>',
    `    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
    '    <image>',
    `      <url>${SITE_URL}/tab/n8-icon.png</url>`,
    `      <title>${xmlEscape(FEED_TITLE)}</title>`,
    `      <link>${blogUrl}</link>`,
    '    </image>',
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}
