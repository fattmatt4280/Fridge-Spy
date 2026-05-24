import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2, Lock } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scanReceipt } from "@/lib/claude.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isoDateInDays, categoryEmoji, suggestExpiryDays } from "@/lib/expiry";
import { toast } from "sonner";
import { usePremium, useUpgradeGate } from "@/hooks/usePremium";
import { UpgradeModal } from "@/components/UpgradeModal";

export const Route = createFileRoute("/scan-receipt")({
  head: () => ({ meta: [{ title: "Snap Receipt — FridgeSpy" }] }),
  component: ScanReceiptPage,
});

type Loc = "fridge" | "freezer" | "pantry";
type ParsedItem = {
  name: string;
  quantity: number;
  unit?: string;
  category?: string;
  estimated_expiry_days?: number;
  expiry_days?: number;
  emoji?: string;
  _keep?: boolean;
  _location?: Loc;
};

function guessLocation(category?: string, name?: string): Loc {
  const s = `${category ?? ""} ${name ?? ""}`.toLowerCase();
  if (/(frozen|ice cream|freezer)/.test(s)) return "freezer";
  if (/(bread|pasta|rice|cereal|can|snack|chip|cookie|flour|sugar|oil|spice|grain|bean|nut|coffee|tea)/.test(s)) return "pantry";
  return "fridge";
}

function ScanReceiptPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const scanFn = useServerFn(scanReceipt);
  const { isPremium } = usePremium();
  const gate = useUpgradeGate();

  const [preview, setPreview] = useState<string | null>(null);
  const [items, setItems] = useState<ParsedItem[] | null>(null);

  // Auto-open paywall for free users entering this premium-only screen.
  useEffect(() => { if (!isPremium) gate.open("receipt-scan"); /* eslint-disable-next-line */ }, [isPremium]);

  const scan = useMutation({
    mutationFn: async (file: File) => {
      const { base64, mediaType } = await fileToBase64(file);
      return await scanFn({ data: { imageBase64: base64, mediaType } });
    },
    onSuccess: (res) => {
      const arr = (res.items ?? []).map((i: any) => ({ ...i, _keep: true }));
      setItems(arr);
      if (arr.length === 0) toast.error("Couldn't find any items on that receipt.");
    },
    onError: (e: any) => toast.error(e.message ?? "Scan failed"),
  });

  function daysFor(i: ParsedItem) {
    return i.estimated_expiry_days ?? i.expiry_days ?? suggestExpiryDays(i.category, i.name);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!user || !items) return;
      const rows = items.filter(i => i._keep).map(i => ({
        user_id: user.id,
        name: i.name,
        category: i.category ?? null,
        emoji: i.emoji ?? categoryEmoji(i.name, i.category),
        quantity: i.quantity ?? 1,
        unit: i.unit ?? "each",
        location: "fridge",
        expiry_date: isoDateInDays(daysFor(i)),
      }));
      if (!rows.length) throw new Error("Nothing selected");
      const { error } = await supabase.from("items").insert(rows);
      if (error) throw error;
      await supabase.from("activity_log").insert({
        user_id: user.id, kind: "receipt", message: `Added ${rows.length} items from a receipt`,
      });
      return rows.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      toast.success(`Added ${n} items to inventory`);
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
        <h1 className="text-xl font-extrabold tracking-tight">Snap Receipt</h1>
      </div>

      {!isPremium && (
        <button onClick={() => gate.open("receipt-scan")}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 py-3 text-sm font-semibold text-primary">
          <Lock size={14}/> Receipt Scan is a Pro feature — Unlock
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />

      {!preview && (
        <div className="mt-4 flex flex-col items-center gap-4">
          <div className="aspect-[3/4] w-full max-w-xs rounded-3xl border-2 border-dashed border-border bg-surface/40 p-6 text-center">
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <span className="text-5xl">🧾</span>
              <p className="text-sm">Snap a clear photo of your grocery receipt.</p>
            </div>
          </div>
          <button onClick={() => isPremium ? fileRef.current?.click() : gate.open("receipt-scan")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20">
            {isPremium ? <><Camera size={18}/> Take or upload photo</> : <><Lock size={18}/> Unlock Receipt Scan</>}
          </button>
        </div>
      )}

      {preview && (
        <div className="mt-3">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
            <img src={preview} alt="receipt" className="max-h-64 w-full object-contain" />
            {scan.isPending && (
              <div className="scanning-shimmer absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold">
                  <Loader2 className="animate-spin text-primary" size={16}/>
                  FridgeSpy is reading your receipt...
                </div>
              </div>
            )}
          </div>

          {items && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Detected items ({keepCount})</h2>
                <button onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-primary">Retake</button>
              </div>
              <ul className="space-y-1.5">
                {items.map((it, idx) => (
                  <li key={idx} className="glass-card flex items-center gap-3 p-3">
                    <input type="checkbox" checked={!!it._keep}
                      onChange={e => setItems(arr => arr!.map((x,i)=>i===idx?{...x,_keep:e.target.checked}:x))}
                      className="h-5 w-5 accent-[color:var(--color-primary)]" />
                    <div className="text-2xl">{it.emoji ?? categoryEmoji(it.name, it.category)}</div>
                    <div className="flex-1">
                      <input value={it.name} onChange={e => setItems(arr=>arr!.map((x,i)=>i===idx?{...x,name:e.target.value}:x))}
                        className="w-full bg-transparent text-sm font-semibold outline-none" />
                      <div className="text-xs text-muted-foreground">{it.category ?? "—"} · expires in {daysFor(it)}d</div>
                    </div>
                    <input type="number" min={0} value={it.quantity} onChange={e=>setItems(arr=>arr!.map((x,i)=>i===idx?{...x,quantity:Number(e.target.value)}:x))}
                      className="w-14 rounded-md border border-border bg-background/40 px-2 py-1 text-center text-sm" />
                  </li>
                ))}
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
