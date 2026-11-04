import { describe, expect, it } from 'vitest'
import { buildFeed, bodyToHtml, xmlEscape } from '@/lib/rss'
import type { Post } from '@/lib/sanity'

const post = (over: Partial<Post> = {}): Post => ({
  _id: 'p1',
  _updatedAt: '2026-06-20T10:00:00Z',
  title: 'Ship it & see <what> happens',
  slug: { current: 'ship-it' },
  publishedAt: '2026-06-19T08:00:00Z',
  topics: ['ai-coding', 'tools'],
  excerpt: 'Short "excerpt".',
  coverUrl: 'https://cdn.sanity.io/images/abgyc32w/production/abc-1200x600.png',
  body: [
    {
      _type: 'block',
      _key: 'a',
      style: 'normal',
      markDefs: [{ _key: 'l1', _type: 'link', href: '/builds/scribe' }],
      children: [
        { _type: 'span', _key: 's1', text: 'See ', marks: [] },
        { _type: 'span', _key: 's2', text: 'Scribe', marks: ['l1'] },
        { _type: 'span', _key: 's3', text: ' ]]> done.', marks: [] },
      ],
    },
    { _type: 'image', _key: 'i', url: 'https://cdn.sanity.io/images/x.png', alt: 'A "chart"', width: 800, height: 400 },
  ],
  ...over,
})

describe('buildFeed', () => {
  const xml = buildFeed([post(), post({ _id: 'p2', slug: { current: 'older' }, title: 'Older', _updatedAt: '2026-05-01T00:00:00Z', body: undefined, coverUrl: undefined, topics: undefined })])

  it('describes the channel with a self link and the newest edit as lastBuildDate', () => {
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/)
    expect(xml).toContain('<title>N8&apos;s Notions</title>')
    expect(xml).toContain('<link>https://n8builds.dev/blog</link>')
    expect(xml).toContain('<atom:link href="https://n8builds.dev/blog/rss.xml" rel="self" type="application/rss+xml" />')
    expect(xml).toContain(`<lastBuildDate>${new Date('2026-06-20T10:00:00Z').toUTCString()}</lastBuildDate>`)
  })

  it('writes one item per post, in order, with escaped text and RFC 822 dates', () => {
    const items = xml.split('<item>').slice(1)
    expect(items).toHaveLength(2)
    expect(items[0]).toContain('<title>Ship it &amp; see &lt;what&gt; happens</title>')
    expect(items[0]).toContain('<guid isPermaLink="true">https://n8builds.dev/blog/ship-it</guid>')
    expect(items[0]).toContain('<pubDate>Fri, 19 Jun 2026 08:00:00 GMT</pubDate>')
    expect(items[0]).toContain('<category>ai-coding</category>')
    expect(items[0]).toContain('<description>Short &quot;excerpt&quot;.</description>')
    expect(items[0]).toContain('<dc:creator>Nathan &quot;n8&quot; Watkins</dc:creator>')
    expect(items[0]).toContain('medium="image"')
    expect(items[1]).not.toContain('content:encoded')
    expect(items[1]).not.toContain('<category>')
  })

  it('keeps the full text in a CDATA section that a "]]>" in the post cannot end early', () => {
    const content = xml.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/)?.[1] ?? ''
    expect(content.startsWith('<![CDATA[')).toBe(true)
    // Undo the split: the CDATA pieces join back into the original HTML.
    const html = content.replace(/^<!\[CDATA\[/, '').replace(/]]>$/, '').replace(/]]]]><!\[CDATA\[>/g, ']]>')
    expect(html).toContain(' ]]&gt; done.')
  })
})

describe('bodyToHtml', () => {
  it('makes site links absolute and keeps image sizes and alt text', () => {
    const html = bodyToHtml(post().body)
    expect(html).toContain('<a href="https://n8builds.dev/builds/scribe">Scribe</a>')
    expect(html).toContain('alt="A &quot;chart&quot;" width="800" height="400"')
    expect(html).toContain('<figcaption>A &quot;chart&quot;</figcaption>')
  })

  it('drops unsafe link targets but keeps their text', () => {
    const body = [
      {
        _type: 'block',
        _key: 'b',
        style: 'normal',
        markDefs: [{ _key: 'x', _type: 'link', href: 'javascript:alert(1)' }],
        children: [{ _type: 'span', _key: 's', text: 'click', marks: ['x'] }],
      },
    ]
    expect(bodyToHtml(body)).toBe('<p>click</p>')
  })

  it('is empty for a post without a body', () => {
    expect(bodyToHtml(undefined)).toBe('')
  })
})

it('xmlEscape escapes all five XML entities', () => {
  expect(xmlEscape(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&apos;&amp;&apos;&lt;/a&gt;')
})
