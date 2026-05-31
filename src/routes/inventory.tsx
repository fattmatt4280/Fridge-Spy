import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, ShoppingCart, Minus, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { categoryEmoji, daysUntil, expiryColorClass, expiryLabel, expiryStatus } from "@/lib/expiry";
import { toast } from "sonner";
import { EmptyState, SkeletonRow } from "@/components/EmptyState";
import { QuantityPopover } from "@/components/QuantityPopover";

type Location = "all" | "fridge" | "freezer" | "pantry" | "counter";
type SortKey = "expiry" | "name" | "category" | "location";
type StatusFilter = "all" | "expiring" | "expired";

const LOC_EMOJI: Record<Exclude<Location, "all">, string> = {
  fridge: "🧊", freezer: "❄️", pantry: "🥫", counter: "🍎",
};

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Your Inventory — FridgeSpy" },
      { name: "description", content: "See every item in your fridge, freezer, and pantry at a glance. Filter by location, expiry, or category and never lose track of groceries again." },
      { property: "og:title", content: "Your Inventory — FridgeSpy" },
      { property: "og:description", content: "See every item in your fridge, freezer, and pantry at a glance." },
      { property: "og:url", content: "https://fridgespy.com/inventory" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/inventory" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    filter: (s.filter === "expiring" || s.filter === "expired") ? s.filter : undefined,
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const [tab, setTab] = useState<Location>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("expiry");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Honor incoming ?filter=expiring|expired from the home dashboard.
  useEffect(() => {
    if (search.filter === "expiring" || search.filter === "expired") {
      setStatusFilter(search.filter);
    }
  }, [search.filter]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Per-location counts for tab badges
  const counts = useMemo(() => {
    const c: Record<Location, number> = { all: items.length, fridge: 0, freezer: 0, pantry: 0, counter: 0 };
    for (const i of items) {
      if (i.location in c) c[i.location as Location]++;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (tab !== "all") list = list.filter(i => i.location === tab);
    if (q) list = list.filter(i => i.name.toLowerCase().includes(q.toLowerCase()));
    if (statusFilter !== "all") {
      list = list.filter(i => {
        const d = daysUntil(i.expiry_date);
        if (d === null) return false;
        if (statusFilter === "expired") return d < 0;
        return d >= 0 && d <= 7;
      });
    }
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
  }, [items, tab, q, sort, statusFilter]);

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
      <div className="flex items-end justify-between py-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Inventory</h1>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{filtered.length} of {items.length}</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search items…"
          className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-10 text-base outline-none placeholder:text-muted-foreground focus:border-primary" />
        {q && (
          <button onClick={() => setQ("")} aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground">
            <X size={16}/>
          </button>
        )}
      </div>

      {/* Status quick filters */}
      {(statusFilter !== "all" || items.length > 0) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {(["all","expiring","expired"] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 font-semibold capitalize transition ${
                statusFilter===s
                  ? s === "expired" ? "bg-destructive/15 text-destructive" : s === "expiring" ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"
                  : "border border-border bg-surface text-muted-foreground"
              }`}>
              {s === "expiring" ? "Expiring soon" : s === "expired" ? "Expired" : "All"}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {(["all","fridge","freezer","pantry","counter"] as Location[]).map(l => (
          <button key={l} onClick={() => setTab(l)}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider transition ${tab===l ? "bg-primary text-primary-foreground" : "border border-border bg-surface text-muted-foreground"}`}>
            <span className="text-sm">{l === "all" ? "📦" : LOC_EMOJI[l as Exclude<Location, "all">]}</span>
            <span>{l}</span>
            <span className={`text-[9px] font-bold ${tab===l ? "opacity-80" : "opacity-60"}`}>{counts[l] ?? 0}</span>
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
        {isLoading && (
          <>
            <SkeletonRow /><SkeletonRow /><SkeletonRow />
          </>
        )}
        {!isLoading && filtered.length === 0 && (
          <EmptyState
            emoji="🥦"
            title="Your kitchen is a mystery."
            body="Add your first item to start tracking. Snap a receipt to add everything at once."
            action={{ label: "Snap a Receipt", to: "/scan-receipt" }}
          />
        )}
        {filtered.map(item => {
          const status = expiryStatus(item.expiry_date);
          return (
            <div key={item.id} className="glass-card flex items-center gap-3 p-3">
              <Link
                to="/item/$id"
                params={{ id: item.id }}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
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
                    {item.low_stock_at != null && Number(item.quantity) <= Number(item.low_stock_at) && (
                      <span className="rounded-full bg-warning/15 px-2 py-0.5 font-bold text-warning">Low</span>
                    )}
                    {item.brand && <span className="truncate">{item.brand}</span>}
                  </div>
                </div>
              </Link>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div className="flex items-center gap-1">
                  <button onClick={() => adjust.mutate({ id: item.id, qty: Math.max(0, Number(item.quantity) - 1) })}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/40 hover:border-primary"><Minus size={14}/></button>
                  <QuantityPopover
                    qty={Number(item.quantity)}
                    unit={item.unit}
                    onSet={(next) => adjust.mutate({ id: item.id, qty: next })}
                  >
                    <button
                      className="w-10 rounded-md py-0.5 text-center text-sm font-bold tabular-nums hover:bg-background/40"
                      aria-label="Adjust by fraction"
                    >
                      {item.quantity}
                    </button>
                  </QuantityPopover>
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
          );
        })}
      </div>
    </div>
  );
}

