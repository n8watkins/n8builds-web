// Generates email-safe PNG social icons into public/email/.
// Emails can't use react-icons components, so we rasterize them once here.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { FaLinkedinIn, FaGithub, FaXTwitter } from 'react-icons/fa6'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const COLOR = '#475569' // slate-600 — reads as neutral on the white email card
const SIZE = 64 // rendered 2x+ for retina; displayed at ~22px

const icons = [
  { name: 'linkedin', Component: FaLinkedinIn },
  { name: 'github', Component: FaGithub },
  { name: 'x', Component: FaXTwitter },
]

mkdirSync('public/email', { recursive: true })

for (const { name, Component } of icons) {
  const svg = renderToStaticMarkup(createElement(Component, { size: SIZE }))
    .replace(/currentColor/g, COLOR)
  await sharp(Buffer.from(svg)).resize(SIZE, SIZE).png().toFile(`public/email/${name}.png`)
  console.log(`wrote public/email/${name}.png`)
}
