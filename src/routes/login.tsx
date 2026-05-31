import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/ui-fs/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in to FridgeSpy" },
      { name: "description", content: "Sign in or create your FridgeSpy account to track your kitchen inventory, get expiry alerts, and generate recipes from what you already have." },
      { property: "og:title", content: "Sign in to FridgeSpy" },
      { property: "og:description", content: "Sign in or create a FridgeSpy account to start tracking your kitchen." },
      { property: "og:url", content: "https://fridgespy.com/login" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created. You're in!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/app", replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
  }

  async function onGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw new Error(result.error.message ?? "Google sign-in failed");
      if (result.redirected) return;
      navigate({ to: "/app", replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed");
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen px-6 pt-[max(env(safe-area-inset-top),3rem)]">
      <div className="mx-auto max-w-sm">
        <div className="flex justify-center pt-4"><Logo size="2xl" animated /></div>
        <h1 className="mt-6 text-center text-3xl font-extrabold tracking-tight">Sign in to FridgeSpy</h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">Know what's in your kitchen. Always.</p>

        <form onSubmit={onSubmit} className="mt-10 space-y-3">
          {mode === "signup" && (
            <Field label="Name">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary" />
            </Field>
          )}
          <Field label="Email">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary" />
          </Field>
          <Field label="Password">
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary" />
          </Field>
          <button
            disabled={loading}
            type="submit"
            className="mt-2 w-full rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={onGoogle}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface py-3.5 text-base font-semibold text-foreground transition hover:bg-muted active:scale-[0.99] disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setMode(m => m === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-center text-sm text-muted-foreground"
        >
          {mode === "signin" ? "No account? " : "Already have an account? "}
          <span className="font-semibold text-primary">{mode === "signin" ? "Sign up" : "Sign in"}</span>
        </button>

        <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
          <Link to="/features" className="text-muted-foreground hover:text-foreground">Features</Link>
          <span aria-hidden="true" className="text-muted-foreground/50">·</span>
          <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground">How it works</Link>
          <span aria-hidden="true" className="text-muted-foreground/50">·</span>
          <Link to="/pricing" className="font-semibold text-primary underline">Pricing</Link>
          <span aria-hidden="true" className="text-muted-foreground/50">·</span>
          <Link to="/faq" className="text-muted-foreground hover:text-foreground">FAQ</Link>
        </nav>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
          <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
