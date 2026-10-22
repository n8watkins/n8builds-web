import type { Config } from 'tailwindcss'

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    extend: {
      // Opacity steps the UI uses (white/3, white/8, white/12) that are not in
      // Tailwind 3's default scale; without them those classes emit no CSS.
      opacity: {
        3: '0.03',
        8: '0.08',
        12: '0.12',
      },
      screens: {
        '1sm': '320px',
      },
      colors: {
        darkBlue: {
          DEFAULT: '#050812',
        },
        // Muted text tones for the dark UI. Stock slate-500 / slate-600 fall
        // below WCAG AA (4.5:1) for small text on the site's near-black
        // backgrounds; these keep the same hierarchy at >= 4.6:1.
        slate: {
          450: '#8291a7',
          475: '#768399',
        },
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      animation: {
        marquee: 'marquee var(--duration) linear infinite',
        'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
      },
      keyframes: {
        marquee: {
          from: {
            transform: 'translateX(0)',
          },
          to: {
            transform: 'translateX(calc(-100% - var(--gap)))',
          },
        },
        'marquee-vertical': {
          from: {
            transform: 'translateY(0)',
          },
          to: {
            transform: 'translateY(calc(-100% - var(--gap)))',
          },
        },
      },
    },
  },
} satisfies Config

export default config
