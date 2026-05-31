import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/ui-fs/Logo";

const NAV_LINKS = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/faq", label: "FAQ" },
  { to: "/blog", label: "Blog" },
];

export function PublicHeader() {
  return (
    <header className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link to="/" aria-label="FridgeSpy home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground sm:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hover:text-foreground"
              activeProps={{ className: "text-foreground font-semibold" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          to="/login"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
