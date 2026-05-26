import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2, Lock } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scanFridge } from "@/lib/claude.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { categoryEmoji, isoDateInDays, suggestExpiryDays } from "@/lib/expiry";
import { toast } from "sonner";
import { usePremium, useUpgradeGate } from "@/hooks/usePremium";
import { UpgradeModal } from "@/components/UpgradeModal";

export const Route = createFileRoute("/scan-fridge")({
  head: () => ({
    meta: [
      { title: "Scan your fridge — FridgeSpy" },
      { name: "description", content: "Snap one photo of your fridge and let FridgeSpy's AI log every item it sees. The fastest way to set up your kitchen inventory." },
      { property: "og:title", content: "Scan your fridge with AI — FridgeSpy" },
      { property: "og:description", content: "Snap one photo and let AI log every item in your fridge." },
      { property: "og:url", content: "https://fridgespy.com/scan-fridge" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/scan-fridge" }],
  }),
  component: ScanFridgePage,
});

type Confidence = "high" | "medium" | "low";
type Loc = "fridge" | "freezer" | "pantry";
type Detected = {
  name: string;
  brand?: string | null;
  estimated_quantity?: number;
  quantity?: number;
  unit?: string;
  category?: string;
  emoji?: string;
  confidence?: Confidence | string | number;
  _keep?: boolean;
  _location?: Loc;
};

function guessLocation(category?: string, name?: string): Loc {
  const s = `${category ?? ""} ${name ?? ""}`.toLowerCase();
  if (/(frozen|ice cream|freezer)/.test(s)) return "freezer";
  if (/(bread|pasta|rice|cereal|can|snack|chip|cookie|flour|sugar|oil|spice|grain|bean|nut|coffee|tea)/.test(s)) return "pantry";
  return "fridge";
}

function normConfidence(c: Detected["confidence"]): Confidence {
  if (typeof c === "number") return c >= 0.75 ? "high" : c >= 0.5 ? "medium" : "low";
  const s = String(c ?? "").toLowerCase();
  if (s.startsWith("h")) return "high";
  if (s.startsWith("m")) return "medium";
  return "low";
}
function confBadge(c: Confidence) {
  return c === "high"
    ? "bg-primary/15 text-primary"
    : c === "medium"
    ? "bg-warning/15 text-warning"
    : "bg-destructive/15 text-destructive";
}

function ScanFridgePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const scanFn = useServerFn(scanFridge);
  const { isPremium, isPremiumLoading } = usePremium();
  const gate = useUpgradeGate();

  const [preview, setPreview] = useState<string | null>(null);
  const [items, setItems] = useState<Detected[] | null>(null);

  useEffect(() => { if (!isPremiumLoading && !isPremium) gate.open("fridge-scan"); /* eslint-disable-next-line */ }, [isPremium, isPremiumLoading]);

  const scan = useMutation({
    mutationFn: async (file: File) => {
      const { base64, mediaType } = await fileToBase64(file);
      return await scanFn({ data: { imageBase64: base64, mediaType } });
    },
    onSuccess: (res) => {
      const arr = (res.items ?? []).map((i: any) => ({ ...i, _keep: true, _location: guessLocation(i.category, i.name) as Loc }));
      setItems(arr);
      if (!arr.length) toast.error("No items detected. Try a clearer shot.");
    },
    onError: (e: any) => toast.error(e.message ?? "Scan failed"),
  });

  function setAllLocations(loc: Loc) {
    setItems(arr => arr?.map(x => ({ ...x, _location: loc })) ?? null);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!user || !items) return 0;
      const rows = items.filter(i => i._keep).map(i => ({
        user_id: user.id,
        name: i.name,
        brand: i.brand ?? null,
        category: i.category ?? null,
        emoji: i.emoji ?? categoryEmoji(i.name, i.category),
        quantity: i.estimated_quantity ?? i.quantity ?? 1,
        unit: i.unit ?? "each",
        location: i._location ?? "fridge",
        expiry_date: isoDateInDays(suggestExpiryDays(i.category, i.name)),
      }));
      if (!rows.length) throw new Error("Nothing selected");
      const { error } = await supabase.from("items").insert(rows);
      if (error) throw error;
      await supabase.from("activity_log").insert({
        user_id: user.id, kind: "fridge-scan", message: `Scanned fridge — added ${rows.length} items`,
      });
      return rows.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      toast.success(`Added ${n} items`);
      navigate({ to: "/inventory" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function onFile(f: File) {
    setPreview(URL.createObjectURL(f));
    setItems(null);
    scan.mutate(f);
  }

  const keepCount = items?.filter(i => i._keep).length ?? 0;

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1rem)]">
      <div className="flex items-center gap-3 py-3">
        <button onClick={() => history.back()} className="rounded-full p-2 hover:bg-surface"><ArrowLeft size={20}/></button>
        <h1 className="text-xl font-extrabold tracking-tight">Scan Fridge</h1>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />

      {!preview && (
        <div className="mt-4 flex flex-col items-center gap-4">
          <div className="relative aspect-[3/4] w-full max-w-xs overflow-hidden rounded-3xl border-2 border-dashed border-border bg-surface/40">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <span className="text-5xl">🥶</span>
              <p className="px-6 text-center text-sm">Point at your fridge shelf and tap capture.</p>
            </div>
          </div>
          <button onClick={() => isPremium ? fileRef.current?.click() : gate.open("fridge-scan")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20">
            {isPremium ? <><Camera size={18}/> Capture fridge photo</> : <><Lock size={18}/> Unlock Fridge Scan</>}
          </button>
        </div>
      )}

      {preview && (
        <div className="mt-3">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
            <img src={preview} alt="fridge" className="max-h-72 w-full object-cover" />
            {scan.isPending && (
              <div className="scanning-shimmer absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold">
                  <Loader2 className="animate-spin text-primary" size={16}/>
                  FridgeSpy is analyzing your fridge...
                </div>
              </div>
            )}
          </div>

          {items && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Detected ({keepCount})</h2>
                <button onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-primary">Retake</button>
              </div>
              <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-border bg-surface/60 p-1.5">
                <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Set all</span>
                {(["fridge","freezer","pantry"] as const).map(l => (
                  <button key={l} onClick={() => setAllLocations(l)}
                    className="flex-1 rounded-lg py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-background/60 hover:text-foreground">
                    {l}
                  </button>
                ))}
              </div>
              <ul className="space-y-1.5">
                {items.map((it, idx) => {
                  const conf = normConfidence(it.confidence);
                  return (
                    <li key={idx} className="glass-card flex flex-col gap-2 p-3">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={!!it._keep}
                          onChange={e => setItems(arr=>arr!.map((x,i)=>i===idx?{...x,_keep:e.target.checked}:x))}
                          className="h-5 w-5 accent-[color:var(--color-primary)]" />
                        <div className="text-2xl">{it.emoji ?? categoryEmoji(it.name, it.category)}</div>
                        <div className="min-w-0 flex-1">
                          <input value={it.name} onChange={e=>setItems(arr=>arr!.map((x,i)=>i===idx?{...x,name:e.target.value}:x))}
                            className="w-full bg-transparent text-sm font-semibold outline-none" />
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${confBadge(conf)}`}>{conf}</span>
                            <span className="truncate">{it.category ?? "—"}</span>
                          </div>
                        </div>
                        <input type="number" min={0}
                          value={it.estimated_quantity ?? it.quantity ?? 1}
                          onChange={e=>setItems(arr=>arr!.map((x,i)=>i===idx?{...x,estimated_quantity:Number(e.target.value),quantity:Number(e.target.value)}:x))}
                          className="w-14 rounded-md border border-border bg-background/40 px-2 py-1 text-center text-sm" />
                      </div>
                      <div className="grid grid-cols-3 gap-1 pl-8">
                        {(["fridge","freezer","pantry"] as const).map(l => (
                          <button key={l} type="button"
                            onClick={() => setItems(arr=>arr!.map((x,i)=>i===idx?{...x,_location:l}:x))}
                            className={`rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider ${(it._location ?? "fridge")===l?"bg-primary text-primary-foreground":"border border-border bg-background/40 text-muted-foreground"}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button disabled={save.isPending || keepCount === 0} onClick={() => save.mutate()}
                className="mt-5 mb-6 w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60">
                {save.isPending ? "Adding..." : `Add All ${keepCount} Items`}
              </button>
            </div>
          )}
        </div>
      )}

      <UpgradeModal reason={gate.reason} onClose={gate.close} />
    </div>
  );
}

async function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  const arr = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  const base64 = btoa(bin);
  const mediaType = ["image/jpeg","image/png","image/webp","image/gif"].includes(file.type) ? file.type : "image/jpeg";
  return { base64, mediaType };
}
