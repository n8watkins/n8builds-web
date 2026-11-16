import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { LuGithub } from 'react-icons/lu'
import Reveal from '@/components/ui/Reveal'
import { N8GAMES_PAGE, gamePage } from '@/data/n8games'
import { N8GAMES_GAMES } from '@/data/n8games/games'
import { THEMES, paletteVars } from '@/data/n8games/themes'
import type { GameTheme, N8Game } from '@/data/n8games/types'
import { abril, anton, baloo, bowlby, cinzel, nunito } from './fonts'
import { BackArrow, MADE_ICONS } from './icons'
import LoopVideo from './LoopVideo'
import { Floaters, OutLink } from './N8gamesPage'
import styles from './n8games.module.css'

const vars = (v: Record<string, string | number>) => v as CSSProperties

/** Each game's heading face and its touch of style (n8games.module.css). */
const LOOK: Record<GameTheme, { font: string; theme: string }> = {
  cork: { font: abril.variable, theme: styles.themeCork },
  potato: { font: anton.variable, theme: styles.themePotato },
  who: { font: '', theme: styles.themeWho },
  derby: { font: bowlby.variable, theme: styles.themeDerby },
  masks: { font: cinzel.variable, theme: styles.themeMasks },
}

function Actions({ game, end = false }: { game: N8Game; end?: boolean }) {
  return (
    <div className={`${styles.heroGo} ${end ? styles.endGo : ''}`}>
      <a className={`${styles.btn} ${styles.btnPlay}`} href={game.play.href} target="_blank" rel="noopener noreferrer" aria-label={`Go play ${game.name} (opens in a new tab)`}>
        Go play
      </a>
      {game.code && (
        <a className={`${styles.btn} ${styles.btnPlain}`} href={game.code} target="_blank" rel="noopener noreferrer" aria-label={`Get the code for ${game.name} (opens in a new tab)`}>
          <LuGithub aria-hidden className={styles.btnIcon} />
          Get the code
        </a>
      )}
      {end && (
        <Link className={styles.back} href={`${N8GAMES_PAGE}#games`}>
          <BackArrow className={styles.backIcon} />
          All of n8games
        </Link>
      )}
    </div>
  )
}

/**
 * One game's own page (/builds/n8games/<slug>): what it is in two lines, a clip
 * of it being played and a few pictures, how a round goes, how it's made as
 * short items with icons, Go play, the code and credits. One layout for all
 * five, driven by the game's data file, with a touch of the game's own style
 * on top of the n8games look (owner, 2026-11-16).
 */
export default function GamePage({ game }: { game: N8Game }) {
  const look = LOOK[game.theme]
  const others = N8GAMES_GAMES.filter((g) => g.slug !== game.slug)
  const [first, ...rest] = game.name.split(' ')
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`${styles.n8g} ${look.theme} ${baloo.variable} ${nunito.variable} ${look.font} focus:outline-none`}
      style={vars(paletteVars(THEMES[game.theme]))}
      data-game={game.slug}
    >
      <div className={styles.page}>
        <Floaters />
        <div className={`${styles.wrap} ${styles.backRow}`}>
          <Link className={styles.back} href={`${N8GAMES_PAGE}#games`}>
            <BackArrow className={styles.backIcon} />
            All of n8games
          </Link>
        </div>

        <section className={`${styles.hero} ${styles.gameHero} ${styles.wrap}`} aria-labelledby="game-title">
          <div className={styles.heroText}>
            <span className={`${styles.chip} ${styles.chipLive} ${styles.enter}`} style={vars({ '--i': 0 })}>
              Playable
            </span>
            <h1 id="game-title" className={`${styles.gameTitle} ${styles.enter}`} style={vars({ '--i': 0 })}>
              {first} {rest.length > 0 && <span>{rest.join(' ')}</span>}
            </h1>
            <div className={`${styles.gameIntro} ${styles.enter}`} style={vars({ '--i': 1 })}>
              {game.intro.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
            <div className={styles.enter} style={vars({ '--i': 2 })}>
              <Actions game={game} />
            </div>
          </div>
          <figure className={`${styles.heroStage} ${styles.enter} ${game.clip.frame === 'phone' ? styles.phoneStage : ''}`} style={vars({ '--i': 3 })}>
            <div className={`${styles.heroView} ${game.clip.frame === 'phone' ? styles.phoneView : ''}`} style={vars({ '--ratio': `${game.clip.width} / ${game.clip.height}` })}>
              <LoopVideo clip={game.clip} alt={game.clip.alt} label={`clip of ${game.name}`} priority />
            </div>
            <figcaption className={styles.clipCaption}>{game.clip.caption}</figcaption>
          </figure>
        </section>

        <Reveal as="section" className={`${styles.sec} ${styles.wrap}`}>
          <h2 className="sr-only">Pictures</h2>
          <div className={`${styles.pics} ${game.pictures[0].height > game.pictures[0].width ? styles.picsPhone : ''}`}>
            {game.pictures.map((p, i) => (
              <figure key={p.src} className={styles.pic} style={vars({ '--tilt': `${[-1.2, 1, -0.6, 0.8][i]}deg` })}>
                <div className={styles.picFrame}>
                  <Image
                    src={p.src}
                    alt={p.alt}
                    width={p.width}
                    height={p.height}
                    sizes={p.height > p.width ? '(min-width: 760px) 240px, 45vw' : '(min-width: 980px) 340px, (min-width: 620px) 45vw, 92vw'}
                  />
                </div>
                <figcaption>{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className={`${styles.sec} ${styles.wrap}`}>
          <div className={styles.secHead}>
            <h2 className={styles.sticker} id="round-title">
              How a round goes
            </h2>
          </div>
          <ol className={styles.steps} aria-labelledby="round-title">
            {game.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </Reveal>

        <Reveal as="section" className={`${styles.sec} ${styles.wrap}`}>
          <div className={styles.secHead}>
            <h2 className={`${styles.sticker} ${styles.stApricot}`} id="made-title">
              How it&apos;s made
            </h2>
            <p className={styles.lede}>
              From{' '}
              {game.madeFrom.href ? (
                <a href={game.madeFrom.href} target="_blank" rel="noopener noreferrer">
                  {game.madeFrom.label.charAt(0).toLowerCase() + game.madeFrom.label.slice(1)}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                game.madeFrom.label.charAt(0).toLowerCase() + game.madeFrom.label.slice(1)
              )}
              .
            </p>
          </div>
          <ul className={styles.made} aria-labelledby="made-title">
            {game.made.map((m) => {
              const Icon = MADE_ICONS[m.icon]
              return (
                <li key={m.title} className={styles.madeItem}>
                  <span className={styles.madeIcon} aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{m.title}</h3>
                  <p>{m.body}</p>
                </li>
              )
            })}
          </ul>
        </Reveal>

        <Reveal as="section" className={`${styles.sec} ${styles.wrap}`}>
          <div className={styles.secHead}>
            <h2 className={`${styles.sticker} ${styles.stCream}`} id="credit-title">
              Credit
            </h2>
          </div>
          <div className={styles.thanks}>
            {game.credits.map((c) => (
              <div key={c.heading} className={styles.thank}>
                <h3>{c.heading}</h3>
                {c.body.map((b) => (
                  <p key={b}>{b}</p>
                ))}
                <div className={styles.links}>
                  {c.links.map((l) => (
                    <OutLink key={l.href} {...l} />
                  ))}
                </div>
                {c.fine.map((f) => (
                  <p key={f} className={styles.fine}>
                    {f}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <Actions game={game} end />
        </Reveal>

        <Reveal as="section" className={`${styles.sec} ${styles.wrap}`}>
          <h2 className={styles.otherTitle} id="others-title">
            The other games
          </h2>
          <ul className={styles.others} aria-labelledby="others-title">
            {others.map((g) => (
              <li key={g.slug}>
                <Link href={gamePage(g.slug)} className={styles.other}>
                  <Image src={g.card.tile} alt="" width={420} height={560} sizes="96px" />
                  <span>{g.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </main>
  )
}
