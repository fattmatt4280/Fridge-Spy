import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const PUBLIC_PREFIXES = ["/blog"];
const PUBLIC = new Set(["/", "/login", "/onboarding", "/pricing", "/privacy", "/terms", "/features", "/how-it-works", "/faq", "/about", "/blog"]);
const isPublicPath = (p: string) => PUBLIC.has(p) || PUBLIC_PREFIXES.some(pre => p.startsWith(pre + "/"));

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const path = useRouterState({ select: s => s.location.pathname });
  const search = useRouterState({ select: s => s.location.search });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading) return;
    // Authenticated users on the public landing → send to their app dashboard.
    if (user && path === "/") {
      navigate({ to: "/app", replace: true });
      return;
    }
    const guest = typeof window !== "undefined" && localStorage.getItem("fridgespy.guest") === "1";
    if (!user && !guest && !PUBLIC.has(path)) {
      navigate({ to: "/login", replace: true });
    }
  }, [user, loading, path, navigate]);

  // Handle Paddle checkout return: webhook may lag a few seconds — poll until premium flips.
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (params.get("checkout") !== "success" || !user) return;

    let cancelled = false;
    const toastId = toast.loading("Activating your subscription…");

    (async () => {
      for (let i = 0; i < 15 && !cancelled; i++) {
        const { data } = await supabase
          .from("profiles")
          .select("premium_user")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.premium_user) {
          await queryClient.invalidateQueries();
          toast.success("You're Pro! 🎉", { id: toastId });
          break;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
      if (!cancelled) {
        await queryClient.invalidateQueries();
        toast.dismiss(toastId);
      }
      // Clean the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.toString());
    })();

    return () => {
      cancelled = true;
      toast.dismiss(toastId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, search]);

  const isPublic = PUBLIC.has(path);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-primary/40" />
      </div>
    );
  }

  const widthClass = isPublic && !user ? "max-w-6xl" : "max-w-md";

  return (
    <div className={`mx-auto min-h-screen ${widthClass} bg-background pb-24`}>
      <PaymentTestModeBanner />
      <main>{children}</main>
      {!isPublic && user && <BottomNav />}
    </div>
  );
}
