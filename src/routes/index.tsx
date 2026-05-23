import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Camera, Receipt, Plus, ChefHat, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui-fs/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { daysUntil, expiryLabel, expiryStatus, categoryEmoji } from "@/lib/expiry";
import { HomeScoreCard } from "@/components/HomeScoreCard";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "FridgeSpy — The Spy Report" }] }),
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["items", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("expiry_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["activity", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const expiring = items.filter(i => {
    const d = daysUntil(i.expiry_date);
    return d !== null && d >= 0 && d <= 7;
  });
  const expired = items.filter(i => {
    const d = daysUntil(i.expiry_date);
    return d !== null && d < 0;
  });

  if (!user) return null;

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1rem)]">
      <header className="flex items-center justify-between py-3">
        <Logo />
        <Link to="/alerts" className="relative rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-surface" aria-label="Alerts">
          <Bell size={22} />
          {expired.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />}
        </Link>
      </header>

      {/* Summary card */}
      <section className="glass-card mt-2 p-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">The Spy Report</div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <SummaryStat value={items.length} label="tracked" tone="primary" />
          <SummaryStat value={expiring.length} label="expiring soon" tone="warning" />
          <SummaryStat value={expired.length} label="expired" tone="destructive" />
        </div>
      </section>

      {/* FridgeSpy Score + waste saved */}
      <HomeScoreCard />

      {/* Quick actions */}
      <section className="mt-4 grid grid-cols-3 gap-2">
        <QuickAction to="/scan-receipt" icon={<Receipt size={20} />} label="Snap Receipt" />
        <QuickAction to="/scan-fridge" icon={<Camera size={20} />} label="Scan Fridge" />
        <QuickAction to="/add" icon={<Plus size={20} />} label="Add Item" />
      </section>

      {/* Expiring Soon */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Expiring Soon</h2>
          <Link to="/inventory" className="text-xs font-semibold text-primary">See all</Link>
        </div>
        {expiring.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 px-4 py-8 text-center">
            <div className="text-3xl">✅</div>
            <div className="mt-2 text-sm font-bold">Nothing's expiring soon.</div>
            <div className="mt-1 text-xs text-muted-foreground">Nice work keeping your kitchen fresh! Check back after your next grocery run.</div>
          </div>
        ) : (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {expiring.map(item => {
              const status = expiryStatus(item.expiry_date);
              return (
                <div key={item.id} className="glass-card flex w-32 shrink-0 flex-col items-center p-3 text-center">
                  <div className="text-3xl">{item.emoji || categoryEmoji(item.name, item.category)}</div>
                  <div className="mt-2 line-clamp-1 text-sm font-semibold">{item.name}</div>
                  <div className={`stat-pill mt-1 ${status === "urgent" || status === "expired" ? "bg-destructive/15 text-destructive" : status === "soon" ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"}`}>
                    {expiryLabel(item.expiry_date)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tonight's Cook */}
      <Link
        to="/recipes"
        className="mt-6 flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-black/10 p-2"><ChefHat size={22} /></span>
          <div className="text-left">
            <div className="text-base font-bold">Tonight's Cook</div>
            <div className="text-xs opacity-90">Recipe from what's about to expire</div>
          </div>
        </div>
        <Sparkles size={20} />
      </Link>

      {/* Recent activity */}
      <section className="mt-7">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent activity</h2>
        {activity.length === 0 ? (
          <div className="text-sm text-muted-foreground">No activity yet. Add your first item.</div>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {activity.map(a => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div className="flex-1">
                  <div className="text-sm">{a.message}</div>
                  <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SummaryStat({ value, label, tone }: { value: number; label: string; tone: "primary" | "warning" | "destructive" }) {
  const color = tone === "primary" ? "text-primary" : tone === "warning" ? "text-warning" : "text-destructive";
  return (
    <div className="rounded-xl bg-background/40 p-3 text-center">
      <div className={`text-3xl font-extrabold tabular-nums ${color}`}>{value}</div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to as any}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface px-2 py-3 text-center text-xs font-semibold transition active:scale-95 hover:border-primary/40"
    >
      <span className="text-primary">{icon}</span>
      {label}
    </Link>
  );
}
