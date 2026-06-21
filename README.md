# Nate Builds 🔧 — n8builds.dev

The public builder lab of Nathan Watkins — a Next.js site for building software in public: apps, AI tools, agents, experiments, and build logs. Cloned from Portfolio 2.0 and rebranded.

**Live at [n8builds.dev](https://n8builds.dev)** — deployed on Vercel (auto-deploy on push to `main`), DNS via Cloudflare.

## ✨ Key Features

- **Modern Stack**: Next.js 16 (App Router) with React 19, TypeScript, and Tailwind CSS
- **Hardened Contact Form**: Gmail SMTP (Nodemailer) with a layered defense stack — rate limiting, honeypot, Zod validation, and template-time HTML escaping
- **Advanced Animations**: Framer Motion with scroll-triggered fade-ins and interactive elements
- **Performance Optimized**: Code-split below-the-fold sections, optimized images, and Web Vitals monitoring
- **Security First**: Request-size cap, in-memory rate limiting (5/hour), honeypot, and HTML-entity escaping of user input in emails
- **Fully Responsive**: Mobile-first design with seamless desktop experience
- **Analytics Integration**: Google Analytics with custom event tracking for all interactions
- **Dark/Light Theme**: Automatic system preference detection with manual toggle
- **Error Boundaries**: Granular section-level error handling with graceful degradation
- **Web Vitals HUD**: Real-time performance monitoring (Alt+Shift+V toggle in dev mode)
- **Testing & CI**: Playwright E2E tests, Lighthouse CI, and automated accessibility testing

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript for type safety
- Tailwind CSS for styling
- Framer Motion for animations
- React Hook Form + Zod validation
- Next Themes for theme management

**Backend:**
- Next.js API Routes
- Nodemailer + Gmail SMTP for email delivery
- Google reCAPTCHA v3 (wired, disabled in production — see Contact Form Deep Dive)
- Layered request validation + security middleware

**Development & Testing:**
- ESLint + TypeScript strict mode
- Playwright for E2E testing
- Lighthouse CI for performance
- Husky + lint-staged for git hooks
- Bundle analyzer for optimization
- Vercel for deployment (auto-deploy on push to `main`)
- Error tracking handled by section/global error boundaries (Sentry was removed — no `@sentry/nextjs` dependency or config)

### Project Structure

```
n8builds-web/
├── app/                          # Next.js 16 App Router
│   ├── api/
│   │   ├── contact/
│   │   │   └── route.ts          # Contact API orchestration
│   │   └── health/               # Health check endpoints
│   ├── globals.css               # Global styles and CSS variables
│   ├── layout.tsx                # Root layout with providers & metadata
│   ├── page.tsx                  # Home page with lazy-loaded sections
│   ├── provider.tsx              # Theme provider wrapper
│   ├── web-vitals.tsx            # Performance monitoring
│   └── global-error.tsx          # Global error boundary
├── components/                   # React components
│   ├── ContactForm/              # Multi-file contact form module
│   ├── Projects/                 # Project showcase module
│   ├── sections/                 # Page sections
│   │   ├── Hero.tsx              # Landing section
│   │   ├── Grid.tsx              # About/BentoGrid section
│   │   ├── TechStackBento.tsx    # Tech-stack bento marquee
│   │   ├── FeaturedProjects.tsx  # Featured builds
│   │   ├── BuildStacks.tsx       # Build stacks
│   │   ├── Loadout.tsx           # Daily-driver loadout
│   │   ├── Shelf.tsx             # Shelf / collections
│   │   ├── ExtensionsShowcase.tsx# Browser extensions showcase
│   │   ├── ToolsSection.tsx      # Free tools suite
│   │   ├── NowBuilding.tsx       # "Now building" section
│   │   └── Experience.tsx        # Work experience
│   ├── layout/                   # Layout components
│   │   ├── FloatingNav.tsx       # Sticky floating navigation
│   │   ├── Navbar.tsx            # Top navbar
│   │   └── Footer.tsx            # Site footer
│   ├── ui/                       # Reusable UI components
│   │   ├── BentoGrid.tsx         # Data-driven grid system
│   │   ├── MagicButton.tsx       # Animated buttons
│   │   └── ScrollToTop.tsx       # Scroll-to-top button
│   ├── SectionErrorBoundary.tsx  # Granular error boundaries
│   ├── ErrorBoundary.tsx         # Global error boundary
│   └── WebVitalsHUD.tsx          # Performance HUD (Alt+Shift+V)
├── lib/                          # Utilities and business logic
│   ├── security/                 # Security modules
│   │   ├── rateLimiter.ts        # In-memory IP-based rate limiting
│   │   ├── recaptcha.ts          # reCAPTCHA + honeypot verification
│   │   └── validation.ts         # Request size (10KB) + JSON parse validation
│   ├── email/                    # Email functionality
│   │   ├── smtp.ts               # Gmail SMTP transport + config
│   │   ├── sender.ts             # Email sending logic
│   │   └── templates.ts          # HTML email templates + HTML-entity escaping
│   ├── validations/              # Zod schemas
│   │   └── contact.ts            # Contact form validation
│   ├── analytics.ts              # Google Analytics tracking
│   ├── animations.ts             # Framer Motion presets
│   ├── logger.ts                 # Centralized logging
│   └── types.ts                  # TypeScript types
├── data/                         # Static content
│   ├── grid/                     # BentoGrid items (split into files)
│   ├── index.ts                  # Data barrel re-exports
│   ├── projects.tsx              # Project portfolio data
│   ├── builds.tsx                # Build logs
│   ├── experience.tsx            # Work history
│   ├── techStack.tsx             # Technology arrays
│   └── navigation.tsx            # Nav items
├── hooks/                        # Custom React hooks
│   ├── useSectionTracking.ts    # IntersectionObserver tracking
│   └── useScrollTracking.ts     # Scroll depth monitoring
├── tests/                        # Playwright E2E tests
│   └── web-vitals.spec.ts       # Performance testing
├── public/                       # Static assets
│   ├── projects/                 # Project screenshots
│   ├── hero/                     # Hero section images
│   └── bento/                    # BentoGrid assets
└── [config files]                # Next.js, TS, Tailwind, Playwright, etc.
```

**Key Stats:**
- **~12k lines** of TypeScript/TSX across `app/`, `components/`, `lib/`, `data/`, and `hooks/`
- **First Load JS**: measure with `npm run analyze` (bundle analyzer)
- **ESLint**: 0 errors (15 pre-existing `react-hooks` warnings)

## 🚀 Getting Started

### Prerequisites

- Node.js 20.9+ and npm (see `engines` in `package.json`)
- Environment variables (see `.env.local.example`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/n8watkins/n8builds-web.git
   cd n8builds-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:1337
NEXT_PUBLIC_VERSION=1.0.0

# Google Analytics
NEXT_PUBLIC_GA_ID=your_ga_id

# Google reCAPTCHA v3 (optional — verification is skipped when the secret is unset)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key

# Contact Form Email (Nodemailer + Gmail SMTP)
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
CONTACT_EMAIL_TO=your-email@domain.com
# Public From/reply address shown in outgoing mail. NOTE: Gmail only honors this
# as the From address once it is registered as a verified "Send mail as" alias —
# until then Gmail rewrites From to GMAIL_USER's own address.
CONTACT_EMAIL_FROM=contact@n8builds.dev
```

#### 🔑 Where to Get API Keys

| Service | URL | Free Tier | Notes |
|---------|-----|-----------|-------|
| Google Analytics | [analytics.google.com](https://analytics.google.com) | ✅ Yes | Create a GA4 property |
| reCAPTCHA v3 | [google.com/recaptcha](https://www.google.com/recaptcha/admin) | ✅ Yes | Select "reCAPTCHA v3" (NOT v2) |
| Gmail app password | [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) | ✅ ~500 emails/day | Requires 2-step verification |

## 📧 Contact Form Deep Dive

The contact form is a layered, defense-in-depth solution backed by Gmail SMTP.

### Features

- **Layered security** (see Security Measures below)
- **Client-side validation** with React Hook Form + Zod
- **Server-side validation** with Zod schema parsing
- **Rate limiting** to prevent spam (5 requests per hour in production)
- **Honeypot field** for bot detection
- **HTML-entity escaping** of all user input rendered into emails (prevents HTML/XSS injection in the inbox)
- **Request size validation** (10KB limit)
- **reCAPTCHA v3** — wired but currently disabled in production (no secret key set)
- **Professional email templates** with auto-reply functionality
- **Real-time character counting** and field validation
- **Smooth animations** and loading states with confetti celebration
- **Accessibility compliant** with WCAG guidelines

### Technical Implementation

**Frontend Flow:**
1. User fills out form with real-time validation
2. On submit, reCAPTCHA executes invisibly (when site/secret keys are configured)
3. Form validation runs with the reCAPTCHA token
4. API request sent to `/api/contact`
5. Success/error states with animations

**Backend Flow** (`app/api/contact/route.ts`):
1. Request size validation (10KB limit)
2. Rate limiting check per IP (5 requests/hour in production)
3. JSON parse + Zod schema validation
4. Honeypot field check
5. reCAPTCHA token verification (skipped when `RECAPTCHA_SECRET_KEY` is unset — see below)
6. Email sending via Nodemailer (Gmail SMTP), with user input HTML-entity-escaped at template time
7. Auto-reply confirmation email to the submitter

### Security Measures

The active layers (in request order):

1. **Request Size Validation** — `lib/security/validation.ts` caps the raw body at 10KB (DoS guard) and safely parses JSON.
2. **In-memory Rate Limiting** — `lib/security/rateLimiter.ts` enforces 5 requests/hour per IP in production (50/hour in dev). Note: the store is per serverless instance, so the limit is best-effort across Vercel's pool, not a global counter.
3. **Zod Schema Validation** — `lib/validations/contact.ts` enforces field types, lengths, and shape; invalid payloads are rejected.
4. **Honeypot Field** — `lib/security/recaptcha.ts → validateHoneypot()` rejects submissions where the hidden field is filled.
5. **Template-time HTML Escaping** — `lib/email/templates.ts → sanitizeHtml()` escapes `&`, `<`, `>`, `"`, and `'` in every user-supplied value before it is interpolated into the email HTML. (This is a hand-rolled escaper — DOMPurify/jsdom were removed because their dependency chain breaks Vercel's serverless runtime.)
6. **Error Masking** — generic error messages are returned to clients while detailed errors are logged server-side.

**reCAPTCHA v3 (currently inactive in production):** `lib/security/recaptcha.ts` returns `true` (allow) when `RECAPTCHA_SECRET_KEY` is unset, and the key is **not** configured on Vercel — so reCAPTCHA does not gate submissions in production today. It also short-circuits in development. The wiring is in place and the layer activates automatically once the secret key is set. Honeypot + rate limiting are the active bot defenses in the meantime.

**Additional notes:**
- In-memory rate-limit store with automatic cleanup
- reCAPTCHA + rate limiting are bypassed in development for easier testing
- Comprehensive logging for audit trails
- No sensitive data exposure in responses

## 🎨 Animations & UX

### Framer Motion Integration

- **Scroll-triggered animations** with intersection observers
- **Staggered reveals** for portfolio grid items
- **Smooth page transitions** and micro-interactions
- **Loading states** with skeleton animations
- **Success celebrations** rendered with `lottie-react` (`data/confetti.json` in `ContactFormSuccess.tsx`), not Framer Motion

### Performance Optimizations

- **Lazy loading** for images and components
- **Code splitting** for optimal bundle sizes
- **Next.js Image optimization** with proper sizing
- **CSS-in-JS optimization** with Tailwind
- **Analytics integration** without performance impact

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server (with HMR)
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run type-check   # TypeScript type checking without emit

# Testing & Analysis
npm run test         # Run Playwright E2E tests
npm run test:ui      # Run Playwright in UI mode
npm run lighthouse   # Run Lighthouse CI performance audit
npm run analyze      # Build with bundle analysis (ANALYZE=true)

# Maintenance
npm run clean        # Clean .next and out directories
npm run prepare      # Setup Husky git hooks
```

### Code Quality

- **TypeScript Strict Mode** - Type-safe codebase
- **ESLint** with Next.js configuration — `npm run lint` reports **0 errors** (15 pre-existing `react-hooks` warnings)
- **Husky + lint-staged** - Pre-commit hooks run `eslint --fix` on staged files
- **Component-driven development** with modular architecture
- **Inline documentation** - JSDoc comments across security and email modules

## 📈 Analytics & Monitoring

### Performance Monitoring
- **Web Vitals HUD** - Real-time metrics display (Alt+Shift+V in dev mode)
- **Vercel Speed Insights** - Real user monitoring in production
- **Lighthouse CI** - Automated performance audits with thresholds
- **Bundle Analyzer** - Track bundle size over time

### User Analytics
- **Google Analytics 4** with comprehensive event tracking:
  - Section views (IntersectionObserver-based)
  - Scroll depth milestones (25%, 50%, 75%, 100%)
  - Project interactions (views, icon clicks)
  - Contact form events (view, focus, submit, errors)
  - Resume downloads/views
  - Social media clicks
  - Web Vitals metrics

### Error Tracking
- **Section-level error boundaries** for granular failure isolation
- **Global error boundary** for unhandled exceptions
- **Custom error reporting** to health API endpoint
- **Sentry** — *removed; no `@sentry/nextjs` dependency or config remains (only a stray `app/api/sentry-example-api/route.ts` and a `SENTRY_ORG` boolean health-check flag)*

## 🚢 Deployment

The site is live at **[n8builds.dev](https://n8builds.dev)**, hosted on Vercel with DNS managed by Cloudflare. Pushes to `main` auto-deploy.

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

### Manual Deployment

```bash
npm run build
npm run start
```

## 🛠️ Customization

### Content Management

- **Portfolio data**: Edit the files under `data/` (re-exported via `data/index.ts`)
- **Project information**: Update project arrays and images in `data/projects.tsx`
- **Contact details**: Modify footer and contact sections
- **Theme colors**: Customize in `app/globals.css`

### Adding New Sections

1. Create component in `components/sections/`
2. Add to main page in `app/page.tsx`
3. Update navigation in `components/layout/FloatingNav.tsx`
4. Add animations and styling

## 🔒 Security Considerations

- Never commit API keys or secrets
- Use environment variables for all sensitive data
- Regular dependency updates for security patches
- Rate limiting and validation on all endpoints
- Proper error handling without information disclosure

## 📝 Development Notes

### Performance Optimizations
- **Bundle Size**: measured via `npm run analyze` (`@next/bundle-analyzer`)
- **Dynamic Imports**: Below-the-fold components lazy loaded
- **Image Optimization**: AVIF/WebP formats with Next/Image
- **Font Optimization**: Inter font with subset loading and swap display
- **Package Tree-shaking**: Optimized imports for lucide-react, framer-motion, etc.

### Technical Highlights
- **CSS Masks**: Gradient effects in infinite card animations
- **Marquee Components**: Magic UI marquee for performant infinite scroll
- **Animation Performance**: Framer Motion optimized for 60fps
- **Form UX**: Invisible reCAPTCHA v3 wiring keeps the experience seamless when enabled
- **Error Resilience**: Section-level boundaries prevent cascading failures
- **Type Safety**: Zod schemas provide runtime validation + TypeScript types

## 🏛️ Architecture Decisions

### Composition Pattern for Grid Items

The BentoGrid uses a data-driven composition pattern instead of ID-based conditionals:

```typescript
// ✅ Clean: Data-driven render functions
<BentoGridItem
  renderBackground={() => <GridPattern />}
  renderContent={() => <MapDetails />}
  renderForeground={() => <TechStack />}
/>

// ❌ Old: 152 lines of ID-based conditionals
{id === 1 && <Component1 />}
{id === 2 && <Component2 />}
```

**Result**: 59% code reduction, better maintainability, easier testing

### Shared Field Wrapper Component

Form fields use a shared wrapper to eliminate duplication:

```typescript
<FieldWrapper label="Name" error={errors.name} emoji="👤">
  <input {...field} />
</FieldWrapper>
```

**Benefits**: DRY principle, consistent styling, centralized error handling

### Centralized Animation Library

All animations defined in `lib/animations.ts` for consistency:

```typescript
import { animationPresets } from '@/lib/animations'

<motion.div {...animationPresets.fadeInUp}>
  Content
</motion.div>
```

**Benefits**: Consistent timing, easy global changes, better performance

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ by Nathan Watkins using modern web technologies.

