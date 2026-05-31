import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3 } from "lucide-react";
import { getUsage, getUsageHistory } from "@/lib/usage.functions";
import { useAuth } from "@/hooks/useAuth";

export function UsageStatsCard() {
  const { user } = useAuth();
  const usageFn = useServerFn(getUsage);
  const histFn = useServerFn(getUsageHistory);

  const { data: usage } = useQuery({
    queryKey: ["usage", user?.id],
    enabled: !!user,
    queryFn: () => usageFn(),
  });
  const { data: hist } = useQuery({
    queryKey: ["usage-history", user?.id],
    enabled: !!user,
    queryFn: () => histFn(),
  });

  if (!usage?.isPremium) return null;

  const days = hist?.days ?? [];
  const max = Math.max(1, ...days.map(d => d.total));
  const weekCooked = days.reduce((s, d) => s + d.cooked, 0);
  const weekAdded = days.reduce((s, d) => s + d.added, 0);

  return (
    <section className="glass-card mt-4 p-5">
      <div className="flex items-center gap-2">
        <BarChart3 size={16} className="text-primary" />
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Pro stats · last 7 days
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="In fridge" value={usage.items.used} />
        <Stat label="Added" value={weekAdded} />
        <Stat label="Cooked" value={weekCooked} />
      </div>

      <div className="mt-4 flex h-16 items-end gap-1">
        {days.map(d => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-sm bg-primary/70"
              style={{ height: `${(d.total / max) * 100}%`, minHeight: d.total > 0 ? 2 : 0 }}
              title={`${d.day}: ${d.total} actions`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        {days.map(d => (
          <span key={d.day}>{new Date(d.day).toLocaleDateString(undefined, { weekday: "narrow" })}</span>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 py-2">
      <div className="text-lg font-extrabold tabular-nums">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
