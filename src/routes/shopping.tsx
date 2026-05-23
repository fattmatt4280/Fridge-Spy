import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Share2, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { categoryEmoji, isoDateInDays, suggestExpiryDays } from "@/lib/expiry";
import { toast } from "sonner";

export const Route = createFileRoute("/shopping")({
  head: () => ({ meta: [{ title: "Shopping List — FridgeSpy" }] }),
  component: ShoppingPage,
});

const SECTIONS = ["Produce","Dairy","Meat","Frozen","Pantry","Beverage","Other"];

function sectionFor(cat?: string | null) {
  const c = (cat ?? "").toLowerCase();
  if (/produce|fruit|vegetable/.test(c)) return "Produce";
  if (/dairy|milk|cheese|yogurt/.test(c)) return "Dairy";
  if (/meat|chicken|beef|pork|fish|seafood/.test(c)) return "Meat";
  if (/frozen/.test(c)) return "Frozen";
  if (/pantry|canned|pasta|rice|grain|sauce/.test(c)) return "Pantry";
  if (/beverage|drink|juice|soda|water/.test(c)) return "Beverage";
  return "Other";
}

function ShoppingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newItem, setNewItem] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["shopping", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("shopping_list").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("shopping_list").insert({
        user_id: user!.id, name, source: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shopping"] }); setNewItem(""); },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const { error } = await supabase.from("shopping_list").update({ checked }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("shopping_list").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });
  const clearChecked = useMutation({
    mutationFn: async () => { await supabase.from("shopping_list").delete().eq("checked", true).eq("user_id", user!.id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shopping"] }); toast.success("Cleared checked items"); },
  });
  const shoppingDone = useMutation({
    mutationFn: async () => {
      const checked = items.filter(i => i.checked);
      if (!checked.length) throw new Error("Nothing checked");
      const rows = checked.map(i => ({
        user_id: user!.id,
        name: i.name,
        category: i.category ?? null,
        emoji: categoryEmoji(i.name, i.category),
        quantity: i.quantity ?? 1,
        unit: i.unit ?? "each",
        location: "fridge",
        expiry_date: isoDateInDays(suggestExpiryDays(i.category, i.name)),
      }));
      const { error: insErr } = await supabase.from("items").insert(rows);
      if (insErr) throw insErr;
      const ids = checked.map(i => i.id);
      const { error: delErr } = await supabase.from("shopping_list").delete().in("id", ids);
      if (delErr) throw delErr;
      await supabase.from("activity_log").insert({
        user_id: user!.id, kind: "shopping", message: `Bought ${rows.length} items`,
      });
      return rows.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["shopping"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      toast.success(`Moved ${n} items to inventory`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function share() {
    const text = items.filter(i => !i.checked).map(i => { const q = i.quantity ?? 1; return `• ${i.name}${q>1?` x${q}`:""}`; }).join("\n");
    if (navigator.share) {
      try { await navigator.share({ title: "FridgeSpy shopping list", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("List copied to clipboard");
    }
  }

  const grouped = SECTIONS.map(s => ({ section: s, items: items.filter(i => sectionFor(i.category) === s) })).filter(g => g.items.length);

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1rem)]">
      <div className="flex items-center justify-between py-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Shopping</h1>
        <button onClick={share} className="rounded-full p-2 text-muted-foreground hover:bg-surface hover:text-foreground"><Share2 size={20}/></button>
      </div>

      <form onSubmit={e => { e.preventDefault(); if (newItem.trim()) add.mutate(newItem.trim()); }} className="flex gap-2">
        <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add item…"
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-primary" />
        <button className="flex items-center justify-center rounded-xl bg-primary px-4 text-primary-foreground"><Plus size={20}/></button>
      </form>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface/40 p-8 text-center">
          <div className="text-4xl">🛒</div>
          <div className="mt-2 text-sm text-muted-foreground">Your shopping list is empty.</div>
        </div>
      ) : (
        <div className="mt-5 space-y-5 pb-6">
          {grouped.map(g => (
            <section key={g.section}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{g.section}</h2>
              <ul className="overflow-hidden rounded-2xl border border-border bg-surface divide-y divide-border">
                {g.items.map(i => (
                  <li key={i.id} className="flex items-center gap-3 px-3 py-3">
                    <input type="checkbox" checked={i.checked} onChange={e => toggle.mutate({ id: i.id, checked: e.target.checked })}
                      className="h-5 w-5 accent-[color:var(--color-primary)]" />
                    <span className={`flex-1 text-sm ${i.checked ? "text-muted-foreground line-through" : ""}`}>
                      {i.name}{(i.quantity ?? 1) > 1 ? ` × ${i.quantity ?? 1}` : ""}
                    </span>
                    <button onClick={() => remove.mutate(i.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 size={16}/>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {items.some(i => i.checked) && (
            <button onClick={() => clearChecked.mutate()} className="w-full rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-muted-foreground">
              Clear checked items
            </button>
          )}
        </div>
      )}
    </div>
  );
}
