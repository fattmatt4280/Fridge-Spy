import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { scanExpiryLabel } from "@/lib/claude.functions";
import { toast } from "sonner";

async function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  const arr = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  const base64 = btoa(bin);
  const mediaType = ["image/jpeg","image/png","image/webp","image/gif"].includes(file.type) ? file.type : "image/jpeg";
  return { base64, mediaType };
}

export function ScanExpiryButton({ onDate, className = "" }: {
  onDate: (iso: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const scan = useServerFn(scanExpiryLabel);
  const [busy, setBusy] = useState(false);

  async function handle(file: File) {
    try {
      setBusy(true);
      const { base64, mediaType } = await fileToBase64(file);
      const res = await scan({ data: { imageBase64: base64, mediaType } });
      if (res?.expiry_date && /^\d{4}-\d{2}-\d{2}$/.test(res.expiry_date)) {
        onDate(res.expiry_date);
        toast.success(`Found ${res.kind?.replace("_", " ") ?? "date"}: ${res.expiry_date}${res.raw ? ` (“${res.raw}”)` : ""}`);
      } else {
        toast.error("Couldn't read a date. Try a closer, well-lit shot — or enter manually.");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <>
      <input ref={ref} type="file" accept="image/*" capture="environment" hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
      <button type="button" onClick={() => ref.current?.click()} disabled={busy}
        className={`flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold disabled:opacity-60 ${className}`}>
        {busy ? <Loader2 size={14} className="animate-spin text-primary"/> : <Camera size={14} className="text-primary"/>}
        {busy ? "Reading…" : "Scan label"}
      </button>
    </>
  );
}
