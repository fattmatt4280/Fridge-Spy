// Smart expiry suggestions per category (in days)
const CATEGORY_EXPIRY: Record<string, number> = {
  milk: 7, dairy: 10, yogurt: 14, cheese: 21, butter: 30,
  bread: 5, bakery: 4,
  meat: 3, poultry: 2, chicken: 2, beef: 4, pork: 4, fish: 2, seafood: 2,
  produce: 7, vegetable: 7, fruit: 6, salad: 4, leafy: 4,
  eggs: 28,
  canned: 730, "canned-goods": 730, jarred: 540,
  pasta: 730, rice: 730, grains: 540, cereal: 365,
  frozen: 90, "frozen-meal": 180,
  sauce: 60, condiment: 180,
  snacks: 120, chips: 90,
  beverage: 30, juice: 14, soda: 180,
  default: 14,
};

export function suggestExpiryDays(category?: string | null, name?: string | null): number {
  const hay = `${category ?? ""} ${name ?? ""}`.toLowerCase();
  for (const k of Object.keys(CATEGORY_EXPIRY)) {
    if (hay.includes(k)) return CATEGORY_EXPIRY[k];
  }
  return CATEGORY_EXPIRY.default;
}

export function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const ms = d.getTime() - new Date(new Date().toDateString()).getTime();
  return Math.floor(ms / 86400000);
}

export function expiryStatus(date: string | Date | null | undefined): "fresh" | "soon" | "urgent" | "expired" | "unknown" {
  const d = daysUntil(date);
  if (d === null) return "unknown";
  if (d < 0) return "expired";
  if (d <= 3) return "urgent";
  if (d < 7) return "soon";
  return "fresh";
}

export function expiryColorClass(status: ReturnType<typeof expiryStatus>): string {
  switch (status) {
    case "fresh": return "text-primary";
    case "soon": return "text-warning";
    case "urgent": return "text-destructive";
    case "expired": return "text-destructive";
    default: return "text-muted-foreground";
  }
}

export function expiryLabel(date: string | Date | null | undefined): string {
  const d = daysUntil(date);
  if (d === null) return "No date";
  if (d < 0) return `${Math.abs(d)}d expired`;
  if (d === 0) return "Today";
  if (d === 1) return "1 day";
  return `${d} days`;
}

export function isoDateInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function categoryEmoji(name: string, category?: string | null): string {
  const s = `${name} ${category ?? ""}`.toLowerCase();
  const map: [string, string][] = [
    ["milk", "🥛"], ["yogurt", "🥛"], ["cheese", "🧀"], ["butter", "🧈"],
    ["egg", "🥚"], ["bread", "🍞"], ["bagel", "🥯"],
    ["chicken", "🍗"], ["beef", "🥩"], ["pork", "🥓"], ["fish", "🐟"], ["shrimp", "🦐"],
    ["apple", "🍎"], ["banana", "🍌"], ["orange", "🍊"], ["lemon", "🍋"], ["grape", "🍇"],
    ["strawberry", "🍓"], ["tomato", "🍅"], ["lettuce", "🥬"], ["carrot", "🥕"],
    ["onion", "🧅"], ["garlic", "🧄"], ["potato", "🥔"], ["pepper", "🌶️"],
    ["pasta", "🍝"], ["rice", "🍚"], ["pizza", "🍕"], ["sandwich", "🥪"],
    ["chocolate", "🍫"], ["cookie", "🍪"], ["cake", "🍰"],
    ["beer", "🍺"], ["wine", "🍷"], ["coffee", "☕"], ["juice", "🧃"], ["soda", "🥤"], ["water", "💧"],
  ];
  for (const [k, e] of map) if (s.includes(k)) return e;
  return "🍽️";
}
