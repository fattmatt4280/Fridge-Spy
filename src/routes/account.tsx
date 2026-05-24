import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Sparkles, LogOut, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { createPortalSession } from "@/utils/payments.functions";
import { supabase } from "@/integrations/supabase/client";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "FridgeSpy — Account" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription, isActive, isLifetime, env } = useSubscription();
  const portalFn = useServerFn(createPortalSession);
  const [opening, setOpening] = useState(false);

  async function openPortal() {
    setOpening(true);
    try {
      const { url } = await portalFn({ data: { environment: env } });
      window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't open subscription portal");
    } finally {
      setOpening(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const planLabel = subscription
    ? subscription.price_id === "pro_lifetime"
      ? "Pro Lifetime"
      : subscription.price_id === "pro_yearly"
      ? "Pro Yearly"
      : subscription.price_id === "pro_monthly"
      ? "Pro Monthly"
      : "Pro"
    : "Free";

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <div>
      <PaymentTestModeBanner />
      <div className="px-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <header className="flex items-center gap-2 py-3">
          <Link to="/" className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-surface" aria-label="Back">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="text-lg font-bold">Account</h1>
        </header>

        <section className="glass-card p-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Signed in as</div>
          <div className="mt-1 text-base font-semibold">{user?.email || "Guest"}</div>
        </section>

        <section className="glass-card mt-4 p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Subscription</div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl font-extrabold">{planLabel}</div>
            <span className={`stat-pill ${isActive ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"}`}>
              {isActive ? (isLifetime ? "Lifetime" : subscription?.status) : "Inactive"}
            </span>
          </div>
          {subscription?.cancel_at_period_end && periodEnd && (
            <p className="mt-2 text-xs text-muted-foreground">Cancels on {periodEnd}.</p>
          )}
          {!subscription?.cancel_at_period_end && periodEnd && !isLifetime && (
            <p className="mt-2 text-xs text-muted-foreground">Renews on {periodEnd}.</p>
          )}

          {subscription && !isLifetime ? (
            <button
              onClick={openPortal}
              disabled={opening}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/40 py-3 text-sm font-semibold transition hover:border-primary/40 disabled:opacity-60"
            >
              {opening ? "Opening…" : "Manage subscription"}
              <ExternalLink size={14} />
            </button>
          ) : !subscription ? (
            <Link
              to="/"
              className="mt-4 block w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground"
            >
              Upgrade to Pro
            </Link>
          ) : null}
        </section>

        <button
          onClick={signOut}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}
