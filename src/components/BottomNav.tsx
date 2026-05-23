import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Package, Plus, ShoppingCart, ChefHat } from "lucide-react";

const tabs: { to: "/" | "/inventory" | "/add" | "/shopping" | "/recipes"; label: string; icon: typeof Home; primary?: boolean }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/add", label: "Add", icon: Plus, primary: true },
  { to: "/shopping", label: "Shop", icon: ShoppingCart },
  { to: "/recipes", label: "Cook", icon: ChefHat },
];

export function BottomNav() {
  const path = useRouterState({ select: s => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/70 pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabs.map(({ to, label, icon: Icon, primary }) => {
          const active = path === to;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {primary ? (
                  <span className="-mt-6 mb-0.5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                    <Icon size={24} strokeWidth={2.5} />
                  </span>
                ) : (
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                )}
                {!primary && <span>{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
