import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

async function callClaude(body: any): Promise<any> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Claude API error:", res.status, text);
    throw new Error(`Claude API error (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

function extractJSON<T = unknown>(text: string): T {
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  const match = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  const candidate = match ? match[0] : cleaned;
  return JSON.parse(candidate) as T;
}

// ---------- Receipt scan ----------
export const scanReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageBase64: string; mediaType: string }) =>
    z.object({
      imageBase64: z.string().min(10).max(15_000_000),
      mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const json = await callClaude({
      model: MODEL,
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: data.mediaType, data: data.imageBase64 } },
          { type: "text", text:
            `Look at this grocery receipt image. Extract every food item purchased. Return ONLY a JSON array, no other text, in this format:
[{"name": "item name", "quantity": 1, "unit": "each", "category": "dairy", "estimated_expiry_days": 7}]
Categories must be one of: produce, dairy, meat, seafood, frozen, pantry, beverages, snacks, condiments, other` },
        ],
      }],
    });
    const text = json?.content?.[0]?.text ?? "[]";
    const items = extractJSON<any[]>(text);
    return { items: Array.isArray(items) ? items : [] };
  });

// ---------- Fridge scan ----------
export const scanFridge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageBase64: string; mediaType: string }) =>
    z.object({
      imageBase64: z.string().min(10).max(15_000_000),
      mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const json = await callClaude({
      model: MODEL,
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: data.mediaType, data: data.imageBase64 } },
          { type: "text", text:
            `Look at this photo of a fridge or pantry shelf. Identify every food item you can see. Return ONLY a JSON array, no other text:
[{"name": "item name", "estimated_quantity": 1, "unit": "each", "category": "dairy", "confidence": "high/medium/low"}]` },
        ],
      }],
    });
    const text = json?.content?.[0]?.text ?? "[]";
    const items = extractJSON<any[]>(text);
    return { items: Array.isArray(items) ? items : [] };
  });

// NOTE: Expiry-label scanning has moved to src/lib/scan.functions.ts (Gemini Flash, gated + metered).
// Do not re-add it here — keep the scan flow fully isolated from the Claude-based flows.

// ---------- Recipe generation ----------
export const generateRecipes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    expiring: { name: string }[];
    other: { name: string }[];
    count?: number;
  }) =>
    z.object({
      expiring: z.array(z.object({ name: z.string().min(1).max(200) })).max(200),
      other: z.array(z.object({ name: z.string().min(1).max(200) })).max(400),
      count: z.number().int().min(1).max(5).optional(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const count = data.count ?? 3;

    // Pull personalization context server-side so the client doesn't have to
    // know about it and so it's always fresh / authoritative.
    const [{ data: profile }, { data: recentCooked }] = await Promise.all([
      supabase
        .from("profiles")
        .select("cuisines_liked, cuisines_learning, dietary_restrictions, avoid_ingredients, skill_level, typical_cook_time_min")
        .maybeSingle(),
      supabase
        .from("activity_log")
        .select("message, created_at")
        .eq("kind", "cooked")
        .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const expiringList = data.expiring.map(i => i.name).join(", ") || "(none)";
    const otherList = data.other.map(i => i.name).join(", ") || "(none)";

    const liked = profile?.cuisines_liked?.join(", ") || "(no preference)";
    const learning = profile?.cuisines_learning?.join(", ") || "(none)";
    const dietary = profile?.dietary_restrictions?.join(", ") || "(none)";
    const avoid = profile?.avoid_ingredients?.join(", ") || "(none)";
    const skill = profile?.skill_level ?? "comfortable";
    const time = profile?.typical_cook_time_min ?? 30;
    const cookedRecent = (recentCooked ?? [])
      .map(r => r.message.replace(/^Cooked\s+/, "").replace(/\s+—.*$/, ""))
      .filter(Boolean)
      .slice(0, 8)
      .join("; ") || "(none yet)";

    const learningClause = profile?.cuisines_learning?.length
      ? `Make exactly 1 of the ${count} recipes a "${profile.cuisines_learning[Math.floor(Math.random() * profile.cuisines_learning.length)]}" dish so the user practices a cuisine they want to learn. Mark that recipe with "is_learning_pick": true.`
      : `Do not include "is_learning_pick" on any recipe.`;

    const prompt = `You are FridgeSpy, a personal cooking assistant. Suggest ${count} recipe${count === 1 ? "" : "s"} the user can make tonight using what's already in their kitchen.

USER PROFILE
- Cuisines they love: ${liked}
- Cuisines they want to learn: ${learning}
- Dietary restrictions: ${dietary}
- Ingredients to AVOID entirely (allergies/dislikes): ${avoid}
- Skill level: ${skill}
- Target cook time: ~${time} minutes on a weeknight

INVENTORY
- Use first (expiring soon): ${expiringList}
- Other ingredients available: ${otherList}

RECENTLY COOKED (do NOT repeat these): ${cookedRecent}

RULES
- Bias strongly toward the user's loved cuisines.
- Respect dietary restrictions strictly. NEVER include any avoided ingredient.
- Match the user's skill level and target cook time.
- Prioritize recipes that use the expiring items.
- ${learningClause}

Return ONLY a JSON array of ${count} recipe${count === 1 ? "" : "s"}, no other text:
[{"title": "Recipe Name", "cuisine": "Italian", "prep_time": "25 mins", "difficulty": "Easy", "uses_expiring": ["item1", "item2"], "missing_ingredients": ["item1"], "instructions": ["step 1", "step 2"], "why_make_this": "Uses your expiring Greek yogurt and spinach", "is_learning_pick": false}]`;

    const json = await callClaude({
      model: MODEL,
      max_tokens: 3072,
      messages: [{ role: "user", content: prompt }],
    });
    const text = json?.content?.[0]?.text ?? "[]";
    const recipes = extractJSON<any[]>(text);
    return { recipes: Array.isArray(recipes) ? recipes : [] };
  });
