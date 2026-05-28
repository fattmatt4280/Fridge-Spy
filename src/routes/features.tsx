import { createFileRoute, Link } from "@tanstack/react-router";
import { Receipt, Camera, Bell, ChefHat, Users, BarChart3 } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";

const FEATURES = [
  { icon: Receipt, title: "AI receipt scanning", body: "Snap a grocery receipt and FridgeSpy reads every item, quantity, and estimated expiry date — no typing." },
  { icon: Camera, title: "Fridge photo scanning", body: "Take one photo of an open fridge or pantry shelf and we identify everything visible automatically." },
  { icon: Bell, title: "Smart expiry alerts", body: "Get gentle reminders before food goes bad so nothing rots at the back of the shelf." },
  { icon: ChefHat, title: "Tonight's Cook recipes", body: "AI-generated recipes built from what's already in your kitchen and what's about to expire." },
  { icon: Users, title: "Household sharing", body: "Share one live inventory with up to 5 housemates so the whole house sees what's in stock." },
  { icon: BarChart3, title: "Waste & savings score", body: "Track how much food you save, your weekly waste, and your cook streak — gamified, not guilt-tripping." },
];

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — FridgeSpy AI Kitchen Inventory" },
      { name: "description", content: "FridgeSpy features: AI receipt scanning, fridge photo scanning, smart expiry alerts, recipes from what you have, household sharing, and a waste score." },
      { property: "og:title", content: "FridgeSpy Features — AI receipt + fridge scanning, expiry alerts, smart recipes" },
      { property: "og:description", content: "Everything FridgeSpy does to help you track your kitchen, cook from what you have, and stop wasting food." },
      { property: "og:url", content: "https://fridgespy.com/features" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/features" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "FridgeSpy",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web, iOS, Android",
        description: "AI-powered kitchen inventory app that tracks groceries, fridge contents, and expiry dates and suggests recipes from what you have.",
        url: "https://fridgespy.com/features",
        featureList: FEATURES.map(f => f.title).join(", "),
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free to start. Pro from $4.99/month.",
          url: "https://fridgespy.com/pricing",
        },
      }),
    }],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <div className="min-h-screen px-5 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">Features</span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">Your kitchen, scanned, tracked, and cooked from.</h1>
        <p className="mt-3 text-sm text-muted-foreground">FridgeSpy uses AI to log groceries automatically, warn you before food spoils, and turn what you already have into tonight's dinner.</p>
      </header>

      <section className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <article key={title} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon size={20} />
            </div>
            <h2 className="mt-3 text-base font-bold">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </article>
        ))}
      </section>

      <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-3">
        <Link to="/pricing" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
          See pricing
        </Link>
        <Link to="/how-it-works" className="text-sm font-semibold text-primary underline">How it works →</Link>
      </div>

      <PublicFooter />
    </div>
  );
}
