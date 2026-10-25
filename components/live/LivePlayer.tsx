'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { SiTwitch, SiYoutube } from 'react-icons/si'
import { FaXTwitter } from 'react-icons/fa6'
import { FiExternalLink, FiMaximize2, FiMinimize2, FiMinus, FiMove, FiRadio, FiVolume2, FiVolumeX, FiX } from 'react-icons/fi'
import { PLATFORM_LABEL, type LivePlatform, type LiveStatus, type LiveStream } from '@/lib/live-shared'
import { CORNERS, addClosed, readClosed, readPrefs, writePrefs, type Corner, type PlayerPrefs } from './storage'

/**
 * The floating corner player, shown on every page while a stream is live.
 * Loaded only when /api/live says so (see LiveLoader).
 *
 * - Starts muted (browsers only autoplay muted video), with an Unmute button.
 * - Expand, move between corners, minimize to a "Live" pill, close. The corner
 *   and minimized choices are remembered; closing hides the current stream
 *   only, so the next one shows again.
 * - Tabs when live on several platforms, Twitch first.
 * - Phones: always starts as the pill at the bottom, and opens full width.
 * - Every control is a labelled button; Escape minimizes.
 */

const PHONE_QUERY = '(max-width: 639.98px)'
// Twitch embeds play only on hosts listed in `parent`; anywhere else (Vercel
// previews) the player shows the "Watch on Twitch" card instead.
const TWITCH_HOSTS = ['n8builds.dev', 'www.n8builds.dev', 'localhost', '127.0.0.1']
const YOUTUBE_ORIGIN = 'https://www.youtube-nocookie.com'

function subscribePhone(onChange: () => void) {
  const media = window.matchMedia(PHONE_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function useIsPhone() {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false)
}

const CORNER_LABEL: Record<Corner, string> = {
  'bottom-right': 'bottom right',
  'bottom-left': 'bottom left',
  'top-left': 'top left',
  'top-right': 'top right',
}

// Clear of the 68px navbar at the top, and of the page edge everywhere.
const CORNER_CLASS: Record<Corner, string> = {
  'bottom-right': 'bottom-5 right-5',
  'bottom-left': 'bottom-5 left-5',
  'top-left': 'top-[5.25rem] left-5',
  'top-right': 'top-[5.25rem] right-5',
}

const PHONE_BOTTOM = 'bottom-[calc(0.75rem+env(safe-area-inset-bottom))]'

function PlatformIcon({ platform, className }: { platform: LivePlatform; className?: string }) {
  if (platform === 'twitch') return <SiTwitch className={className} />
  if (platform === 'youtube') return <SiYoutube className={className} />
  if (platform === 'x') return <FaXTwitter className={className} />
  return <FiRadio className={className} />
}

/** Platform colors only on platform-branded bits (the "Watch on" buttons). */
const WATCH_CLASS: Record<LivePlatform, string> = {
  twitch: 'border-purple-400/35 bg-purple-500/15 text-purple-100 hover:bg-purple-500/25 hover:border-purple-300/50',
  youtube: 'border-red-400/35 bg-red-500/15 text-red-100 hover:bg-red-500/25 hover:border-red-300/50',
  x: 'border-white/20 bg-white/10 text-slate-100 hover:bg-white/15 hover:border-white/30',
  other: 'border-cyan-400/35 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25 hover:border-cyan-300/50',
}

const watchLabel = (platform: LivePlatform) => (platform === 'other' ? 'Watch live' : `Watch on ${PLATFORM_LABEL[platform]}`)

function WatchButton({ stream, className = '' }: { stream: LiveStream; className?: string }) {
  return (
    <a
      href={stream.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${WATCH_CLASS[stream.platform]} ${className}`}
    >
      <PlatformIcon platform={stream.platform} className="size-3.5" />
      {watchLabel(stream.platform)}
      <FiExternalLink className="size-3 opacity-70" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

function LiveDot() {
  return (
    <span className="relative flex size-2 shrink-0" aria-hidden>
      <span data-live-pulse className="absolute inline-flex size-full rounded-full bg-red-400 opacity-75 motion-safe:animate-ping" />
      <span className="relative inline-flex size-2 rounded-full bg-red-500" />
    </span>
  )
}

function IconButton({ label, onClick, children, ...rest }: { label: string; onClick: () => void; children: ReactNode } & Record<`aria-${string}`, string | boolean | undefined>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-400"
      {...rest}
    >
      {children}
    </button>
  )
}

/** Shown instead of an embed: X streams, other links, and streams that can't play here. */
function WatchCard({ stream, note }: { stream: LiveStream; note: string }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2.5 bg-linear-to-br from-[#0b1426] via-[#08101f] to-[#050913] px-5 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-white/6 ring-1 ring-white/10">
        <PlatformIcon platform={stream.platform} className="size-[1.1rem] text-slate-200" />
      </span>
      <p className="line-clamp-2 text-sm font-semibold text-slate-100">{stream.title ?? `Live on ${PLATFORM_LABEL[stream.platform]}`}</p>
      <p className="text-xs text-slate-450">{note}</p>
      <WatchButton stream={stream} className="mt-0.5" />
    </div>
  )
}

function cardNote(stream: LiveStream): string | null {
  if (stream.platform === 'x') return 'X streams play on X.'
  if (stream.platform === 'other') return 'This stream plays on its own site.'
  if (!stream.embed) return `This stream can’t play here, but it’s live on ${PLATFORM_LABEL[stream.platform]}.`
  if (stream.embed.kind === 'twitch' && !TWITCH_HOSTS.includes(window.location.hostname)) return 'Twitch plays here only on n8builds.dev.'
  return null
}

function StreamView({ stream, muted }: { stream: LiveStream; muted: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const embed = stream.embed
  const note = cardNote(stream)

  // YouTube listens for commands over postMessage (enablejsapi=1), so
  // unmuting doesn't reload the stream. Twitch has no such channel without
  // its script, so its player reloads with the new muted setting instead.
  useEffect(() => {
    if (embed?.kind !== 'youtube') return
    const send = (func: string) => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), YOUTUBE_ORIGIN)
    send(muted ? 'mute' : 'unMute')
    if (!muted) send('playVideo')
  }, [embed, muted])

  if (note || !embed) return <WatchCard stream={stream} note={note ?? ''} />

  if (embed.kind === 'twitch') {
    const params = new URLSearchParams({ channel: embed.channel, parent: window.location.hostname, autoplay: 'true', muted: String(muted) })
    return (
      <iframe
        key={params.toString()}
        src={`https://player.twitch.tv/?${params}`}
        title={`Twitch live stream: ${stream.title ?? embed.channel}`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="size-full border-0"
      />
    )
  }

  const params = new URLSearchParams({ autoplay: '1', mute: '1', playsinline: '1', enablejsapi: '1', rel: '0', origin: window.location.origin })
  return (
    <iframe
      ref={frame}
      src={`${YOUTUBE_ORIGIN}/embed/${embed.videoId}?${params}`}
      title={`YouTube live stream: ${stream.title ?? 'live now'}`}
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className="size-full border-0"
    />
  )
}

export default function LivePlayer({ status }: { status: LiveStatus }) {
  const phone = useIsPhone()
  const [prefs, setPrefs] = useState<PlayerPrefs>(readPrefs)
  const [closed, setClosed] = useState<string[]>(readClosed)
  // Phones always start as the pill; opening it is never remembered.
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [unmuted, setUnmuted] = useState<Record<string, boolean>>({})

  const root = useRef<HTMLDivElement>(null)
  const pillButton = useRef<HTMLButtonElement>(null)
  const minimizeButton = useRef<HTMLButtonElement>(null)
  const moveFocus = useRef<'pill' | 'panel' | null>(null)

  // Streams the visitor closed stay closed: when another goes live, the player
  // comes back showing only the new one (falling back to all of them only to
  // keep `active` defined while the player is hidden).
  const open = status.streams.filter((s) => !closed.includes(s.id))
  const visible = open.length > 0
  const streams = visible ? open : status.streams
  const active = streams.find((s) => s.id === chosenId) ?? streams.find((s) => s.platform === status.preferred) ?? streams[0]
  const minimized = phone ? !phoneOpen : prefs.minimized
  const muted = !unmuted[active.id]
  const embedded = cardNote(active) === null && active.embed !== null

  const updatePrefs = useCallback((change: Partial<PlayerPrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...change }
      writePrefs(next)
      return next
    })
  }, [])

  const setMinimized = (value: boolean) => {
    moveFocus.current = value ? 'pill' : 'panel'
    if (phone) setPhoneOpen(!value)
    else updatePrefs({ minimized: value })
  }

  const close = () => {
    const ids = status.streams.map((s) => s.id)
    addClosed(ids)
    setClosed((current) => [...current, ...ids])
  }

  const nextCorner = CORNERS[(CORNERS.indexOf(prefs.corner) + 1) % CORNERS.length]

  // Keep keyboard focus with the control that replaced the one just used.
  useEffect(() => {
    const target = moveFocus.current
    moveFocus.current = null
    if (target === 'pill') pillButton.current?.focus()
    if (target === 'panel') minimizeButton.current?.focus()
  }, [minimized])

  // Tell the page how much of the bottom-right the player covers, so the
  // scroll-to-top button can sit above it (--live-dock-br).
  useLayoutEffect(() => {
    const el = root.current
    const html = document.documentElement
    const coversBottomRight = visible && el && (phone ? !minimized : prefs.corner === 'bottom-right')
    if (!coversBottomRight) {
      html.style.removeProperty('--live-dock-br')
      return
    }
    const update = () => html.style.setProperty('--live-dock-br', `${Math.ceil(el.getBoundingClientRect().height) + 12}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      observer.disconnect()
      html.style.removeProperty('--live-dock-br')
    }
  }, [visible, phone, minimized, prefs.corner, expanded])

  if (!visible) return null

  const platformsLabel = streams.map((s) => PLATFORM_LABEL[s.platform]).join(', ')
  const position = phone ? (minimized ? `${PHONE_BOTTOM} left-3` : `${PHONE_BOTTOM} inset-x-2`) : CORNER_CLASS[prefs.corner]

  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const index = streams.indexOf(active)
    const next =
      event.key === 'Home' ? 0 : event.key === 'End' ? streams.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + streams.length) % streams.length
    setChosenId(streams[next].id)
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <motion.div
      ref={root}
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      data-live-player
      data-corner={phone ? 'phone' : prefs.corner}
      data-state={minimized ? 'minimized' : expanded && !phone ? 'expanded' : 'open'}
      className={`fixed z-30 ${position}`}
    >
      {minimized ? (
        <div className="flex items-center rounded-full border border-white/12 bg-[#070b16]/95 p-1 shadow-xl shadow-black/50 backdrop-blur-xl">
          <button
            ref={pillButton}
            type="button"
            onClick={() => setMinimized(false)}
            aria-expanded={false}
            className="flex h-8 items-center gap-2 rounded-full pr-2.5 pl-2.5 text-xs font-semibold text-slate-100 transition-colors hover:bg-white/8 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-400"
          >
            <LiveDot />
            <span className="uppercase tracking-wider">Live</span>
            <span className="max-w-[9.5rem] truncate font-medium text-slate-300">{platformsLabel}</span>
            <span className="sr-only">: open the live player</span>
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Close live player"
            title="Close live player"
            className="flex size-8 items-center justify-center rounded-full text-slate-450 transition-colors hover:bg-white/8 hover:text-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-400"
          >
            <FiX className="size-3.5" />
          </button>
        </div>
      ) : (
        <section
          aria-label="Live stream player"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setMinimized(true)
          }}
          className={`overflow-hidden rounded-2xl border border-white/10 bg-[#070b16]/96 shadow-2xl shadow-black/60 ring-1 ring-cyan-400/5 backdrop-blur-xl ${
            phone ? 'w-full' : expanded ? 'w-[min(36rem,calc(100vw-2.5rem))]' : 'w-80'
          }`}
        >
          <div className="flex h-11 items-center gap-2 border-b border-white/[0.07] pr-1.5 pl-3.5">
            <LiveDot />
            <span className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-100">Live</span>
            {streams.length === 1 && (
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
                <span className="text-slate-600" aria-hidden>
                  /
                </span>
                <PlatformIcon platform={active.platform} className="size-3.5 shrink-0" />
                <span className="truncate">{PLATFORM_LABEL[active.platform]}</span>
              </span>
            )}
            <span className="flex-1" />
            <div className="-mr-0.5 flex shrink-0 items-center">
            {!phone && (
              <>
                <IconButton label={expanded ? 'Shrink player' : 'Expand player'} onClick={() => setExpanded((v) => !v)} aria-pressed={expanded}>
                  {expanded ? <FiMinimize2 className="size-3.5" /> : <FiMaximize2 className="size-3.5" />}
                </IconButton>
                <IconButton label={`Move player to the ${CORNER_LABEL[nextCorner]} corner`} onClick={() => updatePrefs({ corner: nextCorner })}>
                  <FiMove className="size-3.5" />
                </IconButton>
              </>
            )}
            <button
              ref={minimizeButton}
              type="button"
              onClick={() => setMinimized(true)}
              aria-label="Minimize live player"
              title="Minimize live player"
              aria-expanded
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-400"
            >
              <FiMinus className="size-4" />
            </button>
            <IconButton label="Close live player" onClick={close}>
              <FiX className="size-4" />
            </IconButton>
            </div>
          </div>

          {streams.length > 1 && (
            <div role="tablist" aria-label="Live streams" onKeyDown={onTabKey} className="flex gap-1 border-b border-white/[0.07] px-2 py-1.5">
              {streams.map((stream) => {
                const selected = stream.id === active.id
                return (
                  <button
                    key={stream.id}
                    type="button"
                    role="tab"
                    id={`live-tab-${stream.platform}`}
                    aria-selected={selected}
                    aria-controls="live-player-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setChosenId(stream.id)}
                    className={`flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-400 ${
                      selected ? 'bg-cyan-400/12 text-cyan-200 ring-1 ring-cyan-400/25' : 'text-slate-400 hover:bg-white/6 hover:text-slate-200'
                    }`}
                  >
                    <PlatformIcon platform={stream.platform} className="size-3.5" />
                    {PLATFORM_LABEL[stream.platform]}
                  </button>
                )
              })}
            </div>
          )}

          <div
            id="live-player-panel"
            role={streams.length > 1 ? 'tabpanel' : undefined}
            aria-labelledby={streams.length > 1 ? `live-tab-${active.platform}` : undefined}
          >
            <div className="aspect-video w-full bg-black">
              <StreamView key={active.id} stream={active} muted={muted} />
            </div>
            {embedded && (
              <div className="space-y-2 px-3 pt-2.5 pb-3">
                <p className="truncate text-[0.8rem] font-medium text-slate-200" title={active.title ?? undefined}>
                  {active.title ?? `Live on ${PLATFORM_LABEL[active.platform]}`}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setUnmuted((current) => ({ ...current, [active.id]: muted }))}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/12 bg-white/6 px-2.5 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-cyan-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                  >
                    {muted ? <FiVolumeX className="size-3.5" /> : <FiVolume2 className="size-3.5" />}
                    {muted ? 'Unmute' : 'Mute'}
                  </button>
                  <WatchButton stream={active} />
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </motion.div>
  )
}
