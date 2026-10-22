import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { coverAccent, coverSvg } from '@/lib/blog-cover'

/**
 * Social share cards (Open Graph and Twitter, 1200x630 PNG) for pages with
 * their own preview: blog posts and build pages. The background is the same
 * generated "signal" art as the blog covers (lib/blog-cover.ts), so a post's
 * card matches its cover: same waveform, same topic colour.
 */

export const CARD_SIZE = { width: 1200, height: 630 }

// Read once per server instance; none of these depend on the request.
const assets = Promise.all([
  readFile(join(process.cwd(), 'assets/fonts/Inter-Medium.ttf')),
  readFile(join(process.cwd(), 'assets/fonts/Inter-ExtraBold.ttf')),
  readFile(join(process.cwd(), 'public/tab/n8-icon-192.png')),
])

/** Smaller type for longer titles, so three lines always fit. */
function titleSize(title: string) {
  if (title.length <= 28) return 76
  if (title.length <= 52) return 64
  return 52
}

export async function shareCard({
  seed,
  topic,
  eyebrow,
  title,
  subtitle,
  footer,
}: {
  /** Seeds the waveform (the post or build slug). */
  seed: string
  /** Picks the accent colour, as on blog covers. */
  topic?: string
  eyebrow: string
  title: string
  subtitle?: string
  footer: string
}) {
  const [medium, extraBold, icon] = await assets
  const accent = coverAccent(topic, seed)
  const art = `data:image/svg+xml;base64,${Buffer.from(coverSvg(topic, seed)).toString('base64')}`

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#050812', fontFamily: 'Inter' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
        <img src={art} width={CARD_SIZE.width} height={CARD_SIZE.height} alt="" style={{ position: 'absolute', top: 0, left: 0 }} />
        {/* Darken the left side so the text always reads over the waveform. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'linear-gradient(90deg, rgba(5,8,18,0.9) 0%, rgba(5,8,18,0.7) 45%, rgba(5,8,18,0) 85%)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
            <img src={`data:image/png;base64,${icon.toString('base64')}`} width={52} height={52} alt="" style={{ borderRadius: 12 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, fontWeight: 500, color: '#cbd5e1', letterSpacing: 2.4, textTransform: 'uppercase' }}>
              <div style={{ width: 10, height: 10, borderRadius: 10, background: accent, boxShadow: `0 0 12px ${accent}` }} />
              {eyebrow}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900 }}>
            <div
              style={{
                fontSize: titleSize(title),
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: -1.5,
                color: '#f8fafc',
                lineClamp: 3,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ marginTop: 22, fontSize: 30, fontWeight: 500, lineHeight: 1.35, color: '#9cadc5', lineClamp: 2 }}>
                {subtitle}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, fontWeight: 500, color: '#94a3b8' }}>
            <div style={{ width: 36, height: 3, borderRadius: 3, background: accent }} />
            {footer}
          </div>
        </div>
      </div>
    ),
    {
      ...CARD_SIZE,
      fonts: [
        { name: 'Inter', data: medium, weight: 500, style: 'normal' },
        { name: 'Inter', data: extraBold, weight: 800, style: 'normal' },
      ],
    }
  )
}
