# Tracking & Quantities — Optimization Plan

Goal: make how we track item quantities, recipe cook-downs, and free/Pro usage quotas more accurate, consistent, and harder to game — without changing the visual design.

---

## 1. Inventory quantities (items table)

Today: `quantity numeric, unit text default 'unit'`, +/- buttons step by whole numbers, and `markRecipeCooked` decrements by `quantity` then deletes at ≤ 0. No partial usage, no unit normalization, no low-stock concept.

Changes:
- **Normalized units**: introduce a small `unit` enum on the client (`unit`, `g`, `kg`, `ml`, `l`, `oz`, `lb`) and a `toBase(qty, unit)` helper in `src/lib/units.ts`. Stored values stay user-friendly; conversions happen only when needed (cooked, recipes, low-stock).
- **Partial usage controls in `inventory.tsx`**: long-press (or a "…" affordance) on +/- opens a small popover with `¼ / ½ / ¾ / custom`. Adjust mutation already exists; we just pass non-integer qty.
- **Low-stock flag**: add `low_stock_at numeric null` per item (optional threshold). Show a subtle "Low" pill when `quantity <= low_stock_at`. Auto-suggest adding it to shopping list (we already have `toShopping`).
- **Item history**: piggyback on `activity_log` with `kind = 'item-adjust'` whenever quantity changes by > 0.5 of a unit, so the home score + audit trail get richer signal without a new table.

## 2. Recipe cook-down (`markRecipeCooked`)

Today: matches by `ilike(name)`, picks the soonest-expiring single match, decrements by the recipe's `used.quantity`. Misses on plurals ("tomato" vs "tomatoes"), ignores units, can over-decrement.

Changes:
- **Fuzzy + normalized matching**: lowercase, singularize, strip parenthetical notes before `ilike`. Fall back to a trigram-style `% ` match if exact `ilike` returns nothing.
- **Unit-aware decrement**: if both the recipe ingredient and the stored item carry a unit, convert through `toBase` before subtracting; otherwise treat as "uses 1 unit" and warn.
- **Multi-row drain**: if one matching row can't cover the recipe quantity, walk additional matches (still ordered by expiry) until satisfied — soonest-expiring goes first, which is the whole point of FridgeSpy.
- **Confirmation step** (UI only, recipes page): before calling the server fn, show the user the proposed deductions so they can uncheck items they didn't actually use. Server fn signature is unchanged.

## 3. Usage quotas (free vs Pro)

We have three different "quota" surfaces today:
- `FREE_ITEM_CAP = 25` enforced client-side in `usePremium` via a `count(*)` on items.
- `FREE_RECIPE_PER_DAY = 3` enforced via `activity_log` `count(*)` filtered by `kind = 'recipe-gen'`.
- `scan_usage` table + atomic `increment_scan_usage` RPC — the gold standard, Pro-only.

Inconsistencies: item cap and recipe cap are client-trusted and re-counted on every render; nothing stops a determined client from bypassing them.

Changes:
- **Move recipe/day enforcement server-side**: wrap the existing recipe-gen server fn (in `claude.functions.ts`) so it reads today's `recipe-gen` count for the user, rejects with `{ error: 'recipe_daily' }` for free users at the cap, and logs the activity inside the same handler. Client `useUpgradeGate('recipe-daily')` still drives the modal.
- **Move item-cap enforcement server-side**: add a new `addItem` server fn (or guard inside the existing add path) that for non-premium users runs `count(*)` and rejects past 25. Client UI keeps its optimistic counter for snappy feedback.
- **Unify quota shape**: a single `getUsage()` server fn that returns `{ items: {used, cap}, recipesToday: {used, cap}, scans: {used, included, bonus} }`. `usePremium` and `useScanQuota` both consume it. Keeps one query key (`['usage']`) instead of three.
- **Pro quotas are unlimited** but we still track `used` so the `/account` page can show "127 items, 14 recipes this week, 8 scans this period" — useful retention surface and groundwork for future tier limits.

## 4. Activity log hygiene

`activity_log` is append-only by design (per project memory). We're about to write more often (`item-adjust`, more `cooked`). Add a server-side prune job idea (not built now — just noted): nightly delete rows older than 90 days via service role; doesn't affect the streak window (60 days).

---

## Technical notes

**Files touched**
- new: `src/lib/units.ts` (pure conversion helpers, no deps)
- new: `src/lib/usage.functions.ts` (`getUsage`, `addItem`, plus moves `recipe-gen` counting into the existing recipe server fn)
- edit: `src/lib/cooking.functions.ts` (fuzzy match, unit-aware, multi-row drain)
- edit: `src/hooks/usePremium.ts` (consume unified `getUsage`)
- edit: `src/hooks/useScanQuota.ts` (consume unified `getUsage`)
- edit: `src/routes/inventory.tsx` (partial-qty popover, Low pill)
- edit: `src/routes/add.tsx` (optional `low_stock_at` input)
- edit: `src/routes/recipes.tsx` (cook confirmation modal)
- edit: `src/components/HomeScoreCard.tsx` (use unified usage where convenient)

**Migration** (single migration, reviewable as one diff)
- `ALTER TABLE public.items ADD COLUMN low_stock_at numeric NULL;`
- No other schema changes needed — `quantity numeric` already supports fractions, `unit text` already free-form.

**No new tables, no RLS changes.** Quota logic stays in server fns using `requireSupabaseAuth` (RLS-respecting) except where we already use `supabaseAdmin` for `scan_usage`.

**Out of scope** (call out for later): household sharing of quotas, weekly waste report email, true OCR-based unit parsing on receipts.

---

## Suggested rollout order

1. Migration: add `low_stock_at`.
2. Server: `usage.functions.ts` (unified quota) + move recipe/day + item-cap enforcement.
3. Client: swap `usePremium` / `useScanQuota` to unified hook; verify no regression in existing modals.
4. `markRecipeCooked` rewrite + recipes-page confirmation step.
5. Inventory partial-qty popover + Low pill.

Each step is independently shippable.
