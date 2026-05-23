import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, ShoppingCart, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { categoryEmoji, daysUntil, expiryColorClass, expiryLabel, expiryStatus } from "@/lib/expiry";
import { toast } from "sonner";
import { EmptyState, SkeletonRow } from "@/components/EmptyState";

type Location = "all" | "fridge" | "freezer" | "pantry";
type SortKey = "expiry" | "name" | "category" | "location";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory — FridgeSpy" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Location>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("expiry");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let list = items;
    if (tab !== "all") list = list.filter(i => i.location === tab);
    if (q) list = list.filter(i => i.name.toLowerCase().includes(q.toLowerCase()));
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "category") return (a.category ?? "").localeCompare(b.category ?? "");
      if (sort === "location") return a.location.localeCompare(b.location);
      // expiry
      const da = daysUntil(a.expiry_date) ?? 9999;
      const db = daysUntil(b.expiry_date) ?? 9999;
      return da - db;
    });
    return list;
  }, [items, tab, q, sort]);

  const adjust = useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      const { error } = await supabase.from("items").update({ quantity: qty }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item removed");
    },
  });

  const toShopping = useMutation({
    mutationFn: async (item: any) => {
      const { error } = await supabase.from("shopping_list").insert({
        user_id: user!.id,
        name: item.name, quantity: item.quantity, unit: item.unit,
        category: item.category ?? "Other", source: "swipe",
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Added to shopping list"),
  });

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1rem)]">
      <h1 className="py-3 text-2xl font-extrabold tracking-tight">Inventory</h1>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search items…"
          className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary" />
      </div>

      {/* Tabs */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {(["all","fridge","freezer","pantry"] as Location[]).map(l => (
          <button key={l} onClick={() => setTab(l)}
            className={`rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition ${tab===l ? "bg-primary text-primary-foreground" : "border border-border bg-surface text-muted-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Sort:</span>
        {(["expiry","name","category","location"] as SortKey[]).map(s => (
          <button key={s} onClick={() => setSort(s)}
            className={`rounded-full px-2.5 py-1 ${sort===s ? "bg-primary/15 text-primary" : "hover:text-foreground"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-4 space-y-2.5 pb-6">
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-8 text-center">
            <div className="text-4xl">📭</div>
            <div className="mt-2 text-sm text-muted-foreground">Nothing here yet. Add your first item.</div>
          </div>
        )}
        {filtered.map(item => {
          const status = expiryStatus(item.expiry_date);
          return (
            <div key={item.id} className="glass-card flex items-center gap-3 p-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/40 text-2xl">
                {item.emoji || categoryEmoji(item.name, item.category)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-semibold">{item.name}</div>
                  <div className={`text-xs font-bold ${expiryColorClass(status)}`}>{expiryLabel(item.expiry_date)}</div>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-background/50 px-2 py-0.5 capitalize">{item.location}</span>
                  {item.brand && <span className="truncate">{item.brand}</span>}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button onClick={() => adjust.mutate({ id: item.id, qty: Math.max(0, Number(item.quantity) - 1) })}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/40 hover:border-primary"><Minus size={14}/></button>
                    <span className="w-10 text-center text-sm font-bold tabular-nums">{item.quantity} <span className="text-[10px] font-normal text-muted-foreground">{item.unit}</span></span>
                    <button onClick={() => adjust.mutate({ id: item.id, qty: Number(item.quantity) + 1 })}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/40 hover:border-primary"><Plus size={14}/></button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toShopping.mutate(item)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" aria-label="Add to shopping">
                      <ShoppingCart size={16} />
                    </button>
                    <button onClick={() => del.mutate(item.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
