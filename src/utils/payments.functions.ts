import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gatewayFetch, getPaddleClient, type PaddleEnv } from "@/lib/paddle.server";

const envSchema = z.enum(["sandbox", "live"]);

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) =>
    z.object({ priceId: z.string().min(1).max(64), environment: envSchema }).parse(data),
  )
  .handler(async ({ data }) => {
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const result = await response.json();
    if (!result.data?.length) throw new Error(`Price not found: ${data.priceId}`);
    return result.data[0].id as string;
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) =>
    z.object({ environment: envSchema }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sub, error } = await supabase
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id, price_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sub) throw new Error("No subscription found");

    const paddle = getPaddleClient(data.environment);
    const subIds = sub.price_id === "pro_lifetime" ? [] : [sub.paddle_subscription_id];
    const portal = await paddle.customerPortalSessions.create(sub.paddle_customer_id, subIds);
    return { url: portal.urls.general.overview as string };
  });
