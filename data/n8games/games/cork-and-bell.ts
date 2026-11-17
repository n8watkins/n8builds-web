import type { N8Game } from '../types'

/**
 * Cork & Bell. Facts from the game's own README (github.com/n8watkins/cork-and-bell,
 * main on 2026-11-16). The clip is the game's own attract mode (/cork-and-bell/?auto=1,
 * the house bot playing a solo round), recorded on a local run of the party site;
 * the pictures are its battle view (?view=four), an attack (?state=jam) and the start board.
 */
const D = '/games/n8games/cork-and-bell'

export const corkAndBell: N8Game = {
  slug: 'cork-and-bell',
  name: 'Cork & Bell',
  theme: 'cork',
  card: {
    line: 'A 1930s fairground shooting gallery. Pop the targets, ring the bell.',
    meta: '1 to 4 players, a phone each',
    tile: '/games/n8games/page/tile-cork.webp',
    tileAlt: "Cork & Bell's poster: a red and gold fairground shooting gallery with teapots, stars and numbered targets.",
    tilt: -2,
  },
  intro: [
    'A travelling fairground shooting gallery of the 1930s, at dusk.',
    'One stall on your own, or a battle of two to four stalls side by side.',
  ],
  play: { href: 'https://partygames.n8builds.dev/cork-and-bell/', live: true },
  code: 'https://github.com/n8watkins/cork-and-bell',
  clip: {
    webm: `${D}/clip.webm`,
    mp4: `${D}/clip.mp4`,
    poster: `${D}/clip-poster.webp`,
    width: 960,
    height: 600,
    alt: 'Cork & Bell being played: corks fly at a red and gold stall at dusk, teapots tip over, stars and moons swing on the belt, and the score climbs on the ticket at the bottom left.',
    frame: 'screen',
    caption: 'The house playing a solo round, in the game itself.',
  },
  pictures: [
    {
      src: `${D}/four.webp`,
      width: 960,
      height: 600,
      alt: 'Four stalls side by side, each with its player name and score: Mabel, Old Tom, Fitch and Dolly.',
      caption: 'A battle, as the shared screen shows it.',
    },
    {
      src: `${D}/jam.webp`,
      width: 960,
      height: 600,
      alt: 'A stall with its front row of teapots knocked down and a red cork wedged on the right, under a card that says "Front row jammed".',
      caption: 'An attack lands: the front row is jammed.',
    },
    {
      src: `${D}/board.webp`,
      width: 960,
      height: 600,
      alt: 'The chalk high score board on the stall wall, with the start board under it: Play alone, Battle with friends, Sound is off.',
      caption: 'The high scores, chalked on the wall.',
    },
  ],
  steps: [
    'You get a cork gun, thirty-five corks and ninety seconds.',
    'Point and click, or drag and let go on a phone. The cork flies a real arc, so the far row needs a higher aim.',
    'Teapots score 10, stars 25, moons 50, and the star behind the shutter 100. A run of four hits doubles, a run of eight trebles.',
    "Hits fill the bell's ring of lamps. When it is full, ring the bell for 100.",
    "In a battle, good shooting attacks a rival's stall: a jammed front row, moths across their sights, their lamps out. A dead-centre hit blocks it and sends it back.",
  ],
  made: [
    { icon: 'camera', title: 'One medium', body: 'A real stall, built by a wheelwright and a sign-writer, seen at dusk through a fast lens. Nothing glows that is not a lamp.' },
    { icon: 'sun', title: 'Baked light', body: 'Lit in Blender Cycles, bulbs and sky baked apart, so a lamp really goes out when a cork finds it.' },
    { icon: 'cog', title: 'One machine', body: 'A flywheel turns a belt, and the belt turns every row. It all speeds up together through the round.' },
    { icon: 'server', title: 'The room decides', body: 'A phone sends only its shots. The room runs each stall 0.3 seconds behind its clock and decides every hit.' },
    { icon: 'sound', title: 'Sound from nothing', body: 'Every sound is made in WebAudio, and it stays off until you turn it on.' },
    { icon: 'plug', title: 'It plugs into the party', body: 'The game is its own repository. The party room mounts it over itself for a round, then takes it away.' },
  ],
  madeFrom: { label: "The game's README", href: 'https://github.com/n8watkins/cork-and-bell#readme' },
  credits: [
    {
      heading: 'Nick Saraev',
      body: [
        'Cork & Bell is Nick Saraev\'s idea first. It started from "The cork gallery", one of the build prompts behind his video I Threw $1000 at Fable 5.2 to Build The Coolest Demos Possible.',
        'The battle mode and all the code in the Cork & Bell repository were made for this project.',
      ],
      links: [
        { label: '@nicksaraev', href: 'https://www.youtube.com/@nicksaraev', youtube: true },
        { label: 'The video', href: 'https://www.youtube.com/watch?v=wpFw66kKixU', youtube: true },
        { label: 'His own cork gallery, at 2:46', href: 'https://www.youtube.com/watch?v=wpFw66kKixU&t=166s', youtube: true },
        { label: 'Maker Zero, his free community', href: 'https://www.skool.com/maker-zero/about' },
      ],
      fine: [
        "Nick's prompts and the wording taken from them remain his. This project is not affiliated with Nick Saraev or endorsed by him.",
        'Also inside: three.js (MIT), and the typefaces Abril Fatface and Playfair Display (SIL Open Font License).',
      ],
    },
  ],
  share: `${D}/share.jpg`,
}
