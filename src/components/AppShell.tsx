import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";

const PUBLIC = new Set(["/login", "/onboarding"]);

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const path = useRouterState({ select: s => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user && !PUBLIC.has(path)) {
      navigate({ to: "/login", replace: true });
    }
  }, [user, loading, path, navigate]);

  const isPublic = PUBLIC.has(path);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-primary/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      {children}
      {!isPublic && user && <BottomNav />}
    </div>
  );
}
