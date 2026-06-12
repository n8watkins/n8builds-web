# Nate Builds 🔧 — n8builds.dev

The public builder lab of Nathan Watkins — a Next.js site for building software in public: apps, AI tools, agents, experiments, and build logs. Cloned from Portfolio 2.0 and rebranded.

## ✨ Key Features

- **Modern Stack**: Next.js 14 with App Router, TypeScript, and Tailwind CSS
- **Enterprise Contact Form**: 7-layer security with Gmail SMTP, reCAPTCHA v3, rate limiting, and XSS protection
- **Advanced Animations**: Framer Motion with scroll-triggered fade-ins and interactive elements
- **Performance Optimized**: 340 kB bundle size, optimized images, and comprehensive monitoring
- **Security First**: Multi-layer protection with rate limiting (5/hour), honeypot, and sanitization
- **Fully Responsive**: Mobile-first design with seamless desktop experience
- **Analytics Integration**: Google Analytics with custom event tracking for all interactions
- **Dark/Light Theme**: Automatic system preference detection with manual toggle
- **Error Boundaries**: Granular section-level error handling with graceful degradation
- **Web Vitals HUD**: Real-time performance monitoring (Alt+Shift+V toggle in dev mode)
- **Testing & CI**: Playwright E2E tests, Lighthouse CI, and automated accessibility testing

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript for type safety
- Tailwind CSS for styling
- Framer Motion for animations
- React Hook Form + Zod validation
- Next Themes for theme management

**Backend:**
- Next.js API Routes
- Nodemailer + Gmail SMTP for email delivery
- Google reCAPTCHA v3
- Comprehensive security middleware

**Development & Testing:**
- ESLint + TypeScript strict mode
- Playwright for E2E testing
- Lighthouse CI for performance
- Husky + lint-staged for git hooks
- Bundle analyzer for optimization
- Vercel for deployment
- Sentry for error monitoring

### Project Structure

```
n8builds-web/
├── app/                          # Next.js 14 App Router
│   ├── api/
│   │   ├── contact/
│   │   │   └── route.ts          # Contact API orchestration (168 lines)
│   │   └── health/               # Health check endpoints
│   ├── globals.css               # Global styles and CSS variables
│   ├── layout.tsx                # Root layout with providers & metadata
│   ├── page.tsx                  # Home page with lazy-loaded sections
│   ├── provider.tsx              # Theme provider wrapper
│   ├── web-vitals.tsx            # Performance monitoring
│   └── global-error.tsx          # Global error boundary
├── components/                   # React components
│   ├── ContactForm/              # Multi-file contact form module
│   │   ├── index.tsx             # Main form component
│   │   ├── ContactFormFields.tsx # Form fields UI
│   │   ├── ContactFormSuccess.tsx # Success state
│   │   └── useContactFormSubmit.ts # Form logic hook
│   ├── Projects/                 # Project showcase module
│   │   ├── index.tsx             # Projects container
│   │   ├── ProjectCard.tsx       # Individual project cards
│   │   ├── ProjectModal.tsx      # Project detail modal
│   │   └── utils.ts              # Helper functions
│   ├── sections/                 # Page sections
│   │   ├── Hero.tsx              # Landing section
│   │   ├── Grid.tsx              # About/BentoGrid section
│   │   ├── Experience.tsx        # Work experience
│   │   └── Clients.tsx           # Testimonials
│   ├── layout/                   # Layout components
│   │   ├── FloatingNav.tsx       # Sticky navigation
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
│   │   ├── rateLimiter.ts        # IP-based rate limiting (131 lines)
│   │   ├── recaptcha.ts          # reCAPTCHA verification (103 lines)
│   │   └── validation.ts         # Input sanitization (86 lines)
│   ├── email/                    # Email functionality
│   │   ├── sender.ts             # Email sending logic (110 lines)
│   │   └── templates.ts          # HTML email templates
│   ├── validations/              # Zod schemas
│   │   └── contact.ts            # Contact form validation
│   ├── analytics.ts              # Google Analytics tracking
│   ├── animations.ts             # Framer Motion presets
│   ├── logger.ts                 # Centralized logging
│   └── types.ts                  # TypeScript types
├── data/                         # Static content
│   ├── grid/                     # BentoGrid items (split into files)
│   │   ├── gridItems.tsx         # Re-exports (15 lines)
│   │   └── items/                # Individual grid items
│   ├── projects.tsx              # Project portfolio data
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
- **6,818 lines** of TypeScript/TSX
- **340 kB** First Load JS (15% under budget)
- **A+ grade** (96/100) code quality
- **Zero** technical debt (no TODO/FIXME)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
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
# Google Analytics
NEXT_PUBLIC_GA_ID=your_ga_id

# Site Info
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME=Nate Builds
NEXT_PUBLIC_VERSION=2.0

# Google reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key

# Contact Form Email (Nodemailer + Gmail SMTP)
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
CONTACT_EMAIL_TO=your-email@domain.com

# Sentry (Optional - Error Tracking)
SENTRY_AUTH_TOKEN=your_sentry_token
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

#### 🔑 Where to Get API Keys

| Service | URL | Free Tier | Notes |
|---------|-----|-----------|-------|
| Google Analytics | [analytics.google.com](https://analytics.google.com) | ✅ Yes | Create a GA4 property |
| reCAPTCHA v3 | [google.com/recaptcha](https://www.google.com/recaptcha/admin) | ✅ Yes | Select "reCAPTCHA v3" (NOT v2) |
| Gmail app password | [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) | ✅ ~500 emails/day | Requires 2-step verification |
| Sentry | [sentry.io](https://sentry.io) | ✅ 5K errors/month | Error tracking (optional) |

## 📧 Contact Form Deep Dive

The contact form is a production-ready enterprise solution with multiple layers of security and validation.

### Features

- **7-layer security architecture** (see Security Measures below)
- **Client-side validation** with React Hook Form + Zod
- **Server-side validation** with comprehensive sanitization
- **reCAPTCHA v3** for invisible bot protection (score-based)
- **Rate limiting** to prevent spam (5 requests per hour)
- **Honeypot field** for additional bot detection
- **XSS protection** with DOMPurify sanitization
- **Request size validation** (10KB limit)
- **Professional email templates** with auto-reply functionality
- **Real-time character counting** and field validation
- **Smooth animations** and loading states with confetti celebration
- **Accessibility compliant** with WCAG guidelines

### Technical Implementation

**Frontend Flow:**
1. User fills out form with real-time validation
2. On submit, reCAPTCHA executes invisibly
3. Form validation runs with reCAPTCHA token
4. API request sent with sanitized data
5. Success/error states with animations

**Backend Flow:**
1. Request size validation (10KB limit)
2. Rate limiting check per IP (5 requests/hour)
3. Honeypot field validation
4. reCAPTCHA token verification (0.5+ score)
5. Data sanitization with DOMPurify
6. Zod schema validation
7. Email sending via Nodemailer (Gmail SMTP)
8. Auto-reply confirmation email

### Security Measures (7 Layers)

1. **Request Size Validation** - 10KB limit prevents DoS attacks
2. **IP-based Rate Limiting** - 5 requests/hour in production (50/hour in dev)
3. **Honeypot Field** - Hidden field detects bots
4. **reCAPTCHA v3** - Score-based verification (0.5+ threshold)
5. **XSS Sanitization** - DOMPurify cleans all inputs
6. **Zod Validation** - Type-safe schema validation
7. **Error Masking** - Generic errors to clients, detailed logs server-side

**Additional Security:**
- In-memory rate limit store with automatic cleanup
- Environment-based security bypasses for development
- Comprehensive logging for audit trails
- No sensitive data exposure in responses

## 🎨 Animations & UX

### Framer Motion Integration

- **Scroll-triggered animations** with intersection observers
- **Staggered reveals** for portfolio grid items
- **Smooth page transitions** and micro-interactions
- **Loading states** with skeleton animations
- **Success celebrations** with Lottie animations

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

- **TypeScript Strict Mode** - 100% type-safe codebase (zero `any` types)
- **ESLint** with Next.js configuration (zero warnings/errors)
- **Prettier** integration for consistent formatting
- **Husky + lint-staged** - Pre-commit hooks enforce code quality
- **Component-driven development** with modular architecture
- **Comprehensive inline documentation** - JSDoc comments throughout
- **Zero technical debt** - No TODO, FIXME, or HACK comments

**Current Grade: A+ (96/100)**

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
- **Sentry integration** for error monitoring and performance
- **Section-level error boundaries** for granular failure isolation
- **Global error boundary** for unhandled exceptions
- **Custom error reporting** to health API endpoint

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment

```bash
npm run build
npm run start
```

## 🛠️ Customization

### Content Management

- **Portfolio data**: Edit `data/index.tsx`
- **Project information**: Update project arrays and images
- **Contact details**: Modify footer and contact sections
- **Theme colors**: Customize in `app/globals.css`

### Adding New Sections

1. Create component in `components/`
2. Add to main page in `app/page.tsx`
3. Update navigation in `FloatingNavbar.tsx`
4. Add animations and styling

## 🔒 Security Considerations

- Never commit API keys or secrets
- Use environment variables for all sensitive data
- Regular dependency updates for security patches
- Rate limiting and validation on all endpoints
- Proper error handling without information disclosure

## 📝 Development Notes

### Performance Optimizations
- **Bundle Size**: 340 kB First Load JS (15% under 400 kB target)
- **Dynamic Imports**: Below-the-fold components lazy loaded
- **Image Optimization**: AVIF/WebP formats with Next/Image
- **Font Optimization**: Inter font with subset loading and swap display
- **Package Tree-shaking**: Optimized imports for lucide-react, framer-motion, etc.

### Technical Highlights
- **CSS Masks**: Gradient effects in infinite card animations
- **Marquee Components**: Magic UI marquee for performant infinite scroll
- **Animation Performance**: Framer Motion optimized for 60fps
- **Form UX**: Invisible reCAPTCHA v3 maintains seamless experience
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

