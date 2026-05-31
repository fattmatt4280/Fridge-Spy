## Plan: Partial-quantity popover + Pro usage stats

### 1. Partial-quantity popover on inventory
- In `src/routes/inventory.tsx`, long-press (or new "..." action) on a row's qty opens a Popover with quick chips: `¼`, `½`, `¾`, `1`, and a numeric input.
- Buttons call a new `adjustItem({ id, delta, unit? })` mutation that wraps the existing update path so the activity log + low-stock pill stay in sync.
- Tap on `+`/`-` keeps current behavior (whole units); popover handles fractional.

### 2. Pro usage stats surface on /account
- New `UsageStatsCard` component on `src/routes/account.tsx` (Pro users only, gated by `usePremium`).
- Reads from existing `getUsage` server fn (`["usage"]` key) — no new endpoint.
- Shows: items in fridge, recipes generated today, scans used this period (with bonus), and a 7-day "items saved" sparkline derived from `activity_log` rows where `kind = 'item-adjust'` or recipe-cooked entries.
- Adds one new server fn `getUsageHistory()` returning aggregated daily counts for the last 7 days from `activity_log`.

### Files
- edit: `src/routes/inventory.tsx`
- edit: `src/routes/account.tsx`
- create: `src/components/QuantityPopover.tsx`
- create: `src/components/UsageStatsCard.tsx`
- edit: `src/lib/usage.functions.ts` (add `getUsageHistory`)

### Out of scope
- No schema changes.
- No changes to free-tier limits or quota enforcement.
- No bulk-edit / multi-select on inventory.
