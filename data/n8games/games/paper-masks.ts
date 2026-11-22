import type { N8Game } from '../types'

/**
 * Paper Masks. Facts from its rules (PAPER-MASKS-RULES.md in the private ops repo)
 * and its module, party/games/paper-masks in github.com/n8watkins/n8-party-games
 * (main on 2026-11-16). It plays at the Table on the live site (3 to 8 players,
 * started at /table/). The clip and the pictures are one phone of a real three-player
 * match at the Table on the live site (2026-11-22, the "If We" prompts), cropped to the
 * game so the Table's party code is never in them; the three players are made up
 * (Pip, Toast and Noodle).
 */
const D = '/games/n8games/paper-masks'

export const paperMasks: N8Game = {
  slug: 'paper-masks',
  name: 'Paper Masks',
  theme: 'masks',
  card: {
    line: 'Everyone answers in secret. Guess who wrote what.',
    meta: '3 to 8 players, a phone each',
    tile: '/games/n8games/page/tile-masks.webp',
    tileAlt: "Paper Masks' poster: three torn-paper faces on sticks, tied with a ribbon.",
    tilt: 1.5,
  },
  intro: ['Everyone answers the same prompt in secret, and one reader reads the answers out with no names.', 'The table argues, everyone guesses who wrote what, and the masks come off.'],
  play: { href: 'https://partygames.n8builds.dev/table/', live: true },
  code: 'https://github.com/n8watkins/n8-party-games/tree/main/party/games/paper-masks',
  clip: {
    webm: `${D}/clip.webm`,
    mp4: `${D}/clip.mp4`,
    poster: `${D}/clip-poster.webp`,
    width: 432,
    height: 828,
    alt: 'Paper Masks on a phone at the Table, between red theatre curtains: a card turns over to deal the Sun mask, the prompt "If we were stuck in a lift for a day, the one thing you would want in your pocket" and the answer "A tiny harmonica" typed in secret, "Who wrote this? A very small fan" with Noodle tapped, the blank mask lifts off the moon mask, "Noodle wrote it", and the final curtain, "Pip wins".',
    frame: 'phone',
    caption: 'One phone in a real three-player match at the Table.',
  },
  pictures: [
    {
      src: `${D}/guess.webp`,
      width: 480,
      height: 920,
      alt: '"Who wrote this? A very small fan", with one of three tapped and Noodle picked from Noodle, Toast and The game.',
      caption: 'Who wrote it? Tap a name.',
    },
    {
      src: `${D}/reveal.webp`,
      width: 480,
      height: 920,
      alt: '"A very small fan": the moon mask, "Noodle wrote it", "You said Noodle. Right!", and Pip and Toast guessed right.',
      caption: 'Masks off.',
    },
    {
      src: `${D}/end.webp`,
      width: 480,
      height: 920,
      alt: 'The final curtain after three rounds: "Pip wins", 20 points, Best mask and Mind reader, and the scores of all three.',
      caption: 'The final curtain.',
    },
  ],
  steps: [
    'Everyone is dealt a mask. Everyone sees yours; nobody will see which answer is yours.',
    'A prompt comes up on every phone, and everyone writes one short answer in secret.',
    'The reader reads every answer out loud, with no names.',
    'One answer at a time, the table argues and everyone taps who wrote it. Each name can be used once.',
    'The reveal: whose it was, who guessed right and who was fooled. A point for each right guess, and a point for each friend you fool.',
  ],
  made: [
    { icon: 'shield', title: 'Who wrote what stays secret', body: 'It lives only on the server, and each phone is sent only what its seat may see.' },
    { icon: 'eye', title: 'Played by talking', body: "Only the reader's phone shows the list, so eyes go up to faces, where the clues are." },
    { icon: 'cards', title: 'Each name once', body: 'Each person wrote one answer, so a name you have used is dimmed. Guessing turns into a small puzzle.' },
    { icon: 'book', title: '83 prompts', body: 'Five packs, each prompt with two ghost answers for a table of three.' },
    { icon: 'test', title: 'Rules as pure functions', body: 'No clock and no hidden randomness, so whole matches are played out in tests.' },
    { icon: 'mask', title: 'Painted masks', body: 'Masks and a red curtain painted for the game, one mask dealt to each player.' },
  ],
  madeFrom: { label: 'Its rules module', href: 'https://github.com/n8watkins/n8-party-games/blob/main/party/games/paper-masks/README.md' },
  credits: [
    {
      heading: 'Inside',
      body: ['The masks, the curtain and the table are art made for the game. The prompts are written for it too.'],
      links: [{ label: 'The rules module', href: 'https://github.com/n8watkins/n8-party-games/tree/main/party/games/paper-masks' }],
      fine: ['The typefaces are Cinzel Decorative, Fraunces and Figtree (SIL Open Font License).'],
    },
  ],
  share: `${D}/share.jpg`,
}
