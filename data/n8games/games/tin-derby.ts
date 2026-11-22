import type { N8Game } from '../types'

/**
 * Tin Derby. Facts from its design notes (TIN-DERBY-DESIGN.md in the private ops
 * repo, 2026-11-15) and its README in the party room (floor/games/tin-derby in
 * github.com/n8watkins/n8-party-games, main on 2026-11-22). The clip and the
 * pictures are a race in the party room on the live site (2026-11-22): two made-up
 * players (Noodle, the phone recorded, and Toast) and two house cars, with a big
 * screen; both phones' cars driven by the house's own driver through the page's
 * normal input path. `live` drives what its card and page say ("Playable" and Go
 * play, or "Coming soon" and the games site).
 */
const D = '/games/n8games/tin-derby'

export const tinDerby: N8Game = {
  slug: 'tin-derby',
  name: 'Tin Derby',
  theme: 'derby',
  card: {
    line: 'Wind-up tin cars race laps round a breakfast table.',
    meta: 'Up to 4 players, a phone each',
    tile: '/games/n8games/page/tile-derby.webp',
    tileAlt: "Tin Derby's poster: a red wind-up tin car with a big key races a teal one across a checked tablecloth.",
    tilt: -2,
  },
  intro: ['Wind-up tin cars race laps round a breakfast table.', 'You ride behind your own car, past the salt, the cereal box and the teapot, with your friends right behind you.'],
  // Raced in the party room: Go play starts a party (the front door's "In the room").
  play: { href: 'https://partygames.n8builds.dev/lobby/?start', live: true },
  code: 'https://github.com/n8watkins/n8-party-games/tree/main/floor/games/tin-derby',
  clip: {
    webm: `${D}/clip.webm`,
    mp4: `${D}/clip.mp4`,
    poster: `${D}/clip-poster.webp`,
    width: 854,
    height: 396,
    alt: "Tin Derby on a phone held sideways in the party room, from behind Noodle's red tin car: it races over a red and cream checked tablecloth past the things on the table, chasing the house cars, with the lap strip, the steering pad, Use, Drift and Brake on the screen.",
    frame: 'screen',
    caption: 'A race in the party room, on a phone held sideways.',
    phone: { webm: `${D}/clip-phone.webm`, mp4: `${D}/clip-phone.mp4` },
  },
  pictures: [
    {
      src: `${D}/split.webp`,
      width: 960,
      height: 540,
      alt: "The big screen split in two: Noodle's and Toast's own chase cameras, each behind their tin car on the checked cloth, with the track and the standings in the middle, two house cars among them.",
      caption: 'The big screen, split: a view each.',
    },
    {
      src: `${D}/table.webp`,
      width: 960,
      height: 540,
      alt: "The big screen's whole table: the checked tablecloth seen from above, the track round it and the things on the table, the four cars with their names, and the lap strip with the standings.",
      caption: 'Or the whole table at once.',
    },
    {
      src: `${D}/lap.webp`,
      width: 960,
      height: 444,
      alt: "Noodle's phone held sideways: the red car out in front on the checked cloth, the spring gauge, the lap strip and the place at the top, the steering pad, Use, Drift and Brake.",
      caption: 'Your own phone, out in front.',
    },
  ],
  steps: [
    "Up to four of you stand in Tin Derby's light at the bar. Each of you drives a tin car, your own piece at the wheel.",
    'Race two laps of the breakfast table. House cars fill any empty seats.',
    'Steer round the shakers and the spills. Slide through a turn to wind the spring, then let go for a boost.',
    'Drive through a sweet for a power, and fire it with Use.',
    'Drive on your phone held sideways. The big screen shows the whole table, or a view behind each car.',
  ],
  made: [
    { icon: 'palette', title: 'A poster come to life', body: 'Five inks on cream paper, tomato, mustard, teal, cream and navy, with grain over the whole picture.' },
    { icon: 'camera', title: 'Right behind your car', body: 'A chase camera low over the cloth. Anything between it and your car dissolves into halftone dots.' },
    { icon: 'cog', title: 'The spring', body: 'Twelve notches round a brass key. It winds while you drift and runs down while the boost runs.' },
    { icon: 'users', title: 'Nobody is ever out', body: 'Every flip and spin ends in a second or two, and house cars fill the empty seats.' },
    { icon: 'layers', title: 'Cheap to draw', body: 'three.js with no shadow maps, no reflections and no bloom: one last pass for the grain and the dots.' },
    { icon: 'server', title: 'Built for the room', body: 'The party room runs the race and its word is final. Phones send only what the thumbs hold, and draw.' },
  ],
  madeFrom: { label: "The game's README", href: 'https://github.com/n8watkins/n8-party-games/blob/main/floor/games/tin-derby/README.md' },
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
