import { useState } from "react";
import { X, Check, Sparkles } from "lucide-react";
import { PREMIUM_FEATURES, REASON_COPY, type LimitReason } from "@/lib/limits";
import { toast } from "sonner";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useAuth } from "@/hooks/useAuth";

type Plan = "monthly" | "yearly" | "lifetime";

const PLAN_PRICE_ID: Record<Plan, string> = {
  monthly: "pro_monthly",
  yearly: "pro_yearly",
  lifetime: "pro_lifetime",
};

export function UpgradeModal({
  reason,
  onClose,
}: {
  reason: LimitReason | null;
  onClose: () => void;
}) {
  const [plan, setPlan] = useState<Plan>("yearly");
  const { openCheckout, loading } = usePaddleCheckout();
  const { user } = useAuth();
  if (!reason) return null;
  const copy = REASON_COPY[reason];

  async function startCheckout() {
    try {
      await openCheckout({
        priceId: PLAN_PRICE_ID[plan],
        customerEmail: user?.email,
        userId: user?.id,
      });
    } catch (e: any) {
      toast.error(e?.message || "Couldn't start checkout");
    }
  }

  const ctaLabel =
    plan === "lifetime"
      ? "Get Lifetime — $79"
      : "Start 7-Day Free Trial";

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl p-[1.5px]"
        style={{ background: "linear-gradient(135deg, var(--color-primary), oklch(0.78 0.13 195) 50%, var(--color-primary))" }}
      >
        <div className="rounded-[calc(1.5rem-1.5px)] bg-surface p-6 pt-7">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-background/40 hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Sparkles size={11} /> FridgeSpy Pro
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold leading-tight">{copy.title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{copy.sub}</p>

          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-sm">
            <span className="font-bold text-primary">The average Pro user saves $47/month</span>
            <span className="text-muted-foreground"> in food waste.</span>
          </div>

          <ul className="mt-4 space-y-2">
            {PREMIUM_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {/* Pricing toggle */}
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-background/40 p-1.5">
            <PlanPill active={plan === "monthly"} onClick={() => setPlan("monthly")} title="Monthly" price="$4.99" unit="/mo" />
            <PlanPill active={plan === "yearly"} onClick={() => setPlan("yearly")} title="Yearly" price="$34.99" unit="/yr" badge="Save 42%" />
            <PlanPill active={plan === "lifetime"} onClick={() => setPlan("lifetime")} title="Lifetime" price="$79" unit=" once" badge="Founder" />
          </div>

          {plan === "lifetime" && (
            <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wider text-primary">
              Founding Member price · locks in forever
            </p>
          )}

          <button
            onClick={startCheckout}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Opening checkout…" : ctaLabel}
          </button>
          <button onClick={onClose} className="mt-2 w-full py-2 text-center text-sm text-muted-foreground hover:text-foreground">
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanPill({
  active, onClick, title, price, unit, badge,
}: { active: boolean; onClick: () => void; title: string; price: string; unit: string; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl px-2 py-2.5 text-left transition ${
        active ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{title}</div>
      <div className="mt-0.5">
        <span className="text-base font-extrabold tabular-nums">{price}</span>
        <span className="text-[10px] opacity-80">{unit}</span>
      </div>
      {badge && (
        <span className={`absolute -top-2 right-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${active ? "bg-background/30" : "bg-primary text-primary-foreground"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
