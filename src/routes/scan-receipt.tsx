import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2, Lock, Split, Check, ChevronRight, ChevronLeft } from "lucide-react";
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
  _splits?: Array<{ location: Loc; quantity: number }>;
};

/**
 * Common-sense location guesser. Order matters — more specific keywords first.
 * Freezer beats fridge beats pantry on ambiguity. Beverages default to pantry
 * (cases of water/soda are usually stored, then moved to the fridge a few at a time).
 */
function guessLocation(category?: string, name?: string): Loc {
  const s = `${category ?? ""} ${name ?? ""}`.toLowerCase();

  // Freezer
  if (/(frozen|ice cream|popsicle|freezer|ice pack|frozen meal|frozen pizza|frozen veg)/.test(s)) return "freezer";

  // Pantry — shelf-stable
  if (/(canned|can of|jar|jarred|boxed|box of|mix|cereal|oat|granola|bar\b|pasta|noodle|ramen|rice|grain|quinoa|flour|sugar|salt|spice|seasoning|oil|vinegar|sauce|ketchup|mustard|mayo|peanut butter|jelly|jam|honey|syrup|chip|cracker|cookie|snack|candy|chocolate|nut\b|nuts|bean|lentil|coffee|tea bag|tea\b|water|soda|cola|pop\b|sparkling|gatorade|sports drink|juice box|powder|broth|stock|bread|bun|bagel|tortilla|baking)/.test(s)) return "pantry";

  // Default to fridge for everything else (dairy, eggs, meat, produce, deli, etc.)
  return "fridge";
}

/**
 * Heuristic: bulk beverage cases / multipacks that people commonly split between
 * the fridge (a few cold) and pantry (the rest stored for later).
 */
function isLikelySplit(it: ParsedItem): boolean {
  const s = `${it.category ?? ""} ${it.name ?? ""}`.toLowerCase();
  const bulky = /(water|soda|cola|pop\b|beer|seltzer|sparkling|gatorade|juice box|la croix|coke|pepsi|sprite|can\b|bottle|pack|case)/.test(s);
  return bulky && (it.quantity ?? 1) >= 4;
}

function suggestSplit(it: ParsedItem): Array<{ location: Loc; quantity: number }> {
  const q = Math.max(2, Math.floor(it.quantity || 1));
  const fridge = Math.min(q - 1, Math.max(2, Math.round(q * 0.25)));
  return [
    { location: "fridge", quantity: fridge },
    { location: "pantry", quantity: q - fridge },
  ];
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
  const [wizardIdx, setWizardIdx] = useState<number | null>(null);

  useEffect(() => { if (!isPremium) gate.open("receipt-scan"); /* eslint-disable-next-line */ }, [isPremium]);

  const scan = useMutation({
    mutationFn: async (file: File) => {
      const { base64, mediaType } = await fileToBase64(file);
      return await scanFn({ data: { imageBase64: base64, mediaType } });
    },
    onSuccess: (res) => {
      const arr = (res.items ?? []).map((i: any) => ({
        ...i,
        _keep: true,
        _location: guessLocation(i.category, i.name) as Loc,
      }));
      setItems(arr);
      if (arr.length === 0) toast.error("Couldn't find any items on that receipt.");
    },
    onError: (e: any) => toast.error(e.message ?? "Scan failed"),
  });

  function daysFor(i: ParsedItem) {
    return i.estimated_expiry_days ?? i.expiry_days ?? suggestExpiryDays(i.category, i.name);
  }

  function setAllLocations(loc: Loc) {
    setItems(arr => arr?.map(x => ({ ...x, _location: loc, _splits: undefined })) ?? null);
  }

  function updateItem(idx: number, patch: Partial<ParsedItem>) {
    setItems(arr => arr!.map((x, i) => i === idx ? { ...x, ...patch } : x));
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!user || !items) return;
      const rows: any[] = [];
      for (const i of items) {
        if (!i._keep) continue;
        const baseExpiry = daysFor(i);
        const emoji = i.emoji ?? categoryEmoji(i.name, i.category);
        if (i._splits && i._splits.length) {
          for (const s of i._splits) {
            if (s.quantity <= 0) continue;
            rows.push({
              user_id: user.id,
              name: i.name,
              category: i.category ?? null,
              emoji,
              quantity: s.quantity,
              unit: i.unit ?? "each",
              location: s.location,
              expiry_date: isoDateInDays(suggestExpiryDays(i.category, i.name, s.location) || baseExpiry),
            });
          }
        } else {
          const loc = i._location ?? "fridge";
          rows.push({
            user_id: user.id,
            name: i.name,
            category: i.category ?? null,
            emoji,
            quantity: i.quantity ?? 1,
            unit: i.unit ?? "each",
            location: loc,
            expiry_date: isoDateInDays(suggestExpiryDays(i.category, i.name, loc) || baseExpiry),
          });
        }
      }
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
    setWizardIdx(null);
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
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Auto-organized ({keepCount})</h2>
                <button onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-primary">Retake</button>
              </div>

              <button
                onClick={() => setWizardIdx(0)}
                className="mb-3 flex w-full items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-left">
                <div>
                  <div className="text-sm font-bold text-primary">Review one by one</div>
                  <div className="text-[11px] text-muted-foreground">Confirm each item, split cases between fridge & pantry</div>
                </div>
                <ChevronRight size={18} className="text-primary" />
              </button>

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
                {items.map((it, idx) => (
                  <li key={idx} className="glass-card flex flex-col gap-2 p-3">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={!!it._keep}
                        onChange={e => updateItem(idx, { _keep: e.target.checked })}
                        className="h-5 w-5 accent-[color:var(--color-primary)]" />
                      <div className="text-2xl">{it.emoji ?? categoryEmoji(it.name, it.category)}</div>
                      <div className="flex-1">
                        <input value={it.name} onChange={e => updateItem(idx, { name: e.target.value })}
                          className="w-full bg-transparent text-sm font-semibold outline-none" />
                        <div className="text-xs text-muted-foreground">
                          {it._splits
                            ? it._splits.filter(s => s.quantity > 0).map(s => `${s.quantity} ${s.location}`).join(" · ")
                            : `${it.category ?? "—"} · expires in ${daysFor(it)}d`}
                        </div>
                      </div>
                      <input type="number" min={0} value={it.quantity} onChange={e=>updateItem(idx, { quantity: Number(e.target.value), _splits: undefined })}
                        className="w-14 rounded-md border border-border bg-background/40 px-2 py-1 text-center text-sm" />
                    </div>
                    {!it._splits && (
                      <div className="grid grid-cols-3 gap-1 pl-8">
                        {(["fridge","freezer","pantry"] as const).map(l => (
                          <button key={l} type="button"
                            onClick={() => updateItem(idx, { _location: l })}
                            className={`rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider ${(it._location ?? "fridge")===l?"bg-primary text-primary-foreground":"border border-border bg-background/40 text-muted-foreground"}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    )}
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

      {items && wizardIdx !== null && (
        <ReviewWizard
          items={items}
          startIdx={wizardIdx}
          onUpdate={(idx, patch) => updateItem(idx, patch)}
          onClose={() => setWizardIdx(null)}
          onFinish={() => { setWizardIdx(null); save.mutate(); }}
        />
      )}

      <UpgradeModal reason={gate.reason} onClose={gate.close} />
    </div>
  );
}

function ReviewWizard({
  items, startIdx, onUpdate, onClose, onFinish,
}: {
  items: ParsedItem[];
  startIdx: number;
  onUpdate: (idx: number, patch: Partial<ParsedItem>) => void;
  onClose: () => void;
  onFinish: () => void;
}) {
  const [i, setI] = useState(startIdx);
  const it = items[i];
  if (!it) return null;

  const isSplit = !!it._splits && it._splits.length > 0;
  const total = isSplit
    ? it._splits!.reduce((a, s) => a + (s.quantity || 0), 0)
    : it.quantity;

  function toggleSplit() {
    if (isSplit) onUpdate(i, { _splits: undefined });
    else onUpdate(i, { _splits: suggestSplit(it) });
  }

  function setSplitQty(loc: Loc, qty: number) {
    const next = (it._splits ?? []).map(s => s.location === loc ? { ...s, quantity: Math.max(0, qty) } : s);
    onUpdate(i, { _splits: next });
  }

  function next() {
    if (i + 1 >= items.length) onFinish();
    else setI(i + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl border border-border bg-surface p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={onClose} className="text-xs font-semibold text-muted-foreground">Close</button>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{i + 1} / {items.length}</div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="text-4xl">{it.emoji ?? categoryEmoji(it.name, it.category)}</div>
          <div className="flex-1">
            <input value={it.name} onChange={e => onUpdate(i, { name: e.target.value })}
              className="w-full bg-transparent text-lg font-extrabold outline-none" />
            <div className="text-xs text-muted-foreground">{it.category ?? "—"}</div>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-2 py-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qty</span>
            <input type="number" min={0} value={total}
              onChange={e => {
                const q = Number(e.target.value);
                if (isSplit) {
                  // keep current first row, dump remainder into second
                  const first = it._splits![0];
                  const second = it._splits![1] ?? { location: "pantry" as Loc, quantity: 0 };
                  const firstQ = Math.min(first.quantity, q);
                  onUpdate(i, { _splits: [{ ...first, quantity: firstQ }, { ...second, quantity: Math.max(0, q - firstQ) }] });
                } else {
                  onUpdate(i, { quantity: q });
                }
              }}
              className="w-14 bg-transparent text-center text-base font-bold outline-none" />
          </label>
        </div>

        {!isSplit ? (
          <>
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Where does it go?</div>
            <div className="grid grid-cols-3 gap-2">
              {(["fridge","freezer","pantry"] as const).map(l => (
                <button key={l} onClick={() => onUpdate(i, { _location: l })}
                  className={`rounded-xl py-3 text-xs font-bold uppercase tracking-wider ${(it._location ?? "fridge")===l?"bg-primary text-primary-foreground":"border border-border bg-background/40 text-muted-foreground"}`}>
                  {l}
                </button>
              ))}
            </div>
            {(it.quantity ?? 1) >= 2 && (
              <button onClick={toggleSplit}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/40 py-2.5 text-xs font-semibold text-foreground">
                <Split size={14}/> Split between locations
                {isLikelySplit(it) && <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">Suggested</span>}
              </button>
            )}
          </>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Split across locations</div>
              <button onClick={toggleSplit} className="text-[11px] font-semibold text-muted-foreground underline">Undo split</button>
            </div>
            <div className="space-y-2">
              {(["fridge","freezer","pantry"] as const).map(l => {
                const row = it._splits!.find(s => s.location === l);
                const qty = row?.quantity ?? 0;
                return (
                  <div key={l} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3">
                    <div className="flex-1 text-xs font-bold uppercase tracking-wider">{l}</div>
                    <button onClick={() => setSplitQty(l, qty - 1)} className="rounded-md border border-border px-2 py-0.5 text-sm">−</button>
                    <div className="w-8 text-center text-base font-bold">{qty}</div>
                    <button onClick={() => {
                      if (!row) {
                        onUpdate(i, { _splits: [...(it._splits ?? []), { location: l, quantity: 1 }] });
                      } else {
                        setSplitQty(l, qty + 1);
                      }
                    }} className="rounded-md border border-border px-2 py-0.5 text-sm">+</button>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-right text-[11px] text-muted-foreground">
              Total: {it._splits!.reduce((a,s)=>a+s.quantity,0)} of {it.quantity}
            </div>
          </>
        )}

        <div className="mt-5 flex items-center gap-2">
          <button
            disabled={i === 0}
            onClick={() => setI(Math.max(0, i - 1))}
            className="flex items-center gap-1 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm font-semibold disabled:opacity-40">
            <ChevronLeft size={16}/> Back
          </button>
          <button
            onClick={() => { onUpdate(i, { _keep: false }); next(); }}
            className="rounded-xl border border-border bg-background/40 px-3 py-3 text-xs font-semibold text-muted-foreground">
            Skip
          </button>
          <button onClick={next}
            className="ml-auto flex items-center gap-1 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
            {i + 1 >= items.length ? <><Check size={16}/> Save all</> : <>Next <ChevronRight size={16}/></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// Claude's vision API caps base64 image payloads at ~5 MB. iPhone photos easily
// exceed that, so we always downscale + re-encode as JPEG before sending.
async function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  const { blob, mediaType } = await compressImage(file, { maxDim: 2000, maxBytes: 4_500_000 });
  const arr = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(arr.subarray(i, i + chunk)) as any);
  }
  return { base64: btoa(bin), mediaType };
}

async function compressImage(
  file: File,
  opts: { maxDim: number; maxBytes: number },
): Promise<{ blob: Blob; mediaType: string }> {
  const bitmap = await createImageBitmap(await fileToImageBlob(file));
  let { width, height } = bitmap;
  const scale = Math.min(1, opts.maxDim / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  let quality = 0.85;
  let blob: Blob | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, width, height);
    blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) break;
    // base64 inflates size by ~4/3, so target raw bytes ≈ maxBytes * 3/4
    if (blob.size * 1.37 < opts.maxBytes) break;
    if (attempt < 3) quality -= 0.15;
    else { width = Math.round(width * 0.8); height = Math.round(height * 0.8); }
  }
  if (!blob) throw new Error("Could not process image");
  return { blob, mediaType: "image/jpeg" };
}

async function fileToImageBlob(file: File): Promise<Blob> {
  // HEIC/unknown types: createImageBitmap may still handle, otherwise fall through.
  return file;
}
