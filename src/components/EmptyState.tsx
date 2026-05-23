import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function EmptyState({
  emoji, title, body, action,
}: {
  emoji: string;
  title: string;
  body: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-8 text-center fade-in">
      <div className="text-5xl">{emoji}</div>
      <div className="mt-3 text-base font-bold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {action && (
        <Link to={action.to as any}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function SkeletonRow({ children }: { children?: ReactNode }) {
  return (
    <div className="glass-card flex items-center gap-3 p-3">
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-background/60" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded bg-background/60" />
        <div className="h-2.5 w-1/3 animate-pulse rounded bg-background/40" />
      </div>
      {children}
    </div>
  );
}
