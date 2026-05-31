import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChefHat, Minus, Plus, ShoppingCart, Trash2, Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { categoryEmoji, daysUntil, expiryColorClass, expiryLabel, expiryStatus, isoDateInDays, suggestExpiryDays } from "@/lib/expiry";
import { toast } from "sonner";
import { ScanExpiryButton } from "@/components/ScanExpiryButton";

export const Route = createFileRoute("/item/$id")({
  head: () => ({ meta: [{ title: "Item — FridgeSpy" }] }),
  component: ItemDetailPage,
});

type Nutrition = {
  energy_kcal?: number;
  proteins?: number;
  carbs?: number;
  fat?: number;
};

async function fetchNutrition(barcode: string): Promise<Nutrition | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`);
    if (!res.ok) return null;
    const j = await res.json() as any;
    if (j.status !== 1 || !j.product?.nutriments) return null;
    const n = j.product.nutriments;
    return {
      energy_kcal: n["energy-kcal_serving"] ?? n["energy-kcal_100g"],
      proteins: n["proteins_serving"] ?? n["proteins_100g"],
      carbs: n["carbohydrates_serving"] ?? n["carbohydrates_100g"],
      fat: n["fat_serving"] ?? n["fat_100g"],
    };
  } catch { return null; }
}

function ItemDetailPage() {
  const { id } = useParams({ from: "/item/$id" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: item, isLoading } = useQuery({
    queryKey: ["item", id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: all = [] } = useQuery({
    queryKey: ["items", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("items").select("*")).data ?? [],
  });

  const [editing, setEditing] = useState(false);
  const [draftExpiry, setDraftExpiry] = useState("");
  const [draftLocation, setDraftLocation] = useState<"fridge"|"freezer"|"pantry"|"counter">("fridge");
  const [draftNotes, setDraftNotes] = useState("");
  const [nutrition, setNutrition] = useState<Nutrition | null>(null);

  useEffect(() => {
    if (item) {
      setDraftExpiry(item.expiry_date ?? isoDateInDays(7));
      setDraftLocation(item.location as any);
      setDraftNotes(item.notes ?? "");
      if (item.barcode) fetchNutrition(item.barcode).then(setNutrition);
    }
  }, [item]);

  type ItemPatch = Partial<{ quantity: number; expiry_date: string | null; location: string; notes: string | null }>;
  const update = useMutation({
    mutationFn: async (patch: ItemPatch) => {
      const { error } = await supabase.from("items").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", id] });
    },
  });
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("🗑️ Removed from inventory");
      navigate({ to: "/inventory" });
    },
  });
  const toShopping = useMutation({
    mutationFn: async () => {
      if (!user || !item) throw new Error("Item unavailable");
      const { error } = await supabase.from("shopping_list").insert({
        user_id: user.id,
        name: item.name,
        category: item.category ?? "Other",
        quantity: item.quantity ?? 1,
        unit: item.unit ?? "unit",
        source: "detail",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping"] });
      toast.success("🛒 Added to shopping list");
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't add to shopping list"),
  });

  const similar = useMemo(() => {
    if (!item) return [];
    const cat = (item.category ?? "").toLowerCase();
    return all
      .filter(x => x.id !== item.id && ((x.category ?? "").toLowerCase() === cat || categoryEmoji(x.name, x.category) === categoryEmoji(item.name, item.category)))
      .slice(0, 4);
  }, [all, item]);

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading…</div>;
  }
  if (!item) {
    return (
      <div className="p-6 text-center">
        <div className="text-3xl">🔍</div>
        <div className="mt-2 font-bold">Item not found</div>
        <Link to="/inventory" className="mt-3 inline-block text-sm font-semibold text-primary">Back to inventory</Link>
      </div>
    );
  }

  const status = expiryStatus(item.expiry_date);
  const d = daysUntil(item.expiry_date);
  const pct = d === null ? 0 : Math.max(0, Math.min(100, Math.round((d / 14) * 100)));
  const barColor =
    status === "expired" || status === "urgent" ? "bg-destructive"
    : status === "soon" ? "bg-warning"
    : "bg-primary";

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-8">
      <div className="flex items-center justify-between py-3">
        <button onClick={() => history.back()} className="rounded-full p-2 hover:bg-surface"><ArrowLeft size={20}/></button>
        <button onClick={() => setEditing(e => !e)} className="rounded-full p-2 text-muted-foreground hover:bg-surface hover:text-foreground" aria-label="Edit">
          {editing ? <Check size={18} className="text-primary"/> : <Pencil size={18}/>}
        </button>
      </div>

      {/* Hero */}
      <div className="glass-card flex flex-col items-center p-6 text-center">
        <div className="text-6xl">{item.emoji || categoryEmoji(item.name, item.category)}</div>
        <h1 className="mt-3 text-2xl font-extrabold leading-tight">{item.name}</h1>
        <div className="mt-1 text-sm text-muted-foreground">
          {item.brand ? `${item.brand} · ` : ""}{item.category || "Uncategorized"}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className={`rounded-full bg-background/40 px-3 py-1 text-xs font-bold ${expiryColorClass(status)}`}>
            {expiryLabel(item.expiry_date)}
          </span>
        </div>

        {/* Quick location selector */}
        <div className="mt-4 w-full">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">📍 Storage location</div>
          <div className="grid grid-cols-4 gap-1.5">
            {(["fridge","freezer","pantry","counter"] as const).map(l => (
              <button
                key={l}
                onClick={() => {
                  if (item.location === l) return;
                  const suggested = isoDateInDays(suggestExpiryDays(item.category, item.name, l));
                  update.mutate({ location: l, expiry_date: suggested }, {
                    onSuccess: () => toast.success(`Moved to ${l} · expiry updated`),
                  });
                }}
                className={`rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider transition ${
                  item.location === l
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background/40 text-muted-foreground hover:border-primary"
                }`}
              >
                {l === "fridge" ? "🧊" : l === "freezer" ? "❄️" : l === "pantry" ? "🥫" : "🍎"} {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quantity */}
      <div className="mt-4 glass-card flex items-center justify-between p-4">
        <div className="text-sm font-semibold text-muted-foreground">Quantity</div>
        <div className="flex items-center gap-2">
          <button onClick={() => update.mutate({ quantity: Math.max(0, Number(item.quantity) - 1) })}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/40 hover:border-primary"><Minus size={16}/></button>
          <span className="w-16 text-center text-lg font-extrabold tabular-nums">
            {item.quantity}<span className="ml-1 text-xs font-normal text-muted-foreground">{item.unit}</span>
          </span>
          <button onClick={() => update.mutate({ quantity: Number(item.quantity) + 1 })}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/40 hover:border-primary"><Plus size={16}/></button>
        </div>
      </div>

      {/* Expiry countdown */}
      <div className="mt-4 glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-muted-foreground">Freshness</div>
          <div className={`text-sm font-bold ${expiryColorClass(status)}`}>{expiryLabel(item.expiry_date)}</div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/50">
          <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
        </div>
        {editing && (
          <div className="mt-3 grid grid-cols-1 gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expiry date</label>
            <div className="flex gap-2">
              <input type="date" value={draftExpiry} onChange={e => setDraftExpiry(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-background/40 px-3 py-2.5 outline-none focus:border-primary" />
              <ScanExpiryButton onDate={setDraftExpiry} />
            </div>
            <label className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["fridge","freezer","pantry","counter"] as const).map(l => (
                <button key={l} onClick={() => setDraftLocation(l)}
                  className={`rounded-xl py-2 text-xs font-bold uppercase tracking-wider ${draftLocation===l?"bg-primary text-primary-foreground":"border border-border bg-background/40 text-muted-foreground"}`}>
                  {l}
                </button>
              ))}
            </div>
            <label className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
            <textarea value={draftNotes} onChange={e => setDraftNotes(e.target.value)} rows={2}
              className="rounded-xl border border-border bg-background/40 px-3 py-2 outline-none focus:border-primary"/>
            <button onClick={() => { update.mutate({ expiry_date: draftExpiry, location: draftLocation, notes: draftNotes }); setEditing(false); toast.success("Saved"); }}
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground">
              Save changes
            </button>
          </div>
        )}
      </div>

      {/* Nutrition */}
      {nutrition && (nutrition.energy_kcal || nutrition.proteins || nutrition.carbs || nutrition.fat) && (
        <div className="mt-4 glass-card p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Nutrition (per serving)</div>
          <div className="grid grid-cols-4 gap-2">
            <NutriCell label="kcal" value={nutrition.energy_kcal} />
            <NutriCell label="protein" value={nutrition.proteins} suffix="g" />
            <NutriCell label="carbs" value={nutrition.carbs} suffix="g" />
            <NutriCell label="fat" value={nutrition.fat} suffix="g" />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link to="/recipes" className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
          <ChefHat size={16}/> Use in Recipe
        </Link>
        <button onClick={() => toShopping.mutate()} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-semibold">
          <ShoppingCart size={16}/> Add to Shopping
        </button>
      </div>

      <button onClick={() => { if (confirm(`Remove "${item.name}"?`)) del.mutate(); }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 py-3 text-sm font-semibold text-destructive">
        <Trash2 size={16}/> Delete item
      </button>

      <div className="mt-4 text-center text-xs text-muted-foreground">
        Added {new Date(item.added_date).toLocaleDateString()}
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Similar in your kitchen</h2>
          <div className="grid grid-cols-2 gap-2">
            {similar.map(s => (
              <Link key={s.id} to="/item/$id" params={{ id: s.id }} className="glass-card flex items-center gap-2 p-2.5">
                <div className="text-2xl">{s.emoji || categoryEmoji(s.name, s.category)}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{expiryLabel(s.expiry_date)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function NutriCell({ label, value, suffix = "" }: { label: string; value?: number; suffix?: string }) {
  return (
    <div className="rounded-xl bg-background/40 p-2 text-center">
      <div className="text-base font-extrabold tabular-nums">{value ? Math.round(value * 10) / 10 : "—"}{value ? suffix : ""}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
