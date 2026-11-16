import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import Reveal from '@/components/ui/Reveal'
import { gamePage } from '@/data/n8games'
import { N8GAMES_GAMES } from '@/data/n8games/games'
import { FLOATERS, HERO, HOW, MAKE, NEXT, NICK, PIECES, SOUNDS, floaterSrc } from '@/data/n8games/page'
import { BASE, paletteVars } from '@/data/n8games/themes'
import { baloo, nunito } from './fonts'
import { YouTubeMark } from './icons'
import LoopVideo from './LoopVideo'
import PiecesStage from './PiecesStage'
import styles from './n8games.module.css'

const vars = (v: Record<string, string | number>) => v as CSSProperties
const P = '/games/n8games/page'

/** The things that drift behind the page (decoration only). */
export function Floaters() {
  return (
    <div className={styles.floaters} aria-hidden="true">
      {FLOATERS.map((f, i) => (
        <div
          key={i}
          className={styles.fl}
          style={vars({
            '--w': `${f.w}px`,
            '--x': f.x > 50 ? '98%' : '2%',
            '--y': `${f.y}%`,
            '--dx': `${f.dx}px`,
            '--dy': `${f.dy}px`,
            '--drift': `${f.drift}s`,
            '--bob': `${f.bob}s`,
            '--r': `${f.r}deg`,
            '--delay': `${-(i * 1.7)}s`,
          })}
        >
          <div className={styles.flB}>
            <Image src={floaterSrc(f.img)} alt="" width={f.w} height={f.w} unoptimized loading="lazy" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** A link out, as a small bordered tag (credits). */
export function OutLink({ href, label, youtube }: { href: string; label: string; youtube?: boolean }) {
  return (
    <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer">
      {youtube && <YouTubeMark className={styles.yt} />}
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

/**
 * The n8games page (/builds/n8games), from the owner-approved preview (round
 * two, 2026-11-16): fun and light, in the games' own look on a blue ground. A
 * moving hero from the real room, one Go play, a shelf of the five games (each
 * card to its own page), the pieces, where it is going, how to make a game, and
 * thanks. The real site's header and footer frame it. A server component; the
 * clips and the pieces' stage are the only client code.
 */
export default function N8gamesPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`${styles.n8g} ${baloo.variable} ${nunito.variable} focus:outline-none`}
      style={vars(paletteVars(BASE))}
    >
      <div className={styles.page}>
        <Floaters />

        <section className={`${styles.hero} ${styles.wrap}`} aria-labelledby="n8g-title">
          <div className={styles.heroText}>
            <h1 id="n8g-title" className={styles.enter} style={vars({ '--i': 0 })}>
              n8<span>games</span>
            </h1>
            <p className={`${styles.heroLine} ${styles.enter}`} style={vars({ '--i': 1 })}>
              {HERO.line}
            </p>
            <div className={`${styles.heroGo} ${styles.enter}`} style={vars({ '--i': 2 })}>
              <a className={`${styles.btn} ${styles.btnPlay}`} href={HERO.play} target="_blank" rel="noopener noreferrer">
                Go play
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
          <div className={`${styles.heroStage} ${styles.enter}`} style={vars({ '--i': 3 })}>
            <div className={styles.heroView}>
              {/* The wide strip of floor from 760px; on a phone a taller crop, closer on the pieces. */}
              <LoopVideo clip={HERO.clip.wide} alt={HERO.clip.alt} label="clip of the party room" className={styles.wideOnly} priority />
              <LoopVideo clip={HERO.clip.tall} alt={HERO.clip.alt} label="clip of the party room" className={styles.tallOnly} priority />
              <span className={`${styles.chip} ${styles.chipLive} ${styles.heroTag}`}>The real room</span>
            </div>
            <Image className={`${styles.prop} ${styles.propMask}`} src={`${P}/fl-mask-jester.webp`} width={150} height={150} alt="" aria-hidden="true" unoptimized />
            <Image className={`${styles.prop} ${styles.propKey}`} src={`${P}/fl-key.webp`} width={130} height={97} alt="" aria-hidden="true" unoptimized />
          </div>
          <div className={`${styles.lineup} ${styles.enter}`} style={vars({ '--i': 4 })} aria-hidden="true">
            <Image className={styles.propCar} src={`${P}/fl-car-red.webp`} width={200} height={98} alt="" unoptimized />
            {PIECES.map((p) => (
              <Image key={p.id} className={`${styles.lu} ${styles[`lu_${p.id}`]}`} src={p.face} width={p.faceSize.width} height={p.faceSize.height} alt="" unoptimized />
            ))}
          </div>
        </section>

        <Reveal as="section" id="games" className={`${styles.sec} ${styles.wrap}`}>
          <div className={styles.secHead}>
            <h2 className={styles.sticker} id="games-title">
              The games
            </h2>
            <p className={styles.lede}>Five games, each a little world of its own. See how each one is made.</p>
          </div>
          <ul className={styles.shelf} aria-labelledby="games-title">
            {N8GAMES_GAMES.map((g, i) => (
              <li key={g.slug} className={styles.game}>
                <div className={styles.gameArt} style={vars({ '--tilt': `${g.card.tilt}deg`, '--sd': `${(-i * 1.3).toFixed(1)}s` })}>
                  <Image src={g.card.tile} alt={g.card.tileAlt} width={420} height={560} sizes="(min-width: 980px) 160px, (min-width: 620px) 200px, 140px" />
                </div>
                <div className={styles.gameText}>
                  <span className={`${styles.chip} ${styles.chipLive}`}>Playable</span>
                  <h3>{g.name}</h3>
                  <p>{g.card.line}</p>
                  <span className={styles.gameMeta}>{g.card.meta}</span>
                  <Link className={`${styles.btn} ${styles.btnGo} ${styles.btnSmall}`} href={gamePage(g.slug)} aria-label={`How ${g.name} is made`}>
                    How it&apos;s made
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className={`${styles.sec} ${styles.wrap}`}>
          <div className={styles.secHead}>
            <h2 className={`${styles.sticker} ${styles.stApricot}`} id="pieces-title">
              Meet the pieces
            </h2>
            <p className={styles.lede}>You walk a little piece round the room. Each one has its own trick.</p>
          </div>
          <PiecesStage pieces={PIECES} />
        </Reveal>

        <Reveal as="section" className={`${styles.sec} ${styles.wrap}`}>
          <div className={styles.secHead}>
            <h2 className={`${styles.sticker} ${styles.stCream}`}>Where this is going</h2>
          </div>
          <div className={styles.cards}>
            <article className={styles.card} style={vars({ '--tilt': '-1.2deg' })}>
              <div className={styles.cardPic}>
                <Image src={NEXT.table.image.src} alt={NEXT.table.image.alt} width={NEXT.table.image.width} height={NEXT.table.image.height} sizes="(min-width: 900px) 340px, (min-width: 620px) 45vw, 90vw" />
              </div>
              <h3>{NEXT.table.title}</h3>
              <p>{NEXT.table.line}</p>
            </article>
            <article className={`${styles.card} ${styles.cardWide}`} style={vars({ '--tilt': '.5deg' })}>
              <div className={styles.rooms}>
                {NEXT.rooms.images.map((r) => (
                  <figure key={r.src}>
                    <div className={styles.cardPic}>
                      <Image src={r.src} alt={r.alt} width={r.width} height={r.height} sizes="(min-width: 900px) 200px, 30vw" />
                    </div>
                    <figcaption>{r.caption}</figcaption>
                  </figure>
                ))}
              </div>
              <h3>{NEXT.rooms.title}</h3>
              <p>{NEXT.rooms.line}</p>
            </article>
          </div>
        </Reveal>

        <Reveal as="section" className={`${styles.sec} ${styles.wrap}`}>
          <div className={styles.make}>
            <h2>{MAKE.heading}</h2>
            <ul>
              {MAKE.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <div className={styles.makeGo}>
              <a className={`${styles.btn} ${styles.btnGo}`} href={MAKE.readme} target="_blank" rel="noopener noreferrer">
                Read the README
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <span className={styles.makeNote}>{MAKE.note}</span>
            </div>
            <Image className={styles.makeRobot} src={`${P}/make-robot.webp`} width={300} height={333} alt="" aria-hidden="true" sizes="190px" />
          </div>
        </Reveal>

        <Reveal as="section" className={`${styles.sec} ${styles.wrap}`}>
          <div className={styles.secHead}>
            <h2 className={`${styles.sticker} ${styles.stApricot}`} id="thanks-title">
              Thank you
            </h2>
          </div>
          <div className={styles.thanks}>
            <div className={styles.thank}>
              <h3>Nick Saraev</h3>
              <p>{NICK.body}</p>
              <div className={styles.links}>
                {NICK.links.map((l) => (
                  <OutLink key={l.href} {...l} />
                ))}
              </div>
              <p className={styles.fine}>{NICK.fine}</p>
            </div>
            <div className={styles.thank}>
              <h3>The sounds</h3>
              <p>{SOUNDS.body}</p>
              <div className={styles.links}>
                {SOUNDS.kenney.map((l) => (
                  <OutLink key={l.href} {...l} />
                ))}
              </div>
              <details className={styles.fold}>
                <summary>Show all sound credits</summary>
                <p className={styles.fine}>Single recordings on Freesound, by:</p>
                <p className={styles.names}>
                  {SOUNDS.recordists.map((r, i) => (
                    <span key={r.name}>
                      <a href={r.href} target="_blank" rel="noopener noreferrer">
                        {r.name}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                      {i < SOUNDS.recordists.length - 1 ? ', ' : '.'}
                    </span>
                  ))}
                </p>
                <p className={styles.fine}>
                  <a href={SOUNDS.file} target="_blank" rel="noopener noreferrer">
                    Every file and its recording
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </p>
              </details>
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className={`${styles.how} ${styles.wrap}`}>
          <details>
            <summary>
              How it works <span>for the curious</span>
            </summary>
            <ul className={styles.howBody}>
              {HOW.map((l) => (
                <li key={l}>{l}</li>
              ))}
              <li>
                <a href="https://github.com/n8watkins/n8-party-games" target="_blank" rel="noopener noreferrer">
                  The whole story is in the repository
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </details>
        </Reveal>
      </div>
    </main>
  )
}
