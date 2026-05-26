import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, LogOut, ChefHat } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { daysUntil, expiryLabel, categoryEmoji } from "@/lib/expiry";
import { toast } from "sonner";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Alerts — FridgeSpy" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [digestTime, setDigestTime] = useState("08:00");
  const [threshold, setThreshold] = useState(5);
  const [lowStock, setLowStock] = useState(true);
  const [weekly, setWeekly] = useState(true);

  const { data: activity = [] } = useQuery({
    queryKey: ["activity", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("activity_log").select("*").order("created_at",{ascending:false}).limit(30)).data ?? [],
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("items").select("*").order("expiry_date", { ascending: true, nullsFirst: false })).data ?? [],
  });
  const expiringSoon = items.filter(i => {
    const d = daysUntil(i.expiry_date);
    return d !== null && d <= 5;
  }).slice(0, 8);

  async function requestPush() {
    if (!("Notification" in window)) return toast.error("Notifications unsupported");
    const res = await Notification.requestPermission();
    if (res === "granted") toast.success("Notifications enabled");
    else toast.error("Permission denied");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-8">
      <div className="flex items-center gap-3 py-3">
        <button onClick={() => history.back()} className="rounded-full p-2 hover:bg-surface"><ArrowLeft size={20}/></button>
        <h1 className="text-xl font-extrabold tracking-tight">Alerts</h1>
      </div>

      <div className="glass-card mb-4 p-4">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-primary/15 p-2 text-primary"><Bell size={18}/></span>
          <div className="flex-1">
            <div className="font-semibold">Notifications</div>
            <div className="text-xs text-muted-foreground">Enable on this device.</div>
          </div>
          <button onClick={requestPush} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Enable</button>
        </div>
      </div>

      <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Preferences</h2>
      <div className="glass-card divide-y divide-border">
        <Row label="Daily expiry digest"><input type="time" value={digestTime} onChange={e=>setDigestTime(e.target.value)} className="rounded-md border border-border bg-background/50 px-2 py-1 text-sm"/></Row>
        <Row label="Expiring soon threshold">
          <select value={threshold} onChange={e=>setThreshold(Number(e.target.value))} className="rounded-md border border-border bg-background/50 px-2 py-1 text-sm">
            {[3,5,7].map(n=><option key={n} value={n}>{n} days</option>)}
          </select>
        </Row>
        <Row label="Low stock alerts"><Toggle on={lowStock} onChange={setLowStock}/></Row>
        <Row label="Weekly waste report"><Toggle on={weekly} onChange={setWeekly}/></Row>
      </div>

      <div className="glass-card mt-5 p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">This week</div>
        <div className="mt-2 text-2xl font-extrabold text-primary">You saved 0 items from expiring</div>
        <div className="mt-1 text-xs text-muted-foreground">Keep using FridgeSpy to build your streak.</div>
      </div>

      {expiringSoon.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">Use these soon</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {expiringSoon.map(item => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl">{item.emoji || categoryEmoji(item.name, item.category)}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{expiryLabel(item.expiry_date)}</div>
                </div>
                <Link
                  to="/recipes"
                  search={{ focus: item.name }}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/25"
                >
                  <ChefHat size={12}/> Cook this
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">History</h2>
      {activity.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center text-sm text-muted-foreground">Nothing yet.</div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {activity.map(a => (
            <li key={a.id} className="px-4 py-3 text-sm">
              <div>{a.message}</div>
              <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}

      <button onClick={signOut} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-muted-foreground">
        <LogOut size={16}/> Sign out
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 px-4 py-3"><span className="text-sm">{label}</span>{children}</div>;
}
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean)=>void }) {
  return (
    <button onClick={() => onChange(!on)} className={`relative h-6 w-11 rounded-full transition ${on?"bg-primary":"bg-border"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on?"left-[22px]":"left-0.5"}`}/>
    </button>
  );
}
