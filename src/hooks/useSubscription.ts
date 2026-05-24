import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";

export function useSubscription() {
  const { user } = useAuth();
  const env = getPaddleEnvironment();

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id, env],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const status = subscription?.status;
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).getTime()
    : null;
  const isLifetime = subscription?.price_id === "pro_lifetime" && status === "active";
  const isActive =
    isLifetime ||
    (status === "active" || status === "trialing" || status === "past_due") &&
      (!periodEnd || periodEnd > Date.now()) ||
    (status === "canceled" && !!periodEnd && periodEnd > Date.now());

  return { subscription, isActive: !!isActive, isLifetime, env };
}
