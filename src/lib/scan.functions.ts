/**
 * Isolated scan module — uses Lovable AI Gateway (Gemini Flash) ONLY.
 * Do not import from claude.functions.ts. Do not share helpers with other AI features.
 *
 * Quota: paid users get 100 scans per billing period. Overage = $1 per 100-scan
 * add-on pack (priceId "scan_pack_100"), redeemed via Paddle one-time checkout.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const FREE_SCAN_QUOTA = 100;
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const SCAN_MODEL = "google/gemini-2.5-flash";

type Period = { start: string; end: string };

async function resolvePeriod(userId: string): Promise<Period> {
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("current_period_start, current_period_end, status, price_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sub?.current_period_start && sub?.current_period_end) {
    return { start: sub.current_period_start, end: sub.current_period_end };
  }
  // Lifetime or fallback → calendar month (UTC)
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

async function getOrCreatePeriodRow(userId: string, period: Period) {
  const existing = await supabaseAdmin
    .from("scan_usage")
    .select("id, used, bonus, period_start, period_end")
    .eq("user_id", userId)
    .eq("period_start", period.start)
    .maybeSingle();
  if (existing.data) return existing.data;
  const inserted = await supabaseAdmin
    .from("scan_usage")
    .insert({ user_id: userId, period_start: period.start, period_end: period.end, used: 0, bonus: 0 })
    .select("id, used, bonus, period_start, period_end")
    .single();
  if (inserted.error) throw new Error(inserted.error.message);
  return inserted.data!;
}

async function isPaid(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("premium_user")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data?.premium_user;
}

// -------- Quota read --------
export const getScanQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const paid = await isPaid(userId);
    if (!paid) {
      return { paid: false, used: 0, included: FREE_SCAN_QUOTA, bonus: 0, remaining: 0, period_end: null };
    }
    const period = await resolvePeriod(userId);
    const row = await getOrCreatePeriodRow(userId, period);
    const total = FREE_SCAN_QUOTA + (row.bonus ?? 0);
    return {
      paid: true,
      used: row.used,
      included: FREE_SCAN_QUOTA,
      bonus: row.bonus ?? 0,
      remaining: Math.max(0, total - row.used),
      period_end: row.period_end,
    };
  });

// -------- The scan itself --------
export const scanExpiryLabel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageBase64: string; mediaType: string }) =>
    z.object({
      imageBase64: z.string().min(10).max(15_000_000),
      mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    // 1. Paid tier gate
    if (!(await isPaid(userId))) {
      return { error: "upgrade_required" as const };
    }

    // 2. Atomic quota reserve — increments only if under cap, no read/write race.
    const period = await resolvePeriod(userId);
    const row = await getOrCreatePeriodRow(userId, period);
    const total = FREE_SCAN_QUOTA + (row.bonus ?? 0);
    const { data: reserveRows, error: reserveErr } = await (supabaseAdmin as any)
      .rpc("increment_scan_usage", { p_row_id: row.id, p_max: total });
    if (reserveErr) throw new Error(reserveErr.message);
    const reserve = Array.isArray(reserveRows) ? reserveRows[0] : reserveRows;
    if (!reserve?.accepted) {
      return {
        error: "quota_exceeded" as const,
        used: reserve?.new_used ?? row.used,
        included: FREE_SCAN_QUOTA,
        bonus: row.bonus ?? 0,
      };
    }
    const newUsed: number = reserve.new_used;

    // 3. Call Gemini Flash via Lovable AI Gateway
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const today = new Date().toISOString().slice(0, 10);
    const prompt = `Find the expiration, best-by, use-by, or sell-by date on this product label, barcode area, or packaging. Today is ${today}.
Return ONLY a JSON object — no prose, no markdown:
{"expiry_date":"YYYY-MM-DD","kind":"best_by|use_by|sell_by|exp","raw":"exact text seen","confidence":"high|medium|low"}
If no date is readable, return {"expiry_date":null,"raw":null,"confidence":"low"}.
If only month/year visible, use the last day of that month. Assume the date is current or upcoming year.`;

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: SCAN_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${data.mediaType};base64,${data.imageBase64}` } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) return { error: "rate_limited" as const };
    if (res.status === 402) return { error: "credits_exhausted" as const };
    if (!res.ok) {
      const text = await res.text();
      console.error("Gemini scan error", res.status, text);
      throw new Error(`Scan failed (${res.status})`);
    }

    const payload = await res.json();
    const text = payload?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { expiry_date?: string | null; kind?: string; raw?: string | null; confidence?: string } = {};
    try {
      const cleaned = String(text).replace(/```json\s*|\s*```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {};
    }

    // 4. Increment usage (only on a real call — even if no date was found)
    await supabaseAdmin
      .from("scan_usage")
      .update({ used: row.used + 1 })
      .eq("id", row.id);

    return {
      ok: true as const,
      expiry_date: parsed.expiry_date ?? null,
      kind: parsed.kind ?? null,
      raw: parsed.raw ?? null,
      confidence: parsed.confidence ?? "low",
      remaining: Math.max(0, total - (row.used + 1)),
    };
  });
