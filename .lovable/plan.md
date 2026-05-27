
## 1. Product Hunt discount — `PHYEARLY59`

Create a recurring discount in Paddle (both sandbox + live) that locks the yearly plan at **$59/year forever** for the first 500 redeemers.

- **Type:** flat $24.99 off (yearly is $34.99… wait — yearly is $34.99 in the UI today). Need to confirm: your current yearly price is **$34.99/yr**, so "$59 yearly" is *higher* than today's price. I'll assume you mean **raise yearly to ~$83.99** for the launch so the discounted price lands at $59, OR you actually meant **$29** / something else. **Please confirm the target locked-in price before I create the Paddle discount.** I'll proceed with everything else.
- **Mechanics (once price confirmed):**
  - Paddle discount: `type=flat`, `currency_code=USD`, `recur=true`, `maximum_recurring_intervals=null` (forever), `usage_limit=500`, `code=PHYEARLY59`, `restrict_to=[yearly price id]`, created in **sandbox AND live**.
- **UX:** Add a "Have a code?" input to `UpgradeModal.tsx`. When filled, pass `discountCode` to `Paddle.Checkout.open()` in `usePaddleCheckout`. Show inline validation feedback.
- **Counter:** A small server fn `getDiscountRedemptions` hitting `GET /discounts/{id}` returns `times_used` so the admin panel can display "X / 500 claimed".

## 2. Admin panel

- **Auth model:** Add a `user_roles` table + `app_role` enum (`admin`, `user`) + `has_role(uuid, app_role)` security-definer function (per project security rules — roles must NOT live on `profiles`). Seed your user as `admin` via a one-off insert (tell me which email to grant).
- **Route:** `src/routes/_authenticated/admin.tsx` gated by a `beforeLoad` that calls a `requireAdmin` server fn (uses `has_role`). Non-admins get redirected to `/`.
- **Capabilities (v1):**
  - **Products & prices:** List from Paddle, edit price amounts (PATCH `/prices/{id}` in both sandbox + live), toggle archive. Updates the displayed prices in `UpgradeModal` via a config table or by reading live amounts on render.
  - **Discounts:** List, view redemption counts, archive, create new codes.
  - **Users:** Search users, view subscription status, manually grant/revoke Pro (writes `premium_user` via service-role server fn — the existing trigger already blocks non-service-role changes).
  - **Stats:** Total users, active subs (sandbox + live separately), PH redemption count, basic revenue from `/metrics/revenue`.
- All admin mutations go through `createServerFn` + `requireSupabaseAuth` + server-side `has_role` check + `supabaseAdmin` for writes.

## 3. Switching payments to LIVE

**Blocker:** Go-live status shows **0 of 7 steps complete**. Live checkout will not work until Paddle verifies the account. The required sequence is:

1. Publish the app (you need to do this first — verification can't start otherwise).
2. Complete readiness check (the seller policy pages — Terms, Refund, Privacy — already exist; the readiness check will scan them after publish).
3. Fill out Verification (business/personal details) in the Payments tab.
4. Wait for Paddle's domain review, business ID, identity verification, and final review.

I cannot "flip a switch" — the live token is already wired into `.env.production`, but Paddle will reject live charges until they approve you.

<presentation-actions><presentation-open-payments>Go to payments</presentation-open-payments></presentation-actions>

While waiting for approval, I'll add a guard so the upgrade modal shows a "Coming soon" state on the live site if no live subscription has ever succeeded (optional — say the word).

## Technical details

- **DB migration:** `app_role` enum, `user_roles` table with RLS (`select` own + service-role all), `has_role(uuid, app_role)` security-definer fn, grants for `authenticated` + `service_role`.
- **New server fns** (`src/lib/admin.functions.ts`): `requireAdmin`, `listPaddleProducts`, `updatePaddlePrice`, `listDiscounts`, `createDiscount`, `archiveDiscount`, `listUsers`, `setUserPremium`, `getStats`. All use `requireSupabaseAuth` + internal `has_role` gate.
- **Checkout hook:** Extend `usePaddleCheckout` signature with optional `discountCode`.
- **Upgrade modal:** Add collapsible "Have a code?" row above the CTA.
- **Admin route tree:** `_authenticated/admin.tsx` (layout) + sub-tabs (Products, Discounts, Users, Stats) as in-page tabs, not separate routes.

## Questions before I build

1. **Confirm the locked-in yearly price** (today's yearly is $34.99 — $59 would be a price *increase*; did you mean $29, or are you raising yearly to make the PH deal feel like a discount?).
2. **Your admin email** (so I can seed the `admin` role).
3. Want the "Coming soon" / disabled-checkout guard on the live site until Paddle approves you, or leave checkout active and let users see Paddle's error?
