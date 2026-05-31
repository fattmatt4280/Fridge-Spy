import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { getUsage } from "@/lib/usage.functions";
import { useAuth } from "@/hooks/useAuth";
import { FREE_ITEM_CAP, FREE_RECIPE_PER_DAY, type LimitReason } from "@/lib/limits";

/** Single unified usage query. Backs both usePremium and useScanQuota. */
function useUsageQuery() {
  const { user } = useAuth();
  const fn = useServerFn(getUsage);
  return useQuery({
    queryKey: ["usage", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: () => fn(),
  });
}

export function usePremium() {
  const { user } = useAuth();
  const { data, isLoading, isFetching } = useUsageQuery();

  const isPremium = !!data?.isPremium;
  const itemCount = data?.items.used ?? 0;
  const recipesToday = data?.recipesToday.used ?? 0;
  const itemsLeft = isPremium ? Infinity : Math.max(0, FREE_ITEM_CAP - itemCount);
  const recipesLeft = isPremium ? Infinity : Math.max(0, FREE_RECIPE_PER_DAY - recipesToday);

  return {
    isPremium,
    isPremiumLoading: !!user && (isLoading || (data === undefined && isFetching)),
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

// Re-export so useScanQuota can share the exact same query (same key, one fetch).
export { useUsageQuery };
