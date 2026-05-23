import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/ui-fs/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — FridgeSpy" }] }),
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
      navigate({ to: "/", replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-6 pt-[max(env(safe-area-inset-top),3rem)]">
      <div className="mx-auto max-w-sm">
        <div className="flex justify-center"><Logo size="lg" /></div>
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

        <button
          type="button"
          onClick={() => setMode(m => m === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-center text-sm text-muted-foreground"
        >
          {mode === "signin" ? "No account? " : "Already have an account? "}
          <span className="font-semibold text-primary">{mode === "signin" ? "Sign up" : "Sign in"}</span>
        </button>
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
