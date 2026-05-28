import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter } from "@/components/PublicFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About FridgeSpy — Our Mission to End Household Food Waste" },
      { name: "description", content: "FridgeSpy is built by Dream Holdings LLC. We help households stop wasting food with AI that tracks every item in your kitchen and turns it into recipes you'll actually cook." },
      { property: "og:title", content: "About FridgeSpy" },
      { property: "og:description", content: "The story behind FridgeSpy and our mission to cut household food waste." },
      { property: "og:url", content: "https://fridgespy.com/about" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/about" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "About FridgeSpy",
        url: "https://fridgespy.com/about",
        mainEntity: {
          "@type": "Organization",
          name: "FridgeSpy",
          legalName: "Dream Holdings LLC",
          url: "https://fridgespy.com",
          logo: "https://fridgespy.com/icon-512.png",
          description: "AI-powered kitchen inventory app that helps households stop wasting food.",
        },
      }),
    }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen px-5 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <article className="mx-auto max-w-2xl">
        <header className="text-center">
          <span className="inline-block rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">About</span>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">We're building the kitchen brain you wish you already had.</h1>
        </header>

        <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/90">
          <p>
            The average household throws away roughly a third of the food it buys. Not because anyone wants to — because nobody can remember what's in the back of the fridge, or which yogurt expires first, or what to do with that half a zucchini.
          </p>
          <p>
            <strong className="text-foreground">FridgeSpy</strong> is the simple fix: scan a receipt or your fridge, get gentle reminders before food spoils, and tap one button to turn what's already in your kitchen into tonight's dinner. No meal-planning spreadsheets. No guilt. Just less waste and more cooking.
          </p>
          <p>
            We're built and operated by <strong className="text-foreground">Dream Holdings LLC</strong>, a small team obsessed with making everyday tech feel calm and useful. We don't sell your data, we don't run ads, and our business model is simple: a fair subscription for people who want the powerful Pro features.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link to="/features" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
            See what FridgeSpy does
          </Link>
          <Link to="/pricing" className="text-sm font-semibold text-primary underline">View pricing →</Link>
        </div>
      </article>

      <PublicFooter />
    </div>
  );
}
