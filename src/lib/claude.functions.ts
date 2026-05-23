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

// ---------- Recipe generation ----------
export const generateRecipes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    expiring: { name: string }[];
    other: { name: string }[];
  }) =>
    z.object({
      expiring: z.array(z.object({ name: z.string().min(1).max(200) })).max(200),
      other: z.array(z.object({ name: z.string().min(1).max(200) })).max(400),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const expiringList = data.expiring.map(i => i.name).join(", ") || "(none)";
    const otherList = data.other.map(i => i.name).join(", ") || "(none)";
    const prompt = `I have these items in my kitchen that need to be used soon: ${expiringList}.
I also have these other ingredients: ${otherList}.
Suggest 3 recipes I can make tonight.
Return ONLY JSON, no other text:
[{"title": "Recipe Name", "prep_time": "20 mins", "difficulty": "Easy/Medium/Hard", "uses_expiring": ["item1", "item2"], "missing_ingredients": ["item1"], "instructions": ["step 1", "step 2"], "why_make_this": "Uses your expiring Greek yogurt and spinach"}]`;
    const json = await callClaude({
      model: MODEL,
      max_tokens: 3072,
      messages: [{ role: "user", content: prompt }],
    });
    const text = json?.content?.[0]?.text ?? "[]";
    const recipes = extractJSON<any[]>(text);
    return { recipes: Array.isArray(recipes) ? recipes : [] };
  });
