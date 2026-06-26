# Cloudflare Security Insights — triage & rationale

_Reference for the recurring Cloudflare "Security Insights" findings on
**n8builds.dev**. Read this before acting on any Cloudflare security alert —
several of them assume Cloudflare is proxying our traffic, which it is **not**._

Last triaged: **2026-06-25** (export `Cloudflare_…_SecurityInsights_20260625_2017.csv`).

---

## The one fact that explains everything: we're on Vercel, Cloudflare is DNS-only

- **n8builds.dev is hosted on Vercel.** The apex `A` record is `76.76.21.21`
  (Vercel's shared anycast IP), `www`/`portfolio` are `CNAME → cname.vercel-dns.com`.
- **All web DNS records are "DNS only" (grey cloud) on purpose.** Vercel manages
  its own TLS and routing; putting Cloudflare's proxy (orange cloud) in front of
  Vercel **breaks the site with HTTP 525** (TLS handshake failure). We hit this
  exact error at launch on 2026-06-12 — symptom is Cloudflare IPs (`104.21.x` /
  `172.67.x`) showing on the apex instead of `76.76.21.21`.
- **Cloudflare's only jobs here are DNS + Email Routing** (`contact@n8builds.dev`
  → Gmail). It is **not in the request path** for web traffic and never sees a
  page load.

**Consequence:** any finding whose fix is "turn on a Cloudflare proxy feature"
(Bot Fight Mode, WAF, managed rules, Under Attack mode, caching, proxying the A
record) **cannot work for us and should be ignored.** Those features only act on
proxied (orange-cloud) traffic, and we can't proxy without breaking Vercel.

---

## The findings (2026-06-25)

| Severity | Finding | Verdict | Why |
|---|---|---|---|
| Moderate | **Unproxied A Record / "exposed origin IP"** | **Ignore** | The "exposed" IP is Vercel's shared anycast IP, not a private origin server. Vercel absorbs DDoS + terminates TLS at its edge. Proxying it through Cloudflare breaks the site (525). |
| Low ×3 | **DMARC Record Error / missing** | **Fixed** | Legit — the domain sends & receives mail. Added the DMARC record (see below). |
| Low | **Security.txt not configured** | **Fixed** | Legit, low effort. Added `public/.well-known/security.txt` (RFC 9116) + a `/security.txt` redirect. |
| Moderate | **Bot Fight Mode not enabled** | **Ignore** | Bot Fight Mode only inspects **proxied** traffic, which we don't have. The contact form is already protected at the app layer (Cloudflare **Turnstile** + honeypot + rate limiter on `/api/contact`). |

### What we actually changed
- **DNS (Cloudflare, manual):** added a `TXT` record at host `_dmarc` →
  `v=DMARC1; p=none; rua=mailto:nathancwatkins23@gmail.com; fo=1`
- **Repo:** `public/.well-known/security.txt` + a permanent `/security.txt`
  redirect in `next.config.mjs` (commit `456e4e3`).

---

## Email auth status (the only category that's genuinely our responsibility)

Cloudflare *does* legitimately surface email-auth gaps, because we run mail on
this domain. Current state:

- **SPF:** `v=spf1 include:_spf.mx.cloudflare.net ~all` — present (covers
  Cloudflare Email Routing's inbound forwarding).
- **DMARC:** `v=DMARC1; p=none; …` — present, **monitor-only**. `p=none` does not
  reject/quarantine anything, so it can't hurt deliverability; it just collects
  aggregate reports.
- **DKIM:** not configured.

**To tighten later** (only after a few weeks of clean DMARC reports): add
`include:_spf.google.com` to SPF (for outbound Gmail "send as"), set up DKIM for
the domain, then move DMARC `p=none` → `p=quarantine` → `p=reject`. Don't jump
straight to `p=reject` — the Cloudflare-routing + Gmail-send-as setup needs SPF/
DKIM alignment verified first or legit mail can bounce.

---

## Quick reference — "Cloudflare flagged X again"

- **"Proxy your DNS" / "unproxied record" / "exposed origin"** → **Ignore.**
  Vercel requires DNS-only.
- **"Bot Fight Mode" / "WAF" / "managed rules" / "Under Attack" / "caching"** →
  **Ignore.** All require proxied traffic. Bot protection lives in the app
  (Turnstile + honeypot + rate limiter).
- **"DMARC / SPF / DKIM / email spoofing"** → **Real.** Handle in DNS; see the
  email-auth section above.
- **"security.txt"** → already shipped. If it says *expired*, bump the `Expires:`
  date in `public/.well-known/security.txt`.

**Rule of thumb:** if the recommended fix is a Cloudflare *proxy/edge* feature,
it doesn't apply to us. If it's a *DNS record* (email auth) or a *file we serve*
(security.txt), it might be real — evaluate it.
