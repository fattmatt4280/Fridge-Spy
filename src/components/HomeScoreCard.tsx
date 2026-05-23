import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScoreRing } from "@/components/ScoreRing";
import { daysUntil } from "@/lib/expiry";

const WEEK_MS = 7 * 86400000;
const AVG_ITEM_VALUE = 2.5;

export function HomeScoreCard() {
  const { user } = useAuth();

  const { data: items = [] } = useQuery({
    queryKey: ["score-items", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("items").select("*")).data ?? [],
  });
  const { data: shopping = [] } = useQuery({
    queryKey: ["score-shopping", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("shopping_list").select("id,created_at")).data ?? [],
  });
  const { data: recipes = [] } = useQuery({
    queryKey: ["score-recipes", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("recipes").select("id,saved_date")).data ?? [],
  });
  const { data: activity = [] } = useQuery({
    queryKey: ["score-activity", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("activity_log").select("kind,message,created_at").order("created_at",{ascending:false}).limit(100)).data ?? [],
  });

  const { score, saved, savedDollars, streak } = useMemo(() => {
    const now = Date.now();
    const within = (d?: string | null) => !!d && now - new Date(d).getTime() < WEEK_MS;

    const expiredEver = items.some(i => {
      const d = daysUntil(i.expiry_date);
      return d !== null && d < 0;
    });
    const allHaveExpiry = items.length > 0 && items.every(i => !!i.expiry_date);
    const usedShopping = shopping.length > 0 || activity.some(a => a.kind === "shopping" && within(a.created_at));
    const recipesThisWeek = recipes.filter(r => within(r.saved_date)).length > 0;
    const itemsAddedThisWeek = items.filter(i => within(i.added_date as any)).length > 0;

    let s = 0;
    if (!expiredEver) s += 40;
    if (allHaveExpiry) s += 20;
    if (usedShopping) s += 10;
    if (recipesThisWeek) s += 15;
    if (itemsAddedThisWeek) s += 15;

    // Waste saved proxy: items added in the last week that are still fresh.
    const saved = items.filter(i => {
      if (!within(i.added_date as any)) return false;
      const d = daysUntil(i.expiry_date);
      return d === null || d >= 0;
    }).length;

    // Streak: consecutive days (ending today) with no item that expired on that day.
    const expiredDays = new Set(
      items
        .map(i => i.expiry_date)
        .filter(Boolean)
        .map(d => {
          const dt = new Date(d as string);
          const diff = Math.floor((Date.now() - dt.getTime()) / 86400000);
          return diff >= 0 ? diff : -1;
        })
        .filter(n => n >= 0)
    );
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      if (expiredDays.has(i)) break;
      streak++;
    }

    return { score: s, saved, savedDollars: (saved * AVG_ITEM_VALUE).toFixed(2), streak };
  }, [items, shopping, recipes, activity]);

  return (
    <>
      <section className="glass-card mt-3 flex items-center gap-4 p-5">
        <ScoreRing score={score} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Kitchen Score</div>
          <div className="mt-1 text-sm text-foreground/90">Based on this week's activity</div>
          <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
            <li>+40 no expired items</li>
            <li>+20 all items dated · +15 added this week</li>
            <li>+15 recipes · +10 shopping list</li>
          </ul>
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-primary/20 bg-primary/8 p-4" style={{ background: "color-mix(in oklab, var(--color-primary) 8%, transparent)" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <div>🌱 <span className="font-semibold">{saved}</span> items saved from expiring this week</div>
            <div className="mt-0.5 text-xs text-muted-foreground">💰 Est. <span className="font-semibold text-primary">${savedDollars}</span> saved</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-background/40 px-3 py-1.5 text-xs font-bold">
            <Flame size={14} className="text-warning" />
            <span className="tabular-nums">{streak}</span><span className="text-muted-foreground">d streak</span>
          </div>
        </div>
      </section>
    </>
  );
}
