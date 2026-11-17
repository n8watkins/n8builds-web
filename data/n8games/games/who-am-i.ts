import type { N8Game } from '../types'

/**
 * Who Am I?. Facts from the game's README (github.com/n8watkins/who-am-i, main on
 * 2026-11-16). The clip is a normal game between two made-up players on a local run
 * (wrangler dev, pictures switched off), both phones recorded at once; recording
 * starts after the match starts, so no join code or QR code is in it.
 */
const D = '/games/n8games/who-am-i'

export const whoAmI: N8Game = {
  slug: 'who-am-i',
  name: 'Who Am I?',
  theme: 'who',
  card: {
    line: 'You each have a secret name. Ask questions to guess yours.',
    meta: '2 players, a phone each',
    tile: '/games/n8games/page/tile-who.webp',
    tileAlt: "Who Am I?'s poster: a purple tile with a question mark.",
    tilt: -1.5,
  },
  intro: ['A two-player guessing game: each of you gets a secret identity, a famous person, a character or a mascot.', 'You can see the one your opponent is guessing, never your own.'],
  play: { href: 'https://whoami.n8builds.dev', live: true },
  code: 'https://github.com/n8watkins/who-am-i',
  clip: {
    webm: `${D}/clip.webm`,
    mp4: `${D}/clip.mp4`,
    poster: `${D}/clip-poster.webp`,
    width: 740,
    height: 780,
    alt: "Two phones side by side. Maya, on the left, asks \"Am I a real person?\" and \"Am I alive today?\"; Jonah answers No and Yes on the right. She takes a hint, guesses, he confirms it, and the big reveal shows she was Marco Polo and he was Nelson Mandela.",
    frame: 'phone',
    caption: 'Two phones, one round, recorded at once.',
  },
  pictures: [
    {
      src: `${D}/turn.webp`,
      width: 480,
      height: 1039,
      alt: "Maya's turn: \"Jonah is Nelson Mandela\" at the top, suggested questions, a box to type one, and Hint, Give up and I Guessed It.",
      caption: 'Your turn: ask away.',
    },
    {
      src: `${D}/answer.webp`,
      width: 480,
      height: 1039,
      alt: 'Jonah\'s phone: Answer as Marco Polo, with "Am I a real person?" answered No.',
      caption: 'Their phone: answer as the name you see.',
    },
    {
      src: `${D}/reveal.webp`,
      width: 480,
      height: 1039,
      alt: 'The big reveal: You were Marco Polo, guessed it with one hint; Jonah was Nelson Mandela, gave up. Maya 1, Jonah 0, and Next round.',
      caption: 'The big reveal.',
    },
  ],
  steps: [
    'One player creates a game and picks a category. The other joins with the QR code, the invite link or a 4-digit PIN.',
    "Each screen shows your opponent's character, and yours as Hidden.",
    'On your turn, ask yes or no questions, out loud or in the app. Your opponent answers on their phone.',
    'Stuck? Up to three hints a turn, vague to strong. Say your guess and tap I Guessed It; they confirm it.',
    'After both turns, the big reveal. First to 5 points, or the best after 10 rounds.',
  ],
  made: [
    { icon: 'shield', title: 'The secret stays on the server', body: 'Your own identity never reaches your phone before the reveal. Every message is built for one player.' },
    { icon: 'server', title: 'One room, one Durable Object', body: 'The room is the game server: hibernating sockets, and one alarm for the turn timer and the room closing.' },
    { icon: 'test', title: 'Tested for leaks', body: 'Browser tests record every response and socket frame, and check your name never arrives early.' },
    { icon: 'phone', title: 'Phone comforts', body: 'The screen stays on, the other phone says when you step away, and a sound and a buzz mark your turn.' },
    { icon: 'image', title: 'A result card', body: 'Share result paints a picture of the match in the browser: names and scores, never an identity.' },
    { icon: 'users', title: 'No account', body: 'One player creates a room, the other opens the link, and you are playing in under 30 seconds.' },
  ],
  madeFrom: { label: "The game's README", href: 'https://github.com/n8watkins/who-am-i#readme' },
  credits: [
    {
      heading: 'The pictures',
      body: [
        'Most identities have a picture: real people have a free photo or portrait from Wikimedia Commons, chosen by hand, and the phone loads it straight from Wikimedia, with its author and licence.',
      ],
      links: [{ label: 'Wikimedia Commons', href: 'https://commons.wikimedia.org/' }],
      fine: ['The game itself is MIT licensed.'],
    },
  ],
  share: `${D}/share.jpg`,
}
