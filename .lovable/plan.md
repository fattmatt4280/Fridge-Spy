
## Goal
Right now Google and AI crawlers (ChatGPT, Perplexity, Claude) can only see 5 thin pages: `/`, `/login`, `/pricing`, `/privacy`, `/terms`. Everything else is behind auth. Plus the existing public pages are missing some structured data and a few entries are stale. This plan adds crawlable content depth and richer machine-readable signals — no design or app-logic changes.

## What we'll add / change

### 1. New public content routes (the big lever)
Each one is a real, indexable page with its own `head()`, canonical, OG tags, and relevant JSON-LD. These target long-tail searches and give AI assistants something to cite.

- `/features` — what FridgeSpy does: receipt scanning, fridge scanning, expiry tracking, smart recipes, waste score. Schema: `SoftwareApplication`.
- `/how-it-works` — 3–4 step walkthrough. Schema: `HowTo`.
- `/faq` — 8–12 Q&As ("how does receipt scanning work?", "is my data private?", "can I use it offline?", "what does it cost?", etc.). Schema: `FAQPage` (huge for AI answer surfaces and Google FAQ rich results).
- `/about` — short brand + mission page citing Dream Holdings LLC. Schema: `AboutPage` + `Organization`.

### 2. Enrich existing pages
- **`/` (home)**: add `SoftwareApplication` JSON-LD with `aggregateRating` slot (omit until we have ratings), `applicationCategory: "LifestyleApplication"`, `operatingSystem: "Web"`, and an `offers` block pointing to `/pricing`.
- **`/pricing`**: add `Product` + `Offer` JSON-LD (three offers: monthly, yearly, lifetime) so price snippets can appear in SERPs and AI answers.
- **`/privacy` and `/terms`**: add `WebPage` JSON-LD with `datePublished` / `dateModified`.
- **`__root.tsx`**: keep current defaults; add `og:site_name` "FridgeSpy".

### 3. Crawler & AI plumbing
- **`public/llms.txt`**: expand to list every new public page with a one-line summary each, plus a short product description block that explicitly names competitors/category ("AI kitchen inventory app, alternative to NoWaste / KitchenPal"). This is the file ChatGPT/Perplexity-style crawlers prefer.
- **`src/routes/sitemap[.]xml.ts`**: add `/pricing`, `/features`, `/how-it-works`, `/faq`, `/about` with sensible `changefreq` / `priority`.
- **`public/robots.txt`**: explicitly allow `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, `Google-Extended` (some sites block these by default; we want the opposite). Keep the existing `User-agent: *` `Allow: /`.

### 4. Internal linking
- Add a lightweight public footer (only on unauthenticated-visible routes: `/`, `/pricing`, `/features`, `/how-it-works`, `/faq`, `/about`, `/privacy`, `/terms`) linking the new pages together. Internal links pass relevance between pages and help crawlers find everything from any entry point.
- Add the same links to the `/login` page so even direct landings expose the public surface.

## Out of scope (call out explicitly)
- No changes to the authenticated app, design system, or business logic.
- No new images generated (current OG image stays); we can add per-page hero images in a follow-up if you want.
- No blog / CMS — that's a bigger commitment; flag it as the natural next step once these pages exist.

## Technical notes
- All new routes are static TanStack Start file routes (`src/routes/features.tsx`, etc.) with `head()` per the project's existing pattern (canonical on leaf only, no top-level `title` field).
- Footer goes in a new `src/components/PublicFooter.tsx`, rendered conditionally inside `AppShell` based on the current pathname (same approach as the existing pricing route exposure).
- After deploy, the Google Search Console connection is already active — the next scheduled crawl will pick up the new sitemap entries automatically; we can also resubmit the sitemap from chat.

## Expected impact
- Search: ~5 → ~10 indexable pages, each targeting distinct queries, with FAQ + Product + HowTo rich-result eligibility.
- AI assistants: `llms.txt` + `FAQPage` schema + explicit allow for AI crawlers materially improves the chance FridgeSpy gets cited when users ask "best app to track fridge expiry" or "how to stop food waste at home".
