import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { convert } from "@/lib/units";

// Normalize a free-text ingredient name for matching:
// lowercase, strip parenthetical notes, drop trailing 's' for naive plurals.
function normalizeName(raw: string): string {
  let s = raw.toLowerCase().trim();
  s = s.replace(/\([^)]*\)/g, "").trim();         // drop "(diced)" etc.
  s = s.replace(/[,\-–].*$/, "").trim();          // drop "tomato, ripe"
  s = s.replace(/\s+/g, " ");
  if (s.length > 3 && s.endsWith("es")) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith("s")) s = s.slice(0, -1);
  return s;
}

// ---------- Mark a recipe as cooked ----------
// Decrements inventory for the items the user confirms they actually used.
// Walks multiple matching rows (soonest-expiring first) until the requested
// quantity is satisfied. Honors unit conversion when both sides declare a
// compatible unit (g↔kg↔oz↔lb, ml↔l↔cup↔tsp↔tbsp). Falls back to
// "subtract 1 unit per matching row" when units are incompatible.
export const markRecipeCooked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    recipeTitle: string;
    used: { name: string; quantity: number; unit?: string | null }[];
  }) =>
    z.object({
      recipeTitle: z.string().min(1).max(200),
      used: z.array(z.object({
        name: z.string().min(1).max(200),
        quantity: z.number().min(0).max(10000),
        unit: z.string().max(40).nullable().optional(),
      })).max(50),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let decremented = 0;
    let deleted = 0;

    for (const u of data.used) {
      if (u.quantity <= 0) continue;
      const norm = normalizeName(u.name);
      if (!norm) continue;

      // Try exact ilike first, then a looser contains match.
      let candidates: any[] = [];
      const exact = await supabase
        .from("items")
        .select("id, name, quantity, unit, expiry_date")
        .ilike("name", norm)
        .order("expiry_date", { ascending: true, nullsFirst: false })
        .limit(5);
      candidates = exact.data ?? [];
      if (candidates.length === 0) {
        const fuzzy = await supabase
          .from("items")
          .select("id, name, quantity, unit, expiry_date")
          .ilike("name", `%${norm}%`)
          .order("expiry_date", { ascending: true, nullsFirst: false })
          .limit(5);
        candidates = fuzzy.data ?? [];
      }
      if (candidates.length === 0) continue;

      let remainingNeed = u.quantity; // expressed in u.unit (or "count")
      for (const row of candidates) {
        if (remainingNeed <= 0) break;
        const stocked = Number(row.quantity ?? 0);
        if (stocked <= 0) continue;

        // Convert the row's stock into the requested unit when possible.
        const converted = convert(stocked, row.unit, u.unit ?? "unit");
        // If units are incompatible, treat this row as 1 count of usage.
        const stockedInReqUnit = converted ?? stocked;

        const useFromRow = Math.min(stockedInReqUnit, remainingNeed);
        // Translate back to the row's own unit for the DB write.
        const useInRowUnit = converted === null
          ? useFromRow
          : (convert(useFromRow, u.unit ?? "unit", row.unit) ?? useFromRow);

        const newQty = stocked - useInRowUnit;
        if (newQty <= 0.001) {
          await supabase.from("items").delete().eq("id", row.id);
          deleted++;
        } else {
          await supabase.from("items").update({ quantity: newQty }).eq("id", row.id);
          decremented++;
        }
        remainingNeed -= useFromRow;
      }
    }

    const touched = decremented + deleted;
    await supabase.from("activity_log").insert({
      user_id: userId,
      kind: "cooked",
      message: `Cooked ${data.recipeTitle}${touched ? ` — used ${touched} item${touched === 1 ? "" : "s"}` : ""}`,
    });

    return { decremented, deleted };
  });

// ---------- Cooked streak ----------
// Counts consecutive days (including today or yesterday as anchor) with at
// least one 'cooked' event.
export const getCookedStreak = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const since = new Date();
    since.setDate(since.getDate() - 60);
    const { data } = await supabase
      .from("activity_log")
      .select("created_at")
      .eq("kind", "cooked")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) return { streak: 0, lastCookedAt: null as string | null };

    const days = new Set<string>();
    for (const row of data) {
      const d = new Date(row.created_at);
      days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }

    let streak = 0;
    const cursor = new Date();
    const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!days.has(keyOf(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
      if (!days.has(keyOf(cursor))) {
        return { streak: 0, lastCookedAt: data[0].created_at };
      }
    }
    while (days.has(keyOf(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return { streak, lastCookedAt: data[0].created_at };
  });
