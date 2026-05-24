import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getScanQuota } from "@/lib/scan.functions";
import { useAuth } from "@/hooks/useAuth";

export function useScanQuota() {
  const { user } = useAuth();
  const fn = useServerFn(getScanQuota);
  return useQuery({
    queryKey: ["scan-quota", user?.id],
    enabled: !!user,
    queryFn: () => fn(),
    staleTime: 30_000,
  });
}
