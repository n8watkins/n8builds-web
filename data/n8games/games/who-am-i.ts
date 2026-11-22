import type { N8Game } from '../types'

/**
 * Who Am I?. Facts from the game's README (github.com/n8watkins/who-am-i, main on
 * 2026-11-16). The clip and the pictures are a round between two made-up players
 * (Pip and Toast, Historical Figures) at the Table on the live party site
 * (partygames.n8builds.dev, 2026-11-22), both phones recorded at once and cropped
 * below the Table's header, so no party code is in them.
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
  // At the Table on the party site; its own site still plays it too.
  play: { href: 'https://partygames.n8builds.dev/table/', live: true, also: { label: 'Or on its own site', href: 'https://whoami.n8builds.dev' } },
  code: 'https://github.com/n8watkins/who-am-i',
  clip: {
    webm: `${D}/clip.webm`,
    mp4: `${D}/clip.mp4`,
    poster: `${D}/clip-poster.webp`,
    width: 740,
    height: 730,
    alt: 'Two phones side by side at the Table. Toast, on the left, asks "Am I a real person?"; Pip answers Yes on the right, under a picture of Socrates. Toast takes a hint ("A thinker from the ancient world"), guesses, Pip confirms it, and the big reveal shows Toast was Socrates and Pip was Marie Curie.',
    frame: 'phone',
    caption: 'Two phones at the Table, one round, recorded at once.',
  },
  pictures: [
    {
      src: `${D}/turn.webp`,
      width: 480,
      height: 973,
      alt: 'Toast\'s turn: "Pip is Marie Curie" with her picture at the top, "Your name: hidden", suggested questions, a box to type one, and Hint, Pass and I Guessed It.',
      caption: 'Your turn: ask away.',
    },
    {
      src: `${D}/answer.webp`,
      width: 480,
      height: 973,
      alt: 'Pip\'s phone: Answer as Socrates, under his picture, and "Toast asks: Am I a real person?" with Yes, No, Sort of and Don\'t know.',
      caption: 'Their phone: answer as the name you see.',
    },
    {
      src: `${D}/reveal.webp`,
      width: 480,
      height: 973,
      alt: 'The big reveal: You were Socrates, guessed it with one hint and one question; Pip was Marie Curie, beaten to it. Toast 1, Pip 0, and Next round.',
      caption: 'The big reveal.',
    },
  ],
  steps: [
    'Start a party at the Table and pick Who Am I?. The host picks a category, the hints and how long the match runs.',
    "Each phone shows the other player's name and picture, and yours as hidden.",
    'On your move, ask one yes or no question, out loud or in the app. The other player answers on their phone; then guess or pass.',
    'Stuck? Up to three hints, vague to strong. Say your guess and tap I Guessed It; they confirm it.',
    'The big reveal shows both names. Anyone else at the Table watches the match.',
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
