'use client'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { LuPause, LuPlay } from 'react-icons/lu'
import type { Piece } from '@/data/n8games/page'
import styles from './n8games.module.css'

/** How long each piece holds the stage while it cycles by itself. */
const CYCLE_MS = 5200
/** After a tap on a phone, how long the tapped piece stays before the cycle goes on. */
const TAP_HOLD_MS = 9000

/**
 * The pieces (owner, 2026-11-16): one stage showing a piece moving about the
 * real room, and the four pieces in a row under it. It goes through them by
 * itself, a few seconds each, with a small progress mark on the one showing.
 * Hovering or focusing a piece puts it on the stage at once and holds it there
 * while the pointer or focus stays; on a phone a tap does the same, and the
 * cycle goes on after a pause. The arrow keys move along the row (tabs).
 * Off screen or in a hidden tab nothing moves. Under reduced motion it never
 * cycles or plays by itself: the stage shows a still, and Play plays it.
 */
export default function PiecesStage({ pieces }: { pieces: Piece[] }) {
  const [active, setActive] = useState(0)
  const [still, setStill] = useState<boolean | null>(null)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const [held, setHeld] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [hidden, setHidden] = useState(false)
  // The Pause button: stops the clip and the cycle until Play.
  const [stopped, setStopped] = useState(false)
  // Under reduced motion: Play was pressed.
  const [asked, setAsked] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const videos = useRef<(HTMLVideoElement | null)[]>([])
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setStill(query.matches)
    update()
    query.addEventListener('change', update)
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    const el = root.current
    const observer =
      el && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver((entries) => setOnScreen(entries[entries.length - 1].isIntersecting), { threshold: 0.25 })
        : null
    if (el && observer) observer.observe(el)
    else setOnScreen(true)
    return () => {
      query.removeEventListener('change', update)
      document.removeEventListener('visibilitychange', onVisibility)
      observer?.disconnect()
      clearTimeout(holdTimer.current)
    }
  }, [])

  const live = onScreen && !hidden
  const clipPlays = still === false ? live && !stopped : still === true && live && asked
  const cycling = still === false && live && !stopped && !hovering && !focused && !held

  // Only the piece on the stage plays; the others wait at their first frame.
  useEffect(() => {
    videos.current.forEach((video, i) => {
      if (!video) return
      video.muted = true
      if (i === active && clipPlays) {
        video.play().catch(() => {})
      } else if (!video.paused) video.pause()
    })
  }, [active, clipPlays])

  const show = useCallback((i: number) => setActive((i + pieces.length) % pieces.length), [pieces.length])
  const next = () => show(active + 1)

  /** A tap on a phone: show it, hold it a while, then go on. */
  const hold = () => {
    setHeld(true)
    clearTimeout(holdTimer.current)
    holdTimer.current = setTimeout(() => setHeld(false), TAP_HOLD_MS)
  }

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const to = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? active + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? active - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? pieces.length - 1 : null
    if (to === null) return
    e.preventDefault()
    const i = (to + pieces.length) % pieces.length
    show(i)
    tabs.current[i]?.focus()
  }

  const piece = pieces[active]
  const playing = clipPlays
  const toggle = () => {
    if (still) setAsked((a) => !a)
    else setStopped((s) => !s)
  }
  const toggleName = `${playing ? 'Pause' : 'Play'} the ${piece.name.toLowerCase()}'s clip`

  return (
    <div
      ref={root}
      className={styles.piecesStage}
      data-cycling={cycling ? 'true' : 'false'}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovering(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovering(false)}
    >
      <div className={styles.pieceView} role="tabpanel" id="piece-panel" aria-labelledby={`piece-tab-${piece.id}`} data-playing={playing ? 'true' : 'false'}>
        {pieces.map((p, i) => (
          <video
            key={p.id}
            ref={(el) => {
              videos.current[i] = el
            }}
            className={styles.pieceClip}
            data-on={i === active ? 'true' : 'false'}
            width={640}
            height={400}
            poster={p.clip.poster}
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            aria-label={p.alt}
            aria-hidden={i === active ? undefined : true}
          >
            <source src={p.clip.webm} type="video/webm" />
            <source src={p.clip.mp4} type="video/mp4" />
          </video>
        ))}
        <span className={`${styles.chip} ${piece.soon ? styles.chipSoon : styles.chipLive} ${styles.pieceTag}`}>{piece.soon ? 'Coming to the room' : 'From the real room'}</span>
        {still && !playing && (
          // The Pause/Play button below is the one for the keyboard; this is a bigger target for a tap.
          <button type="button" className={styles.clipBigPlay} onClick={toggle} tabIndex={-1} aria-hidden="true">
            <LuPlay aria-hidden />
          </button>
        )}
        <button type="button" className={styles.clipToggle} onClick={toggle} aria-label={toggleName}>
          {playing ? <LuPause aria-hidden /> : <LuPlay aria-hidden />}
          <span aria-hidden>{playing ? 'Pause' : 'Play'}</span>
        </button>
      </div>

      <div className={styles.pieceCaption}>
        <p className={styles.pieceName}>{piece.name}</p>
        <p>{piece.line}</p>
        {piece.soon && <p className={styles.pieceSoon}>{piece.soon}</p>}
      </div>

      <div className={styles.pieceRow} role="tablist" aria-label="The pieces">
        {pieces.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => {
              tabs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`piece-tab-${p.id}`}
            aria-controls="piece-panel"
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            className={styles.pieceTab}
            onPointerEnter={(e) => e.pointerType === 'mouse' && show(i)}
            onFocus={(e) => {
              show(i)
              if (e.currentTarget.matches(':focus-visible')) setFocused(true)
            }}
            onBlur={(e) => {
              if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null)) setFocused(false)
            }}
            onClick={() => {
              show(i)
              hold()
            }}
            onKeyDown={onKey}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a small cut-out at its own size; next/image adds nothing here */}
            <img src={p.face} alt="" width={p.faceSize.width} height={p.faceSize.height} loading="lazy" decoding="async" className={styles.pieceFace} />
            <span className={styles.pieceTabName}>{p.name}</span>
            {/* The progress mark: it fills while this piece holds the stage, and the stage moves on when it is full. */}
            <span className={styles.pieceProgress} aria-hidden="true">
              {i === active && still === false && (
                <i key={`${active}`} style={{ animationDuration: `${CYCLE_MS}ms`, animationPlayState: cycling ? 'running' : 'paused' }} onAnimationEnd={next} />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
