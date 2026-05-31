import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui-fs/Logo";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/faq", label: "FAQ" },
  { to: "/blog", label: "Blog" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link to="/" aria-label="FridgeSpy home">
          <Logo />
        </Link>

        {/* Desktop nav */}
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

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20"
          >
            Sign in
          </Link>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground sm:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] border-border bg-background p-0">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <Logo size="sm" />
                  <SheetClose asChild>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                      aria-label="Close menu"
                    >
                      <X size={18} />
                    </button>
                  </SheetClose>
                </div>
                <nav className="flex-1 px-5 py-4">
                  <ul className="space-y-1">
                    {NAV_LINKS.map((l) => (
                      <li key={l.to}>
                        <SheetClose asChild>
                          <Link
                            to={l.to}
                            className="block rounded-xl px-3 py-3 text-base font-medium text-foreground hover:bg-surface"
                          >
                            {l.label}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="border-t border-border px-5 py-4">
                  <SheetClose asChild>
                    <Link
                      to="/login"
                      className="block w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      Sign in
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
