import type { N8Game } from '../types'

/**
 * Hot Potato. Facts from one-device/hot-potato/README.md and shared/CREDITS.txt in
 * github.com/n8watkins/n8-party-games (main on 2026-11-16). The clip is a round of
 * cities on a phone on a local run of the party site, with speech recognition
 * replaced by the scripted stand-in the game's own browser test uses.
 */
const D = '/games/n8games/hot-potato'

export const hotPotato: N8Game = {
  slug: 'hot-potato',
  name: 'Hot Potato',
  theme: 'potato',
  card: {
    line: 'Say a word out loud and pass it on, before the potato bursts.',
    meta: '2 to 8 players, one phone passed round',
    tile: '/games/n8games/page/tile-potato.webp',
    tileAlt: 'A deadpan cartoon potato strapped into a lab machine.',
    tilt: 2,
  },
  intro: ['A word chain by voice, on one phone passed around a group of 2 to 8.', 'Your word must start with the last letter of the one before. Five misses and the potato bursts.'],
  play: { href: 'https://partygames.n8builds.dev/one-device/hot-potato/', live: true },
  code: 'https://github.com/n8watkins/n8-party-games/tree/main/one-device/hot-potato',
  clip: {
    webm: `${D}/clip.webm`,
    mp4: `${D}/clip.mp4`,
    poster: `${D}/clip-poster.webp`,
    width: 432,
    height: 934,
    alt: 'Hot Potato on a phone: four players say Paris, Sydney and Yaounde, each answered with a green "Yes!", then "Salmon" gets a red "Nope!" and a slow turn "Too slow!", while the potato in its lab rig grows, sweats and turns green.',
    frame: 'phone',
    caption: 'A round of cities, on a phone.',
  },
  pictures: [
    {
      src: `${D}/start.webp`,
      width: 480,
      height: 1039,
      alt: 'The start screen: the potato in its rig, the categories (cities, countries, animals, food and drink, anything), the number of players, Sound and Buzz.',
      caption: 'Pick a category and the players.',
    },
    {
      src: `${D}/yes.webp`,
      width: 480,
      height: 1039,
      alt: 'A green screen with a big "Yes!" over the word Paris; the potato winks in its rig.',
      caption: 'Right: the letter moves on.',
    },
    {
      src: `${D}/too-slow.webp`,
      width: 480,
      height: 1039,
      alt: 'A red screen with "Too slow!"; the potato, bigger and green now, sweats in its rig.',
      caption: 'Too slow: it gets worse.',
    },
  ],
  steps: [
    'Pick a category (cities, countries, animals, food and drink, or anything) and 2 to 8 players.',
    'The holder taps their button and says a word. The fuse burns: 10 seconds while the potato is calm, less as it gets worse.',
    'Right, and the letter moves on. Wrong or too slow, and the potato grows and strains, and passes on.',
    'Every verdict has one appeal, because recognisers mishear. The group has the last word.',
    'The fifth miss bursts it on whoever is holding it.',
  ],
  made: [
    { icon: 'mic', title: 'The browser listens', body: 'The Web Speech API in Chrome, Edge and Safari. Where it cannot, every word is typed instead.' },
    { icon: 'offline', title: 'No server', body: 'The page is all there is: no accounts, and nothing sent anywhere by the page.' },
    { icon: 'book', title: 'A fair judge', body: 'A shared matcher checks each word against real lists and says why in plain words: "Paris starts with P, not S".' },
    { icon: 'face', title: 'Thirty faces', body: 'An angular potato in a lab rig, from deadpan to a scream. Cute, never scary.' },
    { icon: 'gauge', title: 'A stress ladder', body: 'A slow turn winds it up between lost lives: faster breaths, sweat, a shaking rig, lights going out.' },
    { icon: 'sound', title: 'Sound and buzz', body: 'Bell, knocks, clock and crack made with Web Audio, and a buzz where the phone can vibrate.' },
  ],
  madeFrom: { label: "The game's README", href: 'https://github.com/n8watkins/n8-party-games/blob/main/one-device/hot-potato/README.md' },
  credits: [
    {
      heading: 'The word lists',
      body: [
        'City and country names come from GeoNames, animals and food from Open English WordNet (both CC BY 4.0). Everyday words come from FrequencyWords (CC BY-SA 4.0) and SCOWL, with names from the US Census.',
      ],
      links: [
        { label: 'GeoNames', href: 'https://www.geonames.org/' },
        { label: 'Open English WordNet', href: 'https://en-word.net/' },
        { label: 'FrequencyWords', href: 'https://github.com/hermitdave/FrequencyWords' },
        { label: 'SCOWL', href: 'http://wordlist.aspell.net/' },
        { label: 'Every source', href: 'https://github.com/n8watkins/n8-party-games/blob/main/one-device/hot-potato/shared/CREDITS.txt' },
      ],
      fine: ['Also inside: the typeface Anton (SIL Open Font License).'],
    },
  ],
  share: `${D}/share.jpg`,
}
