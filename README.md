# n8builds - n8builds.dev

The public builder lab of Nathan Watkins: a Next.js site for building software in public (apps, AI tools, Chrome extensions, experiments, and the Nate's Notions blog).

**Live at [n8builds.dev](https://n8builds.dev)**, deployed on Vercel (auto-deploys from `main`), DNS via Cloudflare.

Current project state, decisions and conventions live in [`docs/HANDOFF.md`](docs/HANDOFF.md).
Manual steps that need the owner live in [`docs/OWNER_TODO.md`](docs/OWNER_TODO.md).

## Stack

- Next.js 16 (App Router, webpack production build), React 19, TypeScript (strict)
- Tailwind CSS 4 (configured in `app/globals.css`), Motion (`motion/react`)
- React Hook Form + Zod
- Sanity (read-only CDN client) for the Nate's Notions blog
- Nodemailer + Gmail SMTP, Cloudflare Turnstile, Upstash Redis rate limiting
- Sentry (on in production; inert without `NEXT_PUBLIC_SENTRY_DSN`), GA4, Vercel Speed Insights
- Vitest (unit), Playwright + axe (E2E and accessibility), Lighthouse budgets

The site is dark-only and honors `prefers-reduced-motion` everywhere.

## Project structure

```
app/
  api/contact/route.ts      Contact form API
  api/health/route.ts       Liveness ping
  api/notions/recent/       Latest posts for the homepage strip
  blog/, blog/[slug]/       Nate's Notions (ISR, hourly)
  builds/[slug]/            Build detail pages
  loadout/, privacy/        Static pages
  layout.tsx, page.tsx      Root layout and homepage
  globals.css               Tailwind theme and global styles
components/
  sections/                 Homepage sections (Hero, NowBuilding, FeaturedProjects, ShelfSection, ...)
  layout/                   Navbar, Footer (contact card)
  ContactForm/              Form UI and useContactFormSubmit
  blog/, ui/, features/, magicui/
data/                       builds.tsx (single source of truth for builds), shelves, loadout, stacks
hooks/                      usePrefersReducedMotion, useHydrated, analytics tracking hooks
lib/
  security/                 headers.mjs (CSP), rateLimiter, turnstile, validation, testMode
  email/                    smtp, sender, templates, icons (generated)
  validations/contact.ts    Zod schema shared by client and server
tests/
  unit/                     Vitest
  e2e/                      Playwright (api/, pages, contact form, reduced motion, security headers)
```

## Getting started

Requires Node.js 22.19+ (Lighthouse 13 and Vitest need it; CI uses Node 24).

```bash
git clone https://github.com/n8watkins/n8builds-web.git
cd n8builds-web
npm install
cp .env.example .env.local   # then fill in values; each variable is documented there
npm run dev                  # http://localhost:3737
```

Under `next dev`, Turnstile verification and Upstash are skipped, so the contact form works with only the Gmail variables set.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3737 |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint; fails on any warning |
| `npm run type-check` | `tsc --noEmit` |
| `npm run test:unit` | Vitest |
| `npm run test:e2e` | Playwright (contact API + Chromium) against a production build |
| `npm run test:e2e:all` | Playwright on Chromium, Firefox, WebKit and mobile |
| `npm test` | Unit + E2E |
| `npm run lighthouse` | Lighthouse budgets on the production build (build first; see below) |
| `npm run analyze` | Production build with the bundle analyzer |

Playwright builds and starts the app itself on port 3747 (`E2E_PORT` overrides it) in `CONTACT_TEST_MODE`, with Cloudflare's always-pass Turnstile test keys.
No email is sent, and GA, Sentry and Upstash are forced off.

Lighthouse: `npm run build && npm run lighthouse` (`LIGHTHOUSE_PORT`, default 3747).
It audits four pages three times each, checks the medians against the budgets in `scripts/lighthouse.mjs`, and writes HTML reports to `.lighthouse/`.
Under WSL, set `CHROME_PATH` to a Linux Chrome.

CI (GitHub Actions) runs on every push to `main` and every pull request: lint, type-check and unit tests, the E2E suite on all six Playwright projects as parallel jobs, and the Lighthouse budgets.
A nightly workflow reruns the full suite against `main`, since blog content in Sanity changes without a commit.

## Contact form

Request flow in `app/api/contact/route.ts`:

1. Body size cap (10KB) and a JSON content type (anything else gets 415).
2. JSON parse and Zod validation, including the honeypot field, which must be empty.
3. Cloudflare Turnstile verification (`siteverify`), including the hostname the token was issued on.
4. Per-IP rate limit (5/hour; IPv6 per /64).
5. Site-wide daily limit (`CONTACT_DAILY_LIMIT`, default 50), counted only for verified submissions.
6. Per-recipient auto-reply limit (1/day per address); past it, only the auto-reply is skipped.
7. Notification email to the owner and an auto-reply to the sender, with all user input HTML-escaped at template time.

Every free check runs before the first Upstash call, so requests without a solved Turnstile challenge never spend the Redis quota.
In front of all this, a Vercel WAF rule (Firewall tab, not code) answers 429 at the edge after 10 `POST /api/contact` per minute per IP.

Rate-limit counters live in Upstash Redis so every serverless instance shares them.
Everything fails closed in production: a missing Turnstile secret, a Turnstile error, missing Upstash config, or an Upstash outage or timeout rejects the submission with a message to email directly.

On the client, Send stays disabled until the form has hydrated.
If Turnstile has not issued a token yet, the button shows "Verifying..." and sends once it arrives, or explains the failure after 15 seconds.

To exercise the real API locally, run a production build with `CONTACT_TEST_MODE=1` and the test secret `1x0000000000000000000000000000000AA`.
Test mode sends no email, always uses an in-memory rate limiter, and is ignored on Vercel.

## Security

- Security headers, including an enforced Content-Security-Policy, live in `lib/security/headers.mjs`.
  Any new third-party origin must be added there or the browser blocks it.
- Scripts keep `'unsafe-inline'` because App Router pages inline RSC payload scripts; nonces would force every page to render dynamically.
- CSP violations are reported to Sentry when a DSN is set.
- `tests/e2e/security-headers.spec.ts` asserts the headers and fails on any CSP violation.

## License

MIT.
