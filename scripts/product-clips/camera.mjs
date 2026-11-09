// A camera for product clips (owner, 2026-11-09): a zoom in the video itself,
// like Screen Studio, never the browser's zoom (that only reflows the page).
// The take is recorded at high resolution (deviceScaleFactor 2), the recording
// script logs where each focus target was (getBoundingClientRect, in CSS px)
// and when, and this turns that log into an ffmpeg filter that eases the
// camera onto each target, holds while it is read, and pulls back.
//
//   node scripts/product-clips/camera.mjs <shots.json>          prints the -vf filter
//   node scripts/product-clips/camera.mjs <shots.json> <in> <out>  applies it (lossless .mkv out)
//
// shots.json:
//   {
//     "source": { "width": 2560, "height": 1600 }, // the take's pixel size
//     "scale": 2,                                 // take px per CSS px (the deviceScaleFactor)
//     "output": { "width": 1280, "height": 800 },  // optional, default 1280x800
//     "pad": 24,                                  // optional, CSS px kept round each target
//     "maxZoom": 2.6,                             // optional cap on how far in it goes
//     "keys": [                                   // seconds into the take, in order
//       { "t": 0 },                               // no box: the whole frame
//       { "t": 6.2 },                             // still the whole frame here...
//       { "t": 7.0, "box": { "x": 16, "y": 192, "w": 833, "h": 166 } }, // ...eased in by 7.0s
//       { "t": 9.5, "box": { "x": 16, "y": 192, "w": 400, "h": 166 } }, // a pan along it
//       { "t": 12 }                               // and back out
//     ]
//   }
//
// Between two keys the camera eases (smoothstep) from one framing to the next;
// two keys with the same box hold it. A box is grown to the output's aspect
// ratio (plus the padding) and kept inside the frame. How it works: ffmpeg's
// zoompan filter, one output frame per input frame (d=1), with the zoom and the
// window's top-left as eased expressions of the input time (`it`). (Scaling each
// frame and cropping a fixed window doesn't work: a size that changes every
// frame reinitializes the crop.)
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/** The camera's framing for a key: its centre and width, in take pixels. */
export function framing(key, shots) {
  const { width: SW, height: SH } = shots.source
  const out = shots.output ?? { width: 1280, height: 800 }
  const aspect = out.width / out.height
  if (!key.box) return { cx: SW / 2, cy: SH / 2, w: SW }
  const s = shots.scale ?? 1
  const pad = (key.pad ?? shots.pad ?? 24) * s
  let w = key.box.w * s + pad * 2
  let h = key.box.h * s + pad * 2
  if (w / h < aspect) w = h * aspect
  w = Math.min(SW, Math.max(w, SW / (shots.maxZoom ?? 2.6)))
  h = w / aspect
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
  const cx = clamp((key.box.x + key.box.w / 2) * s, w / 2, SW - w / 2)
  const cy = clamp((key.box.y + key.box.h / 2) * s, h / 2, SH - h / 2)
  return { cx, cy, w }
}

const num = (v) => Number(v.toFixed(3))

/** A piecewise, eased ffmpeg expression in the input time `it` for one property of the framings. */
function piecewise(keys, values) {
  const t = 'it'
  let expr = String(num(values.at(-1)))
  for (let i = keys.length - 2; i >= 0; i--) {
    const [a, b] = [keys[i].t, keys[i + 1].t]
    const [va, vb] = [values[i], values[i + 1]]
    const k = `clip((${t}-${num(a)})/${num(b - a)},0,1)`
    const seg = va === vb || b <= a ? String(num(va)) : `(${num(va)}+(${num(vb - va)})*${k}*${k}*(3-2*${k}))`
    expr = `if(lt(${t},${num(b)}),${seg},${expr})`
  }
  return expr
}

/** The -vf filter for a shots log. */
export function cameraFilter(shots) {
  const { width: SW } = shots.source
  const out = shots.output ?? { width: 1280, height: 800 }
  if (!shots.keys?.length) throw new Error('shots.keys is empty')
  // Keys in time order, never going back.
  const keys = shots.keys.reduce((list, k) => [...list, { ...k, t: Math.max(k.t, list.at(-1)?.t ?? 0) }], [])
  const frames = keys.map((k) => framing(k, shots))
  const zoom = piecewise(keys, frames.map((f) => SW / f.w))
  const cx = piecewise(keys, frames.map((f) => f.cx))
  const cy = piecewise(keys, frames.map((f) => f.cy))
  // The window is iw/zoom wide; its top-left keeps the eased centre in the middle.
  return [
    `zoompan=z='${zoom}':x='clip(${cx}-iw/zoom/2,0,iw-iw/zoom)':y='clip(${cy}-ih/zoom/2,0,ih-ih/zoom)':d=1:s=${out.width}x${out.height}:fps=${shots.fps ?? 24}`,
    'setsar=1',
].join(',')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [log, input, output] = process.argv.slice(2)
  if (!log) throw new Error('usage: camera.mjs <shots.json> [<in> <out>]')
  const filter = cameraFilter(JSON.parse(readFileSync(log, 'utf8')))
  if (!input) {
    console.log(filter)
  } else {
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', input, '-an', '-vf', filter, '-c:v', 'libx264', '-preset', 'ultrafast', '-qp', '0', output], {
      stdio: 'inherit',
    })
  }
}
