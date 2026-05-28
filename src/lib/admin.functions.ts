import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

const envSchema = z.enum(["sandbox", "live"]);

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const listPaddlePrices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) =>
    z.object({ environment: envSchema }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const resp = await gatewayFetch(data.environment, "/prices?per_page=100&include=product");
    const json = await resp.json();
    return json.data ?? [];
  });

export const updatePaddlePrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv; priceId: string; amount: string }) =>
    z
      .object({
        environment: envSchema,
        priceId: z.string().min(1).max(64),
        amount: z.string().regex(/^\d{1,8}$/),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const resp = await gatewayFetch(data.environment, `/prices/${data.priceId}`, {
      method: "PATCH",
      body: JSON.stringify({ unit_price: { amount: data.amount, currency_code: "USD" } }),
    });
    if (!resp.ok) throw new Error(`Paddle error ${resp.status}: ${await resp.text()}`);
    return await resp.json();
  });

export const listDiscounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) =>
    z.object({ environment: envSchema }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const resp = await gatewayFetch(
      data.environment,
      "/discounts?per_page=100&status=active,archived",
    );
    const json = await resp.json();
    return json.data ?? [];
  });

export const archiveDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv; discountId: string }) =>
    z.object({ environment: envSchema, discountId: z.string().min(1).max(64) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const resp = await gatewayFetch(data.environment, `/discounts/${data.discountId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "archived" }),
    });
    if (!resp.ok) throw new Error(`Paddle error ${resp.status}: ${await resp.text()}`);
    return await resp.json();
  });

export const listUsersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { search?: string; limit?: number }) =>
    z
      .object({
        search: z.string().max(120).optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const limit = data.limit ?? 50;
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: limit,
    });
    if (error) throw new Error(error.message);
    const filtered = data.search
      ? users.filter((u) => u.email?.toLowerCase().includes(data.search!.toLowerCase()))
      : users;
    const ids = filtered.map((u) => u.id);
    const [{ data: profiles }, { data: subs }] = await Promise.all([
      supabaseAdmin.from("profiles").select("user_id, premium_user, display_name").in("user_id", ids),
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, status, price_id, environment, current_period_end")
        .in("user_id", ids),
    ]);
    const pMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
    const sMap = new Map<string, any[]>();
    (subs ?? []).forEach((s) => {
      const arr = sMap.get(s.user_id) ?? [];
      arr.push(s);
      sMap.set(s.user_id, arr);
    });
    return filtered.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      profile: pMap.get(u.id) ?? null,
      subscriptions: sMap.get(u.id) ?? [],
    }));
  });

export const setUserPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; premium: boolean }) =>
    z.object({ userId: z.string().uuid(), premium: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ premium_user: data.premium })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const [usersResp, premiumResp, sandboxResp, liveResp] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("premium_user", true),
      supabaseAdmin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("environment", "sandbox")
        .in("status", ["active", "trialing"]),
      supabaseAdmin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("environment", "live")
        .in("status", ["active", "trialing"]),
    ]);
    return {
      totalUsers: usersResp.count ?? 0,
      premiumUsers: premiumResp.count ?? 0,
      activeSandboxSubs: sandboxResp.count ?? 0,
      activeLiveSubs: liveResp.count ?? 0,
    };
  });
