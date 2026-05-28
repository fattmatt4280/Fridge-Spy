import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter } from "@/components/PublicFooter";

const STEPS = [
  { name: "Add what you have", text: "Snap a grocery receipt, take a photo of your fridge, scan a barcode, or add items by hand. FridgeSpy reads names, quantities, and best-by dates automatically." },
  { name: "Get expiry alerts", text: "FridgeSpy tracks every item's freshness and sends a gentle reminder before food goes bad — no more discovering rotten spinach behind the milk." },
  { name: "Cook from what you have", text: "Tap Tonight's Cook and get AI recipes built from your inventory, prioritizing items that are about to expire and the cuisines you actually like." },
  { name: "See your waste score", text: "Every week, FridgeSpy shows what you saved, what you wasted, and your cook streak. Small wins, real money back in your pocket." },
];

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How FridgeSpy Works — 4 Steps to Stop Wasting Food" },
      { name: "description", content: "How FridgeSpy works in 4 steps: add what you have with AI scanning, get expiry alerts, cook from what's in your kitchen, and watch your food waste drop." },
      { property: "og:title", content: "How FridgeSpy Works" },
      { property: "og:description", content: "Scan, track, cook, save. Here's exactly how FridgeSpy helps you stop wasting food." },
      { property: "og:url", content: "https://fridgespy.com/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/how-it-works" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to use FridgeSpy to stop wasting food",
        description: "Set up FridgeSpy and start tracking your kitchen inventory in minutes.",
        totalTime: "PT5M",
        step: STEPS.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
      }),
    }],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <div className="min-h-screen px-5 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">How it works</span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">From grocery bag to dinner plate — without the waste.</h1>
        <p className="mt-3 text-sm text-muted-foreground">Most food waste happens because we forget what's in the fridge. FridgeSpy fixes that in four simple steps.</p>
      </header>

      <ol className="mx-auto mt-10 max-w-2xl space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.name} className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-extrabold text-primary-foreground">{i + 1}</div>
            <div>
              <h2 className="text-base font-bold">{s.name}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-3">
        <Link to="/login" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
          Start free
        </Link>
        <Link to="/faq" className="text-sm font-semibold text-primary underline">Read the FAQ →</Link>
      </div>

      <PublicFooter />
    </div>
  );
}
