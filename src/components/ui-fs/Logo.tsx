import { Eye } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
        <Eye size={18} strokeWidth={2.6} />
      </span>
      <span className={`font-extrabold tracking-tight ${dims}`}>
        Fridge<span className="text-primary">Spy</span>
      </span>
    </div>
  );
}
