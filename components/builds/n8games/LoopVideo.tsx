'use client'
import { useEffect, useRef, useState } from 'react'
import { LuPause, LuPlay } from 'react-icons/lu'
import styles from './n8games.module.css'

export interface LoopClip {
  webm: string
  mp4: string
  poster: string
  width: number
  height: number
}

/**
 * A silent looping clip of a game being played (the site's clip rules, as for
 * Scribe's tour): VP9 WebM first, H.264 MP4 after it, the first frame as the
 * poster so nothing jumps, muted and inline. It loads nothing until it is on
 * screen, plays only while it is (and the tab is in front), and has a Pause
 * button. Under reduced motion it never plays by itself: it shows its still
 * with a Play button, and plays only when asked.
 */
export default function LoopVideo({
  clip,
  alt,
  label,
  className,
  priority = false,
}: {
  clip: LoopClip
  alt: string
  /** What the buttons call it: "Pause the clip of Cork & Bell". */
  label: string
  className?: string
  /** Above the fold: fetch the poster early. */
  priority?: boolean
}) {
  const ref = useRef<HTMLVideoElement>(null)
  // `null` until the browser has said whether reduced motion is asked for.
  const [still, setStill] = useState<boolean | null>(null)
  const [playing, setPlaying] = useState(false)
  // A choice made with the button wins over scrolling: paused stays paused.
  const chosen = useRef<'play' | 'pause' | null>(null)
  const seen = useRef(false)
  const syncRef = useRef<() => void>(() => {})

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setStill(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const video = ref.current
    if (!video || still === null) return
    video.muted = true
    const wanted = () => seen.current && !document.hidden && (chosen.current === 'play' || (!still && chosen.current !== 'pause'))
    const sync = () => {
      if (wanted()) {
        video.play().catch(() => setPlaying(false))
      } else if (!video.paused) video.pause()
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              seen.current = entries[entries.length - 1].isIntersecting
              sync()
            },
            { threshold: 0.2 },
          )
    if (observer) observer.observe(video)
    else {
      seen.current = true
      sync()
    }
    document.addEventListener('visibilitychange', sync)
    syncRef.current = sync
    return () => {
      observer?.disconnect()
      document.removeEventListener('visibilitychange', sync)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [still])

  const toggle = () => {
    chosen.current = playing ? 'pause' : 'play'
    // A tap on Play means "now", even if the clip is only partly on screen.
    if (chosen.current === 'play') seen.current = true
    syncRef.current()
  }

  const name = playing ? `Pause the ${label}` : `Play the ${label}`
  return (
    <div className={`${styles.clip} ${className ?? ''}`} data-playing={playing ? 'true' : 'false'} data-still={still ? 'true' : 'false'}>
      <video
        ref={ref}
        className={styles.clipVideo}
        width={clip.width}
        height={clip.height}
        poster={clip.poster}
        muted
        loop
        playsInline
        preload={priority ? 'metadata' : 'none'}
        disablePictureInPicture
        aria-label={alt}
      >
        <source src={clip.webm} type="video/webm" />
        <source src={clip.mp4} type="video/mp4" />
      </video>
      {/* Under reduced motion, before it has played: the still, with a big Play in the middle. */}
      {still && !playing && (
        // The corner button is the one for the keyboard and screen readers; this is a bigger target for a tap.
        <button type="button" className={styles.clipBigPlay} onClick={toggle} tabIndex={-1} aria-hidden="true">
          <LuPlay aria-hidden />
        </button>
      )}
      <button type="button" className={styles.clipToggle} onClick={toggle} aria-label={name}>
        {playing ? <LuPause aria-hidden /> : <LuPlay aria-hidden />}
        <span aria-hidden>{playing ? 'Pause' : 'Play'}</span>
      </button>
    </div>
  )
}
