import { useUsageQuery } from "@/hooks/usePremium";

/**
 * Backed by the unified getUsage query. Shape preserved so existing
 * consumers (scan-receipt, scan-fridge, ScanExpiryButton, account) work
 * unchanged.
 */
export function useScanQuota() {
  const { data, isLoading, error, refetch } = useUsageQuery();
  return {
    data: data
      ? {
          paid: data.isPremium,
          used: data.scans.used,
          included: data.scans.included,
          bonus: data.scans.bonus,
          remaining: data.isPremium
            ? Math.max(0, data.scans.included + data.scans.bonus - data.scans.used)
            : 0,
          period_end: data.scans.period_end,
        }
      : undefined,
    isLoading,
    error,
    refetch,
  };
}
