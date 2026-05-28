import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter } from "@/components/PublicFooter";

const QA = [
  {
    q: "What is FridgeSpy?",
    a: "FridgeSpy is an AI-powered kitchen inventory app. It tracks what's in your fridge, freezer, and pantry, warns you before food expires, and suggests recipes built from what you already have so you waste less and cook more.",
  },
  {
    q: "How does receipt scanning work?",
    a: "Snap a photo of any grocery receipt and FridgeSpy uses AI to extract every item, quantity, and a best-guess expiry date. You can review and edit before everything is added to your inventory. Receipt scanning is a Pro feature.",
  },
  {
    q: "How does fridge photo scanning work?",
    a: "Open your fridge or pantry and take one photo. FridgeSpy identifies the visible items and adds them to your inventory in seconds — no barcode scanning required. Fridge scanning is a Pro feature.",
  },
  {
    q: "Is FridgeSpy free?",
    a: "Yes — there's a free tier that lets you track up to 25 items and generate 3 recipes per day. Pro unlocks unlimited items, unlimited recipes, AI receipt and fridge scanning, household sharing, and the weekly waste report.",
  },
  {
    q: "How much does FridgeSpy Pro cost?",
    a: "Pro is $4.99/month, $49.99/year (save 17%), or $79 once for Lifetime access. Monthly and yearly plans include a 3-day free trial. See the pricing page for full details.",
  },
  {
    q: "Can I share an inventory with my family or housemates?",
    a: "Yes. With Pro, you can share one live inventory with up to 5 housemates. Anyone in the household sees real-time updates when items are added, used, or expired.",
  },
  {
    q: "Is my data private?",
    a: "Yes. We use industry-standard encryption, never sell your data, and you can export or delete your account at any time. Payments are processed by Paddle.com Market Ltd as Merchant of Record. See our Privacy Policy for full details.",
  },
  {
    q: "Does FridgeSpy work offline?",
    a: "Browsing your inventory and editing items works offline; AI features like receipt scanning, fridge scanning, and recipe generation need an internet connection because they call our AI models.",
  },
  {
    q: "What platforms does FridgeSpy support?",
    a: "FridgeSpy runs in any modern browser on phones, tablets, and computers, and installs as a Progressive Web App on iOS and Android home screens.",
  },
  {
    q: "How accurate are expiry dates?",
    a: "When we can read a printed best-by or use-by date from your receipt or a label scan, we use that. Otherwise FridgeSpy estimates based on the food category, and you can adjust any date with a tap.",
  },
  {
    q: "How do I cancel a subscription?",
    a: "Open Account → Manage subscription. You can cancel anytime; you'll keep Pro access until the end of the current billing period. Lifetime is a one-time payment with no recurring charges.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FridgeSpy FAQ — Common Questions Answered" },
      { name: "description", content: "Answers to common FridgeSpy questions: how AI receipt and fridge scanning work, what's free vs Pro, pricing, privacy, household sharing, offline use, and more." },
      { property: "og:title", content: "FridgeSpy FAQ" },
      { property: "og:description", content: "Everything you might ask about FridgeSpy — pricing, scanning, privacy, sharing, offline use, and more." },
      { property: "og:url", content: "https://fridgespy.com/faq" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/faq" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: QA.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }),
    }],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen px-5 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">FAQ</span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">Frequently asked questions</h1>
        <p className="mt-3 text-sm text-muted-foreground">Quick answers to what people ask before signing up for FridgeSpy.</p>
      </header>

      <section className="mx-auto mt-10 max-w-2xl space-y-3">
        {QA.map(({ q, a }) => (
          <details key={q} className="group rounded-2xl border border-border bg-surface p-5 open:bg-surface">
            <summary className="cursor-pointer list-none text-base font-bold marker:hidden">
              <span className="flex items-start justify-between gap-3">
                <span>{q}</span>
                <span className="mt-0.5 shrink-0 text-primary transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
      </section>

      <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-3">
        <Link to="/login" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
          Try FridgeSpy free
        </Link>
      </div>

      <PublicFooter />
    </div>
  );
}
