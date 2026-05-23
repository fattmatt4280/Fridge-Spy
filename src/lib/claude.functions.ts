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
  // Strip markdown code fences
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  // Find first JSON array or object
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
            `Extract all grocery items from this receipt. Return ONLY a JSON array. No markdown, no commentary.
Each item: { "name": string, "quantity": number, "unit": string, "category": string, "expiry_days": number, "emoji": string }.
- category: one of dairy, produce, meat, frozen, pantry, beverage, snack, bakery, other
- expiry_days: typical shelf life from today for that item
- emoji: a single food emoji
If no grocery items, return [].` },
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
            `Identify all food items visible in this fridge photo. Return ONLY a JSON array. No markdown.
Each item: { "name": string, "brand": string|null, "quantity": number, "unit": string, "category": string, "emoji": string, "confidence": number }.
- confidence: 0-1
- Use the most specific name you can see. Mention the brand if a label is visible.
If nothing is visible, return [].` },
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
  .inputValidator((input: { inventory: { name: string; quantity?: number; unit?: string; days_left?: number | null }[] }) =>
    z.object({
      inventory: z.array(z.object({
        name: z.string().min(1).max(200),
        quantity: z.number().optional(),
        unit: z.string().max(50).optional(),
        days_left: z.number().nullable().optional(),
      })).min(1).max(200),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const list = data.inventory
      .map(i => `- ${i.name}${i.quantity ? ` (${i.quantity} ${i.unit ?? ""})` : ""}${typeof i.days_left === "number" ? ` [${i.days_left}d left]` : ""}`)
      .join("\n");
    const json = await callClaude({
      model: MODEL,
      max_tokens: 3072,
      messages: [{
        role: "user",
        content: `Based on these ingredients I have on hand:
${list}

Suggest 3 recipes I can make tonight using primarily items expiring within 7 days.
Return ONLY a JSON array. No markdown, no commentary.

Each recipe: {
  "title": string,
  "prep_time": string (e.g. "25 min"),
  "difficulty": "Easy" | "Medium" | "Hard",
  "ingredients": string[],
  "instructions": string[],
  "uses_items": string[] (names from my inventory it uses),
  "missing_ingredients": string[] (things I'd need to buy)
}`,
      }],
    });
    const text = json?.content?.[0]?.text ?? "[]";
    const recipes = extractJSON<any[]>(text);
    return { recipes: Array.isArray(recipes) ? recipes : [] };
  });
