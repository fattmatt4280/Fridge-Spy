import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---------- Mark a recipe as cooked ----------
// Decrements inventory for the items the user confirms they actually used.
// Items dropping to <= 0 are deleted. Logs an `activity_log` entry with
// kind = 'cooked' so the home streak + history surfaces it.
export const markRecipeCooked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    recipeTitle: string;
    used: { name: string; quantity: number }[];
  }) =>
    z.object({
      recipeTitle: z.string().min(1).max(200),
      used: z.array(z.object({
        name: z.string().min(1).max(200),
        quantity: z.number().min(0).max(1000),
      })).max(50),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let decremented = 0;
    let deleted = 0;

    for (const u of data.used) {
      if (u.quantity <= 0) continue;
      // Find matching items, prefer ones expiring soonest.
      const { data: matches } = await supabase
        .from("items")
        .select("id, quantity, expiry_date")
        .ilike("name", u.name)
        .order("expiry_date", { ascending: true, nullsFirst: false })
        .limit(1);
      const match = matches?.[0];
      if (!match) continue;
      const newQty = Number(match.quantity ?? 0) - u.quantity;
      if (newQty <= 0) {
        await supabase.from("items").delete().eq("id", match.id);
        deleted++;
      } else {
        await supabase.from("items").update({ quantity: newQty }).eq("id", match.id);
        decremented++;
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

    // Walk back from today; allow yesterday as the streak anchor too.
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
