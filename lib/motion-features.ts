// The motion features the site uses (animate, exit, variants, gestures,
// in-view), loaded by LazyMotion in app/provider.tsx as their own chunk after
// the page has rendered, instead of in every page's first JavaScript.
import { domAnimation } from 'motion/react'

export default domAnimation
