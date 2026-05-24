import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";

let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

async function flipPremium(userId: string, isPremium: boolean) {
  await getSupabase()
    .from("profiles")
    .update({ premium_user: isPremium, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

async function handleSubscriptionCreatedOrUpdated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData, scheduledChange } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error("subscription event missing customData.userId");
    return;
  }
  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("Skipping subscription: missing importMeta.externalId", {
      rawPriceId: item?.price?.id,
      rawProductId: item?.product?.id,
    });
    return;
  }

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        paddle_subscription_id: id,
        paddle_customer_id: customerId,
        product_id: productId,
        price_id: priceId,
        status,
        current_period_start: currentBillingPeriod?.startsAt,
        current_period_end: currentBillingPeriod?.endsAt,
        cancel_at_period_end: scheduledChange?.action === "cancel",
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" },
    );

  // Flip premium based on access status
  const active =
    status === "active" || status === "trialing" || status === "past_due";
  if (active) await flipPremium(userId, true);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const { id, customData, currentBillingPeriod } = data;
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      current_period_end: currentBillingPeriod?.endsAt,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", id)
    .eq("environment", env);

  // Keep premium until period end — schedule nothing; the
  // has_active_subscription helper grants access until current_period_end.
  // If period already ended (rare for instant cancel), revoke now.
  const endsAt = currentBillingPeriod?.endsAt
    ? new Date(currentBillingPeriod.endsAt).getTime()
    : 0;
  if (customData?.userId && endsAt && endsAt <= Date.now()) {
    await flipPremium(customData.userId, false);
  }
}

async function creditScanPack(userId: string) {
  // Find current period via latest subscription, else calendar month (UTC)
  const { data: sub } = await getSupabase()
    .from("subscriptions")
    .select("current_period_start, current_period_end")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  let periodStart: string;
  let periodEnd: string;
  if (sub?.current_period_start && sub?.current_period_end) {
    periodStart = sub.current_period_start;
    periodEnd = sub.current_period_end;
  } else {
    const now = new Date();
    periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
  }
  const existing = await getSupabase()
    .from("scan_usage")
    .select("id, bonus")
    .eq("user_id", userId)
    .eq("period_start", periodStart)
    .maybeSingle();
  if (existing.data) {
    await getSupabase()
      .from("scan_usage")
      .update({ bonus: (existing.data.bonus ?? 0) + 100 })
      .eq("id", existing.data.id);
  } else {
    await getSupabase()
      .from("scan_usage")
      .insert({ user_id: userId, period_start: periodStart, period_end: periodEnd, used: 0, bonus: 100 });
  }
}

async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  // Detect lifetime one-time purchases (no subscription_id on the transaction)
  const { id, customerId, items, customData, subscriptionId } = data;
  const userId = customData?.userId;
  if (!userId) return;
  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;

  // Scan add-on pack — fires whether or not a subscription exists
  if (priceId === "scan_pack_100") {
    await creditScanPack(userId);
    return;
  }

  if (subscriptionId) return; // remaining cases handled by subscription events
  if (priceId !== "pro_lifetime") return;
  const productId = "fridgespy_pro_lifetime";

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        paddle_subscription_id: `lifetime_${id}`,
        paddle_customer_id: customerId,
        product_id: productId,
        price_id: priceId,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: null,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" },
    );
  await flipPremium(userId, true);
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
      await handleSubscriptionCreatedOrUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    case EventName.TransactionCompleted:
      await handleTransactionCompleted(event.data, env);
      break;
    default:
      console.log("Unhandled event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
