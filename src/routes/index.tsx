import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Receipt, Camera, Bell, ChefHat, Gauge, Flame, ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui-fs/Logo";
import { PublicFooter } from "@/components/PublicFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FridgeSpy — Know what's in your kitchen. Always." },
      { name: "description", content: "FridgeSpy is the AI kitchen inventory app that scans your receipts and fridge, alerts you before food expires, and turns what you already have into tonight's dinner. Stop wasting food. Free to start." },
      { property: "og:title", content: "FridgeSpy — Your kitchen, organized" },
      { property: "og:description", content: "AI receipt + fridge scanning, expiry alerts, and recipes from what you already have. Cut household food waste." },
      { property: "og:url", content: "https://fridgespy.com/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "FridgeSpy",
          url: "https://fridgespy.com/",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "FridgeSpy",
          legalName: "Dream Holdings LLC",
          url: "https://fridgespy.com/",
          logo: "https://fridgespy.com/icon-512.png",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "FridgeSpy",
          applicationCategory: "LifestyleApplication",
          operatingSystem: "Web, iOS, Android",
          description: "AI-powered kitchen inventory app that tracks groceries, fridge contents, and expiry dates, then suggests recipes from what you already have.",
          url: "https://fridgespy.com/",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            description: "Free to start. Pro from $4.99/month.",
            url: "https://fridgespy.com/pricing",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Features", url: "https://fridgespy.com/features" },
            { "@type": "ListItem", position: 2, name: "How it works", url: "https://fridgespy.com/how-it-works" },
            { "@type": "ListItem", position: 3, name: "Pricing", url: "https://fridgespy.com/pricing" },
            { "@type": "ListItem", position: 4, name: "FAQ", url: "https://fridgespy.com/faq" },
            { "@type": "ListItem", position: 5, name: "About", url: "https://fridgespy.com/about" },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: TEASER_FAQS.map(f => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  { icon: Receipt, title: "Snap your receipt", body: "Photograph any grocery receipt — AI logs every item, brand, and category automatically." },
  { icon: Camera, title: "Scan your fridge", body: "Point your camera inside. FridgeSpy identifies what's there so you don't type a thing." },
  { icon: Bell, title: "Expiry alerts", body: "Gentle reminders the day before food spoils — not a noisy stream of pings." },
  { icon: ChefHat, title: "Recipes from what you have", body: "One tap turns what's about to expire into tonight's dinner. No grocery trip required." },
  { icon: Gauge, title: "FridgeSpy Score", body: "A simple score that tracks how well your kitchen is running — and how much waste you've avoided." },
  { icon: Flame, title: "Cook streaks", body: "Build a daily streak for cooking at home. Gentle nudges, real money saved." },
];

const TEASER_FAQS = [
  { q: "Is FridgeSpy really free?", a: "Yes. The free plan covers up to 25 tracked items and 3 AI recipes per day. Pro unlocks unlimited everything from $4.99/month, and there's a 3-day free trial." },
  { q: "Do I have to type in every item?", a: "No. Most users only ever snap a receipt or scan their fridge — FridgeSpy adds the items for you. You can also barcode-scan or add manually if you prefer." },
  { q: "Do you sell my data?", a: "Never. Your kitchen data is yours. We don't run ads, we don't sell data, and you can export or delete your account at any time." },
];

function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <header className="px-5 pt-[max(env(safe-area-inset-top),1.25rem)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" aria-label="FridgeSpy home"><Logo /></Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground sm:flex">
            <Link to="/features" className="hover:text-foreground">Features</Link>
            <Link to="/how-it-works" className="hover:text-foreground">How it works</Link>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/faq" className="hover:text-foreground">FAQ</Link>
            <Link to="/blog" className="hover:text-foreground">Blog</Link>
          </nav>
          <Link to="/login" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pt-10 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center pt-2">
            <Logo size="2xl" animated />
          </div>
          <span className="mt-8 inline-block rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
            AI kitchen inventory
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Know what's in your kitchen.<br className="hidden sm:block" /> <span className="text-primary-glow">Always.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-foreground/80 sm:text-lg">
            FridgeSpy scans your receipts and your fridge, warns you before food spoils, and turns what you already have into tonight's dinner. Stop throwing money in the trash.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]">
              Get started free <ArrowRight size={18} />
            </Link>
            <Link to="/how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-6 py-3.5 text-base font-semibold text-foreground backdrop-blur">
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Free to start · No credit card · Works on web, iOS &amp; Android</p>
        </div>
      </section>

      {/* How it works (3-step) */}
      <section className="px-5 pt-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">How it works</span>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">From grocery bag to dinner — in three taps.</h2>
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { n: "01", icon: Receipt, t: "Snap a receipt", d: "Or scan your fridge. FridgeSpy logs every item for you." },
              { n: "02", icon: Bell, t: "Track freshness", d: "Get a gentle heads-up the day before anything goes bad." },
              { n: "03", icon: ChefHat, t: "Cook tonight", d: "One tap turns what's about to expire into a real recipe." },
            ].map((s) => (
              <li key={s.n} className="glass-card p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-primary/15 p-2.5 text-primary"><s.icon size={22} /></span>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">{s.n}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 text-center">
            <Link to="/how-it-works" className="text-sm font-semibold text-primary underline">See the full walkthrough →</Link>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="px-5 pt-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Features</span>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Everything you need. Nothing you don't.</h2>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="glass-card p-5">
                <span className="inline-flex rounded-xl bg-primary/15 p-2.5 text-primary"><f.icon size={20} /></span>
                <h3 className="mt-3 text-base font-bold">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 text-center">
            <Link to="/features" className="text-sm font-semibold text-primary underline">Explore all features →</Link>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="px-5 pt-20">
        <div className="mx-auto max-w-3xl">
          <div className="glass-card p-7 text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Pricing</span>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Free to start. Pro when you're ready.</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
              25 items and 3 AI recipes a day on the free plan — forever. Go unlimited from <strong className="text-foreground">$4.99/month</strong>, with a 3-day free trial and a 30-day money-back guarantee.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
                See plans <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="text-sm font-semibold text-primary underline">Start free →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="px-5 pt-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">FAQ</span>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Quick answers.</h2>
          </div>
          <ul className="mt-8 space-y-3">
            {TEASER_FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </ul>
          <div className="mt-6 text-center">
            <Link to="/faq" className="text-sm font-semibold text-primary underline">Read all FAQs →</Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pt-20">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-10 text-center text-primary-foreground shadow-2xl shadow-primary/40">
            <Sparkles className="mx-auto" size={28} />
            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">Start cutting food waste tonight.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm opacity-90">
              The average household throws away $1,500 of food a year. FridgeSpy is the simple fix.
            </p>
            <Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3 text-sm font-bold text-foreground shadow-lg transition active:scale-[0.98]">
              Create your free account <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold">{q}</span>
        <ChevronDown size={18} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">{a}</div>}
    </li>
  );
}
