// Pure unit conversion helpers. No deps, safe in client + server.
// We normalize to two base units: grams (mass) and milliliters (volume).
// "unit" / "each" / "count" are dimensionless and only compare to themselves.

export type UnitKind = "mass" | "volume" | "count";

const TABLE: Record<string, { kind: UnitKind; toBase: number }> = {
  // mass
  g: { kind: "mass", toBase: 1 },
  gram: { kind: "mass", toBase: 1 },
  grams: { kind: "mass", toBase: 1 },
  kg: { kind: "mass", toBase: 1000 },
  oz: { kind: "mass", toBase: 28.3495 },
  lb: { kind: "mass", toBase: 453.592 },
  lbs: { kind: "mass", toBase: 453.592 },
  // volume
  ml: { kind: "volume", toBase: 1 },
  l: { kind: "volume", toBase: 1000 },
  liter: { kind: "volume", toBase: 1000 },
  liters: { kind: "volume", toBase: 1000 },
  tsp: { kind: "volume", toBase: 4.92892 },
  tbsp: { kind: "volume", toBase: 14.7868 },
  cup: { kind: "volume", toBase: 236.588 },
  cups: { kind: "volume", toBase: 236.588 },
  // count (dimensionless)
  unit: { kind: "count", toBase: 1 },
  units: { kind: "count", toBase: 1 },
  each: { kind: "count", toBase: 1 },
  count: { kind: "count", toBase: 1 },
  pc: { kind: "count", toBase: 1 },
  pcs: { kind: "count", toBase: 1 },
  piece: { kind: "count", toBase: 1 },
  pieces: { kind: "count", toBase: 1 },
};

function lookup(unit?: string | null) {
  if (!unit) return TABLE.unit;
  return TABLE[unit.trim().toLowerCase()] ?? TABLE.unit;
}

export function toBase(qty: number, unit?: string | null): { value: number; kind: UnitKind } {
  const u = lookup(unit);
  return { value: qty * u.toBase, kind: u.kind };
}

/** Convert qty from `from` unit into `to` unit, when they share a kind.
 *  Returns null when kinds differ (caller should fall back to a count-of-1). */
export function convert(qty: number, from?: string | null, to?: string | null): number | null {
  const a = lookup(from);
  const b = lookup(to);
  if (a.kind !== b.kind) return null;
  return (qty * a.toBase) / b.toBase;
}
