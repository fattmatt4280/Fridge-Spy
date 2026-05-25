
# App Store + Play Store Compliance Pass

## Phase 1 — Web/PWA fixes (do now, all frontend)

### 1. Trial length: 7 days → 3 days
- `src/components/UpgradeModal.tsx`: change CTA label `"Start 7-Day Free Trial"` → `"Start 3-Day Free Trial"`.
- Add a small disclosure line directly under the CTA (required by Apple 3.1.2 / Play subscription policy when we eventually go native, and good practice now):
  - `"3 days free, then $4.99/month. Auto-renews until canceled. Cancel anytime in Account."` (monthly)
  - `"3 days free, then $34.99/year. Auto-renews until canceled."` (yearly)
  - Lifetime: `"One-time payment. No recurring charges."`
- Note: actual 3-day trial period must also be configured in Paddle's product settings — I'll flag this for you to set in the Paddle dashboard after the code change lands (it's not something Lovable tools can set).

### 2. Remove unsubstantiated claims
- `UpgradeModal.tsx`: remove `"The average Pro user saves $47/month in food waste."` Replace with neutral copy: `"Cut food waste. Cook what you already have. Save on groceries."`
- `src/routes/onboarding.tsx` Slide 1: keep the `$1,500` figure but add a small `Source: USDA` line beneath it so it's a cited stat, not a marketing claim.

### 3. Privacy Policy + Terms of Service pages
- Create `src/routes/privacy.tsx` and `src/routes/terms.tsx` as full content routes with proper `head()` metadata.
- Content drafted to cover Paddle's seller requirements (Terms, Refund Policy embedded in Terms, Privacy Notice) — including the required Paddle Merchant-of-Record disclosure and a 30-day refund window.
- Add footer links to both pages from: `login.tsx`, `onboarding.tsx` (last slide), `account.tsx`, and the paywall modal (above the CTA).
- **I need your legal business name** (or your personal name if you're not incorporated) to put on these pages — Paddle requires it. Please drop that in a reply before/when you approve this plan.

### 4. In-app Account Deletion
- Add a `deleteAccount` server function (`src/lib/account.functions.ts`) using `requireSupabaseAuth` middleware + `supabaseAdmin` to:
  - Delete user's `items`, `activity_log`, `shopping_list`, `profiles` rows (cascades via FKs where possible).
  - Cancel any active Paddle subscription via the Paddle API.
  - Call `supabase.auth.admin.deleteUser(userId)` to remove the auth record.
- Add a "Delete Account" section at the bottom of `src/routes/account.tsx` with a confirmation dialog (`"Type DELETE to confirm. This is permanent and cannot be undone."`).

### 5. Notification permission pre-prompt
- `src/routes/onboarding.tsx`: replace the silent `Notification.requestPermission()` call in `finish()` with a new slide (or modal step) that explains *why* — `"Get a heads-up before food expires?"` with Allow / Not now buttons. Only call the native prompt after the user taps Allow.

### 6. Production env sanity
- Verify `.env.production` contains a `live_...` Paddle token (not `test_...`). I'll read both env files and confirm; if production still has a test token, I'll flag it (you'll need to set the live token via the Lovable env UI — I can't write `.env.production` secrets directly).
- The `PaymentTestModeBanner` already keys off the token prefix, so a correct live token automatically hides the banner in production.

### 7. Wording cleanup that reviewers nitpick
- `account.tsx`: map raw Paddle statuses (`trialing`, `past_due`) to user-friendly labels (`"Trial"`, `"Payment issue"`).
- `UpgradeModal.tsx`: tweak lifetime copy from `"Founding Member price · locks in forever"` to `"One-time payment · lifetime access, no recurring charges"`.

## Phase 2 — Native mobile billing (do later, when you wrap for the stores)

This is **not** something we can implement inside the current Lovable web project — it requires a native shell (Capacitor recommended, since it works with your existing React/Vite code). When you're ready to submit to App Store / Play:

1. Wrap the PWA with Capacitor (`npx cap init`, add `ios` and `android` platforms — done outside Lovable in your local IDE/Xcode/Android Studio).
2. Add `@revenuecat/purchases-capacitor` or the raw StoreKit 2 / Play Billing plugins.
3. Create matching IAP products in App Store Connect and Play Console: `pro_monthly`, `pro_yearly`, `pro_lifetime` (must mirror the Paddle IDs so the same `premium_user` flag flips).
4. Detect platform at runtime: web → Paddle (current code), iOS/Android → native IAP. Branch in `UpgradeModal.tsx` and `usePaddleCheckout.ts`.
5. Add a server function to verify Apple/Google receipts and flip `premium_user` (mirrors the existing Paddle webhook behavior).
6. Add "Restore Purchases" button on `account.tsx` (Apple 3.1.1 requirement).

I'll write a separate detailed plan for Phase 2 when you reach that stage — flagging it now so you know the web fixes alone won't unlock store submission.

---

## What I need from you to proceed with Phase 1

1. **Your legal business name** (or personal name) for the Privacy Policy and Terms.
2. Approval of this plan.

Once approved I'll do all of Phase 1 in one pass. Want me to proceed?
