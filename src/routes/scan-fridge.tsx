import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scanFridge } from "@/lib/claude.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { categoryEmoji, isoDateInDays, suggestExpiryDays } from "@/lib/expiry";
import { toast } from "sonner";

export const Route = createFileRoute("/scan-fridge")({
  head: () => ({ meta: [{ title: "Scan Fridge — FridgeSpy" }] }),
  component: ScanFridgePage,
});

type Detected = { name: string; brand?: string|null; quantity: number; unit?: string; category?: string; emoji?: string; confidence?: number; _keep?: boolean };

function ScanFridgePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const scanFn = useServerFn(scanFridge);

  const [preview, setPreview] = useState<string | null>(null);
  const [items, setItems] = useState<Detected[] | null>(null);

  const scan = useMutation({
    mutationFn: async (file: File) => {
      const { base64, mediaType } = await fileToBase64(file);
      return await scanFn({ data: { imageBase64: base64, mediaType } });
    },
    onSuccess: (res) => {
      const arr = (res.items ?? []).map((i: any) => ({ ...i, _keep: true }));
      setItems(arr);
      if (!arr.length) toast.error("No items detected. Try a clearer shot.");
    },
    onError: (e: any) => toast.error(e.message ?? "Scan failed"),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!user || !items) return;
      const rows = items.filter(i => i._keep).map(i => ({
        user_id: user.id,
        name: i.name,
        brand: i.brand ?? null,
        category: i.category ?? null,
        emoji: i.emoji ?? categoryEmoji(i.name, i.category),
        quantity: i.quantity ?? 1,
        unit: i.unit ?? "unit",
        location: "fridge",
        expiry_date: isoDateInDays(suggestExpiryDays(i.category, i.name)),
      }));
      if (!rows.length) throw new Error("Nothing selected");
      const { error } = await supabase.from("items").insert(rows);
      if (error) throw error;
      await supabase.from("activity_log").insert({
        user_id: user.id, kind: "fridge-scan", message: `Scanned fridge — added ${rows.length} items`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      toast.success("Items added");
      navigate({ to: "/inventory" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function onFile(f: File) {
    setPreview(URL.createObjectURL(f));
    setItems(null);
    scan.mutate(f);
  }

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
          <button onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20">
            <Camera size={18}/> Capture fridge photo
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
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Detected ({items.filter(i=>i._keep).length})</h2>
                <button onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-primary">Retake</button>
              </div>
              <ul className="space-y-1.5">
                {items.map((it, idx) => (
                  <li key={idx} className="glass-card flex items-center gap-3 p-3">
                    <input type="checkbox" checked={!!it._keep}
                      onChange={e => setItems(arr=>arr!.map((x,i)=>i===idx?{...x,_keep:e.target.checked}:x))}
                      className="h-5 w-5 accent-[color:var(--color-primary)]" />
                    <div className="text-2xl">{it.emoji ?? categoryEmoji(it.name, it.category)}</div>
                    <div className="flex-1">
                      <input value={it.name} onChange={e=>setItems(arr=>arr!.map((x,i)=>i===idx?{...x,name:e.target.value}:x))}
                        className="w-full bg-transparent text-sm font-semibold outline-none" />
                      <div className="text-xs text-muted-foreground">
                        {it.brand ?? "no brand"} · {Math.round((it.confidence ?? 0)*100)}% confident
                      </div>
                    </div>
                    <input type="number" min={0} value={it.quantity} onChange={e=>setItems(arr=>arr!.map((x,i)=>i===idx?{...x,quantity:Number(e.target.value)}:x))}
                      className="w-14 rounded-md border border-border bg-background/40 px-2 py-1 text-center text-sm" />
                  </li>
                ))}
              </ul>
              <button disabled={save.isPending} onClick={() => save.mutate()}
                className="mt-5 mb-6 w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60">
                {save.isPending ? "Adding..." : `Add ${items.filter(i=>i._keep).length} items`}
              </button>
            </div>
          )}
        </div>
      )}
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
