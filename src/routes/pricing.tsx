import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, ChevronLeft } from "lucide-react";
import { PREMIUM_FEATURES } from "@/lib/limits";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — FridgeSpy Pro" },
      { name: "description", content: "Simple FridgeSpy Pro pricing: $4.99/month, $49.99/year, or $79 one-time Lifetime. Cut food waste, cook what you have, save on groceries." },
      { property: "og:title", content: "FridgeSpy Pro Pricing" },
      { property: "og:description", content: "$4.99/month, $49.99/year, or $79 Lifetime. 3-day free trial on subscriptions." },
      { property: "og:url", content: "https://fridgespy.com/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/pricing" }],
  }),
  component: PricingPage,
});

type PlanCard = {
  id: "monthly" | "yearly" | "lifetime";
  name: string;
  price: string;
  unit: string;
  blurb: string;
  badge?: string;
  highlight?: boolean;
};

const PLANS: PlanCard[] = [
  { id: "monthly", name: "Monthly", price: "$4.99", unit: "/month", blurb: "3-day free trial, then $4.99/month. Cancel anytime." },
  { id: "yearly", name: "Yearly", price: "$49.99", unit: "/year", blurb: "3-day free trial, then $49.99/year. Save 17% vs monthly.", badge: "Save 17%", highlight: true },
  { id: "lifetime", name: "Lifetime", price: "$79", unit: " once", blurb: "One-time payment. Lifetime access, no recurring charges.", badge: "Best deal" },
];

function PricingPage() {
  return (
    <div className="min-h-screen px-5 pb-16 pt-[max(env(safe-area-inset-top),1rem)]">
      <header className="flex items-center gap-2 py-3">
        <Link to="/" className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-surface" aria-label="Back">
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-lg font-bold">Pricing</h1>
      </header>

      <section className="mx-auto max-w-2xl">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            <Sparkles size={11} /> FridgeSpy Pro
          </span>
        </div>
        <h2 className="mt-3 text-center text-3xl font-extrabold leading-tight">Cut food waste. Save on groceries.</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Pick a plan that fits. All Pro plans unlock the same features.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-2xl border p-5 ${
                p.highlight ? "border-primary bg-primary/5" : "border-border bg-surface"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-2 right-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  {p.badge}
                </span>
              )}
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{p.name}</div>
              <div className="mt-2">
                <span className="text-3xl font-extrabold tabular-nums">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.unit}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{p.blurb}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">What's included</h3>
          <ul className="mt-3 space-y-2">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            to="/login"
            className="w-full max-w-xs rounded-xl bg-primary py-3.5 text-center text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.99]"
          >
            Get started
          </Link>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground max-w-md">
            Subscriptions auto-renew until canceled. Cancel anytime in Account. Payments processed by Paddle as Merchant of Record. 30-day money-back guarantee.
          </p>
          <p className="text-center text-[11px] text-muted-foreground">
            See our <Link to="/terms" className="underline">Terms</Link> and{" "}
            <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
