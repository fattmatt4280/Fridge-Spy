import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Sparkles, LogOut, ExternalLink, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { createPortalSession } from "@/utils/payments.functions";
import { deleteAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useScanQuota } from "@/hooks/useScanQuota";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "FridgeSpy — Account" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription, isActive, isLifetime, env } = useSubscription();
  const portalFn = useServerFn(createPortalSession);
  const deleteAccountFn = useServerFn(deleteAccount);
  const { data: quota } = useScanQuota();
  const { openCheckout, loading: buyingPack } = usePaddleCheckout();
  const [opening, setOpening] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function buyPack() {
    try {
      await openCheckout({
        priceId: "scan_pack_100",
        customerEmail: user?.email,
        userId: user?.id,
        successUrl: `${window.location.origin}/account?pack=success`,
      });
    } catch (e: any) {
      toast.error(e?.message || "Couldn't open checkout");
    }
  }

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

  async function confirmDelete() {
    if (deleteConfirm !== "DELETE") {
      toast.error("Type DELETE to confirm");
      return;
    }
    setDeleting(true);
    try {
      await deleteAccountFn();
      await supabase.auth.signOut();
      toast.success("Account deleted");
      navigate({ to: "/login", replace: true });
    } catch (e: any) {
      toast.error(e?.message || "Couldn't delete account");
      setDeleting(false);
    }
  }

  const statusLabel = (() => {
    if (!isActive) return "Inactive";
    if (isLifetime) return "Lifetime";
    switch (subscription?.status) {
      case "active": return "Active";
      case "trialing": return "Trial";
      case "past_due": return "Payment issue";
      case "paused": return "Paused";
      case "canceled": return "Canceling";
      default: return subscription?.status ?? "Active";
    }
  })();

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

        <section className="glass-card mt-4 p-5">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-primary" />
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Label scans</div>
          </div>
          {quota?.paid ? (
            <>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-xl font-extrabold">
                  {quota.remaining} <span className="text-sm font-medium text-muted-foreground">remaining</span>
                </div>
                <span className="stat-pill bg-primary/15 text-primary">
                  {quota.used} / {quota.included + quota.bonus} used
                </span>
              </div>
              {quota.bonus > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Includes {quota.bonus} bonus scans from add-on packs.</p>
              )}
              {quota.period_end && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Resets {new Date(quota.period_end).toLocaleDateString()}.
                </p>
              )}
              <button
                onClick={buyPack}
                disabled={buyingPack}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/40 py-3 text-sm font-semibold transition hover:border-primary/40 disabled:opacity-60"
              >
                {buyingPack ? "Opening…" : "Buy 100 more scans · $1"}
              </button>
            </>
          ) : (
            <>
              <div className="mt-2 text-sm text-muted-foreground">
                Label scanning is a Pro feature. Pro includes 100 scans per billing cycle, then $1 per additional 100.
              </div>
              <Link
                to="/"
                className="mt-3 block w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground"
              >
                Upgrade to Pro
              </Link>
            </>
          )}
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
