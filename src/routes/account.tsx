import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Sparkles, LogOut, ExternalLink, Camera, Trash2, ChefHat, ShieldCheck } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { createPortalSession } from "@/utils/payments.functions";
import { deleteAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useScanQuota } from "@/hooks/useScanQuota";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { CuisinePicker, DietaryEditor, EMPTY_PROFILE, type CookingProfile } from "@/components/CookingProfileEditor";
import { UsageStatsCard } from "@/components/UsageStatsCard";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — FridgeSpy" },
      { name: "description", content: "Manage your FridgeSpy account, cooking preferences, dietary restrictions, and subscription." },
      { property: "og:title", content: "Your FridgeSpy Account" },
      { property: "og:description", content: "Manage your FridgeSpy account, cooking preferences, and subscription." },
      { property: "og:url", content: "https://fridgespy.com/account" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/account" }],
  }),
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
  const { isAdmin } = useIsAdmin();
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
          <Link to="/app" className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-surface" aria-label="Back">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="text-lg font-bold">Account</h1>
        </header>

        <section className="glass-card p-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Signed in as</div>
          <div className="mt-1 text-base font-semibold">{user?.email || "Guest"}</div>
        </section>

        {isAdmin && (
          <Link
            to="/admin"
            className="mt-4 flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 p-4 transition hover:bg-primary/15"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-primary" />
              <div>
                <div className="text-sm font-bold">Admin panel</div>
                <div className="text-[11px] text-muted-foreground">Manage pricing, discounts & users</div>
              </div>
            </div>
            <ExternalLink size={14} className="text-muted-foreground" />
          </Link>
        )}

        <section className="glass-card mt-4 p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Subscription</div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl font-extrabold">{planLabel}</div>
            <span className={`stat-pill ${isActive ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"}`}>
              {statusLabel}
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
              to="/pricing"
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
                to="/pricing"
                className="mt-3 block w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground"
              >
                Upgrade to Pro
              </Link>
            </>
          )}
        </section>

        <UsageStatsCard />

        <CookingProfileSection userId={user?.id} />





        <button
          onClick={signOut}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <LogOut size={16} /> Sign out
        </button>

        {/* Danger zone */}
        <section className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-destructive">Danger zone</div>
          {!showDelete ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Permanently delete your account and all your data. This cannot be undone.
              </p>
              <button
                onClick={() => setShowDelete(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-background/40 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={16} /> Delete account
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm">
                This will permanently delete your account, inventory, shopping list, activity, and cancel any active subscription. <strong>This cannot be undone.</strong>
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Type <span className="text-destructive">DELETE</span> to confirm
              </p>
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-destructive"
                placeholder="DELETE"
                autoFocus
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-border bg-surface py-3 text-sm font-semibold disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting || deleteConfirm !== "DELETE"}
                  className="flex-1 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Permanently delete"}
                </button>
              </div>
            </>
          )}
        </section>

        <footer className="mt-8 mb-4 flex justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
        </footer>
      </div>
    </div>
  );
}

function CookingProfileSection({ userId }: { userId: string | undefined }) {
  const { data, refetch } = useQuery({
    queryKey: ["cooking-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("cuisines_liked, cuisines_learning, dietary_restrictions, avoid_ingredients, skill_level, typical_cook_time_min")
        .eq("user_id", userId!)
        .maybeSingle();
      return data;
    },
  });

  const [profile, setProfile] = useState<CookingProfile>(EMPTY_PROFILE);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setProfile({
        cuisines_liked: data.cuisines_liked ?? [],
        cuisines_learning: data.cuisines_learning ?? [],
        dietary_restrictions: data.dietary_restrictions ?? [],
        avoid_ingredients: data.avoid_ingredients ?? [],
        skill_level: (data.skill_level as any) ?? "comfortable",
        typical_cook_time_min: data.typical_cook_time_min ?? 30,
      });
      setDirty(false);
    }
  }, [data]);

  function update(next: CookingProfile) {
    setProfile(next);
    setDirty(true);
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(profile).eq("user_id", userId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Cooking profile saved");
    setDirty(false);
    refetch();
  }

  if (!userId) return null;

  return (
    <section className="glass-card mt-4 p-5">
      <div className="flex items-center gap-2">
        <ChefHat size={16} className="text-primary" />
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cooking profile</div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        FridgeSpy personalizes recipes based on this. Update anytime.
      </p>

      <div className="mt-5 space-y-6">
        <CuisinePicker
          title="Cuisines I love"
          value={profile.cuisines_liked}
          onChange={v => update({ ...profile, cuisines_liked: v })}
        />
        <CuisinePicker
          title="Want to learn"
          subtitle="We'll sneak in a new dish from these now and then."
          value={profile.cuisines_learning}
          onChange={v => update({ ...profile, cuisines_learning: v })}
        />
        <DietaryEditor profile={profile} onChange={update} />
      </div>

      <button
        onClick={save}
        disabled={!dirty || saving}
        className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
      </button>
    </section>
  );
}
