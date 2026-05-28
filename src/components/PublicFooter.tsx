import { Link } from "@tanstack/react-router";

export function PublicFooter() {
  return (
    <footer className="mt-12 border-t border-border px-5 py-8 text-xs text-muted-foreground">
      <nav className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span aria-hidden="true">·</span>
        <Link to="/features" className="hover:text-foreground">Features</Link>
        <span aria-hidden="true">·</span>
        <Link to="/how-it-works" className="hover:text-foreground">How it works</Link>
        <span aria-hidden="true">·</span>
        <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
        <span aria-hidden="true">·</span>
        <Link to="/faq" className="hover:text-foreground">FAQ</Link>
        <span aria-hidden="true">·</span>
        <Link to="/about" className="hover:text-foreground">About</Link>
        <span aria-hidden="true">·</span>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <span aria-hidden="true">·</span>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
      </nav>
      <p className="mt-4 text-center text-[11px] text-muted-foreground/80">
        © {new Date().getFullYear()} Dream Holdings LLC. FridgeSpy — AI kitchen inventory that helps you stop wasting food.
      </p>
    </footer>
  );
}
