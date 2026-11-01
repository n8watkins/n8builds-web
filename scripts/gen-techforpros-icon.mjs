// Makes Tech for Pros' icon for this site from the owner's master artwork.
// Run: node scripts/gen-techforpros-icon.mjs "<path to techforpros icon.png>"
//
// The master (1254x1254 RGBA, about 1 MB: a worker in a cap holding a blue
// gear, navy outlines on a transparent background) stays out of the repo; the
// owner keeps it. The site shows the icon at 20 to 40px, so a 256px PNG
// covers every use, sharp at 3x, and next/image resizes it from there.
import sharp from 'sharp'

const [, , master] = process.argv
if (!master) {
  console.error('usage: node scripts/gen-techforpros-icon.mjs <master.png>')
  process.exit(1)
}

const OUT = 'public/brands/techforpros.png'
const SIZE = 256

// Trim the transparent margin first, so the figure fills the square, then fit
// it into SIZE x SIZE on a transparent background, centred.
const trimmed = await sharp(master).trim({ threshold: 1 }).toBuffer()
await sharp(trimmed)
  .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
  .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
  .toFile(OUT)
console.log(`wrote ${OUT} (${SIZE}px)`)
