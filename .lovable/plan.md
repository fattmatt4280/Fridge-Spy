
# Make the recipe generator the heart of FridgeSpy

Three connected pieces: (1) personalize recipes via a new cooking-preferences onboarding, (2) make "I cooked this" a one-tap flow that actually decrements inventory, (3) feed cooking history back into future suggestions so it gets smarter over time.

## 1. Cooking preferences (new onboarding step + editable later)

Add a new slide to the existing onboarding flow (`src/routes/onboarding.tsx`) called "What do you like to cook?" with three quick inputs:

- **Cuisines I love** — multi-select chips (Italian, Mexican, Thai, Indian, Mediterranean, Japanese, American comfort, BBQ, Middle Eastern, Chinese, French, Korean, Vietnamese, etc.). Pick any number.
- **Want to learn** — same chip list, second pass. "I'd like to get better at…"
- **Dietary / avoid** — chips: Vegetarian, Vegan, Pescatarian, Gluten-free, Dairy-free, Nut-free, Halal, Kosher, Low-carb, plus a free-text "Also avoid…" field for allergies / dislikes (cilantro, mushrooms, etc.).
- **Skill level** — slider: Beginner / Comfortable / Advanced. Drives recipe difficulty bias.
- **Typical cook time on a weekday** — chips: 15, 30, 45, 60+ min.

Also expose all of this on `src/routes/account.tsx` under a new "Cooking profile" section so users can edit anytime (the onboarding is just the first capture).

## 2. "Mark as cooked" — close the loop on inventory

Add a primary CTA on each recipe card (both freshly generated recipes on `src/routes/recipes.tsx` and saved recipes): **"I cooked this"**.

Tapping it opens a confirmation sheet listing the items the recipe used (from `uses_expiring` / `uses_items`), each prefilled and editable:

```
[✓] Greek yogurt   [ 1 ] cup        ← editable qty + unit
[✓] Spinach        [ 2 ] handfuls
[✓] Chicken breast [ 1 ] each
[ ] Olive oil      (unchecked = don't decrement)
```

On confirm:
- Decrement `items.quantity` per checked row. If new qty ≤ 0, delete the row.
- Log `activity_log` with `kind: 'cooked'` and a message like "Cooked Lemon Yogurt Chicken — used 3 items".
- Show a celebratory toast + bump the FridgeSpy score (server-side; the existing score-update trigger / server logic handles this — flag for me to wire if it doesn't already).
- Invalidate `items`, `item-count`, and `activity_log` queries so home / inventory / alerts update instantly.

Edge cases:
- Item name in recipe doesn't match any inventory item exactly → show "Couldn't find in your kitchen" row, skipped by default.
- Multiple inventory rows match same name (e.g. two yogurts) → use the one expiring soonest first.

## 3. Personalized recipe generation

Update `generateRecipes` in `src/lib/claude.functions.ts` to also accept the user's cooking profile and recent cooking history, and weave both into the prompt.

New shape passed to Claude:

```
Inventory expiring soon: ...
Other inventory: ...
User likes: Italian, Thai, Mediterranean
Learning: Indian
Avoid: mushrooms, gluten
Skill: Comfortable. Target cook time: 30 min.
Recently cooked (last 14 days, avoid repeating): Lemon Yogurt Chicken, Pad See Ew
```

Recipes returned should:
- Strongly bias toward "likes"
- Occasionally (1 of 3) hit a "want to learn" cuisine and mark it `is_learning_pick: true` in the JSON so the UI can show a "🎓 Try something new" badge
- Never include avoided ingredients
- Respect skill + time

The server function reads the user's profile + recent `activity_log` rows (`kind = 'cooked'`, last 14 days) via the existing `requireSupabaseAuth`-scoped `supabase` client — no client-side payload needed for preferences (more secure + always fresh).

## 4. Make the recipe generator a daily habit (the "push to constant use")

Small surface changes that get people back in:

- **Home screen**: replace / add a "Tonight's pick" card that auto-suggests one recipe based on what's expiring soonest, pulled lazily on home load (cached for the day per user). One tap → recipes page with that suggestion pre-expanded. Driven by the same `generateRecipes` but `count: 1` and cached in `activity_log` or a new `daily_pick` row to avoid burning quota.
- **Cooked streak**: surface a "🔥 3 days cooked in a row" chip on home, based on distinct days in `activity_log` where `kind = 'cooked'`. Cheap, motivating.
- **Alert page**: each expiring item gets a "What can I make?" inline button that jumps into recipe gen pre-focused on that item.
- **Post-cook nudge**: after marking cooked, the success toast offers "Plan tomorrow's dinner?" → opens recipes page.

## 5. Database changes

One migration adds:

- `profiles.cuisines_liked text[] default '{}'`
- `profiles.cuisines_learning text[] default '{}'`
- `profiles.dietary_restrictions text[] default '{}'`
- `profiles.avoid_ingredients text[] default '{}'`
- `profiles.skill_level text default 'comfortable'` (beginner / comfortable / advanced)
- `profiles.typical_cook_time_min int default 30`

`activity_log` already supports a new `kind` value (`'cooked'`) — no schema change needed, just start writing it.

The existing `prevent_profile_privilege_escalation` trigger still blocks `premium_user` / `fridgespy_score` from client edits; these new columns are user-editable so they pass through fine. RLS is already correct (own-row update).

## Files touched

- `src/routes/onboarding.tsx` — new slides for cooking profile + notification pre-prompt (the latter from the existing compliance plan)
- `src/routes/account.tsx` — editable Cooking profile section
- `src/routes/recipes.tsx` — "I cooked this" button + confirmation sheet, "learning pick" badge
- `src/routes/index.tsx` — Tonight's pick card + cooked-streak chip
- `src/routes/alerts.tsx` — per-item "What can I make?" jump
- `src/lib/claude.functions.ts` — richer prompt, accept profile + recent cooks
- `src/lib/cooking.functions.ts` (new) — `markRecipeCooked` server fn (decrement inventory, log activity)
- New migration for the 6 `profiles` columns

## Questions before I build

1. **"Cooked streak" definition** — distinct days with any `cooked` event, or only days where at least one inventory item was decremented? (I lean "any cooked event" — friendlier.)
2. **Tonight's pick cache** — refresh once per calendar day, or let the user pull-to-refresh for a new one? (I lean: once per day auto, with a small "Try again" button that costs 1 of their daily generations for free users.)
3. **Learning-pick frequency** — always include 1 of 3 as a learning cuisine, or only when the user has set "want to learn"? (Latter is safer.)
4. **Onboarding length** — existing onboarding is already a few slides; adding cuisines + learning + dietary + skill + time is roughly 2–3 new slides. OK with that, or want it condensed onto one dense slide?

Once you answer (or say "your call on all four"), I'll implement everything in one pass.
