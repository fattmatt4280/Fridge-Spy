import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin } from "@/lib/admin.functions";

export function useIsAdmin() {
  const { user } = useAuth();
  const fn = useServerFn(checkIsAdmin);
  const { data, isLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: () => fn(),
  });
  return { isAdmin: !!data?.isAdmin, isLoading };
}
