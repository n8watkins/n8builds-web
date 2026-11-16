import type { N8Game } from '../types'

/**
 * Paper Masks. Facts from its rules (PAPER-MASKS-RULES.md in the private ops repo)
 * and its rules module, party/games/paper-masks in github.com/n8watkins/n8-party-games
 * (main on 2026-11-16). The clip and the pictures are the approved screens preview
 * (masks-round3), tapped through in order on a phone. It is not on the live site yet
 * (`live: false`): its Go play goes to the games site's front door for now.
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
  play: { href: 'https://partygames.n8builds.dev', live: false },
  code: 'https://github.com/n8watkins/n8-party-games/tree/main/party/games/paper-masks',
  clip: {
    webm: `${D}/clip.webm`,
    mp4: `${D}/clip.mp4`,
    poster: `${D}/clip-poster.webp`,
    width: 432,
    height: 934,
    alt: 'Paper Masks on a phone, between red theatre curtains: the table of six, a card turns over to deal the Fox mask, "Who wrote this? Never trust a ladder that is already up" with names to tap, the blank mask lifts to show the Owl, "Wren wrote it", and the final curtain, "Priya wins".',
    frame: 'phone',
    caption: 'One round, screen by screen.',
  },
  pictures: [
    {
      src: `${D}/deal.webp`,
      width: 480,
      height: 1038,
      alt: 'Your mask tonight: the Fox, on a gold-framed card. "Everyone sees your mask. Nobody sees which answer is yours."',
      caption: 'Dealt a mask.',
    },
    {
      src: `${D}/reveal.webp`,
      width: 480,
      height: 1038,
      alt: '"Never trust a ladder that is already up": the Owl mask, "Wren wrote it", with who guessed right and who was fooled.',
      caption: 'Masks off.',
    },
    {
      src: `${D}/end.webp`,
      width: 480,
      height: 1038,
      alt: 'The final curtain: "Priya wins", 23 points, the scores of all six, Best mask and Mind reader, and Play again.',
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
