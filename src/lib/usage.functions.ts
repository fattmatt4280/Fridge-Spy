/**
 * Unified usage/quota surface.
 *
 * - getUsage: single read returning items / recipes-today / scans usage for
 *   the current user. Backs usePremium + useScanQuota so we don't fire three
 *   independent queries.
 * - addItem: server-enforced free-tier item cap. Client UI keeps optimistic
 *   feedback, but the source of truth is here.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { FREE_ITEM_CAP, FREE_RECIPE_PER_DAY } from "@/lib/limits";
import { FREE_SCAN_QUOTA } from "@/lib/scan.functions";

async function profileFor(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("premium_user, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export const getUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const profile = await profileFor(userId);
    const isPremium = !!profile?.premium_user;

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);

    const [itemRes, recipeRes, scanRow] = await Promise.all([
      supabase.from("items").select("*", { count: "exact", head: true }),
      supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("kind", "recipe-gen")
        .gte("created_at", since.toISOString()),
      // Most recent scan_usage period (Pro only — free users have no row).
      supabaseAdmin
        .from("scan_usage")
        .select("used, bonus, period_end")
        .eq("user_id", userId)
        .order("period_end", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const items = {
      used: itemRes.count ?? 0,
      cap: isPremium ? null : FREE_ITEM_CAP,
    };
    const recipesToday = {
      used: recipeRes.count ?? 0,
      cap: isPremium ? null : FREE_RECIPE_PER_DAY,
    };
    const scans = isPremium
      ? {
          used: scanRow.data?.used ?? 0,
          included: FREE_SCAN_QUOTA,
          bonus: scanRow.data?.bonus ?? 0,
          period_end: scanRow.data?.period_end ?? null,
        }
      : { used: 0, included: FREE_SCAN_QUOTA, bonus: 0, period_end: null };

    return {
      isPremium,
      displayName: profile?.display_name ?? null,
      items,
      recipesToday,
      scans,
    };
  });

/** Server-enforced add. Free users blocked at FREE_ITEM_CAP. */
export const addItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    name: string;
    brand?: string | null;
    category?: string | null;
    emoji?: string | null;
    quantity: number;
    unit?: string | null;
    location: "fridge" | "freezer" | "pantry" | "counter";
    expiry_date?: string | null;
    notes?: string | null;
    image_url?: string | null;
    barcode?: string | null;
    low_stock_at?: number | null;
  }) =>
    z.object({
      name: z.string().min(1).max(200),
      brand: z.string().max(200).nullable().optional(),
      category: z.string().max(100).nullable().optional(),
      emoji: z.string().max(8).nullable().optional(),
      quantity: z.number().min(0).max(100000),
      unit: z.string().max(40).nullable().optional(),
      location: z.enum(["fridge", "freezer", "pantry", "counter"]),
      expiry_date: z.string().max(40).nullable().optional(),
      notes: z.string().max(1000).nullable().optional(),
      image_url: z.string().max(2000).nullable().optional(),
      barcode: z.string().max(64).nullable().optional(),
      low_stock_at: z.number().min(0).max(100000).nullable().optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const profile = await profileFor(userId);
    const isPremium = !!profile?.premium_user;

    if (!isPremium) {
      const { count } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true });
      if ((count ?? 0) >= FREE_ITEM_CAP) {
        return { error: "item_cap" as const };
      }
    }

    const { error } = await supabase.from("items").insert({
      user_id: userId,
      name: data.name.trim(),
      brand: data.brand || null,
      category: data.category || null,
      emoji: data.emoji || "🍽️",
      quantity: data.quantity,
      unit: data.unit || "unit",
      location: data.location,
      expiry_date: data.expiry_date || null,
      notes: data.notes || null,
      image_url: data.image_url || null,
      barcode: data.barcode || null,
      low_stock_at: data.low_stock_at ?? null,
    });
    if (error) throw new Error(error.message);

    await supabase.from("activity_log").insert({
      user_id: userId,
      kind: "add",
      message: `Added ${data.name}`,
    });

    return { ok: true as const };
  });
