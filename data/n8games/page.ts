import { N8GAMES_REPO, N8GAMES_URL } from '.'

/**
 * The n8games page (/builds/n8games): the owner-approved preview's words and
 * order (round two, 2026-11-16), as data. The shelf of games is
 * data/n8games/games/; this is the rest. Facts are from
 * github.com/n8watkins/n8-party-games, main on 2026-11-16.
 */

const P = '/games/n8games/page'

export const HERO = {
  line: 'Party games for friends in one room, each on their own phone.',
  play: N8GAMES_URL,
  /** Four scripted players in the real room, cropped to the floor (no join code, QR code or address). */
  clip: {
    alt: 'A loop from the real party room: four pieces walk about the bar floor, jump, kick each other over and get back up, while a ghost points and laughs.',
    /** From 760px: the wide strip of floor. */
    wide: { webm: `${P}/hero-wide.webm`, mp4: `${P}/hero-wide.mp4`, poster: `${P}/hero-wide-poster.webp`, width: 960, height: 408 },
    /** On a phone: a taller crop on the pieces. */
    tall: { webm: `${P}/hero-tall.webm`, mp4: `${P}/hero-tall.mp4`, poster: `${P}/hero-tall-poster.webp`, width: 640, height: 414 },
  },
}

export interface Piece {
  id: 'pawn' | 'ghost' | 'robot' | 'slime'
  name: string
  line: string
  /** The piece on its own, for the row under the stage. */
  face: string
  faceSize: { width: number; height: number }
  clip: { webm: string; mp4: string; poster: string }
  alt: string
  /** Its own move is not built yet: it walks and emotes like the others for now. */
  soon?: string
}

/**
 * The pieces (owner, 2026-11-16: "all the pieces ... the four pieces on the bottom
 * with the carousel going through each piece. If you hover over the piece, it
 * shows that piece moving around."). Every clip is from a real party room on a
 * local Worker: the pawn and the ghost from main, the robot and the slime from
 * the branch that adds them (feat/slime-and-robot, not live yet).
 */
export const PIECES: Piece[] = [
  {
    id: 'pawn',
    name: 'Pawn',
    line: 'The bump. Wind up, kick, and a friend goes sliding out of their light.',
    face: `${P}/fl-pawn.webp`,
    faceSize: { width: 180, height: 179 },
    clip: { webm: `${P}/piece-pawn.webm`, mp4: `${P}/piece-pawn.mp4`, poster: `${P}/piece-pawn-poster.webp` },
    alt: 'In the party room, a red pawn kicks a blue pawn, which flies back, lands on its side and gets up.',
  },
  {
    id: 'ghost',
    name: 'Ghost',
    line: 'Floating hands. It points, claps and laughs with hands that hang in the air.',
    face: `${P}/fl-ghost.webp`,
    faceSize: { width: 180, height: 192 },
    clip: { webm: `${P}/piece-ghost.webm`, mp4: `${P}/piece-ghost.mp4`, poster: `${P}/piece-ghost-poster.webp` },
    alt: 'In the party room, a white ghost points a floating purple hand at a pawn and laughs, HA HA.',
  },
  {
    id: 'robot',
    name: 'Robot',
    line: 'Its move will be a hook on a chain, fired from the chest, that drags a friend across the floor.',
    face: `${P}/fl-robot.webp`,
    faceSize: { width: 180, height: 191 },
    clip: { webm: `${P}/piece-robot.webm`, mp4: `${P}/piece-robot.mp4`, poster: `${P}/piece-robot-poster.webp` },
    alt: 'In the party room, a teal robot rolls across the floor and back beside a yellow slime, gives a thumbs up ("nice!") and claps.',
    soon: 'Coming to the room: it walks and emotes already, and its own move is still to come.',
  },
  {
    id: 'slime',
    name: 'Slime',
    line: 'Its move will be soft or hard: soft, a hook sinks in and turns around; hard, a kick bounces off.',
    face: `${P}/fl-slime.webp`,
    faceSize: { width: 180, height: 108 },
    clip: { webm: `${P}/piece-slime.webm`, mp4: `${P}/piece-slime.mp4`, poster: `${P}/piece-slime-poster.webp` },
    alt: 'In the party room, a yellow slime oozes across the floor and back beside a teal robot, throws confetti ("yay!") and claps.',
    soon: 'Coming to the room: it walks and emotes already, and its own move is still to come.',
  },
]

/** Where this is going: postcards. */
export const NEXT = {
  table: {
    title: 'The Table',
    line: 'Sit down, talk, take turns. The party keeps its code and its scores.',
    image: { src: `${P}/wide-who.webp`, width: 720, height: 405, alt: 'A painted round table from above, hands holding phones and cards under a lamp.' },
  },
  rooms: {
    title: 'More rooms',
    line: 'Seven rooms to party in today. These three are still drawings.',
    images: [
      { src: `${P}/room-alley.webp`, width: 560, height: 289, alt: 'The party room drawn as a lantern-lit alley.', caption: 'An alley' },
      { src: `${P}/room-submarine.webp`, width: 560, height: 289, alt: 'The party room drawn inside a submarine, with portholes and brass lamps.', caption: 'A submarine' },
      { src: `${P}/room-train.webp`, width: 560, height: 289, alt: 'The party room drawn as a night train carriage.', caption: 'A night train' },
    ],
  },
}

export const MAKE = {
  heading: 'Want to make a game?',
  lines: [
    'You can. A game is its own little project that tells the room its name, its players and its rules.',
    "Games hang on the room's wall with a lamp over each, and the party votes by standing in its light.",
    'The README says how a game gets in.',
  ],
  readme: `${N8GAMES_REPO}#how-a-game-gets-in`,
  note: 'Open source, MIT License.',
}

/** Nick Saraev, as the party games README credits him (its "Credit" section). */
export const NICK = {
  body: 'The party games started from build prompts by Nick Saraev, published with two of his Claude Fable 5.2 videos. Each of his prompts is a single-player build; each game here takes one and remakes it for friends playing together on their phones.',
  links: [
    { label: '@nicksaraev', href: 'https://www.youtube.com/@nicksaraev', youtube: true },
    { label: 'The demos video', href: 'https://www.youtube.com/watch?v=wpFw66kKixU', youtube: true },
    { label: 'The builds video', href: 'https://www.youtube.com/watch?v=5mA9Hab09Do', youtube: true },
    { label: 'Maker Zero, his free community', href: 'https://www.skool.com/maker-zero/about' },
  ],
  fine: "Nick's prompts and any wording taken from them remain his. This project is not affiliated with Nick Saraev or endorsed by him.",
}

/** The room's sounds, from lobby/public/sounds/CREDITS.txt (main, 2026-11-16): Kenney's packs, then one recording page per Freesound recordist. */
export const SOUNDS = {
  body: "Every sound in the room was made from a recording its maker gave to the public domain (CC0). Most come from Kenney's sound packs.",
  kenney: [
    { label: 'Kenney: Interface Sounds', href: 'https://kenney.nl/assets/interface-sounds' },
    { label: 'Impact Sounds', href: 'https://kenney.nl/assets/impact-sounds' },
    { label: 'RPG Audio', href: 'https://kenney.nl/assets/rpg-audio' },
    { label: 'Casino Audio', href: 'https://kenney.nl/assets/casino-audio' },
  ],
  recordists: [
    { name: 'Breviceps', href: 'https://freesound.org/people/Breviceps/sounds/462362/' },
    { name: 'connerdrake98', href: 'https://freesound.org/people/connerdrake98/sounds/701175/' },
    { name: 'DavidJGurney', href: 'https://freesound.org/people/DavidJGurney/sounds/275802/' },
    { name: 'DeezSoundzTho', href: 'https://freesound.org/people/DeezSoundzTho/sounds/407428/' },
    { name: 'dr_skitz', href: 'https://freesound.org/people/dr_skitz/sounds/353925/' },
    { name: 'esperar', href: 'https://freesound.org/people/esperar/sounds/170768/' },
    { name: 'florianreichelt', href: 'https://freesound.org/people/florianreichelt/sounds/683101/' },
    { name: 'kaydinhamby', href: 'https://freesound.org/people/kaydinhamby/sounds/382637/' },
    { name: 'keweldog', href: 'https://freesound.org/people/keweldog/sounds/181718/' },
    { name: 'qubodup', href: 'https://freesound.org/people/qubodup/sounds/60013/' },
    { name: 'Raventhornn', href: 'https://freesound.org/people/Raventhornn/sounds/181189/' },
    { name: 'sammy214', href: 'https://freesound.org/people/sammy214/sounds/316926/' },
    { name: 'schots', href: 'https://freesound.org/people/schots/sounds/452749/' },
    { name: 'semccab', href: 'https://freesound.org/people/semccab/sounds/154399/' },
    { name: 'simkiott', href: 'https://freesound.org/people/simkiott/sounds/43404/' },
    { name: 'skymary', href: 'https://freesound.org/people/skymary/sounds/412017/' },
    { name: 'SpliceSound', href: 'https://freesound.org/people/SpliceSound/sounds/218318/' },
    { name: 'Streety', href: 'https://freesound.org/people/Streety/sounds/26349/' },
    { name: 'tonmayster', href: 'https://freesound.org/people/tonmayster/sounds/685111/' },
  ],
  file: 'https://github.com/n8watkins/n8-party-games/blob/main/lobby/public/sounds/CREDITS.txt',
}

/** "How it works", folded, for the curious. */
export const HOW = [
  'One Cloudflare Worker serves the site, the party room and every game.',
  'Each party is one Durable Object. It sleeps between moves, so a room nobody touches costs nothing.',
  'The room is drawn in three.js, with a flat drawing for devices that cannot do 3D.',
  'No framework: the browser loads plain modules.',
]

/**
 * The things that drift behind the page: picture, width in px, where it rests
 * (x over 50 hugs the right edge, under 50 the left; y as % of the page), how
 * far it drifts (px), how long a drift and a bob take (s), its lean. The "chill"
 * mood of the preview: ten of them.
 */
export const FLOATERS = [
  { img: 'car-red', w: 84, x: 93, y: 14, dx: -40, dy: 14, drift: 30, bob: 4.0, r: 3 },
  { img: 'mask-jester', w: 62, x: 5, y: 26, dx: 26, dy: 22, drift: 27, bob: 4.8, r: -7 },
  { img: 'key', w: 50, x: 95, y: 40, dx: -24, dy: 26, drift: 25, bob: 4.4, r: -10 },
  { img: 'trophy', w: 50, x: 4, y: 53, dx: 22, dy: -24, drift: 26, bob: 3.9, r: -5 },
  { img: 'mask-moon', w: 58, x: 95, y: 67, dx: -26, dy: 22, drift: 28, bob: 4.7, r: -6 },
  { img: 'flag', w: 46, x: 5, y: 81, dx: 24, dy: -26, drift: 24, bob: 3.7, r: 8 },
  { img: 'card', w: 38, x: 90, y: 22, dx: -26, dy: 24, drift: 25, bob: 4.5, r: -12 },
  { img: 'car-teal', w: 78, x: 6, y: 38, dx: 44, dy: -8, drift: 30, bob: 4.3, r: -2 },
  { img: 'mask-fox', w: 58, x: 94, y: 55, dx: -30, dy: 24, drift: 29, bob: 5.2, r: 6 },
  { img: 'card', w: 36, x: 8, y: 68, dx: 30, dy: -28, drift: 23, bob: 4.1, r: 9 },
] as const

export const floaterSrc = (img: string) => `${P}/fl-${img}.webp`
