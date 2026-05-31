import { useRef, useState } from "react";
import { Camera, Loader2, Lock } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { scanExpiryLabel } from "@/lib/scan.functions";
import { usePremium, useUpgradeGate } from "@/hooks/usePremium";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useAuth } from "@/hooks/useAuth";
import { UpgradeModal } from "@/components/UpgradeModal";
import { toast } from "sonner";

async function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  const arr = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  const base64 = btoa(bin);
  const mediaType = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) ? file.type : "image/jpeg";
  return { base64, mediaType };
}

export function ScanExpiryButton({ onDate, className = "" }: {
  onDate: (iso: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const scan = useServerFn(scanExpiryLabel);
  const { isPremium } = usePremium();
  const gate = useUpgradeGate();
  const { user } = useAuth();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [outOfQuota, setOutOfQuota] = useState(false);

  async function buyPack() {
    try {
      await openCheckout({
        priceId: "scan_pack_100",
        customerEmail: user?.email,
        userId: user?.id,
        successUrl: `${window.location.origin}/account?pack=success`,
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Couldn't open checkout");
    }
  }

  async function handle(file: File) {
    try {
      setBusy(true);
      const { base64, mediaType } = await fileToBase64(file);
      const res = await scan({ data: { imageBase64: base64, mediaType } });

      if ("error" in res) {
        if (res.error === "upgrade_required") {
          gate.open("fridge-scan");
          return;
        }
        if (res.error === "quota_exceeded") {
          setOutOfQuota(true);
          toast.error("You've used all your scans for this billing cycle.");
          return;
        }
        if (res.error === "rate_limited") {
          toast.error("Too many requests. Try again in a moment.");
          return;
        }
        if (res.error === "credits_exhausted") {
          toast.error("Scan service temporarily unavailable.");
          return;
        }
      } else if (res.ok) {
        qc.invalidateQueries({ queryKey: ["usage"] });
        if (res.expiry_date && /^\d{4}-\d{2}-\d{2}$/.test(res.expiry_date)) {
          onDate(res.expiry_date);
          toast.success(`Found ${res.kind?.replace("_", " ") ?? "date"}: ${res.expiry_date}${res.raw ? ` ("${res.raw}")` : ""}`);
        } else {
          toast.error("Couldn't read a date. Try a closer, well-lit shot.");
        }
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  function onClick() {
    if (!isPremium) {
      gate.open("fridge-scan");
      return;
    }
    if (outOfQuota) {
      buyPack();
      return;
    }
    ref.current?.click();
  }

  const locked = !isPremium;

  return (
    <>
      <input ref={ref} type="file" accept="image/*" capture="environment" hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
      <button type="button" onClick={onClick} disabled={busy || checkoutLoading}
        className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-60 ${
          locked
            ? "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-300"
            : outOfQuota
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-surface"
        } ${className}`}>
        {busy ? <Loader2 size={14} className="animate-spin text-primary" /> :
         locked ? <Lock size={14} /> :
         <Camera size={14} className="text-primary" />}
        {busy ? "Reading…" :
         locked ? "Scan (Pro)" :
         outOfQuota ? "Buy 100 more · $1" :
         "Scan label"}
      </button>
      <UpgradeModal reason={gate.reason} onClose={gate.close} />
    </>
  );
}
