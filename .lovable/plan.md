## Plan: Public marketing home at `/`, app moves to `/app`

### Goal
Turn `fridgespy.com` into a real, indexable landing page for cold traffic and AI crawlers, while keeping the authenticated dashboard one click away for existing users.

---

### 1. Routing changes

**Move the current authenticated home to `/app`:**
- Rename `src/routes/index.tsx` → `src/routes/app.tsx` (same component, route string `"/app"`).
- All internal navigation that currently sends users "home" (BottomNav, post-login `navigate({ to: "/" })`, post-onboarding redirect, AppShell guest fallback, etc.) updates to `/app`.
- `BottomNav` "Home" tab points to `/app`.

**Create a new public `src/routes/index.tsx`** that renders the marketing landing (details below).

**AppShell guard updates (`src/components/AppShell.tsx`):**
- Add `/` to the `PUBLIC` set (so it's reachable without auth).
- Add a small effect: if the user is authenticated and lands on `/`, redirect to `/app`. Guests stay on `/`.
- BottomNav still hidden on public routes (already correct).

**Login flow:**
- After successful sign-in / sign-up, `navigate({ to: "/app" })`.
- Login page's "logo click" / brand link goes to `/` (public home), not `/app`.

---

### 2. New landing page (`src/routes/index.tsx`)

Single scrollable public page using the existing Liquid Metal background, Royal Blue tokens, and animated Logo. Sections (in order):

1. **Hero** — Large animated `<Logo size="2xl" animated />`, H1 tagline ("Know what's in your kitchen. Always."), 1-line subhead, primary CTA "Get started free" → `/login`, secondary "See how it works" → `/how-it-works`. Subtle trust line (e.g. "Free to start · No credit card").
2. **How it works (3 steps)** — Snap receipt → Track freshness → Cook tonight. Icon + short copy per step. Mirrors `/how-it-works` at a glance; "See full walkthrough" link.
3. **Feature highlights (6 cards)** — Receipt scanning, Fridge vision scan, Expiry alerts, AI recipes from what you have, FridgeSpy Score, Cook streaks. Each card: icon, short title, 1-sentence benefit. Pulled from existing `/features` content; "Explore all features" link.
4. **Pricing teaser** — Free vs Pro one-liner with "From $4.99/mo" and CTA → `/pricing`.
5. **FAQ teaser** — 3 highest-intent Q&As (collapsible), "Read all FAQs" → `/faq`.
6. **Final CTA band** — "Start cutting food waste tonight" + Sign up button.
7. **PublicFooter** — Already exists, reused as-is.

All copy stays on-brand with the existing public pages — no new claims, no new product features.

---

### 3. SEO & metadata

`src/routes/index.tsx` `head()`:
- `title`: "FridgeSpy — Know what's in your kitchen. Always."
- `description`: keyword-rich (kitchen inventory app, receipt scanning, expiry alerts, AI recipes, reduce food waste).
- `og:title`, `og:description`, `og:url` (`https://fridgespy.com/`), `og:type: website`.
- `canonical` → `https://fridgespy.com/`.
- JSON-LD: keep the existing `WebSite`, `Organization`, and `SoftwareApplication` blocks (currently on the dashboard `index.tsx` — they belong on the public home, not the app). Add an `ItemList` of primary sub-pages (Features, How it works, Pricing, FAQ, About) for richer AI crawl.

`src/routes/app.tsx` `head()`:
- Title "Your Kitchen — FridgeSpy", `robots: noindex` (private dashboard shouldn't be indexed).
- Drop the marketing JSON-LD (moved to `/`).

`public/sitemap.xml.ts` & `public/llms.txt`:
- Confirm `/` is listed (it already is). Remove `/app` from sitemap and llms.txt (private).
- Bump `lastmod` for `/`.

---

### 4. Out of scope (not touching)
- No backend, auth, database, or business-logic changes.
- No new content pages — `/features`, `/how-it-works`, `/faq`, `/about`, `/pricing` stay as-is.
- No design-token or Liquid Metal changes; the new page reuses the existing theme.
- No analytics, no A/B testing scaffolding.

---

### Files

**Renamed**
- `src/routes/index.tsx` → `src/routes/app.tsx` (component becomes the dashboard at `/app`, with `noindex` head and marketing JSON-LD removed)

**Created**
- `src/routes/index.tsx` (new public landing)

**Edited**
- `src/components/AppShell.tsx` — add `/` to PUBLIC, redirect authed users `/` → `/app`
- `src/components/BottomNav.tsx` — Home tab → `/app`
- `src/routes/login.tsx` — post-auth redirect → `/app`; logo link → `/`
- `src/routes/onboarding.tsx` — completion redirect → `/app` (if it currently sends to `/`)
- `src/routes/sitemap[.]xml.ts` — drop `/app`, ensure `/` present
- `public/llms.txt` — same cleanup
- `src/routeTree.gen.ts` — regenerated automatically by Vite plugin

### Verification
- Logged-out visitor at `/` sees the landing page; can navigate to all public pages.
- Logged-in visitor at `/` auto-redirects to `/app`.
- Logged-out visitor at `/app` redirects to `/login`.
- Sign-in lands on `/app`; BottomNav Home tab returns there.
- View-source on `/` shows new title, description, OG tags, and JSON-LD.
