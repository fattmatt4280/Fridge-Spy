import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, ShieldCheck, Users, Tag, Package, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  listPaddlePrices,
  updatePaddlePrice,
  listDiscounts,
  archiveDiscount,
  listUsersAdmin,
  setUserPremium,
  getAdminStats,
} from "@/lib/admin.functions";

type Env = "sandbox" | "live";
type Tab = "stats" | "products" | "discounts" | "users";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — FridgeSpy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading: checking } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("stats");
  const [env, setEnv] = useState<Env>("sandbox");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Admins only</h1>
        <p className="text-sm text-muted-foreground">You don't have access to this area.</p>
        <Link to="/app" className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/account" className="rounded-full p-1.5 hover:bg-surface">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="flex-1 text-base font-bold">Admin</h1>
        <select
          value={env}
          onChange={(e) => setEnv(e.target.value as Env)}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="sandbox">Test</option>
          <option value="live">Live</option>
        </select>
      </header>

      <nav className="grid grid-cols-4 gap-1 border-b border-border bg-surface/40 p-1">
        <TabBtn icon={<BarChart3 size={14} />} label="Stats" active={tab === "stats"} onClick={() => setTab("stats")} />
        <TabBtn icon={<Package size={14} />} label="Pricing" active={tab === "products"} onClick={() => setTab("products")} />
        <TabBtn icon={<Tag size={14} />} label="Discounts" active={tab === "discounts"} onClick={() => setTab("discounts")} />
        <TabBtn icon={<Users size={14} />} label="Users" active={tab === "users"} onClick={() => setTab("users")} />
      </nav>

      <div className="p-4">
        {tab === "stats" && <StatsTab />}
        {tab === "products" && <ProductsTab env={env} />}
        {tab === "discounts" && <DiscountsTab env={env} />}
        {tab === "users" && <UsersTab />}
      </div>
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatsTab() {
  const fn = useServerFn(getAdminStats);
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });
  if (isLoading) return <Spinner />;
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="Total users" value={data.totalUsers} />
      <Stat label="Premium users" value={data.premiumUsers} />
      <Stat label="Active subs (test)" value={data.activeSandboxSubs} />
      <Stat label="Active subs (live)" value={data.activeLiveSubs} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

function ProductsTab({ env }: { env: Env }) {
  const fn = useServerFn(listPaddlePrices);
  const updateFn = useServerFn(updatePaddlePrice);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-prices", env],
    queryFn: () => fn({ data: { environment: env } }),
  });
  const mut = useMutation({
    mutationFn: (vars: { priceId: string; amount: string }) =>
      updateFn({ data: { environment: env, priceId: vars.priceId, amount: vars.amount } }),
    onSuccess: () => {
      toast.success("Price updated");
      qc.invalidateQueries({ queryKey: ["admin-prices", env] });
    },
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  });

  if (isLoading) return <Spinner />;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Editing <strong>{env === "sandbox" ? "test" : "live"}</strong> prices. Amounts in USD.
      </p>
      {(data ?? []).map((p: any) => (
        <PriceRow key={p.id} price={p} onSave={(amt) => mut.mutate({ priceId: p.id, amount: amt })} saving={mut.isPending} />
      ))}
    </div>
  );
}

function PriceRow({ price, onSave, saving }: { price: any; onSave: (cents: string) => void; saving: boolean }) {
  const initial = (Number(price.unit_price.amount) / 100).toFixed(2);
  const [val, setVal] = useState(initial);
  const cycle = price.billing_cycle ? `/${price.billing_cycle.interval}` : " one-time";
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{price.import_meta?.external_id || price.id}</div>
          <div className="text-[10px] text-muted-foreground">{price.id}{cycle}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">$</span>
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-20 rounded-md border border-border bg-background px-2 py-1 text-right text-sm tabular-nums"
          />
          <button
            disabled={saving || val === initial}
            onClick={() => {
              const cents = Math.round(parseFloat(val) * 100);
              if (!Number.isFinite(cents) || cents < 1) return toast.error("Invalid amount");
              onSave(String(cents));
            }}
            className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscountsTab({ env }: { env: Env }) {
  const fn = useServerFn(listDiscounts);
  const archiveFn = useServerFn(archiveDiscount);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-discounts", env],
    queryFn: () => fn({ data: { environment: env } }),
  });
  const mut = useMutation({
    mutationFn: (id: string) => archiveFn({ data: { environment: env, discountId: id } }),
    onSuccess: () => {
      toast.success("Archived");
      qc.invalidateQueries({ queryKey: ["admin-discounts", env] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });
  if (isLoading) return <Spinner />;
  return (
    <div className="space-y-2">
      {(data ?? []).map((d: any) => (
        <div key={d.id} className="rounded-xl border border-border bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <code className="rounded bg-background px-1.5 py-0.5 text-xs font-bold">{d.code || "—"}</code>
                <span className={`text-[10px] uppercase ${d.status === "active" ? "text-green-500" : "text-muted-foreground"}`}>
                  {d.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground truncate">{d.description}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {d.type === "percentage" ? `${d.amount}% off` : `$${(Number(d.amount) / 100).toFixed(2)} off`}
                {d.recur && ` · recurs ${d.maximum_recurring_intervals ?? "forever"}`}
                {d.usage_limit && ` · ${d.times_used}/${d.usage_limit} used`}
              </div>
            </div>
            {d.status === "active" && (
              <button
                onClick={() => mut.mutate(d.id)}
                disabled={mut.isPending}
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-background"
              >
                Archive
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const fn = useServerFn(listUsersAdmin);
  const setPremiumFn = useServerFn(setUserPremium);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => fn({ data: { search: search || undefined, limit: 100 } }),
  });
  const mut = useMutation({
    mutationFn: (vars: { userId: string; premium: boolean }) => setPremiumFn({ data: vars }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });
  return (
    <div className="space-y-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email…"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      {isLoading ? (
        <Spinner />
      ) : (
        (data ?? []).map((u: any) => (
          <div key={u.id} className="rounded-xl border border-border bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{u.email}</div>
                <div className="text-[10px] text-muted-foreground">{u.id}</div>
                <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                  {u.profile?.premium_user && <span className="rounded bg-primary/20 px-1.5 py-0.5 text-primary">Premium</span>}
                  {u.subscriptions?.map((s: any) => (
                    <span key={`${s.price_id}-${s.environment}`} className="rounded bg-background px-1.5 py-0.5 text-muted-foreground">
                      {s.environment}:{s.price_id}:{s.status}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => mut.mutate({ userId: u.id, premium: !u.profile?.premium_user })}
                disabled={mut.isPending}
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-background"
              >
                {u.profile?.premium_user ? "Revoke Pro" : "Grant Pro"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}
