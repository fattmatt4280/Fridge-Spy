import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Receipt, Barcode, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { lookupBarcode, searchByName, type OFFProduct } from "@/lib/openfoodfacts";
import { categoryEmoji, isoDateInDays, suggestExpiryDays } from "@/lib/expiry";
import { toast } from "sonner";
import { usePremium, useUpgradeGate } from "@/hooks/usePremium";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ScanExpiryButton } from "@/components/ScanExpiryButton";

export const Route = createFileRoute("/add")({
  head: () => ({ meta: [{ title: "Add Item — FridgeSpy" }] }),
  component: AddPage,
});

function AddPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { isPremium, isPremiumLoading, itemsLeft } = usePremium();
  const gate = useUpgradeGate();
  const [tab, setTab] = useState<"manual" | "barcode">("manual");

  // Manual / search state
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [emoji, setEmoji] = useState("🍽️");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("unit");
  const [location, setLocation] = useState<"fridge"|"freezer"|"pantry"|"counter">("fridge");
  const [expiry, setExpiry] = useState(isoDateInDays(suggestExpiryDays(null, null, "fridge")));
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [barcode, setBarcode] = useState("");
  const [searchResults, setSearchResults] = useState<OFFProduct[]>([]);

  function applyProduct(p: OFFProduct) {
    setName(p.name ?? name);
    setBrand(p.brand ?? "");
    setCategory(p.category ?? "");
    setImageUrl(p.image_url);
    setBarcode(p.barcode);
    setEmoji(categoryEmoji(p.name ?? "", p.category));
    setExpiry(isoDateInDays(suggestExpiryDays(p.category, p.name, location)));
    setSearchResults([]);
    toast.success(`Found: ${p.name}`);
  }

  function recomputeExpiry(cat: string, itemName: string, loc: string) {
    setExpiry(isoDateInDays(suggestExpiryDays(cat || null, itemName || null, loc)));
  }

  async function onSearch() {
    if (!name.trim()) return;
    const res = await searchByName(name.trim());
    setSearchResults(res);
    if (res.length === 0) toast.info("No matches — fill in details manually.");
  }

  async function onLookupBarcode() {
    if (!barcode.trim()) return;
    const p = await lookupBarcode(barcode.trim());
    if (p) applyProduct(p);
    else toast.error("Barcode not found in OpenFoodFacts.");
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!name.trim()) throw new Error("Name required");
      if (!isPremium && itemsLeft <= 0) {
        gate.open("item-cap");
        throw new Error("Free tier limit reached");
      }
      const { error } = await supabase.from("items").insert({
        user_id: user.id,
        name: name.trim(),
        brand: brand || null,
        category: category || null,
        emoji,
        quantity,
        unit,
        location,
        expiry_date: expiry || null,
        notes: notes || null,
        image_url: imageUrl ?? null,
        barcode: barcode || null,
      });
      if (error) throw error;
      await supabase.from("activity_log").insert({
        user_id: user.id, kind: "add", message: `Added ${name}`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      toast.success("Item added");
      navigate({ to: "/inventory" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="overflow-x-hidden px-4 pt-[max(env(safe-area-inset-top),1rem)]">
      <div className="flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => history.back()} className="rounded-full p-2 hover:bg-surface"><ArrowLeft size={20}/></button>
          <h1 className="text-xl font-extrabold tracking-tight">Add Item</h1>
        </div>
        {!isPremium && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            {itemsLeft} free left
          </span>
        )}
      </div>

      {/* Method selectors */}
      <div className="grid grid-cols-3 gap-2">
        <Link to="/scan-receipt" className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-surface py-3 text-xs font-semibold transition active:scale-95">
          <Receipt size={20} className="text-primary" />Receipt
        </Link>
        <Link to="/scan-fridge" className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-surface py-3 text-xs font-semibold transition active:scale-95">
          <Camera size={20} className="text-primary" />Fridge
        </Link>
        <button onClick={() => setTab("barcode")} className={`flex flex-col items-center gap-1 rounded-2xl border py-3 text-xs font-semibold ${tab==="barcode"?"border-primary bg-primary/10":"border-border bg-surface"}`}>
          <Barcode size={20} className="text-primary" />Barcode
        </button>
      </div>

      {tab === "barcode" && (
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Barcode number</label>
          <div className="flex gap-2">
            <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="e.g. 3017620422003" inputMode="numeric"
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-primary" />
            <button onClick={onLookupBarcode} className="rounded-xl bg-primary px-4 font-semibold text-primary-foreground">Lookup</button>
          </div>
          <p className="text-xs text-muted-foreground">Powered by OpenFoodFacts. Auto-fills product details below.</p>
        </div>
      )}

      {/* Search by name */}
      <div className="mt-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</label>
        <div className="mt-1.5 flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Whole milk"
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-primary" />
          <button onClick={onSearch} className="rounded-xl border border-border bg-surface px-4 text-sm font-semibold">Find</button>
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface">
            {searchResults.map(r => (
              <li key={r.barcode}>
                <button onClick={() => applyProduct(r)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-background/40">
                  {r.image_url ? <img src={r.image_url} alt="" className="h-9 w-9 rounded object-cover"/> : <span className="text-xl">🛒</span>}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.name}</div>
                    {r.brand && <div className="truncate text-xs text-muted-foreground">{r.brand}</div>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Brand"><input value={brand} onChange={e=>setBrand(e.target.value)} className="input"/></Field>
        <Field label="Category"><input value={category} onChange={e=>setCategory(e.target.value)} className="input"/></Field>
      </div>

      <div className="mt-3 grid grid-cols-[60px_1fr_1fr] gap-2">
        <Field label="Emoji">
          <input value={emoji} onChange={e=>setEmoji(e.target.value.slice(0,2))} className="input text-center text-xl"/>
        </Field>
        <Field label="Qty">
          <input type="number" min={0} step="0.1" value={quantity} onChange={e=>setQuantity(Number(e.target.value))} className="input"/>
        </Field>
        <Field label="Unit">
          <input value={unit} onChange={e=>setUnit(e.target.value)} className="input"/>
        </Field>
      </div>

      <Field label="Location">
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {(["fridge","freezer","pantry","counter"] as const).map(l => {
            const emoji = l === "fridge" ? "🧊" : l === "freezer" ? "❄️" : l === "pantry" ? "🥫" : "🍎";
            return (
              <button key={l} type="button" onClick={() => { setLocation(l); recomputeExpiry(category, name, l); }}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider transition ${location===l?"bg-primary text-primary-foreground":"border border-border bg-surface text-muted-foreground hover:border-primary/40"}`}>
                <span className="text-base">{emoji}</span>
                {l}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Expiry date">
        <div className="flex gap-2">
          <input type="date" value={expiry} onChange={e=>setExpiry(e.target.value)} className="input flex-1"/>
          <ScanExpiryButton onDate={setExpiry} />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {expiry ? (() => {
            const days = Math.round((new Date(expiry).getTime() - new Date().setHours(0,0,0,0)) / 86400000);
            if (days < 0) return `⚠️ Already expired ${Math.abs(days)} day${Math.abs(days)===1?"":"s"} ago`;
            if (days === 0) return "⏰ Expires today";
            if (days === 1) return "⏰ Expires tomorrow";
            return `✨ Fresh for ~${days} days based on ${location}`;
          })() : "Type it in, or scan the printed best-by date on the package."}
        </p>
      </Field>
      <Field label="Notes"><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className="input"/></Field>

      <button
        disabled={save.isPending}
        onClick={() => save.mutate()}
        className="mt-5 mb-6 w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60"
      >
        {save.isPending ? "Saving..." : "Add to inventory"}
      </button>

      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--color-border);background:var(--color-surface);padding:0.75rem 1rem;outline:none;}.input:focus{border-color:var(--color-primary)}`}</style>

      <UpgradeModal reason={gate.reason} onClose={gate.close} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
