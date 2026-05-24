import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FREE_ITEM_CAP, FREE_RECIPE_PER_DAY, type LimitReason } from "@/lib/limits";

export function usePremium() {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading, isFetching: profileFetching } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("premium_user, display_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: itemCount = 0 } = useQuery({
    queryKey: ["item-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: recipesToday = 0 } = useQuery({
    queryKey: ["recipes-today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("kind", "recipe-gen")
        .gte("created_at", since.toISOString());
      return count ?? 0;
    },
  });

  const isPremium = !!profile?.premium_user;
  const itemsLeft = isPremium ? Infinity : Math.max(0, FREE_ITEM_CAP - itemCount);
  const recipesLeft = isPremium ? Infinity : Math.max(0, FREE_RECIPE_PER_DAY - recipesToday);

  return {
    isPremium,
    itemCount,
    itemsLeft,
    recipesToday,
    recipesLeft,
  };
}

/** Local helper that opens the upgrade modal for a given reason. */
export function useUpgradeGate() {
  const [reason, setReason] = useState<LimitReason | null>(null);
  const open = useCallback((r: LimitReason) => setReason(r), []);
  const close = useCallback(() => setReason(null), []);
  return { reason, open, close };
}
