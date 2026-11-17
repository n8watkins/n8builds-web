import type { N8Game } from '../types'

/**
 * Tin Derby. Facts from its design notes (TIN-DERBY-DESIGN.md in the private ops
 * repo, 2026-11-15) and its playable round-five preview, which the clip and the
 * pictures come from: the house driving your car in a four-car race, held sideways
 * like a phone, and the split screen for a TV. It is not on the live site yet
 * (`live: false`): its page says "Coming soon" and its main button goes to the
 * games site. Its page and its card come from this file alone; when the room
 * version goes live, pull request #204 lists what to change here and the three
 * lines elsewhere (the ad's count, the /games note, "Coming next").
 */
const D = '/games/n8games/tin-derby'

export const tinDerby: N8Game = {
  slug: 'tin-derby',
  name: 'Tin Derby',
  theme: 'derby',
  card: {
    line: 'Wind-up tin cars race laps round a kitchen table.',
    meta: '1 to 4 players',
    tile: '/games/n8games/page/tile-derby.webp',
    tileAlt: "Tin Derby's poster: a red wind-up tin car with a big key races a teal one across a checked tablecloth.",
    tilt: -2,
  },
  intro: ['Wind-up tin cars race laps round a kitchen table.', 'You ride behind your own car, past the salt, the cereal box and the teapot, with your friends right behind you.'],
  play: { href: 'https://partygames.n8builds.dev', live: false },
  clip: {
    webm: `${D}/clip.webm`,
    mp4: `${D}/clip.mp4`,
    poster: `${D}/clip-poster.webp`,
    width: 854,
    height: 396,
    alt: 'Tin Derby from behind a red tin car: it races over a red and cream checked tablecloth, past a teapot and a box of Tin Flakes, chasing the other cars, with the steering pad, Drift and Use buttons on the screen.',
    frame: 'screen',
    caption: 'A race on a phone held sideways, the house driving.',
    phone: { webm: `${D}/clip-phone.webm`, mp4: `${D}/clip-phone.mp4` },
  },
  pictures: [
    {
      src: `${D}/split.webp`,
      width: 960,
      height: 540,
      alt: 'The race split four ways on one screen: a pawn, a ghost, a slime and a robot, each in a tin car, with the track map in the middle.',
      caption: 'Four cars on one TV.',
    },
    {
      src: `${D}/lap.webp`,
      width: 960,
      height: 444,
      alt: 'The red car out in front on the checked cloth, with the spring gauge top left, the lap strip at the top and the Drift button bottom right.',
      caption: 'Out in front, halfway round.',
    },
    {
      src: `${D}/pick.webp`,
      width: 960,
      height: 444,
      alt: 'The racer picker: a pawn, a ghost, a slime and a robot, ten colours, the steering choice and a big Race button.',
      caption: 'Pick a racer and a colour.',
    },
  ],
  steps: [
    'Pick a racer, a pawn, a ghost, a slime or a robot, and the colour of its tin car.',
    'Race two laps of the kitchen table. House cars fill any empty seats.',
    'Steer round the shakers and the spills. Slide through a turn to wind the spring, then let go for a boost.',
    'Drive through a sweet for a power, and fire it with Use.',
    'Play on your phone held sideways, or put everyone on a TV, one corner each.',
  ],
  made: [
    { icon: 'palette', title: 'A poster come to life', body: 'Five inks on cream paper, tomato, mustard, teal, cream and navy, with grain over the whole picture.' },
    { icon: 'camera', title: 'Right behind your car', body: 'A chase camera low over the cloth. Anything between it and your car dissolves into halftone dots.' },
    { icon: 'cog', title: 'The spring', body: 'Twelve notches round a brass key. It winds while you drift and runs down while the boost runs.' },
    { icon: 'users', title: 'Nobody is ever out', body: 'Every flip and spin ends in a second or two, and house cars fill the empty seats.' },
    { icon: 'layers', title: 'Cheap to draw', body: 'three.js with no shadow maps, no reflections and no bloom: one last pass for the grain and the dots.' },
    { icon: 'server', title: 'Built for the room', body: 'The race is a simulation the party room can run, so in the room its word is final and phones only draw.' },
  ],
  madeFrom: { label: 'Its design notes and the playable preview' },
  credits: [
    {
      heading: 'Nick Saraev',
      body: [
        'The party games started from build prompts by Nick Saraev, published with two of his Claude Fable 5.2 videos. Each of his prompts is a single-player build; each game here takes one and remakes it for friends playing together on their phones.',
        'Tin Derby starts from his "Wind-up derby" prompt, from 13 INSANE Things You Can Build w/ Claude Fable 5.2.',
      ],
      links: [
        { label: '@nicksaraev', href: 'https://www.youtube.com/@nicksaraev', youtube: true },
        { label: 'The video', href: 'https://www.youtube.com/watch?v=5mA9Hab09Do', youtube: true },
        { label: 'Maker Zero, his free community', href: 'https://www.skool.com/maker-zero/about' },
      ],
      fine: [
        "Nick's prompts and any wording taken from them remain his. This project is not affiliated with Nick Saraev or endorsed by him.",
        'Also inside: three.js (MIT), and the typefaces Bowlby One and Barlow Condensed (SIL Open Font License).',
      ],
    },
  ],
  share: `${D}/share.jpg`,
}
