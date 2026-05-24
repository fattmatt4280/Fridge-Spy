// Smart expiry suggestions per category (in days)
// Order matters: more specific / shelf-stable keys are checked first so that
// e.g. "boxed mac and cheese" matches the dry-goods entry before the "cheese"
// dairy entry.
const CATEGORY_EXPIRY: Array<[string, number]> = [
  // Shelf-stable boxed / dry packaged meals (mac & cheese, hamburger helper, etc.)
  ["mac and cheese", 540], ["mac & cheese", 540], ["macaroni and cheese", 540],
  ["boxed", 540], ["box mix", 540], ["dry mix", 540], ["mix", 365],
  ["instant", 540], ["ramen", 365], ["noodle cup", 365],
  // Canned & jarred
  ["canned", 730], ["canned-goods", 730], ["jarred", 540], ["jar", 540],
  // Dry pantry staples
  ["pasta", 730], ["noodle", 540], ["rice", 730], ["grain", 540],
  ["cereal", 365], ["oat", 365], ["flour", 365], ["sugar", 730],
  ["bean", 730], ["lentil", 730],
  // Snacks & sweets
  ["snack", 120], ["chips", 90], ["cracker", 180], ["cookie", 120],
  ["chocolate", 365], ["candy", 365],
  // Condiments & sauces
  ["sauce", 60], ["condiment", 180], ["ketchup", 180], ["mustard", 365],
  ["mayo", 60], ["dressing", 90], ["syrup", 365], ["honey", 730],
  ["oil", 365], ["vinegar", 730],
  // Beverages
  ["soda", 180], ["juice", 14], ["beverage", 30], ["water", 730],
  ["coffee", 180], ["tea", 365],
  // Frozen
  ["frozen-meal", 180], ["frozen", 90],
  // Dairy
  ["milk", 7], ["yogurt", 14], ["cheese", 21], ["butter", 30], ["dairy", 10],
  // Bakery
  ["bread", 5], ["bagel", 5], ["bakery", 4],
  // Meat / seafood
  ["chicken", 2], ["poultry", 2], ["beef", 4], ["pork", 4],
  ["fish", 2], ["seafood", 2], ["meat", 3],
  // Produce
  ["salad", 4], ["leafy", 4], ["lettuce", 5], ["berry", 5],
  ["fruit", 6], ["vegetable", 7], ["produce", 7],
  // Eggs
  ["egg", 28],
];

const DEFAULT_EXPIRY = 14;

function suggestBaseExpiryDays(category?: string | null, name?: string | null): number {
  const hay = `${category ?? ""} ${name ?? ""}`.toLowerCase();
  for (const [k, v] of CATEGORY_EXPIRY) {
    if (hay.includes(k)) return v;
  }
  return DEFAULT_EXPIRY;
}

export function suggestExpiryDays(category?: string | null, name?: string | null, location?: string | null): number {
  const base = suggestBaseExpiryDays(category, name);

  if (location === "freezer") {
    if (base <= 14) return Math.min(365, base * 12);
    if (base <= 60) return Math.min(365, base * 6);
    return Math.min(365, base);
  }

  if (location === "pantry") {
    if (base <= 14) return Math.min(730, base * 4);
    if (base <= 60) return Math.min(730, base * 2);
    return base;
  }

  return base;
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
