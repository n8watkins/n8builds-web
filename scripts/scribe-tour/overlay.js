// The tour's overlay (record.mjs): a cursor that glides between the things it
// clicks and a ring where it clicks. Drawn over the app, never in its way (pointer-events: none); the
// clicks themselves are real ones on the app.
(() => {
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  let layer, arrow
  let x = 0
  let y = 0
  const place = () => {
    arrow.style.transform = `translate(${x}px, ${y}px)`
  }
  const mount = () => {
    if (layer) return
    layer = document.createElement('div')
    layer.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;'
    arrow = document.createElement('div')
    arrow.style.cssText = 'position:absolute;left:0;top:0;width:18px;height:26px;will-change:transform;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45));'
    // The Windows arrow: white with a dark edge, its tip at the point.
    arrow.innerHTML =
      '<svg width="18" height="26" viewBox="0 0 18 26"><path d="M1.5 1.5v19.3l4.9-4.7 3.2 7.4 3.1-1.3-3.1-7.3h6.8z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>'
    layer.append(arrow)
    document.body.append(layer)
  }
  window.__tour = {
    show(px, py) {
      mount()
      x = px
      y = py
      place()
    },
    moveTo(px, py, ms) {
      mount()
      const x0 = x
      const y0 = y
      const t0 = performance.now()
      return new Promise((resolve) => {
        const step = (now) => {
          const t = Math.min(1, (now - t0) / ms)
          const e = ease(t)
          x = x0 + (px - x0) * e
          y = y0 + (py - y0) * e
          place()
          if (t < 1) requestAnimationFrame(step)
          else resolve()
        }
        requestAnimationFrame(step)
      })
    },
    press() {
      const ring = document.createElement('div')
      ring.style.cssText = `position:absolute;left:${x - 14}px;top:${y - 14}px;width:28px;height:28px;border-radius:50%;border:2px solid rgba(129,140,248,.9);background:rgba(129,140,248,.18);`
      layer.append(ring)
      ring.animate([{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(1.25)', opacity: 0 }], { duration: 420, easing: 'ease-out' }).onfinish = () => ring.remove()
      arrow.animate([{ scale: '1' }, { scale: '.86' }, { scale: '1' }], { duration: 180 })
    },
  }
})()
